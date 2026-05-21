#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pure-LLM baseline (standalone).

- Does NOT call Next.js, LangGraph, or run_rq1_validity_experiments.py.
- One HTTP LLM request per attempt; no in-pipeline error feedback.
- Optional REMODEL syntax check via external --validate-cmd (e.g. tsx validator).

Example (114 ops, one model, 5 independent attempts, with syntax check):

  python script/run_baseline_llm_only.py ^
    --models gpt-5.4 ^
    --output-dir results/baseline_llm_only/gpt-5.4 ^
    --max-attempts 5 ^
    --validate-cmd "npx tsx script/validate-remodel-contract.ts {input_file}" ^
    --parser-use-shell

Smoke test:

  python script/run_baseline_llm_only.py --models gpt-5.4-mini --limit 2 --max-attempts 1
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import random
import re
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ALL_MODELS: Tuple[str, ...] = (
    "gpt-5.4",
    "gpt-5.4-mini",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "qwen3-coder-plus",
    "qwen3-coder-flash",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def setup_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.handlers.clear()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh = logging.FileHandler(log_dir / "run.log", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    root.addHandler(fh)
    root.addHandler(sh)


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return rows


def append_jsonl(path: Path, obj: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def safe_operation(row: Dict[str, Any], line_no: int) -> Optional[Dict[str, Any]]:
    oid = row.get("id") or row.get("operation_id")
    if not oid:
        logging.warning("line %s: missing id, skipped", line_no)
        return None
    return {
        "id": str(oid),
        "case_study": str(row.get("case_study") or row.get("case") or "unknown"),
        "service": str(row.get("service") or ""),
        "operation_name": str(row.get("operation_name") or row.get("name") or ""),
        "operation_signature": str(
            row.get("operation_signature") or row.get("signature") or ""
        ),
        "description": str(row.get("description") or ""),
        "parameters": row.get("parameters") or [],
        "return_type": str(row.get("return_type") or ""),
        "model_context": str(row.get("model_context") or row.get("context") or ""),
    }


def build_prompt(op: Dict[str, Any]) -> str:
    params_str = json.dumps(op.get("parameters") or [], ensure_ascii=False)
    return f"""你是一名 OCL 合约生成专家。请根据给定的自然语言需求、操作签名、参数、返回值类型和系统模型上下文，生成 OCL 合约片段。

要求：
1. 只输出一个 JSON 对象，不要输出解释或 Markdown；
2. JSON 键必须为 definition、precondition、postcondition（definition 可为 null）；
3. 各字段值为 OCL 表达式字符串（不含 Contract 外壳）；
4. 不要编造 model_context 中不存在的类、属性、关联或操作；
5. 使用标准 OCL 风格；保持 result、self、@pre 等关键字使用正确。

输入信息：
Case Study: {op["case_study"]}
Service: {op["service"]}
Operation Signature: {op["operation_signature"]}
Description: {op["description"]}
Parameters: {params_str}
Return Type: {op["return_type"]}

Model Context:
{op["model_context"]}

请输出 JSON，例如：
{{"definition": "...", "precondition": "...", "postcondition": "..."}}
"""


def wrap_contract(
    op: Dict[str, Any],
    *,
    definition: Optional[str],
    precondition: str,
    postcondition: str,
) -> str:
    params = op.get("parameters") or []
    param_str = ",".join(
        f"{p.get('name', '')}:{p.get('type', '')}"
        for p in params
        if isinstance(p, dict) and p.get("name")
    )
    ret = (op.get("return_type") or "").strip()
    ret_suffix = f": {ret}" if ret else ""
    service = op.get("service") or "Service"
    op_name = op.get("operation_name") or "operation"
    def_block = ""
    if definition and str(definition).strip():
        def_block = f"definition:\n          {definition}\n            "
    pre_block = ""
    if precondition and str(precondition).strip():
        pre_block = f"precondition:\n          {precondition}\n            "
    post_block = ""
    if postcondition and str(postcondition).strip():
        post_block = f"postcondition:\n          {postcondition}\n            "
    return (
        f"Contract {service}::{op_name}({param_str}){ret_suffix} {{\n"
        f"          {def_block}{pre_block}{post_block}\n        }}"
    )


def parse_json_from_llm(text: str) -> Optional[Dict[str, Any]]:
    text = (text or "").strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(text[start : end + 1])
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def extract_contract_text(raw: str, op: Dict[str, Any]) -> Dict[str, Any]:
    obj = parse_json_from_llm(raw)
    if obj and ("precondition" in obj or "postcondition" in obj):
        pre = str(obj.get("precondition") or "")
        post = str(obj.get("postcondition") or "")
        defn = obj.get("definition")
        defn_s = None if defn is None else str(defn)
        contract = wrap_contract(
            op, definition=defn_s, precondition=pre, postcondition=post
        )
        return {
            "contract": contract,
            "json_parsed": True,
            "extraction_ok": bool(pre.strip() or post.strip()),
        }
    stripped = (raw or "").strip()
    if stripped.lower().startswith("contract "):
        return {
            "contract": stripped,
            "json_parsed": False,
            "extraction_ok": True,
        }
    return {"contract": "", "json_parsed": False, "extraction_ok": False}


def _http_json(
    url: str, payload: Dict[str, Any], headers: Dict[str, str], timeout: float
) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def call_llm(
    model: str, prompt: str, *, temperature: float, max_tokens: int, timeout: float
) -> str:
    last_err: Optional[BaseException] = None
    for attempt in range(1, 4):
        try:
            if model.startswith("gpt-"):
                key = os.environ.get("OPENAI_API_KEY", "")
                if not key:
                    raise RuntimeError("OPENAI_API_KEY is not set")
                base = os.environ.get("OPENAI_BASE_URL", "").strip() or "https://api.openai.com/v1"
                url = base.rstrip("/") + "/chat/completions"
                out = _http_json(
                    url,
                    {
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {key}",
                    },
                    timeout,
                )
                return str((out.get("choices") or [{}])[0].get("message", {}).get("content") or "")
            if model.startswith("deepseek-"):
                key = os.environ.get("DEEPSEEK_API_KEY", "")
                if not key:
                    raise RuntimeError("DEEPSEEK_API_KEY is not set")
                base = os.environ.get("DEEPSEEK_BASE_URL", "").strip() or "https://api.deepseek.com/v1"
                url = base.rstrip("/") + "/chat/completions"
                out = _http_json(
                    url,
                    {
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {key}",
                    },
                    timeout,
                )
                return str((out.get("choices") or [{}])[0].get("message", {}).get("content") or "")
            if model.startswith("claude-"):
                key = os.environ.get("ANTHROPIC_API_KEY", "")
                if not key:
                    raise RuntimeError("ANTHROPIC_API_KEY is not set")
                base = os.environ.get("ANTHROPIC_BASE_URL", "").strip() or "https://api.anthropic.com"
                url = base.rstrip("/") + "/v1/messages"
                out = _http_json(
                    url,
                    {
                        "model": model,
                        "max_tokens": max(256, max_tokens),
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    {
                        "Content-Type": "application/json",
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    },
                    timeout,
                )
                parts = [
                    str(b.get("text") or "")
                    for b in out.get("content") or []
                    if isinstance(b, dict) and b.get("type") == "text"
                ]
                return "".join(parts)
            if model.startswith("qwen"):
                key = os.environ.get("QWEN_API_KEY", "")
                if not key:
                    raise RuntimeError("QWEN_API_KEY is not set")
                base = (
                    os.environ.get("QWEN_BASE_URL", "").strip()
                    or "https://dashscope.aliyuncs.com/compatible-mode/v1"
                )
                url = base.rstrip("/") + "/chat/completions"
                out = _http_json(
                    url,
                    {
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {key}",
                    },
                    timeout,
                )
                return str((out.get("choices") or [{}])[0].get("message", {}).get("content") or "")
            raise RuntimeError(f"Unsupported model: {model}")
        except Exception as e:
            last_err = e
            logging.warning("LLM attempt %s failed: %s", attempt, e)
            time.sleep((2 ** (attempt - 1)) + random.random())
    raise RuntimeError(f"call_llm failed: {last_err}")


def validate_contract_file(
    contract: str,
    path: Path,
    cmd_template: str,
    timeout: int,
    use_shell: bool,
) -> Dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contract, encoding="utf-8")
    cmd_str = cmd_template.replace("{input_file}", str(path.resolve()))
    try:
        if use_shell:
            proc = subprocess.run(
                cmd_str,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
            )
        else:
            proc = subprocess.run(
                shlex.split(cmd_str, posix=os.name != "nt"),
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
            )
    except subprocess.TimeoutExpired:
        return {
            "syntax_valid": False,
            "validate_skipped": False,
            "validate_returncode": None,
            "validate_stderr": "timeout",
        }
    except Exception as e:
        return {
            "syntax_valid": False,
            "validate_skipped": False,
            "validate_returncode": None,
            "validate_stderr": str(e),
        }
    ok = proc.returncode == 0
    return {
        "syntax_valid": ok,
        "validate_skipped": False,
        "validate_returncode": proc.returncode,
        "validate_stdout": proc.stdout or "",
        "validate_stderr": proc.stderr or "",
    }


def reindex(
    attempts: List[Dict[str, Any]], max_attempts: int
) -> Tuple[Dict[Tuple[str, str], List[Dict[str, Any]]], Set[Tuple[str, str]]]:
    by_key: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for row in attempts:
        by_key[(row["operation_id"], row["model"])].append(row)
    succeeded: Set[Tuple[str, str]] = set()
    for key, rows in by_key.items():
        rows.sort(key=lambda r: int(r["attempt"]))
        if any(r.get("syntax_valid") for r in rows):
            succeeded.add(key)
    return by_key, succeeded


def write_summary(
    output_dir: Path,
    operations: List[Dict[str, Any]],
    models: List[str],
    max_attempts: int,
) -> None:
    attempts = read_jsonl(output_dir / "attempts.jsonl")
    op_ids = {op["id"] for op in operations}
    op_case = {op["id"]: op["case_study"] for op in operations}
    by_key, succeeded = reindex(attempts, max_attempts)

    def agg(model: str, op_set: Set[str]) -> Dict[str, Any]:
        total = len(op_set)
        valid = sum(1 for oid in op_set if (oid, model) in succeeded)
        valid_at = {k: 0 for k in range(1, max_attempts + 1)}
        for oid in op_set:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r["attempt"]))
            for k in range(1, max_attempts + 1):
                if any(int(r["attempt"]) <= k and r.get("syntax_valid") for r in rows):
                    valid_at[k] += 1
        rates = {k: (100.0 * valid_at[k] / total) if total else 0.0 for k in valid_at}
        return {
            "model": model,
            "total_operations": total,
            "syntax_valid_count": valid,
            "syntax_validity_rate": (100.0 * valid / total) if total else 0.0,
            "valid_at_counts": valid_at,
            "valid_at_rates": rates,
        }

    model_rows = [agg(m, op_ids) for m in models]
    case_rows: List[Dict[str, Any]] = []
    cases = sorted({op_case[oid] for oid in op_ids})
    for m in models:
        for c in cases:
            ops_c = {oid for oid in op_ids if op_case.get(oid) == c}
            if ops_c:
                case_rows.append({**agg(m, ops_c), "case_study": c})

    with (output_dir / "baseline_validity_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "total_operations",
                "syntax_valid_count",
                "syntax_validity_rate",
            ]
        )
        for r in model_rows:
            w.writerow(
                [
                    r["model"],
                    r["total_operations"],
                    r["syntax_valid_count"],
                    f"{r['syntax_validity_rate']:.4f}",
                ]
            )

    hdr = ["model", "total_operations"] + [f"valid_at_{k}_rate" for k in range(1, max_attempts + 1)]
    with (output_dir / "baseline_valid_at_k_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for r in model_rows:
            w.writerow(
                [r["model"], r["total_operations"]]
                + [f"{r['valid_at_rates'][k]:.4f}" for k in range(1, max_attempts + 1)]
            )

    with (output_dir / "baseline_validity_by_case.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            ["model", "case_study", "total_operations", "syntax_valid_count", "syntax_validity_rate"]
        )
        for r in case_rows:
            w.writerow(
                [
                    r["model"],
                    r["case_study"],
                    r["total_operations"],
                    r["syntax_valid_count"],
                    f"{r['syntax_validity_rate']:.4f}",
                ]
            )

    summary = {
        "experiment": "baseline_llm_only",
        "generated_at": utc_now_iso(),
        "max_attempts": max_attempts,
        "by_model": model_rows,
        "by_case": case_rows,
    }
    (output_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def parse_models(s: str) -> List[str]:
    parts = [x.strip() for x in s.split(",") if x.strip()]
    for m in parts:
        if m not in ALL_MODELS:
            raise argparse.ArgumentTypeError(f"unknown model {m}; allowed: {ALL_MODELS}")
    return parts


def main() -> None:
    p = argparse.ArgumentParser(description="Pure-LLM baseline (standalone script).")
    p.add_argument("--input", default="data/operations.jsonl")
    p.add_argument("--output-dir", default="results/baseline_llm_only")
    p.add_argument("--models", default="gpt-5.4", type=parse_models)
    p.add_argument("--max-attempts", type=int, default=5)
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--max-tokens", type=int, default=2048)
    p.add_argument("--http-timeout", type=float, default=120.0)
    p.add_argument("--sleep-between-calls", type=float, default=1.0)
    p.add_argument(
        "--validate-cmd",
        default="",
        help='External validator with {input_file}, e.g. npx tsx script/validate-remodel-contract.ts {input_file}',
    )
    p.add_argument("--parser-use-shell", action="store_true")
    p.add_argument("--parser-timeout", type=int, default=60)
    p.add_argument("--force", action="store_true")
    p.add_argument("--analyze-only", action="store_true")
    args = p.parse_args()

    load_env_file(repo_root() / ".env")
    output_dir = Path(args.output_dir)
    setup_logging(output_dir / "logs")

    attempts_path = output_dir / "attempts.jsonl"
    tmp_dir = output_dir / "_tmp_contracts"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    input_path = Path(args.input)
    operations: List[Dict[str, Any]] = []
    if input_path.exists():
        with input_path.open("r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                op = safe_operation(row, i)
                if op:
                    operations.append(op)
    if args.limit > 0:
        operations = operations[: args.limit]

    if args.analyze_only:
        if not operations:
            logging.error("analyze-only needs --input with operations")
            sys.exit(1)
        write_summary(output_dir, operations, args.models, args.max_attempts)
        logging.info("Wrote summary under %s", output_dir)
        return

    if not operations:
        logging.error("No operations loaded from %s", input_path)
        sys.exit(1)

    if args.force:
        for fp in [attempts_path, output_dir / "summary.json"]:
            if fp.exists():
                fp.unlink()
        for pat in ("baseline_*.csv",):
            for f in output_dir.glob(pat):
                f.unlink()

    validate_cmd = args.validate_cmd.strip() or None
    existing = read_jsonl(attempts_path)
    done_valid: Set[Tuple[str, str]] = set()
    for row in existing:
        if row.get("syntax_valid"):
            done_valid.add((row["operation_id"], row["model"]))

    planned = len(operations) * len(args.models)
    print(f"Baseline LLM: {len(operations)} ops x {len(args.models)} models = {planned} pairs")

    for op in operations:
        oid = op["id"]
        for model in args.models:
            if (oid, model) in done_valid:
                continue
            start_att = (
                max(
                    (int(r["attempt"]) for r in existing if r["operation_id"] == oid and r["model"] == model),
                    default=0,
                )
                + 1
            )
            prompt = build_prompt(op)
            for att in range(start_att, args.max_attempts + 1):
                if (oid, model) in done_valid:
                    break
                t0 = time.perf_counter()
                err_type = ""
                raw = ""
                try:
                    raw = call_llm(
                        model,
                        prompt,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        timeout=args.http_timeout,
                    )
                except Exception:
                    logging.exception("LLM failed op=%s model=%s att=%s", oid, model, att)
                    err_type = "llm_api_error"
                ext = extract_contract_text(raw, op)
                contract = ext["contract"]
                if validate_cmd and contract:
                    safe_oid = re.sub(r"[^\w\-.]", "_", oid)[:100]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:60]
                    vpath = tmp_dir / f"{safe_oid}__{safe_model}__{att}.contract"
                    val = validate_contract_file(
                        contract,
                        vpath,
                        validate_cmd,
                        args.parser_timeout,
                        args.parser_use_shell,
                    )
                elif validate_cmd:
                    val = {
                        "syntax_valid": False,
                        "validate_skipped": False,
                        "validate_stderr": "empty_contract",
                    }
                else:
                    val = {
                        "syntax_valid": ext["extraction_ok"],
                        "validate_skipped": True,
                        "validate_stderr": "",
                    }
                if err_type:
                    val["syntax_valid"] = False
                if not ext["extraction_ok"] and not err_type:
                    err_type = "extraction_failed"
                rec = {
                    "operation_id": oid,
                    "case_study": op["case_study"],
                    "model": model,
                    "attempt": att,
                    "prompt": prompt,
                    "raw_output": raw,
                    "contract": contract,
                    "json_parsed": ext["json_parsed"],
                    "extraction_ok": ext["extraction_ok"],
                    "syntax_valid": bool(val.get("syntax_valid")),
                    "validate_skipped": bool(val.get("validate_skipped")),
                    "error_type": "none" if val.get("syntax_valid") else (err_type or "syntax_invalid"),
                    "latency_sec": round(time.perf_counter() - t0, 4),
                    "timestamp": utc_now_iso(),
                    **{k: v for k, v in val.items() if k != "syntax_valid"},
                }
                append_jsonl(attempts_path, rec)
                existing.append(rec)
                if rec["syntax_valid"]:
                    done_valid.add((oid, model))
                    print(f"[ok] {model} {oid} att={att}", flush=True)
                    break
                print(f"[--] {model} {oid} att={att} {rec['error_type']}", flush=True)
                time.sleep(max(0.0, args.sleep_between_calls))

    write_summary(output_dir, operations, args.models, args.max_attempts)
    logging.info("Done. Results: %s", output_dir.resolve())


if __name__ == "__main__":
    main()
