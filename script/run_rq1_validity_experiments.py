#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RQ1 validity experiments: Exp1 validity rate, Exp2 Valid@k, Exp3 parser error taxonomy.

Designed to run inside this repo (langchain-ocl-next-main):

  - ``--backend direct`` (default): calls LLM APIs from Python (see call_llm).
  - ``--backend next``: calls the Next.js app ``POST /api/generate-ocl`` so generation
    matches the in-repo LangGraph (OCL → contract → TypeScript → tests). Validity
    defaults to **no contractErrors** on the last Contract Generator step (same signal
    as ``experiment/*.json``). The app graph uses **ChatOpenAI + OPENAI_BASE_URL** only;
    models routed only on the gateway (e.g. apiyi) work end-to-end.

Loads ``.env`` from the repository root (parent of ``script/``) when present.

Optional: replace call_llm with ``from project_llm_client import call_project_llm``.
"""

from __future__ import annotations

import argparse
import csv
import http.client
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

# ---------------------------------------------------------------------------
# Optional: delegate to project LLM client (uncomment and implement).
# from project_llm_client import call_project_llm
# ---------------------------------------------------------------------------

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
    """Minimal .env loader (no python-dotenv). Does not override existing os.environ."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if val.startswith('"') and val.endswith('"'):
            val = val[1:-1]
        elif val.startswith("'") and val.endswith("'"):
            val = val[1:-1]
        if key and key not in os.environ:
            os.environ[key] = val


def call_next_generate_ndjson(
    base_url: str,
    api_key: str,
    project: str,
    use_case: str,
    operation: str,
    model: str,
    user_input: Optional[str],
    timeout: float,
    graph_mode: str = "feedback",
    feedback_mode: str = "full",
) -> Tuple[str, Dict[str, Any]]:
    """
    Calls this repo's Next route /api/generate-ocl (NDJSON stream).
    apiKey is sent in JSON (same as route: body.apiKey overrides cookie for automation).
    """
    url = base_url.rstrip("/") + "/api/generate-ocl"
    payload: Dict[str, Any] = {
        "project": project,
        "useCase": use_case,
        "operation": operation,
        "model": model,
        "apiKey": api_key,
        "graphMode": graph_mode,
        "feedbackMode": feedback_mode,
    }
    if user_input:
        payload["userInput"] = user_input
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/x-ndjson, application/json, text/plain, */*",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    meta: Dict[str, Any] = {
        "last_contract": None,
        "last_contract_errors": None,
        "last_ocl": None,
        "contract_parse_ok": False,
        "contract_error_messages": "",
        "last_typescript_generation_errors": None,
        "typescript_generation_ok": False,
        "last_typescript_parse_errors": None,
        "typescript_parse_ok": False,
        "test_execution_ok": False,
        "test_passing_count": 0,
        "test_failing_count": 0,
        "http_error": None,
        "step_errors": [],
        "repair_round_count": 0,
        "feedback_used": False,
    }
    lines: List[str] = []
    ocl_round = 0
    step_index = 0
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            try:
                raw_bytes = resp.read()
            except http.client.IncompleteRead as e:
                raw_bytes = e.partial or b""
                meta["stream_incomplete"] = "incomplete_read_partial_response"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        meta["http_error"] = f"HTTP {e.code}: {body[:4000]}"
        return "", meta
    except urllib.error.URLError as e:
        meta["http_error"] = f"URL error: {e}"
        return "", meta
    text = raw_bytes.decode("utf-8", errors="replace")
    for ls in text.splitlines():
        ls = ls.strip()
        if not ls:
            continue
        try:
            obj = json.loads(ls)
        except json.JSONDecodeError:
            continue
        lines.append(ls)
        step_index += 1
        if "OCL Generator" in obj:
            ocl_round += 1
            og = obj["OCL Generator"] or {}
            meta["last_ocl"] = og.get("ocl") or og
            meta["repair_round_count"] = ocl_round
            if bool(og.get("feedbackUsed")):
                meta["feedback_used"] = True
        if "Contract Generator" in obj:
            cg = obj["Contract Generator"] or {}
            meta["last_contract"] = cg.get("contract")
            errs = cg.get("contractErrors")
            meta["last_contract_errors"] = errs
            if errs is None:
                meta["contract_parse_ok"] = False
            else:
                meta["contract_parse_ok"] = len(errs) == 0
                meta["contract_error_messages"] = "\n".join(
                    str(x.get("msg", x)) for x in errs
                )
                if errs:
                    meta["step_errors"].append(
                        {
                            "step_index": step_index,
                            "repair_round": max(1, ocl_round),
                            "stage": "Contract Generator",
                            "error_type": "contract_parse_error",
                            "errors": errs,
                            "contract": cg.get("contract") or "",
                        }
                    )
        if "TypeScript Generator" in obj:
            tg = obj["TypeScript Generator"] or {}
            errs = tg.get("typescriptErrors") or []
            meta["last_typescript_generation_errors"] = errs
            meta["typescript_generation_ok"] = len(errs) == 0
            if errs:
                meta["step_errors"].append(
                    {
                        "step_index": step_index,
                        "repair_round": max(1, ocl_round),
                        "stage": "TypeScript Generator",
                        "error_type": "typescript_generation_error",
                        "errors": errs,
                    }
                )
        if "TypeScript Parser" in obj:
            tp = obj["TypeScript Parser"] or {}
            errs = tp.get("typescriptErrors") or []
            meta["last_typescript_parse_errors"] = errs
            meta["typescript_parse_ok"] = len(errs) == 0
            if errs:
                meta["step_errors"].append(
                    {
                        "step_index": step_index,
                        "repair_round": max(1, ocl_round),
                        "stage": "TypeScript Parser",
                        "error_type": "typescript_parse_error",
                        "errors": errs,
                        }
                    )
        if "Test Result" in obj:
            tr = obj["Test Result"] or {}
            result = tr.get("result") or {}
            passing = int(result.get("numPassingTests") or 0)
            failing = int(result.get("numFailingTests") or 0)
            meta["test_passing_count"] = passing
            meta["test_failing_count"] = failing
            meta["test_execution_ok"] = passing > 0 and failing == 0
    if meta["last_contract_errors"] is None and not meta.get("http_error"):
        meta["stream_incomplete"] = "no_contract_generator_in_stream"
    return "\n".join(lines), meta


def synthetic_parser_from_contract_meta(meta: Dict[str, Any]) -> Dict[str, Any]:
    """Map LangGraph contract step to the same shape as validate_ocl_with_parser."""
    if meta.get("http_error"):
        return {
            "is_valid": False,
            "parser_stdout": "",
            "parser_stderr": str(meta["http_error"]),
            "parser_returncode": None,
            "parser_error_message": str(meta["http_error"]),
            "parser_skipped": False,
            "subprocess_timeout": False,
            "subprocess_exception": True,
        }
    if meta.get("stream_incomplete") and meta.get("last_contract_errors") is None:
        msg = str(meta["stream_incomplete"])
        return {
            "is_valid": False,
            "parser_stdout": "",
            "parser_stderr": msg,
            "parser_returncode": 1,
            "parser_error_message": msg,
            "parser_skipped": False,
            "subprocess_timeout": False,
            "subprocess_exception": False,
        }
    ok = bool(meta.get("contract_parse_ok"))
    errs = meta.get("last_contract_errors") or []
    out = json.dumps(errs, ensure_ascii=False)
    stderr = meta.get("contract_error_messages") or ""
    return {
        "is_valid": ok,
        "parser_stdout": out,
        "parser_stderr": stderr,
        "parser_returncode": 0 if ok else 1,
        "parser_error_message": stderr,
        "parser_skipped": False,
        "subprocess_timeout": False,
        "subprocess_exception": False,
    }


def extraction_from_next(meta: Dict[str, Any], raw_ndjson: str) -> Dict[str, Any]:
    contract = meta.get("last_contract") or ""
    ocl = meta.get("last_ocl")
    if contract:
        return {
            "extracted_ocl": contract,
            "extraction_warning": "",
            "extraction_success": True,
        }
    if ocl is not None:
        try:
            blob = json.dumps(ocl, ensure_ascii=False)
        except TypeError:
            blob = str(ocl)
        return {
            "extracted_ocl": blob,
            "extraction_warning": "no_contract_text_used_ocl_json",
            "extraction_success": True,
        }
    return {
        "extracted_ocl": raw_ndjson[:50000],
        "extraction_warning": "empty_contract_and_ocl",
        "extraction_success": False,
    }


def setup_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "run.log"
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.handlers.clear()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    root.addHandler(fh)
    root.addHandler(sh)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def print_progress(done: int, total: int, rec: Dict[str, Any]) -> None:
    pct = (done / total * 100.0) if total else 0.0
    status = "valid" if rec.get("is_valid") else str(rec.get("error_type") or "invalid")
    print(
        "[{done}/{total} {pct:6.2f}%] model={model} op={op} att={att} "
        "status={status} latency={latency:.2f}s".format(
            done=done,
            total=total,
            pct=pct,
            model=rec.get("model", ""),
            op=rec.get("operation_id", ""),
            att=rec.get("attempt", ""),
            status=status,
            latency=float(rec.get("latency_sec") or 0.0),
        ),
        flush=True,
    )


def append_jsonl(path: Path, obj: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                logging.warning("skip bad jsonl line in %s: %s", path, e)
    return rows


def safe_operation(row: Dict[str, Any], line_no: int) -> Optional[Dict[str, Any]]:
    oid = row.get("id") or row.get("operation_id")
    if not oid:
        logging.warning("line %s: missing id, skipped", line_no)
        return None
    return {
        "id": str(oid),
        "case_study": str(row.get("case_study") or row.get("case") or "unknown"),
        "service": str(row.get("service") or ""),
        "entity": str(row.get("entity") or ""),
        "operation_name": str(row.get("operation_name") or row.get("name") or ""),
        "operation_signature": str(
            row.get("operation_signature") or row.get("signature") or ""
        ),
        "description": str(row.get("description") or ""),
        "parameters": row.get("parameters") or [],
        "return_type": str(row.get("return_type") or ""),
        "model_context": str(row.get("model_context") or row.get("context") or ""),
        "reference_contract": row.get("reference_contract") or "",
        "project": str(row.get("project") or "").strip(),
        "useCase": str(row.get("useCase") or row.get("use_case") or "").strip(),
        "operation": str(row.get("operation") or row.get("operation_name") or "").strip(),
        "userInput": str(row.get("userInput") or row.get("user_input") or "").strip()
        or None,
    }


def build_prompt(op: Dict[str, Any]) -> str:
    params = op.get("parameters")
    try:
        params_str = json.dumps(params, ensure_ascii=False)
    except (TypeError, ValueError):
        params_str = str(params)
    return f"""你是一名 OCL 合约生成专家。请根据给定的自然语言需求、操作签名、参数、返回值类型和系统模型上下文，生成一个完整的 OCL operation contract。

要求：
1. 只输出 OCL contract，不要输出解释；
2. 必须包含 context；
3. 尽量包含 precondition 和 postcondition；
4. 如果需要，可以包含 definition；
5. 不要编造 model_context 中不存在的类、属性、关联或操作；
6. 使用标准 OCL 风格；
7. 保持 result、self、@pre 等关键字使用正确；
8. 不要使用 Markdown 代码块；
9. 不要输出自然语言说明；
10. 不要输出 JSON。

输入信息：
Case Study: {op["case_study"]}
Service: {op["service"]}
Entity: {op["entity"]}
Operation Signature: {op["operation_signature"]}
Description: {op["description"]}
Parameters: {params_str}
Return Type: {op["return_type"]}

Model Context:
{op["model_context"]}

请输出 OCL operation contract。
"""


def extract_ocl_contract(raw_text: str) -> Dict[str, Any]:
    if raw_text is None or raw_text.strip() == "":
        return {
            "extracted_ocl": "",
            "extraction_warning": "empty raw_text",
            "extraction_success": False,
        }
    text = raw_text.strip()
    ocl_fence = re.search(r"```ocl\s*([\s\S]*?)```", text, re.IGNORECASE)
    if ocl_fence:
        inner = ocl_fence.group(1).strip()
        return {
            "extracted_ocl": inner,
            "extraction_warning": "",
            "extraction_success": True,
        }
    generic = re.findall(r"```[^\n]*\n([\s\S]*?)```", text)
    for block in generic:
        if "context" in block.lower():
            return {
                "extracted_ocl": block.strip(),
                "extraction_warning": "from generic fenced block",
                "extraction_success": True,
            }
    m = re.search(r"(?i)\bcontext\b[\s\S]*", text)
    if m:
        return {
            "extracted_ocl": m.group(0).strip(),
            "extraction_warning": "truncated from first 'context'",
            "extraction_success": True,
        }
    cleaned = re.sub(
        r"(?is)^(here is|the contract is|below is|output:|answer:)[:\s]*", "", text
    ).strip()
    return {
        "extracted_ocl": cleaned,
        "extraction_warning": "could not locate context; kept full cleaned text",
        "extraction_success": "context" in cleaned.lower(),
    }


def _heuristic_malformed_context(ocl: str) -> bool:
    if not ocl.strip():
        return True
    low = ocl.lower()
    if "context" not in low:
        return False
    first = re.search(r"(?is)context\s+[^:]+::", ocl)
    if not first:
        return True
    line = ocl[: ocl.find("\n") if "\n" in ocl else len(ocl)]
    if "(" in line or ")" in line:
        if line.count("(") != line.count(")"):
            return True
    return False


def classify_parser_error(
    extracted_ocl: str,
    parser_stdout: str,
    parser_stderr: str,
    returncode: Optional[int],
    extraction_result: Dict[str, Any],
    *,
    subprocess_timeout: bool = False,
    subprocess_exception: bool = False,
    parser_skipped: bool = False,
    is_valid: bool = False,
) -> str:
    if is_valid:
        return "none"
    if parser_skipped:
        return "dry_run_skipped_validation"
    if subprocess_timeout:
        return "parser_timeout"
    if subprocess_exception:
        return "parser_internal_error"
    if not extraction_result.get("extraction_success", False):
        return "extraction_failed"
    ocl = extracted_ocl or ""
    low = ocl.lower()
    if "context" not in low:
        return "missing_context"
    if _heuristic_malformed_context(ocl):
        return "malformed_context"
    if "precondition" not in low and "postcondition" not in low:
        return "missing_pre_post"
    msg = (parser_stdout or "") + "\n" + (parser_stderr or "")
    ml = msg.lower()
    antlr_tokens = (
        "mismatched input",
        "no viable alternative",
        "extraneous input",
        "missing ",
        "token recognition error",
    )
    if any(t in ml for t in antlr_tokens):
        return "malformed_expression"
    if any(
        t in ml
        for t in ("unsupported", "not supported", "unknown construct")
    ):
        return "unsupported_construct"
    if any(
        t in ml
        for t in (
            "self",
            "result",
            "@pre",
            "undefined variable",
            "unknown variable",
        )
    ):
        return "invalid_keyword_usage"
    if any(
        t in ml
        for t in ("signature", "operation", "parameter", "return type")
    ):
        return "invalid_operation_signature"
    if returncode is not None and returncode != 0:
        return "unknown_parser_error"
    return "unknown_parser_error"


def _http_json(
    url: str,
    payload: Dict[str, Any],
    headers: Dict[str, str],
    timeout: float,
) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body)


def _openai_compatible_chat(
    base: str,
    api_key: str,
    model: str,
    prompt: str,
    temperature: float,
    max_tokens: int,
    timeout: float,
) -> str:
    base = base.rstrip("/")
    url = f"{base}/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    out = _http_json(url, payload, headers, timeout)
    choices = out.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    return str(msg.get("content") or "")


def _anthropic_messages(
    base: str,
    api_key: str,
    model: str,
    prompt: str,
    max_tokens: int,
    timeout: float,
) -> str:
    base = base.rstrip("/")
    url = f"{base}/v1/messages"
    payload = {
        "model": model,
        "max_tokens": max(256, max_tokens),
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    out = _http_json(url, payload, headers, timeout)
    blocks = out.get("content") or []
    parts: List[str] = []
    for b in blocks:
        if isinstance(b, dict) and b.get("type") == "text":
            parts.append(str(b.get("text") or ""))
    return "".join(parts)


def call_llm(model_name: str, prompt: str, args: argparse.Namespace) -> str:
    """
    Routes by model family. Base URLs from env (override as needed):

    - OpenAI-compatible (gpt, deepseek, qwen): OPENAI_BASE_URL, DEEPSEEK_BASE_URL,
      QWEN_BASE_URL (each falls back only for that family if unset — see code).
    - Anthropic: ANTHROPIC_BASE_URL (default https://api.anthropic.com).

    Keys: OPENAI_API_KEY, DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, QWEN_API_KEY
    """
    # --- Optional project hook ---
    # return call_project_llm(model_name, prompt, args)

    timeout = float(getattr(args, "http_timeout", 120.0))
    temperature = float(args.temperature)
    max_tokens = int(args.max_tokens)
    last_err: Optional[BaseException] = None
    for attempt in range(1, 4):
        try:
            if model_name.startswith("gpt-"):
                key = os.environ.get("OPENAI_API_KEY", "")
                if not key:
                    raise RuntimeError("OPENAI_API_KEY is not set")
                base = os.environ.get("OPENAI_BASE_URL", "").strip()
                if not base:
                    base = "https://api.openai.com/v1"
                    logging.warning(
                        "OPENAI_BASE_URL unset; using default OpenAI endpoint "
                        "(set OPENAI_BASE_URL for gateways like apiyi)."
                    )
                return _openai_compatible_chat(
                    base, key, model_name, prompt, temperature, max_tokens, timeout
                )
            if model_name.startswith("deepseek-"):
                key = os.environ.get("DEEPSEEK_API_KEY", "")
                if not key:
                    raise RuntimeError("DEEPSEEK_API_KEY is not set")
                base = os.environ.get("DEEPSEEK_BASE_URL", "").strip()
                if not base:
                    base = "https://api.deepseek.com/v1"
                    logging.warning("DEEPSEEK_BASE_URL unset; using default.")
                return _openai_compatible_chat(
                    base, key, model_name, prompt, temperature, max_tokens, timeout
                )
            if model_name.startswith("claude-"):
                key = os.environ.get("ANTHROPIC_API_KEY", "")
                if not key:
                    raise RuntimeError("ANTHROPIC_API_KEY is not set")
                base = os.environ.get("ANTHROPIC_BASE_URL", "").strip()
                if not base:
                    base = "https://api.anthropic.com"
                return _anthropic_messages(
                    base, key, model_name, prompt, max_tokens, timeout
                )
            if model_name.startswith("qwen"):
                key = os.environ.get("QWEN_API_KEY", "")
                if not key:
                    raise RuntimeError("QWEN_API_KEY is not set")
                base = os.environ.get("QWEN_BASE_URL", "").strip()
                if not base:
                    base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                    logging.warning("QWEN_BASE_URL unset; using DashScope compatible URL.")
                return _openai_compatible_chat(
                    base, key, model_name, prompt, temperature, max_tokens, timeout
                )
            raise RuntimeError(f"Unsupported model_name: {model_name}")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            last_err = e
            logging.warning("LLM attempt %s failed: %s", attempt, e)
        except Exception as e:
            last_err = e
            logging.warning("LLM attempt %s failed: %s", attempt, e)
        time.sleep((2 ** (attempt - 1)) + random.random())
    raise RuntimeError(f"call_llm failed after retries: {last_err}")


def validate_ocl_with_parser(
    ocl_text: str,
    operation_record: Dict[str, Any],
    input_file: Path,
    parser_cmd_template: Optional[str],
    parser_timeout: int,
    parser_use_shell: bool,
) -> Dict[str, Any]:
    _ = operation_record
    if not parser_cmd_template:
        return {
            "is_valid": False,
            "parser_stdout": "",
            "parser_stderr": "",
            "parser_returncode": None,
            "parser_error_message": "",
            "parser_skipped": True,
            "subprocess_timeout": False,
            "subprocess_exception": False,
        }
    input_file.parent.mkdir(parents=True, exist_ok=True)
    input_file.write_text(ocl_text, encoding="utf-8")
    cmd_str = parser_cmd_template.replace("{input_file}", str(input_file.resolve()))
    if parser_use_shell:
        proc = subprocess.run(
            cmd_str,
            shell=True,
            capture_output=True,
            text=True,
            timeout=parser_timeout,
            encoding="utf-8",
            errors="replace",
        )
    else:
        try:
            cmd_list = shlex.split(cmd_str, posix=os.name != "nt")
        except ValueError as e:
            return {
                "is_valid": False,
                "parser_stdout": "",
                "parser_stderr": f"shlex split error: {e}; try --parser-use-shell",
                "parser_returncode": None,
                "parser_error_message": str(e),
                "parser_skipped": False,
                "subprocess_timeout": False,
                "subprocess_exception": True,
            }
        proc = subprocess.run(
            cmd_list,
            shell=False,
            capture_output=True,
            text=True,
            timeout=parser_timeout,
            encoding="utf-8",
            errors="replace",
        )
    rc = proc.returncode
    out = proc.stdout or ""
    err = proc.stderr or ""
    return {
        "is_valid": rc == 0,
        "parser_stdout": out,
        "parser_stderr": err,
        "parser_returncode": rc,
        "parser_error_message": err.strip() or out.strip(),
        "parser_skipped": False,
        "subprocess_timeout": False,
        "subprocess_exception": False,
    }


def run_parser_safe(
    ocl_text: str,
    operation_record: Dict[str, Any],
    input_file: Path,
    parser_cmd_template: Optional[str],
    parser_timeout: int,
    parser_use_shell: bool,
) -> Dict[str, Any]:
    if not parser_cmd_template:
        return validate_ocl_with_parser(
            ocl_text,
            operation_record,
            input_file,
            None,
            parser_timeout,
            parser_use_shell,
        )
    try:
        return validate_ocl_with_parser(
            ocl_text,
            operation_record,
            input_file,
            parser_cmd_template,
            parser_timeout,
            parser_use_shell,
        )
    except subprocess.TimeoutExpired:
        return {
            "is_valid": False,
            "parser_stdout": "",
            "parser_stderr": "subprocess.TimeoutExpired",
            "parser_returncode": None,
            "parser_error_message": "timeout",
            "parser_skipped": False,
            "subprocess_timeout": True,
            "subprocess_exception": False,
        }
    except Exception as e:
        logging.exception("parser subprocess error")
        return {
            "is_valid": False,
            "parser_stdout": "",
            "parser_stderr": repr(e),
            "parser_returncode": None,
            "parser_error_message": str(e),
            "parser_skipped": False,
            "subprocess_timeout": False,
            "subprocess_exception": True,
        }


def reindex_attempts(
    attempts: List[Dict[str, Any]], max_attempts: int
) -> Tuple[
    Dict[Tuple[str, str], List[Dict[str, Any]]],
    Set[Tuple[str, str]],
    Set[Tuple[str, str]],
]:
    by_key: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for row in attempts:
        key = (row.get("operation_id", ""), row.get("model", ""))
        by_key[key].append(row)
    succeeded: Set[Tuple[str, str]] = set()
    exhausted: Set[Tuple[str, str]] = set()
    for key, rows in by_key.items():
        rows.sort(key=lambda r: int(r.get("attempt", 0)))
        valid_rows = [
            r
            for r in rows
            if r.get("is_valid") and not r.get("parser_skipped")
        ]
        if valid_rows:
            succeeded.add(key)
        else:
            max_att = max((int(r.get("attempt", 0)) for r in rows), default=0)
            if max_att >= max_attempts:
                exhausted.add(key)
    return by_key, succeeded, exhausted


def clear_attempts_for_pairs(path: Path, pairs: Set[Tuple[str, str]]) -> None:
    if not path.exists() or not pairs:
        return
    keep: List[Dict[str, Any]] = []
    for row in read_jsonl(path):
        key = (row.get("operation_id", ""), row.get("model", ""))
        if key in pairs:
            continue
        keep.append(row)
    path.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in keep) + ("\n" if keep else ""),
        encoding="utf-8",
    )


def summarize_rq1_results(
    output_dir: Path,
    max_attempts: int,
    *,
    benchmark_operation_ids: Optional[Set[str]] = None,
    operation_case: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    attempts_path = output_dir / "attempts.jsonl"
    attempts = read_jsonl(attempts_path)
    usable = [a for a in attempts if not a.get("parser_skipped")]
    by_key, succeeded, exhausted = reindex_attempts(usable, max_attempts)

    models = sorted({a.get("model", "") for a in usable if a.get("model")})
    if benchmark_operation_ids is None:
        benchmark_operation_ids = {
            str(a.get("operation_id", "")) for a in usable if a.get("operation_id")
        }
    if operation_case is None:
        operation_case = {
            str(a.get("operation_id", "")): str(a.get("case_study", ""))
            for a in usable
            if a.get("operation_id")
        }
    cases = sorted(
        {operation_case.get(oid, "") for oid in benchmark_operation_ids if operation_case.get(oid)}
    )

    # Exp1 + Exp2 aggregates
    def agg_model(model: str) -> Dict[str, Any]:
        ops_for_model = set(benchmark_operation_ids)
        total = len(ops_for_model)
        valid_count = sum(1 for oid in ops_for_model if (oid, model) in succeeded)
        invalid_count = total - valid_count
        vr = (100.0 * valid_count / total) if total else 0.0
        attempts_success: List[int] = []
        latencies: List[float] = []
        total_attempts = 0
        for oid in ops_for_model:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r.get("attempt", 0)))
            total_attempts += len(rows)
            first_valid_idx: Optional[int] = None
            for r in rows:
                if r.get("is_valid") and not r.get("parser_skipped"):
                    first_valid_idx = int(r.get("attempt", 1))
                    latencies.append(float(r.get("latency_sec", 0.0)))
                    break
            if first_valid_idx is not None:
                attempts_success.append(first_valid_idx)
        avg_att = sum(attempts_success) / len(attempts_success) if attempts_success else 0.0
        avg_lat = sum(latencies) / len(latencies) if latencies else 0.0

        valid_at = {k: 0 for k in range(1, max_attempts + 1)}
        for oid in ops_for_model:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r.get("attempt", 0)))
            for k in range(1, max_attempts + 1):
                if any(
                    int(r.get("attempt", 0)) <= k
                    and r.get("is_valid")
                    and not r.get("parser_skipped")
                    for r in rows
                ):
                    valid_at[k] += 1

        rates = {
            k: (100.0 * valid_at[k] / total) if total else 0.0 for k in range(1, max_attempts + 1)
        }
        return {
            "model": model,
            "total_operations": total,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "validity_rate": vr,
            "avg_attempts_for_success": avg_att,
            "total_attempts": total_attempts,
            "avg_latency_sec": avg_lat,
            "valid_at_counts": valid_at,
            "valid_at_rates": rates,
        }

    exp1_model_rows = [agg_model(m) for m in models]

    def agg_model_case(model: str, case: str) -> Dict[str, Any]:
        ops_mc = {
            oid
            for oid in benchmark_operation_ids
            if operation_case.get(oid) == case
        }
        total = len(ops_mc)
        valid_count = sum(
            1 for oid in ops_mc if (oid, model) in succeeded
        )
        invalid_count = total - valid_count
        vr = (100.0 * valid_count / total) if total else 0.0
        attempts_success: List[int] = []
        for oid in ops_mc:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r.get("attempt", 0)))
            for r in rows:
                if r.get("is_valid") and not r.get("parser_skipped"):
                    attempts_success.append(int(r.get("attempt", 1)))
                    break
        avg_att = sum(attempts_success) / len(attempts_success) if attempts_success else 0.0
        valid_at = {kk: 0 for kk in range(1, max_attempts + 1)}
        for oid in ops_mc:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r.get("attempt", 0)))
            for kk in range(1, max_attempts + 1):
                if any(
                    int(r.get("attempt", 0)) <= kk
                    and r.get("is_valid")
                    and not r.get("parser_skipped")
                    for r in rows
                ):
                    valid_at[kk] += 1
        rates = {
            kk: (100.0 * valid_at[kk] / total) if total else 0.0
            for kk in range(1, max_attempts + 1)
        }
        return {
            "model": model,
            "case_study": case,
            "total_operations": total,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "validity_rate": vr,
            "avg_attempts_for_success": avg_att,
            "valid_at_counts": valid_at,
            "valid_at_rates": rates,
        }

    exp1_case_rows: List[Dict[str, Any]] = []
    for m in models:
        for c in cases:
            row = agg_model_case(m, c)
            if row["total_operations"] > 0:
                exp1_case_rows.append(row)

    # Exp3 attempt-level invalid
    invalid_attempts = [
        a
        for a in usable
        if not a.get("is_valid") and not a.get("parser_skipped")
    ]
    exp3_model_err: Dict[Tuple[str, str], int] = defaultdict(int)
    for a in invalid_attempts:
        et = str(a.get("error_type") or "unknown_parser_error")
        exp3_model_err[(str(a.get("model", "")), et)] += 1
    exp3_case_err: Dict[Tuple[str, str, str], int] = defaultdict(int)
    for a in invalid_attempts:
        et = str(a.get("error_type") or "unknown_parser_error")
        exp3_case_err[(str(a.get("model", "")), str(a.get("case_study", "")), et)] += 1

    # Operation-level final error (last attempt among invalid-only ops)
    final_err_rows: List[Dict[str, Any]] = []
    final_err_dist: Dict[Tuple[str, str], int] = defaultdict(int)
    for (oid, model), rows in by_key.items():
        rows = sorted(rows, key=lambda r: int(r.get("attempt", 0)))
        if (oid, model) in succeeded:
            continue
        if not rows:
            continue
        last = rows[-1]
        et = str(last.get("error_type") or "unknown_parser_error")
        final_err_dist[(model, et)] += 1
        if not last.get("is_valid"):
            final_err_rows.append(
                {
                    "operation_id": oid,
                    "case_study": last.get("case_study"),
                    "model": model,
                    "attempt": last.get("attempt"),
                    "error_type": et,
                    "parser_stdout": last.get("parser_stdout", ""),
                    "parser_stderr": last.get("parser_stderr", ""),
                    "extracted_ocl": last.get("extracted_ocl", ""),
                }
            )

    summary = {
        "generated_at": utc_now_iso(),
        "max_attempts": max_attempts,
        "exp1_by_model": exp1_model_rows,
        "exp1_by_case": exp1_case_rows,
        "exp3_attempt_level_counts": {f"{m}|{e}": c for (m, e), c in exp3_model_err.items()},
        "exp3_operation_final_counts": {f"{m}|{e}": c for (m, e), c in final_err_dist.items()},
    }
    return {
        "summary": summary,
        "exp1_model_rows": exp1_model_rows,
        "exp1_case_rows": exp1_case_rows,
        "exp3_model_err": exp3_model_err,
        "exp3_case_err": exp3_case_err,
        "final_err_rows": final_err_rows,
        "invalid_attempts": invalid_attempts,
        "models": models,
        "cases": cases,
        "by_key": by_key,
        "succeeded": succeeded,
    }


def write_exp_csvs(
    output_dir: Path,
    pack: Dict[str, Any],
    max_attempts: int,
) -> None:
    exp1_model = output_dir / "exp1_validity_rate_by_model.csv"
    rows = pack["exp1_model_rows"]
    with exp1_model.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "total_operations",
                "valid_count",
                "invalid_count",
                "validity_rate",
                "avg_attempts_for_success",
                "total_attempts",
                "avg_latency_sec",
            ]
        )
        for r in rows:
            w.writerow(
                [
                    r["model"],
                    r["total_operations"],
                    r["valid_count"],
                    r["invalid_count"],
                    f"{r['validity_rate']:.4f}",
                    f"{r['avg_attempts_for_success']:.4f}",
                    r["total_attempts"],
                    f"{r['avg_latency_sec']:.4f}",
                ]
            )

    exp1_case = output_dir / "exp1_validity_rate_by_case.csv"
    with exp1_case.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "case_study",
                "total_operations",
                "valid_count",
                "invalid_count",
                "validity_rate",
                "avg_attempts_for_success",
            ]
        )
        for r in pack["exp1_case_rows"]:
            w.writerow(
                [
                    r["model"],
                    r["case_study"],
                    r["total_operations"],
                    r["valid_count"],
                    r["invalid_count"],
                    f"{r['validity_rate']:.4f}",
                    f"{r['avg_attempts_for_success']:.4f}",
                ]
            )

    # Exp2
    hdr = ["model", "total_operations"]
    for k in range(1, max_attempts + 1):
        hdr.append(f"valid_at_{k}_count")
    for k in range(1, max_attempts + 1):
        hdr.append(f"valid_at_{k}_rate")
    exp2_model = output_dir / "exp2_valid_at_k_by_model.csv"
    with exp2_model.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for r in rows:
            vac = r["valid_at_counts"]
            var = r["valid_at_rates"]
            line = [r["model"], r["total_operations"]]
            for k in range(1, max_attempts + 1):
                line.append(vac[k])
            for k in range(1, max_attempts + 1):
                line.append(f"{var[k]:.4f}")
            w.writerow(line)

    exp2_case = output_dir / "exp2_valid_at_k_by_case.csv"
    with exp2_case.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            ["model", "case_study", "total_operations"]
            + [f"valid_at_{k}_count" for k in range(1, max_attempts + 1)]
            + [f"valid_at_{k}_rate" for k in range(1, max_attempts + 1)]
        )
        for r in pack["exp1_case_rows"]:
            vac = r["valid_at_counts"]
            var = r["valid_at_rates"]
            line = [r["model"], r["case_study"], r["total_operations"]]
            for k in range(1, max_attempts + 1):
                line.append(vac[k])
            for k in range(1, max_attempts + 1):
                line.append(f"{var[k]:.4f}")
            w.writerow(line)

    # Exp3
    exp3_m = output_dir / "exp3_parser_error_types_by_model.csv"
    model_tot = defaultdict(int)
    for (m, _e), c in pack["exp3_model_err"].items():
        model_tot[m] += c
    with exp3_m.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["model", "error_type", "count", "percentage"])
        for (m, e), c in sorted(pack["exp3_model_err"].items()):
            tot = model_tot[m] or 1
            w.writerow([m, e, c, f"{100.0 * c / tot:.4f}"])

    exp3_c = output_dir / "exp3_parser_error_types_by_case.csv"
    mc_tot: Dict[Tuple[str, str], int] = defaultdict(int)
    for (m, cs, _e), c in pack["exp3_case_err"].items():
        mc_tot[(m, cs)] += c
    with exp3_c.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["model", "case_study", "error_type", "count", "percentage"])
        for (m, cs, e), c in sorted(pack["exp3_case_err"].items()):
            tot = mc_tot[(m, cs)] or 1
            w.writerow([m, cs, e, c, f"{100.0 * c / tot:.4f}"])

    fail_path = output_dir / "exp3_failed_cases_with_error_type.jsonl"
    with fail_path.open("w", encoding="utf-8") as fj:
        for row in pack["final_err_rows"]:
            fj.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary_path = output_dir / "summary.json"
    with summary_path.open("w", encoding="utf-8") as sf:
        json.dump(pack["summary"], sf, ensure_ascii=False, indent=2)


def write_step_error_summary(output_dir: Path) -> None:
    path = output_dir / "step_errors.jsonl"
    summary_path = output_dir / "step_error_summary.csv"
    if not path.exists():
        with summary_path.open("w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["model", "stage", "error_type", "count"])
        return
    rows = read_jsonl(path)
    counts: Dict[Tuple[str, str, str], int] = defaultdict(int)
    for row in rows:
        counts[
            (
                str(row.get("model", "")),
                str(row.get("stage", "")),
                str(row.get("error_type", "")),
            )
        ] += 1
    with summary_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["model", "stage", "error_type", "count"])
        for (model, stage, error_type), count in sorted(counts.items()):
            w.writerow([model, stage, error_type, count])


def first_attempt_rows(output_dir: Path) -> List[Dict[str, Any]]:
    rows = read_jsonl(output_dir / "attempts.jsonl")
    first_by_key: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for row in sorted(rows, key=lambda r: int(r.get("attempt", 0))):
        key = (str(row.get("operation_id", "")), str(row.get("model", "")))
        first_by_key.setdefault(key, row)
    return list(first_by_key.values())


def write_rq_csvs(output_dir: Path) -> None:
    rows = read_jsonl(output_dir / "attempts.jsonl")
    if not rows:
        return

    by_key: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_key[(str(row.get("operation_id", "")), str(row.get("model", "")))].append(row)

    final_rows: List[Dict[str, Any]] = []
    for key_rows in by_key.values():
        ordered = sorted(key_rows, key=lambda r: int(r.get("attempt", 0)))
        success = next((r for r in ordered if r.get("execution_valid")), None)
        if success is None and not any("execution_valid" in r for r in ordered):
            success = next((r for r in ordered if r.get("is_valid")), None)
        final_rows.append(success or ordered[-1])

    def metric_value(row: Dict[str, Any], field: str) -> bool:
        if field in row:
            return bool(row.get(field))
        if field in {"syntax_valid", "execution_valid"}:
            return bool(row.get("is_valid"))
        return False

    def write_grouped_metric(
        path: Path,
        group_fields: List[str],
        metric_field: str,
        count_name: str,
        rate_name: str,
    ) -> None:
        groups: Dict[Tuple[str, ...], List[Dict[str, Any]]] = defaultdict(list)
        for row in final_rows:
            groups[tuple(str(row.get(field, "")) for field in group_fields)].append(row)
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(group_fields + ["total_operations", count_name, f"non_{count_name}", rate_name])
            for key, group in sorted(groups.items()):
                count = sum(1 for r in group if metric_value(r, metric_field))
                total = len(group)
                rate = (100.0 * count / total) if total else 0.0
                w.writerow(list(key) + [total, count, total - count, f"{rate:.4f}"])

    write_grouped_metric(
        output_dir / "rq1_syntax_validity_by_model.csv",
        ["model"],
        "syntax_valid",
        "syntax_valid_count",
        "syntax_validity_rate",
    )
    write_grouped_metric(
        output_dir / "rq1_syntax_validity_by_case.csv",
        ["model", "case_study"],
        "syntax_valid",
        "syntax_valid_count",
        "syntax_validity_rate",
    )
    write_grouped_metric(
        output_dir / "rq2_execution_success_by_model.csv",
        ["model"],
        "execution_valid",
        "execution_success_count",
        "execution_success_rate",
    )
    write_grouped_metric(
        output_dir / "rq2_execution_success_by_case.csv",
        ["model", "case_study"],
        "execution_valid",
        "execution_success_count",
        "execution_success_rate",
    )

    feedback_groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for row in final_rows:
        feedback_groups[(str(row.get("model", "")), str(row.get("case_study", "")))].append(row)

    for path, fields in [
        (output_dir / "rq3_feedback_utility_by_model.csv", ["model"]),
        (output_dir / "rq3_feedback_utility_by_case.csv", ["model", "case_study"]),
    ]:
        groups: Dict[Tuple[str, ...], List[Dict[str, Any]]] = defaultdict(list)
        for row in final_rows:
            groups[tuple(str(row.get(field, "")) for field in fields)].append(row)
        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(
                fields
                + [
                    "total_operations",
                    "operations_with_intermediate_errors",
                    "repaired_after_feedback_count",
                    "unrepaired_after_feedback_count",
                    "repair_success_rate",
                    "avg_repair_rounds",
                    "avg_intermediate_errors",
                ]
            )
            for key, group in sorted(groups.items()):
                with_errors = [r for r in group if r.get("had_intermediate_errors")]
                repaired = [r for r in with_errors if r.get("execution_valid")]
                unrepaired = [r for r in with_errors if not r.get("execution_valid")]
                rate = (100.0 * len(repaired) / len(with_errors)) if with_errors else 0.0
                avg_rounds = sum(int(r.get("repair_round_count") or 0) for r in group) / len(group)
                avg_errors = sum(int(r.get("intermediate_error_count") or 0) for r in group) / len(group)
                w.writerow(
                    list(key)
                    + [
                        len(group),
                        len(with_errors),
                        len(repaired),
                        len(unrepaired),
                        f"{rate:.4f}",
                        f"{avg_rounds:.4f}",
                        f"{avg_errors:.4f}",
                    ]
                )


def parse_models_arg(s: str) -> List[str]:
    parts = [x.strip() for x in s.split(",") if x.strip()]
    for mid in parts:
        if mid not in ALL_MODELS:
            raise argparse.ArgumentTypeError(f"unknown model: {mid}. Allowed: {ALL_MODELS}")
    return parts


def main() -> None:
    p = argparse.ArgumentParser(description="RQ1 validity experiments (Exp1–Exp3).")
    p.add_argument("--input", default="data/operations.jsonl", help="JSONL operations")
    p.add_argument("--output-dir", default="results/rq1_validity", help="Output directory")
    p.add_argument(
        "--models",
        default=",".join(ALL_MODELS),
        type=parse_models_arg,
        help="Comma-separated model ids",
    )
    p.add_argument("--max-attempts", type=int, default=5)
    p.add_argument("--parser-cmd", default="", help='Template with {input_file}, e.g. node parse.js --input {input_file}')
    p.add_argument("--parser-timeout", type=int, default=60)
    p.add_argument("--parser-use-shell", action="store_true", help="Use shell=True for parser (needed for some npm scripts on Windows). Risk: shell injection if input is untrusted.")
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--max-tokens", type=int, default=2048)
    p.add_argument("--sleep-between-calls", type=float, default=1.0)
    p.add_argument("--http-timeout", type=float, default=120.0)
    p.add_argument("--dry-run", action="store_true", help="Do not run parser; still call LLM unless analyze-only")
    p.add_argument("--force", action="store_true", help="Clear previous attempts/raw_generations before run")
    p.add_argument("--analyze-only", action="store_true", help="Recompute CSV/summary from attempts.jsonl only")
    p.add_argument("--rerun-invalid", action="store_true", help="Remove attempts for (op,model) that never succeeded")
    p.add_argument("--limit", type=int, default=0, help="Only first N operations (smoke test)")
    p.add_argument(
        "--backend",
        choices=["direct", "next"],
        default="direct",
        help="direct: Python LLM APIs. next: this repo's POST /api/generate-ocl (LangGraph).",
    )
    p.add_argument(
        "--next-base-url",
        default=os.environ.get("NEXT_RQ1_BASE_URL", "http://127.0.0.1:3000"),
        help="App origin when --backend next (start Next dev server first).",
    )
    p.add_argument(
        "--next-read-timeout",
        type=float,
        default=float(os.environ.get("NEXT_RQ1_READ_TIMEOUT", "600")),
        help="HTTP read timeout for one full /api/generate-ocl response.",
    )
    p.add_argument(
        "--next-graph-mode",
        choices=["feedback", "linear"],
        default=os.environ.get("NEXT_RQ1_GRAPH_MODE", "feedback"),
        help="Next LangGraph mode: feedback is the full repair loop; linear is the no-feedback RQ3 ablation.",
    )
    p.add_argument(
        "--feedback-mode",
        choices=["full", "generic", "none"],
        default=os.environ.get("NEXT_RQ1_FEEDBACK_MODE"),
        help=(
            "Feedback ablation mode for --backend next. full uses concrete diagnostics; "
            "generic uses one fixed failure message without diagnostic details; none uses the linear no-feedback graph. "
            "If omitted, derived from --next-graph-mode for backward compatibility."
        ),
    )
    args = p.parse_args()
    if args.feedback_mode is None:
        args.feedback_mode = "none" if args.next_graph_mode == "linear" else "full"
    if args.feedback_mode == "none":
        args.next_graph_mode = "linear"
    else:
        args.next_graph_mode = "feedback"

    load_env_file(repo_root() / ".env")
    output_dir = Path(args.output_dir)
    logs_dir = output_dir / "logs"
    setup_logging(logs_dir)

    attempts_path = output_dir / "attempts.jsonl"
    raw_gen_path = output_dir / "raw_generations.jsonl"
    step_errors_path = output_dir / "step_errors.jsonl"
    tmp_dir = output_dir / "_tmp_ocl"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    if args.force and not args.analyze_only:
        for fp in [attempts_path, raw_gen_path, step_errors_path]:
            if fp.exists():
                fp.unlink()
        for pat in (
            "exp1_*.csv",
            "exp2_*.csv",
            "exp3_*.csv",
            "rq*.csv",
            "step_error_*.csv",
            "summary.json",
        ):
            for f in output_dir.glob(pat):
                f.unlink()
        logging.info("--force: cleared previous result files")

    attempts_path.parent.mkdir(parents=True, exist_ok=True)

    if args.analyze_only:
        if not attempts_path.exists():
            logging.error("analyze-only: %s not found", attempts_path)
            sys.exit(1)
        bench_ids: Optional[Set[str]] = None
        op_case: Optional[Dict[str, str]] = None
        inp_b = Path(args.input)
        if inp_b.exists():
            operations_b: List[Dict[str, Any]] = []
            with inp_b.open("r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    opb = safe_operation(row, i)
                    if opb:
                        operations_b.append(opb)
            if args.limit and args.limit > 0:
                operations_b = operations_b[: args.limit]
            bench_ids = {op["id"] for op in operations_b}
            op_case = {op["id"]: op["case_study"] for op in operations_b}
            logging.info("analyze-only: using benchmark ops from %s (%s)", inp_b, len(bench_ids))
        pack = summarize_rq1_results(
            output_dir,
            args.max_attempts,
            benchmark_operation_ids=bench_ids,
            operation_case=op_case,
        )
        write_exp_csvs(output_dir, pack, args.max_attempts)
        write_step_error_summary(output_dir)
        write_rq_csvs(output_dir)
        logging.info("analyze-only: wrote CSVs and summary.json")
        print_summary(pack)
        return

    input_path = Path(args.input)
    if not input_path.exists():
        logging.error("input not found: %s", input_path)
        sys.exit(1)

    operations: List[Dict[str, Any]] = []
    with input_path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as e:
                logging.warning("skip line %s: %s", i, e)
                continue
            op = safe_operation(row, i)
            if op:
                operations.append(op)
    if args.limit and args.limit > 0:
        operations = operations[: args.limit]

    if args.backend == "next":
        for op in operations:
            if not (op.get("project") and op.get("useCase") and op.get("operation")):
                logging.error(
                    '--backend next requires JSONL fields "project", "useCase", "operation" '
                    "(same keys as script/experiment.ts / GenerateOCLParam)."
                )
                sys.exit(1)
        if not os.environ.get("OPENAI_API_KEY"):
            logging.error(
                "--backend next: set OPENAI_API_KEY (sent as JSON apiKey to the Next route)."
            )
            sys.exit(1)
        logging.info(
            "Next backend: %s/api/generate-ocl (LangGraph mode=%s; feedback_mode=%s; OPENAI_BASE_URL from server env)",
            args.next_base_url.rstrip("/"),
            args.next_graph_mode,
            args.feedback_mode,
        )

    parser_cmd = args.parser_cmd.strip() or None
    if args.dry_run:
        parser_cmd = None
        logging.info("--dry-run: parser disabled")

    existing = read_jsonl(attempts_path)
    by_key, succeeded, exhausted = reindex_attempts(existing, args.max_attempts)

    if args.rerun_invalid:
        to_drop = {
            key
            for key in by_key.keys()
            if key[1] in args.models and key not in succeeded and key in exhausted
        }
        clear_attempts_for_pairs(attempts_path, to_drop)
        # Remove raw_generations for dropped keys
        if raw_gen_path.exists():
            raw_rows = read_jsonl(raw_gen_path)
            raw_keep = [
                r
                for r in raw_rows
                if (r.get("operation_id", ""), r.get("model", "")) not in to_drop
            ]
            raw_gen_path.write_text(
                "\n".join(json.dumps(r, ensure_ascii=False) for r in raw_keep)
                + ("\n" if raw_keep else ""),
                encoding="utf-8",
            )
        existing = read_jsonl(attempts_path)
        by_key, succeeded, exhausted = reindex_attempts(existing, args.max_attempts)
        logging.info("--rerun-invalid: cleared %s (op,model) pairs", len(to_drop))

    planned_total = len(operations) * len(args.models)
    completed_unique = len(succeeded | exhausted)
    print(
        f"Progress target: {planned_total} operation-model pairs "
        f"({len(operations)} operations x {len(args.models)} models).",
        flush=True,
    )

    for op in operations:
        oid = op["id"]
        for model in args.models:
            key = (oid, model)
            if key in succeeded:
                continue
            if key in exhausted and not args.rerun_invalid:
                continue
            start_attempt = len(by_key.get(key, [])) + 1
            for att in range(start_attempt, args.max_attempts + 1):
                if key in succeeded:
                    break
                prompt = ""
                t0 = time.perf_counter()
                raw_out = ""
                err_type_llm = ""
                llm_exc = False
                meta: Dict[str, Any] = {}
                if args.backend == "next":
                    proj = (op.get("project") or "").strip()
                    uc = (op.get("useCase") or "").strip()
                    oper = (op.get("operation") or "").strip()
                    ui_raw = op.get("userInput")
                    if ui_raw is not None and str(ui_raw).strip():
                        ui = str(ui_raw).strip()
                    else:
                        ui = (op.get("description") or "").strip() or None
                    api_key_n = os.environ.get("OPENAI_API_KEY", "")
                    prompt = json.dumps(
                        {
                            "project": proj,
                            "useCase": uc,
                            "operation": oper,
                            "model": model,
                            "userInput": ui,
                            "graphMode": args.next_graph_mode,
                            "feedbackMode": args.feedback_mode,
                        },
                        ensure_ascii=False,
                    )
                    try:
                        raw_out, meta = call_next_generate_ndjson(
                            args.next_base_url,
                            api_key_n,
                            proj,
                            uc,
                            oper,
                            model,
                            ui,
                            args.next_read_timeout,
                            args.next_graph_mode,
                            args.feedback_mode,
                        )
                    except Exception:
                        logging.exception(
                            "Next API failure op=%s model=%s att=%s", oid, model, att
                        )
                        err_type_llm = "llm_api_error"
                        llm_exc = True
                        raw_out = ""
                        meta = {"http_error": "python_exception_see_logs"}
                    if not (raw_out or "").strip() and not meta.get("http_error"):
                        if not err_type_llm:
                            err_type_llm = "empty_response"
                    ext = extraction_from_next(meta, raw_out)
                    ocl_text = ext.get("extracted_ocl") or ""
                    safe_oid = re.sub(r"[^\w\-.]", "_", str(oid))[:120]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:80]
                    tmp_file = tmp_dir / f"{safe_oid}__{safe_model}__{att}.ocl"
                    if parser_cmd:
                        p_res = run_parser_safe(
                            ocl_text,
                            op,
                            tmp_file,
                            parser_cmd,
                            args.parser_timeout,
                            args.parser_use_shell,
                        )
                    else:
                        p_res = synthetic_parser_from_contract_meta(meta)
                else:
                    prompt = build_prompt(op)
                    try:
                        raw_out = call_llm(model, prompt, args)
                    except Exception:
                        logging.exception(
                            "LLM failure op=%s model=%s att=%s", oid, model, att
                        )
                        err_type_llm = "llm_api_error"
                        llm_exc = True
                        raw_out = ""
                    if not (raw_out or "").strip() and not llm_exc:
                        err_type_llm = "empty_response"
                    ext = extract_ocl_contract(raw_out or "")
                    ocl_text = ext.get("extracted_ocl") or ""
                    safe_oid = re.sub(r"[^\w\-.]", "_", str(oid))[:120]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:80]
                    tmp_file = tmp_dir / f"{safe_oid}__{safe_model}__{att}.ocl"
                    p_res = run_parser_safe(
                        ocl_text,
                        op,
                        tmp_file,
                        parser_cmd,
                        args.parser_timeout,
                        args.parser_use_shell,
                    )
                latency = time.perf_counter() - t0
                is_valid = bool(p_res.get("is_valid")) and not p_res.get("parser_skipped")
                if err_type_llm:
                    is_valid = False
                syntax_valid = (
                    bool(meta.get("contract_parse_ok"))
                    if args.backend == "next"
                    else is_valid
                )
                execution_valid = (
                    syntax_valid
                    and bool(meta.get("typescript_generation_ok"))
                    and bool(meta.get("typescript_parse_ok"))
                    and bool(meta.get("test_execution_ok"))
                    and not bool(err_type_llm)
                    if args.backend == "next"
                    else is_valid
                )
                step_error_count = len(meta.get("step_errors", []))
                repair_round_count = int(meta.get("repair_round_count") or 0)
                if err_type_llm:
                    validation_stage = "llm_api"
                elif not syntax_valid:
                    validation_stage = "parser"
                elif not bool(meta.get("typescript_generation_ok")):
                    validation_stage = "typescript_generator"
                elif not bool(meta.get("typescript_parse_ok")):
                    validation_stage = "typescript_parser"
                elif not bool(meta.get("test_execution_ok")):
                    validation_stage = "jest"
                else:
                    validation_stage = "passed"
                if p_res.get("parser_skipped"):
                    et = "dry_run_skipped_validation"
                elif err_type_llm:
                    et = err_type_llm
                else:
                    et = classify_parser_error(
                        ocl_text,
                        p_res.get("parser_stdout", ""),
                        p_res.get("parser_stderr", ""),
                        p_res.get("parser_returncode"),
                        ext,
                        subprocess_timeout=p_res.get("subprocess_timeout", False),
                        subprocess_exception=p_res.get("subprocess_exception", False),
                        parser_skipped=p_res.get("parser_skipped", False),
                        is_valid=is_valid,
                    )
                rec = {
                    "operation_id": oid,
                    "case_study": op["case_study"],
                    "service": op["service"],
                    "entity": op["entity"],
                    "operation_name": op["operation_name"],
                    "operation_signature": op["operation_signature"],
                    "model": model,
                    "model_name": model,
                    "feedback_mode": args.feedback_mode,
                    "next_graph_mode": args.next_graph_mode if args.backend == "next" else "",
                    "attempt": att,
                    "attempt_id": att,
                    "raw_output": raw_out,
                    "extracted_ocl": ocl_text,
                    "extraction_success": ext.get("extraction_success"),
                    "extraction_warning": ext.get("extraction_warning", ""),
                    "is_valid": is_valid,
                    "syntax_valid": syntax_valid,
                    "execution_valid": execution_valid,
                    "validation_stage": validation_stage,
                    "parser_valid": syntax_valid,
                    "typescript_valid": bool(meta.get("typescript_generation_ok"))
                    and bool(meta.get("typescript_parse_ok")),
                    "jest_passed": bool(meta.get("test_execution_ok")),
                    "final_pass": execution_valid,
                    "number_of_attempts_used": att,
                    "whether_feedback_was_used": bool(meta.get("feedback_used")),
                    "contract_error_count": len(meta.get("last_contract_errors") or []),
                    "contract_errors": meta.get("last_contract_errors") or [],
                    "typescript_generation_ok": bool(meta.get("typescript_generation_ok")),
                    "typescript_parse_ok": bool(meta.get("typescript_parse_ok")),
                    "typescript_error_count": len(meta.get("last_typescript_generation_errors") or [])
                    + len(meta.get("last_typescript_parse_errors") or []),
                    "typescript_generation_errors": meta.get("last_typescript_generation_errors") or [],
                    "typescript_parse_errors": meta.get("last_typescript_parse_errors") or [],
                    "test_execution_ok": bool(meta.get("test_execution_ok")),
                    "test_passing_count": int(meta.get("test_passing_count") or 0),
                    "test_failing_count": int(meta.get("test_failing_count") or 0),
                    "repair_round_count": repair_round_count,
                    "intermediate_error_count": step_error_count,
                    "had_intermediate_errors": step_error_count > 0,
                    "repaired_after_feedback": execution_valid and step_error_count > 0,
                    "parser_returncode": p_res.get("parser_returncode"),
                    "parser_stdout": p_res.get("parser_stdout", ""),
                    "parser_stderr": p_res.get("parser_stderr", ""),
                    "parser_skipped": p_res.get("parser_skipped", False),
                    "error_type": "none" if is_valid else et,
                    "latency_sec": round(latency, 4),
                    "timestamp": utc_now_iso(),
                }
                append_jsonl(attempts_path, rec)
                for step_error in meta.get("step_errors", []):
                    append_jsonl(
                        step_errors_path,
                        {
                            "operation_id": oid,
                            "case_study": op["case_study"],
                            "service": op["service"],
                            "operation_name": op["operation_name"],
                            "model": model,
                            "feedback_mode": args.feedback_mode,
                            "attempt": att,
                            "attempt_is_valid": is_valid,
                            **step_error,
                            "timestamp": rec["timestamp"],
                        },
                    )
                append_jsonl(
                    raw_gen_path,
                    {
                        "operation_id": oid,
                        "model": model,
                        "feedback_mode": args.feedback_mode,
                        "attempt": att,
                        "prompt": prompt,
                        "raw_output": raw_out,
                        "timestamp": rec["timestamp"],
                    },
                )
                by_key[key].append(rec)
                if is_valid:
                    succeeded.add(key)
                    completed_unique = len(succeeded | exhausted)
                    print_progress(completed_unique, planned_total, rec)
                    break
                if att >= args.max_attempts:
                    exhausted.add(key)
                    completed_unique = len(succeeded | exhausted)
                    print_progress(completed_unique, planned_total, rec)
                else:
                    print_progress(completed_unique, planned_total, rec)
                time.sleep(max(0.0, float(args.sleep_between_calls)))

    bench_ids = {op["id"] for op in operations}
    op_case = {op["id"]: op["case_study"] for op in operations}
    pack = summarize_rq1_results(
        output_dir,
        args.max_attempts,
        benchmark_operation_ids=bench_ids,
        operation_case=op_case,
    )
    write_exp_csvs(output_dir, pack, args.max_attempts)
    write_step_error_summary(output_dir)
    write_rq_csvs(output_dir)
    print_summary(pack)
    logging.info("Done. Outputs under %s", output_dir.resolve())


def print_summary(pack: Dict[str, Any]) -> None:
    print("\n=== RQ1 Summary (parsed attempts, parser_skipped excluded) ===\n")
    for r in pack.get("exp1_model_rows", []):
        print(
            f"  {r['model']}: validity={r['validity_rate']:.2f}% "
            f"({r['valid_count']}/{r['total_operations']}) "
            f"avgAtt={r['avg_attempts_for_success']:.2f}"
        )
    print("\nArtifacts: exp1_*.csv exp2_*.csv exp3_* summary.json attempts.jsonl raw_generations.jsonl\n")


if __name__ == "__main__":
    main()
