from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TABLE_DIR = ROOT / "results" / "paper_tables_current_data"
BASELINE_DIRS = [
    ROOT / "results" / "baseline_llm_only" / "gpt-5.4_full_rq1_rq2",
    ROOT / "results" / "baseline_llm_only" / "gpt-5.4-mini_full_rq1_rq2",
]


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def fmt(value: float, digits: int = 2) -> str:
    return f"{value:.{digits}f}"


def fmt_count(value: float) -> str:
    return str(math.floor(value))


def avg(values: list[float]) -> float:
    return sum(values) / len(values)


def pure_llm_metrics() -> dict[str, Any]:
    summaries = [read_json(path / "summary.json") for path in BASELINE_DIRS]
    rows = [summary["by_model"][0] for summary in summaries]

    valid_at_counts = {
        str(k): avg([float(row["valid_at_counts"][str(k)]) for row in rows])
        for k in range(1, 6)
    }
    valid_at_rates = {
        str(k): avg([float(row["valid_at_rates"][str(k)]) for row in rows])
        for k in range(1, 6)
    }
    pass_at_counts = {
        str(k): avg([float(row["pass_at_counts"][str(k)]) for row in rows])
        for k in range(1, 6)
    }
    pass_at_rates = {
        str(k): avg([float(row["pass_at_rates"][str(k)]) for row in rows])
        for k in range(1, 6)
    }

    return {
        "label": "PureLLM",
        "total": int(rows[0]["total_operations"]),
        "syntax_valid_count": avg([float(row["syntax_valid_count"]) for row in rows]),
        "syntax_validity_rate": avg([float(row["syntax_validity_rate"]) for row in rows]),
        "execution_success_count": avg([float(row["execution_success_count"]) for row in rows]),
        "execution_success_rate": avg([float(row["execution_success_rate"]) for row in rows]),
        "valid_at_counts": valid_at_counts,
        "valid_at_rates": valid_at_rates,
        "pass_at_counts": pass_at_counts,
        "pass_at_rates": pass_at_rates,
    }


def pure_llm_stage_metrics() -> dict[str, float]:
    rows = []
    for path in [
        TABLE_DIR / "table_pure_llm_stage_success_current.csv",
    ]:
        rows.extend(read_csv(path))
    pure_rows = [row for row in rows if row.get("Method") == "Pure LLM"]
    return {
        "Parser/Syntax #Pass": avg([float(row["Parser/Syntax #Pass"]) for row in pure_rows]),
        "Parser/Syntax (%)": avg([float(row["Parser/Syntax (%)"]) for row in pure_rows]),
        "TypeScript Generation #Pass": avg([float(row["TypeScript Generation #Pass"]) for row in pure_rows]),
        "TypeScript Generation (%)": avg([float(row["TypeScript Generation (%)"]) for row in pure_rows]),
        "TypeScript Compile #Pass": avg([float(row["TypeScript Compile #Pass"]) for row in pure_rows]),
        "TypeScript Compile (%)": avg([float(row["TypeScript Compile (%)"]) for row in pure_rows]),
        "Jest Execution #Pass": avg([float(row["Jest Execution #Pass"]) for row in pure_rows]),
        "Jest Execution (%)": avg([float(row["Jest Execution (%)"]) for row in pure_rows]),
        "Execution #Pass": avg([float(row["Execution #Pass"]) for row in pure_rows]),
        "Execution (%)": avg([float(row["Execution (%)"]) for row in pure_rows]),
    }


def remove_existing(rows: list[dict[str, str]], key: str, value: str) -> list[dict[str, str]]:
    return [row for row in rows if row.get(key) != value]


def update_table4(metrics: dict[str, Any]) -> None:
    path = TABLE_DIR / "table4_rq1_validity_current.csv"
    fieldnames = ["Method / Model", "#Valid", "Validity (%)"]
    rows = remove_existing(read_csv(path), "Method / Model", "PureLLM")
    insert_at = 2 if len(rows) >= 2 else len(rows)
    rows.insert(
        insert_at,
        {
            "Method / Model": "PureLLM",
            "#Valid": fmt_count(metrics["syntax_valid_count"]),
            "Validity (%)": fmt(metrics["syntax_validity_rate"]),
        },
    )
    write_csv(path, rows, fieldnames)


def update_table5(metrics: dict[str, Any]) -> None:
    path = TABLE_DIR / "table5_rq2_execution_current.csv"
    fieldnames = ["Method / Model", "#Pass", "Success (%)"]
    rows = remove_existing(read_csv(path), "Method / Model", "PureLLM")
    insert_at = 2 if len(rows) >= 2 else len(rows)
    rows.insert(
        insert_at,
        {
            "Method / Model": "PureLLM",
            "#Pass": fmt_count(metrics["execution_success_count"]),
            "Success (%)": fmt(metrics["execution_success_rate"]),
        },
    )
    write_csv(path, rows, fieldnames)


def update_valid_at_k(metrics: dict[str, Any]) -> None:
    path = TABLE_DIR / "table_rq1_valid_at_k_current.csv"
    fieldnames = ["Model", "Valid@1", "#@1", "Valid@2", "#@2", "Valid@3", "#@3", "Valid@4", "#@4", "Valid@5", "#@5"]
    rows = remove_existing(read_csv(path), "Model", "PureLLM")
    row: dict[str, Any] = {"Model": "PureLLM"}
    for k in range(1, 6):
        row[f"Valid@{k}"] = fmt(metrics["valid_at_rates"][str(k)])
        row[f"#@{k}"] = fmt_count(metrics["valid_at_counts"][str(k)])
    rows.insert(0, row)
    write_csv(path, rows, fieldnames)


def update_pass_at_k(metrics: dict[str, Any]) -> None:
    path = TABLE_DIR / "table_rq2_pass_at_k_current.csv"
    fieldnames = ["Model", "Pass@1 (%)", "Pass@2 (%)", "Pass@3 (%)", "Pass@4 (%)", "Pass@5 (%)", "#@1", "#@2", "#@3", "#@4", "#@5"]
    rows = remove_existing(read_csv(path), "Model", "PureLLM")
    row: dict[str, Any] = {"Model": "PureLLM"}
    for k in range(1, 6):
        row[f"Pass@{k} (%)"] = fmt(metrics["pass_at_rates"][str(k)])
        row[f"#@{k}"] = fmt_count(metrics["pass_at_counts"][str(k)])
    rows.insert(0, row)
    write_csv(path, rows, fieldnames)


def update_gap_table(metrics: dict[str, Any]) -> None:
    path = TABLE_DIR / "table_rq1_rq2_gap_current.csv"
    fieldnames = [
        "Model",
        "#Syntax Valid",
        "Syntax Validity (%)",
        "#Execution Valid",
        "Execution Success (%)",
        "Rate Gap (pp)",
        "Execution/Syntax Retention (%)",
    ]
    rows = remove_existing(read_csv(path), "Model", "PureLLM")
    syntax = float(metrics["syntax_valid_count"])
    execution = float(metrics["execution_success_count"])
    syntax_rate = float(metrics["syntax_validity_rate"])
    execution_rate = float(metrics["execution_success_rate"])
    rows.insert(
        0,
        {
            "Model": "PureLLM",
            "#Syntax Valid": fmt_count(syntax),
            "Syntax Validity (%)": fmt(syntax_rate),
            "#Execution Valid": fmt_count(execution),
            "Execution Success (%)": fmt(execution_rate),
            "Rate Gap (pp)": fmt(syntax_rate - execution_rate),
            "Execution/Syntax Retention (%)": fmt(100.0 * execution / syntax if syntax else 0.0),
        },
    )
    write_csv(path, rows, fieldnames)


def update_pure_tables(metrics: dict[str, Any], stage: dict[str, float]) -> None:
    path = TABLE_DIR / "table_pure_llm_vs_contract_gen_gpt_current.csv"
    fieldnames = [
        "Model",
        "Method",
        "Total",
        "RQ1 #Valid",
        "RQ1 Validity (%)",
        "RQ2 #Pass",
        "RQ2 Success (%)",
        "Valid@1 (%)",
        "Valid@5 (%)",
        "Pass@1 (%)",
        "Pass@5 (%)",
    ]
    rows = [row for row in read_csv(path) if not (row.get("Model") == "PureLLM" and row.get("Method") == "Average")]
    rows.insert(
        0,
        {
            "Model": "PureLLM",
            "Method": "Average",
            "Total": metrics["total"],
            "RQ1 #Valid": fmt_count(metrics["syntax_valid_count"]),
            "RQ1 Validity (%)": fmt(metrics["syntax_validity_rate"]),
            "RQ2 #Pass": fmt_count(metrics["execution_success_count"]),
            "RQ2 Success (%)": fmt(metrics["execution_success_rate"]),
            "Valid@1 (%)": fmt(metrics["valid_at_rates"]["1"]),
            "Valid@5 (%)": fmt(metrics["valid_at_rates"]["5"]),
            "Pass@1 (%)": fmt(metrics["pass_at_rates"]["1"]),
            "Pass@5 (%)": fmt(metrics["pass_at_rates"]["5"]),
        },
    )
    write_csv(path, rows, fieldnames)

    stage_path = TABLE_DIR / "table_pure_llm_stage_success_current.csv"
    stage_fields = [
        "Model",
        "Method",
        "Total",
        "Parser/Syntax #Pass",
        "Parser/Syntax (%)",
        "TypeScript Generation #Pass",
        "TypeScript Generation (%)",
        "TypeScript Compile #Pass",
        "TypeScript Compile (%)",
        "Jest Execution #Pass",
        "Jest Execution (%)",
        "Execution #Pass",
        "Execution (%)",
    ]
    stage_rows = [row for row in read_csv(stage_path) if not (row.get("Model") == "PureLLM" and row.get("Method") == "Average")]
    stage_rows.insert(
        0,
        {
            "Model": "PureLLM",
            "Method": "Average",
            "Total": metrics["total"],
            "Parser/Syntax #Pass": fmt_count(stage["Parser/Syntax #Pass"]),
            "Parser/Syntax (%)": fmt(stage["Parser/Syntax (%)"]),
            "TypeScript Generation #Pass": fmt_count(stage["TypeScript Generation #Pass"]),
            "TypeScript Generation (%)": fmt(stage["TypeScript Generation (%)"]),
            "TypeScript Compile #Pass": fmt_count(stage["TypeScript Compile #Pass"]),
            "TypeScript Compile (%)": fmt(stage["TypeScript Compile (%)"]),
            "Jest Execution #Pass": fmt_count(stage["Jest Execution #Pass"]),
            "Jest Execution (%)": fmt(stage["Jest Execution (%)"]),
            "Execution #Pass": fmt_count(stage["Execution #Pass"]),
            "Execution (%)": fmt(stage["Execution (%)"]),
        },
    )
    write_csv(stage_path, stage_rows, stage_fields)

    valid_path = TABLE_DIR / "table_pure_llm_valid_at_k_current.csv"
    valid_fields = ["Model", "Method", "Valid@1 (%)", "Valid@2 (%)", "Valid@3 (%)", "Valid@4 (%)", "Valid@5 (%)", "#@1", "#@2", "#@3", "#@4", "#@5"]
    valid_rows = [row for row in read_csv(valid_path) if not (row.get("Model") == "PureLLM" and row.get("Method") == "Average")]
    valid_row: dict[str, Any] = {"Model": "PureLLM", "Method": "Average"}
    for k in range(1, 6):
        valid_row[f"Valid@{k} (%)"] = fmt(metrics["valid_at_rates"][str(k)])
        valid_row[f"#@{k}"] = fmt_count(metrics["valid_at_counts"][str(k)])
    valid_rows.insert(0, valid_row)
    write_csv(valid_path, valid_rows, valid_fields)


def md_table(rows: list[dict[str, str]], headers: list[str], align_right: set[str] | None = None) -> str:
    align_right = align_right or set()
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---:" if h in align_right else "---" for h in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(str(row.get(h, "")) for h in headers) + " |")
    return "\n".join(lines)


def format_valid_k_rows(path: Path, kind: str) -> list[dict[str, str]]:
    rows = read_csv(path)
    out = []
    for row in rows:
        new_row = {"Model": row["Model"]}
        for k in range(1, 6):
            if kind == "valid":
                new_row[f"Valid@{k}"] = f"{float(row[f'Valid@{k}']):.2f}% ({row[f'#@{k}']})"
            else:
                new_row[f"Pass@{k}"] = f"{float(row[f'Pass@{k} (%)']):.2f}% ({row[f'#@{k}']})"
        out.append(new_row)
    return out


def replace_section(text: str, heading: str, body: str) -> str:
    start = text.index(heading)
    next_heading = text.find("\n## ", start + len(heading))
    if next_heading == -1:
        return text[: start + len(heading)] + "\n" + body.rstrip() + "\n"
    return text[: start + len(heading)] + "\n" + body.rstrip() + "\n" + text[next_heading:]


def update_markdown() -> None:
    md_path = TABLE_DIR / "paper_tables_current_data.md"
    text = md_path.read_text(encoding="utf-8")

    table4 = read_csv(TABLE_DIR / "table4_rq1_validity_current.csv")
    text = replace_section(
        text,
        "## Table 4. Validity rate comparison (RQ1) on 114 operations",
        md_table(table4, ["Method / Model", "#Valid", "Validity (%)"], {"#Valid", "Validity (%)"}),
    )

    valid_rows = format_valid_k_rows(TABLE_DIR / "table_rq1_valid_at_k_current.csv", "valid")
    text = replace_section(
        text,
        "## Table 4b. Syntax Valid@k under the five-attempt budget",
        md_table(valid_rows, ["Model", "Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"], {"Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"}),
    )

    table5 = read_csv(TABLE_DIR / "table5_rq2_execution_current.csv")
    text = replace_section(
        text,
        "## Table 5. Execution-grounded validation success (RQ2) on 114 operations",
        md_table(table5, ["Method / Model", "#Pass", "Success (%)"], {"#Pass", "Success (%)"}),
    )

    pass_rows = format_valid_k_rows(TABLE_DIR / "table_rq2_pass_at_k_current.csv", "pass")
    text = replace_section(
        text,
        "## Additional Table 8. Execution Pass@k under the five-attempt budget",
        md_table(pass_rows, ["Model", "Pass@1", "Pass@2", "Pass@3", "Pass@4", "Pass@5"], {"Pass@1", "Pass@2", "Pass@3", "Pass@4", "Pass@5"}),
    )

    gap_rows = read_csv(TABLE_DIR / "table_rq1_rq2_gap_current.csv")
    text = replace_section(
        text,
        "## Additional Table 9. Gap between syntactic validity and execution-grounded validity",
        md_table(gap_rows, ["Model", "#Syntax Valid", "Syntax Validity (%)", "#Execution Valid", "Execution Success (%)", "Rate Gap (pp)", "Execution/Syntax Retention (%)"], {"#Syntax Valid", "Syntax Validity (%)", "#Execution Valid", "Execution Success (%)", "Rate Gap (pp)", "Execution/Syntax Retention (%)"}),
    )

    pure_rows = read_csv(TABLE_DIR / "table_pure_llm_vs_contract_gen_gpt_current.csv")
    intro = "This table incorporates the new pure-LLM baseline runs in `results/baseline_llm_only`. The `PureLLM / Average` row is the arithmetic mean of gpt-5.4 and gpt-5.4-mini pure-LLM runs."
    text = replace_section(
        text,
        "## Additional Table 12. Pure LLM baseline vs Contract Gen on GPT-family models",
        intro + "\n" + md_table(pure_rows, ["Model", "Method", "Total", "RQ1 #Valid", "RQ1 Validity (%)", "RQ2 #Pass", "RQ2 Success (%)", "Valid@1 (%)", "Valid@5 (%)", "Pass@1 (%)", "Pass@5 (%)"], {"Total", "RQ1 #Valid", "RQ1 Validity (%)", "RQ2 #Pass", "RQ2 Success (%)", "Valid@1 (%)", "Valid@5 (%)", "Pass@1 (%)", "Pass@5 (%)"}),
    )

    stage_rows = read_csv(TABLE_DIR / "table_pure_llm_stage_success_current.csv")
    stage_intro = "This table reports operation-level Best@5 success for each validation stage. The `PureLLM / Average` row averages gpt-5.4 and gpt-5.4-mini."
    text = replace_section(
        text,
        "## Additional Table 13. Pure LLM stage-wise execution-grounded validation",
        stage_intro + "\n" + md_table(stage_rows, ["Model", "Method", "Total", "Parser/Syntax #Pass", "Parser/Syntax (%)", "TypeScript Generation #Pass", "TypeScript Generation (%)", "TypeScript Compile #Pass", "TypeScript Compile (%)", "Jest Execution #Pass", "Jest Execution (%)", "Execution #Pass", "Execution (%)"], {"Total", "Parser/Syntax #Pass", "Parser/Syntax (%)", "TypeScript Generation #Pass", "TypeScript Generation (%)", "TypeScript Compile #Pass", "TypeScript Compile (%)", "Jest Execution #Pass", "Jest Execution (%)", "Execution #Pass", "Execution (%)"}),
    )

    pure_valid_rows = read_csv(TABLE_DIR / "table_pure_llm_valid_at_k_current.csv")
    formatted = []
    for row in pure_valid_rows:
        formatted.append(
            {
                "Model": row["Model"],
                "Method": row["Method"],
                **{
                    f"Valid@{k}": f"{float(row[f'Valid@{k} (%)']):.2f}% ({row[f'#@{k}']})"
                    for k in range(1, 6)
                },
            }
        )
    text = replace_section(
        text,
        "## Additional Table 14. Pure LLM Syntax Valid@k under the five-attempt budget",
        md_table(formatted, ["Model", "Method", "Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"], {"Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"}),
    )

    md_path.write_text(text, encoding="utf-8")

    additional_path = TABLE_DIR / "additional_tables_current_data.md"
    additional = additional_path.read_text(encoding="utf-8")
    additional = replace_section(
        additional,
        "## Additional Table 8. Execution Pass@k under the five-attempt budget",
        md_table(pass_rows, ["Model", "Pass@1", "Pass@2", "Pass@3", "Pass@4", "Pass@5"], {"Pass@1", "Pass@2", "Pass@3", "Pass@4", "Pass@5"}),
    )
    additional = replace_section(
        additional,
        "## Additional Table 9. Gap between syntactic validity and execution-grounded validity",
        md_table(gap_rows, ["Model", "#Syntax Valid", "Syntax Validity (%)", "#Execution Valid", "Execution Success (%)", "Rate Gap (pp)", "Execution/Syntax Retention (%)"], {"#Syntax Valid", "Syntax Validity (%)", "#Execution Valid", "Execution Success (%)", "Rate Gap (pp)", "Execution/Syntax Retention (%)"}),
    )
    additional_path.write_text(additional, encoding="utf-8")

    pure_vs_path = TABLE_DIR / "table_pure_llm_vs_contract_gen_gpt_current.md"
    pure_vs_path.write_text(
        "\n".join(
            [
                "## Additional Table 12. Pure LLM baseline vs Contract Gen on GPT-family models",
                "The `PureLLM / Average` row is the arithmetic mean of gpt-5.4 and gpt-5.4-mini pure-LLM runs.",
                md_table(pure_rows, ["Model", "Method", "Total", "RQ1 #Valid", "RQ1 Validity (%)", "RQ2 #Pass", "RQ2 Success (%)", "Valid@1 (%)", "Valid@5 (%)", "Pass@1 (%)", "Pass@5 (%)"], {"Total", "RQ1 #Valid", "RQ1 Validity (%)", "RQ2 #Pass", "RQ2 Success (%)", "Valid@1 (%)", "Valid@5 (%)", "Pass@1 (%)", "Pass@5 (%)"}),
                "",
                "## Additional Table 13. Pure LLM stage-wise execution-grounded validation",
                "The `PureLLM / Average` row averages gpt-5.4 and gpt-5.4-mini.",
                md_table(stage_rows, ["Model", "Method", "Total", "Parser/Syntax #Pass", "Parser/Syntax (%)", "TypeScript Generation #Pass", "TypeScript Generation (%)", "TypeScript Compile #Pass", "TypeScript Compile (%)", "Jest Execution #Pass", "Jest Execution (%)", "Execution #Pass", "Execution (%)"], {"Total", "Parser/Syntax #Pass", "Parser/Syntax (%)", "TypeScript Generation #Pass", "TypeScript Generation (%)", "TypeScript Compile #Pass", "TypeScript Compile (%)", "Jest Execution #Pass", "Jest Execution (%)", "Execution #Pass", "Execution (%)"}),
                "",
            ]
        ),
        encoding="utf-8",
    )

    pure_valid_path = TABLE_DIR / "table_pure_llm_valid_at_k_current.md"
    pure_valid_path.write_text(
        "\n".join(
            [
                "## Additional Table 14. Pure LLM Syntax Valid@k under the five-attempt budget",
                md_table(formatted, ["Model", "Method", "Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"], {"Valid@1", "Valid@2", "Valid@3", "Valid@4", "Valid@5"}),
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    metrics = pure_llm_metrics()
    stage = pure_llm_stage_metrics()
    update_table4(metrics)
    update_table5(metrics)
    update_valid_at_k(metrics)
    update_pass_at_k(metrics)
    update_gap_table(metrics)
    update_pure_tables(metrics, stage)
    update_markdown()

    summary_path = TABLE_DIR / "purellm_average_summary.csv"
    write_csv(
        summary_path,
        [
            {
                "Method": "PureLLM",
                "Source": "mean(gpt-5.4 Pure LLM, gpt-5.4-mini Pure LLM)",
                "Total": metrics["total"],
                "RQ1 #Valid": fmt_count(metrics["syntax_valid_count"]),
                "RQ1 Validity (%)": fmt(metrics["syntax_validity_rate"]),
                "RQ2 #Pass": fmt_count(metrics["execution_success_count"]),
                "RQ2 Success (%)": fmt(metrics["execution_success_rate"]),
                "Valid@1 (%)": fmt(metrics["valid_at_rates"]["1"]),
                "Valid@5 (%)": fmt(metrics["valid_at_rates"]["5"]),
                "Pass@1 (%)": fmt(metrics["pass_at_rates"]["1"]),
                "Pass@5 (%)": fmt(metrics["pass_at_rates"]["5"]),
            }
        ],
        ["Method", "Source", "Total", "RQ1 #Valid", "RQ1 Validity (%)", "RQ2 #Pass", "RQ2 Success (%)", "Valid@1 (%)", "Valid@5 (%)", "Pass@1 (%)", "Pass@5 (%)"],
    )

    print("Updated paper table data with PureLLM average:")
    print(f"RQ1: {fmt_count(metrics['syntax_valid_count'])}/{metrics['total']} = {fmt(metrics['syntax_validity_rate'])}%")
    print(f"RQ2: {fmt_count(metrics['execution_success_count'])}/{metrics['total']} = {fmt(metrics['execution_success_rate'])}%")


if __name__ == "__main__":
    main()
