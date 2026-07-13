#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OCLVM backend sanity check / differential validation.

This small experiment samples representative contracts from an existing result
file and validates them through three layers:

1. REMODEL parser sanity check via ``script/validate-remodel-contract.ts``.
2. Optional expression-level external OCL backend check, e.g. USE/Eclipse OCL,
   using ``--expression-check-cmd`` with ``{input_file}``.
3. Optional operation-level TypeScript/Jest oracle by calling this app's
   ``POST /api/evaluate-contract`` endpoint via ``--eval-next-base-url``.

The external OCL backend is intentionally command-template based because USE
and Eclipse OCL installations differ across machines. The script always exports
the selected expression snippets, so the backend check can be run later.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


DEFAULT_CASE_QUOTAS = {
    "Airport": 4,
    "ATM": 4,
    "CoCoME": 4,
    "Library Management": 4,
    "Loan Processing": 4,
}


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def safe_filename(text: str) -> str:
    return re.sub(r"[^\w.-]+", "_", text)[:140]


def parse_contract_sections(contract: str) -> Dict[str, str]:
    sections: Dict[str, str] = {"definition": "", "precondition": "", "postcondition": ""}
    current: Optional[str] = None
    for raw in (contract or "").splitlines():
        line = raw.strip()
        low = line.lower()
        if low.startswith("definition:"):
            current = "definition"
            tail = line.split(":", 1)[1].strip()
            if tail:
                sections[current] += tail + "\n"
            continue
        if low.startswith("precondition:"):
            current = "precondition"
            tail = line.split(":", 1)[1].strip()
            if tail:
                sections[current] += tail + "\n"
            continue
        if low.startswith("postcondition:"):
            current = "postcondition"
            tail = line.split(":", 1)[1].strip()
            if tail:
                sections[current] += tail + "\n"
            continue
        if line == "}" or not current:
            continue
        sections[current] += line + "\n"
    return {k: v.strip() for k, v in sections.items()}


def final_attempts(rows: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    by_op: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_op[str(row.get("operation_id", ""))].append(row)
    finals: Dict[str, Dict[str, Any]] = {}
    for op_id, op_rows in by_op.items():
        ordered = sorted(op_rows, key=lambda r: int(r.get("attempt") or 0))
        success = next((r for r in ordered if r.get("execution_valid")), None)
        finals[op_id] = success or ordered[-1]
    return finals


def complexity_score(op: Dict[str, Any], row: Dict[str, Any]) -> int:
    params = op.get("parameters") or []
    return (
        4 * len(params)
        + len(str(op.get("description") or "")) // 120
        + len(str(op.get("model_context") or "")) // 2500
        + 2 * int(row.get("intermediate_error_count") or 0)
    )


def select_representative_contracts(
    operations: List[Dict[str, Any]],
    attempts: List[Dict[str, Any]],
    sample_size: int,
) -> List[Tuple[Dict[str, Any], Dict[str, Any], int]]:
    op_by_id = {str(op.get("id")): op for op in operations}
    finals = final_attempts(attempts)
    candidates: List[Tuple[Dict[str, Any], Dict[str, Any], int]] = []
    for op_id, row in finals.items():
        op = op_by_id.get(op_id)
        if not op or not row.get("contract_parse_ok", row.get("syntax_valid")):
            continue
        contract = row.get("extracted_ocl") or row.get("contract") or ""
        if not contract.strip():
            continue
        candidates.append((op, row, complexity_score(op, row)))

    by_case: Dict[str, List[Tuple[Dict[str, Any], Dict[str, Any], int]]] = defaultdict(list)
    for item in candidates:
        by_case[str(item[0].get("case_study") or "unknown")].append(item)
    for case in by_case:
        by_case[case].sort(key=lambda x: (-x[2], str(x[0].get("id"))))

    selected: List[Tuple[Dict[str, Any], Dict[str, Any], int]] = []
    seen = set()
    for case, quota in DEFAULT_CASE_QUOTAS.items():
        for item in by_case.get(case, [])[:quota]:
            op_id = str(item[0].get("id"))
            selected.append(item)
            seen.add(op_id)

    if len(selected) < sample_size:
        for item in sorted(candidates, key=lambda x: (-x[2], str(x[0].get("id")))):
            op_id = str(item[0].get("id"))
            if op_id in seen:
                continue
            selected.append(item)
            seen.add(op_id)
            if len(selected) >= sample_size:
                break
    return selected[:sample_size]


def run_cmd_template(cmd_template: str, input_file: Path, timeout: int) -> Dict[str, Any]:
    cmd = cmd_template.replace("{input_file}", str(input_file.resolve()))
    try:
        proc = subprocess.run(
            cmd,
            shell=True,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        return {
            "status": "pass" if proc.returncode == 0 else "fail",
            "returncode": proc.returncode,
            "stdout": proc.stdout[-4000:],
            "stderr": proc.stderr[-4000:],
        }
    except subprocess.TimeoutExpired as e:
        return {
            "status": "timeout",
            "returncode": "",
            "stdout": (e.stdout or "")[-4000:] if isinstance(e.stdout, str) else "",
            "stderr": (e.stderr or "")[-4000:] if isinstance(e.stderr, str) else "",
        }


def http_json(url: str, payload: Dict[str, Any], timeout: float) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {"error": f"HTTP {e.code}: {body[:2000]}"}
    except Exception as e:
        return {"error": str(e)}


def write_expression_file(path: Path, op: Dict[str, Any], sections: Dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = [
        f"-- operation_id: {op.get('id')}",
        f"-- case_study: {op.get('case_study')}",
        f"-- signature: {op.get('operation_signature')}",
        "-- NOTE: This is a REMODEL/OCL expression export. For USE/Eclipse OCL,",
        "-- adapt context declarations to the target backend model if required.",
        "",
        "-- definition",
        sections.get("definition") or "-- <empty>",
        "",
        "-- precondition",
        sections.get("precondition") or "-- <empty>",
        "",
        "-- postcondition",
        sections.get("postcondition") or "-- <empty>",
        "",
    ]
    path.write_text("\n".join(text), encoding="utf-8")


def markdown_table(rows: List[Dict[str, Any]]) -> str:
    headers = [
        "ID",
        "Case",
        "REMODEL",
        "External OCL",
        "Jest Oracle",
        "Notes",
    ]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for r in rows:
        notes = []
        if r["external_ocl_status"] == "not_run":
            notes.append("external backend not configured")
        if r["jest_oracle_status"] == "not_run":
            notes.append("Next eval endpoint not configured")
        lines.append(
            "| "
            + " | ".join(
                [
                    str(r["operation_id"]),
                    str(r["case_study"]),
                    str(r["remodel_parser_status"]),
                    str(r["external_ocl_status"]),
                    str(r["jest_oracle_status"]),
                    "; ".join(notes),
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run OCLVM backend sanity check / differential validation."
    )
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument(
        "--attempts", default="results/rq_gpt_5_4_full_oracle_fixed/attempts.jsonl"
    )
    parser.add_argument("--output-dir", default="results/oclvm_sanity_check")
    parser.add_argument("--sample-size", type=int, default=20)
    parser.add_argument(
        "--remodel-validate-cmd",
        default="npx tsx script/validate-remodel-contract.ts {input_file}",
    )
    parser.add_argument("--expression-check-cmd", default="")
    parser.add_argument("--cmd-timeout", type=int, default=60)
    parser.add_argument("--eval-next-base-url", default="")
    parser.add_argument("--eval-timeout", type=float, default=300.0)
    args = parser.parse_args()

    operations = read_jsonl(Path(args.input))
    attempts = read_jsonl(Path(args.attempts))
    selected = select_representative_contracts(operations, attempts, args.sample_size)
    out_dir = Path(args.output_dir)
    contracts_dir = out_dir / "contracts"
    expressions_dir = out_dir / "expressions"
    out_dir.mkdir(parents=True, exist_ok=True)

    rows: List[Dict[str, Any]] = []
    for index, (op, row, score) in enumerate(selected, 1):
        op_id = str(op.get("id"))
        contract = row.get("extracted_ocl") or row.get("contract") or ""
        sections = parse_contract_sections(contract)
        stem = f"{index:02d}_{safe_filename(op_id)}"
        contract_path = contracts_dir / f"{stem}.contract"
        expr_path = expressions_dir / f"{stem}.ocl"
        contract_path.parent.mkdir(parents=True, exist_ok=True)
        contract_path.write_text(contract, encoding="utf-8")
        write_expression_file(expr_path, op, sections)

        remodel_res = run_cmd_template(args.remodel_validate_cmd, contract_path, args.cmd_timeout)
        external_res = (
            run_cmd_template(args.expression_check_cmd, expr_path, args.cmd_timeout)
            if args.expression_check_cmd.strip()
            else {"status": "not_run", "returncode": "", "stdout": "", "stderr": ""}
        )
        if args.eval_next_base_url.strip():
            url = args.eval_next_base_url.rstrip("/") + "/api/evaluate-contract"
            eval_res = http_json(
                url,
                {
                    "project": op.get("project"),
                    "useCase": op.get("useCase"),
                    "operation": op.get("operation"),
                    "contract": contract,
                    "ocl": {
                        "definition": sections.get("definition") or None,
                        "precondition": sections.get("precondition") or "",
                        "postcondition": sections.get("postcondition") or "",
                    },
                },
                args.eval_timeout,
            )
            if eval_res.get("error"):
                jest_status = "error"
            else:
                jest_status = "pass" if eval_res.get("test_execution_ok") else "fail"
        else:
            eval_res = {}
            jest_status = "not_run"

        rows.append(
            {
                "sample_index": index,
                "operation_id": op_id,
                "case_study": op.get("case_study"),
                "operation_signature": op.get("operation_signature"),
                "complexity_score": score,
                "source_model": row.get("model"),
                "source_attempt": row.get("attempt"),
                "source_execution_valid": bool(row.get("execution_valid")),
                "contract_file": str(contract_path),
                "expression_file": str(expr_path),
                "definition": sections.get("definition"),
                "precondition": sections.get("precondition"),
                "postcondition": sections.get("postcondition"),
                "remodel_parser_status": remodel_res["status"],
                "remodel_parser_returncode": remodel_res["returncode"],
                "remodel_parser_stderr": remodel_res["stderr"],
                "external_ocl_status": external_res["status"],
                "external_ocl_returncode": external_res["returncode"],
                "external_ocl_stderr": external_res["stderr"],
                "jest_oracle_status": jest_status,
                "jest_contract_parse_ok": eval_res.get("contract_parse_ok", ""),
                "jest_typescript_parse_ok": eval_res.get("typescript_parse_ok", ""),
                "jest_test_execution_ok": eval_res.get("test_execution_ok", ""),
                "jest_test_passing_count": eval_res.get("test_passing_count", ""),
                "jest_test_failing_count": eval_res.get("test_failing_count", ""),
                "jest_error": eval_res.get("error", ""),
            }
        )

    fields = list(rows[0].keys()) if rows else []
    with (out_dir / "oclvm_sanity_check_results.csv").open(
        "w", newline="", encoding="utf-8"
    ) as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    (out_dir / "oclvm_sanity_check_results.md").write_text(
        markdown_table(rows), encoding="utf-8"
    )
    summary = {
        "generated_at_epoch": time.time(),
        "sample_size": len(rows),
        "source_attempts": args.attempts,
        "remodel_parser": dict(Counter(r["remodel_parser_status"] for r in rows)),
        "external_ocl": dict(Counter(r["external_ocl_status"] for r in rows)),
        "jest_oracle": dict(Counter(r["jest_oracle_status"] for r in rows)),
    }
    (out_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
