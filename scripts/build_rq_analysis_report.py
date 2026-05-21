from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = ROOT / "results"
OUT_DIR = RESULTS_DIR / "analysis_report"

MODEL_ORDER = [
    "claude-opus-4-7",
    "gpt-5.4",
    "gpt-5.4-mini",
    "qwen3-coder-plus",
    "qwen3-coder-flash",
]

MODEL_LABELS = {
    "claude-opus-4-7": "Claude Opus 4.7",
    "gpt-5.4": "GPT-5.4",
    "gpt-5.4-mini": "GPT-5.4 Mini",
    "qwen3-coder-plus": "Qwen3 Coder Plus",
    "qwen3-coder-flash": "Qwen3 Coder Flash",
}

MODEL_COLORS = {
    "claude-opus-4-7": "#4C78A8",
    "gpt-5.4": "#F58518",
    "gpt-5.4-mini": "#54A24B",
    "qwen3-coder-plus": "#B279A2",
    "qwen3-coder-flash": "#E45756",
}


def result_dirs() -> list[Path]:
    return sorted(
        path
        for path in RESULTS_DIR.iterdir()
        if path.is_dir()
        and path.name.startswith("rq_")
        and path.name.endswith("_full_oracle_fixed")
        and (path / "summary.json").exists()
    )


def read_by_model(filename: str) -> pd.DataFrame:
    frames = []
    for folder in result_dirs():
        path = folder / filename
        if path.exists():
            frames.append(pd.read_csv(path))
    df = pd.concat(frames, ignore_index=True)
    return order_models(df)


def read_by_case(filename: str) -> pd.DataFrame:
    frames = []
    for folder in result_dirs():
        path = folder / filename
        if path.exists():
            frames.append(pd.read_csv(path))
    df = pd.concat(frames, ignore_index=True)
    return order_models(df)


def order_models(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["model"] = pd.Categorical(df["model"], categories=MODEL_ORDER, ordered=True)
    return df.sort_values(["model"] + (["case_study"] if "case_study" in df.columns else [])).reset_index(drop=True)


def add_labels(ax, values: list[float], counts: list[str] | None = None) -> None:
    for idx, value in enumerate(values):
        label = f"{value:.1f}%"
        if counts:
            label = f"{label}\n{counts[idx]}"
        ax.text(idx, value + 1.2, label, ha="center", va="bottom", fontsize=8)


def style_percent_axis(ax, title: str, ylabel: str = "Rate (%)") -> None:
    ax.set_title(title, fontsize=13, weight="bold", pad=12)
    ax.set_ylabel(ylabel)
    ax.set_ylim(0, 108)
    ax.grid(axis="y", color="#D9D9D9", linewidth=0.8, alpha=0.8)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(axis="x", labelrotation=25)


def save_bar(df: pd.DataFrame, rate_col: str, count_col: str, total_col: str, title: str, filename: str) -> None:
    df = order_models(df)
    labels = [MODEL_LABELS[str(model)] for model in df["model"]]
    models = [str(model) for model in df["model"]]
    values = df[rate_col].astype(float).tolist()
    counts = [f"{int(row[count_col])}/{int(row[total_col])}" for _, row in df.iterrows()]

    fig, ax = plt.subplots(figsize=(9, 5.2), dpi=180)
    ax.bar(labels, values, color=[MODEL_COLORS[model] for model in models], width=0.62)
    add_labels(ax, values, counts)
    style_percent_axis(ax, title)
    fig.tight_layout()
    fig.savefig(OUT_DIR / filename, bbox_inches="tight")
    plt.close(fig)


def save_feedback_bar(df: pd.DataFrame) -> None:
    df = order_models(df)
    labels = [MODEL_LABELS[str(model)] for model in df["model"]]
    models = [str(model) for model in df["model"]]
    values = df["repair_success_rate"].astype(float).tolist()
    counts = [
        f"{int(row['repaired_after_feedback_count'])}/{int(row['operations_with_intermediate_errors'])}"
        for _, row in df.iterrows()
    ]

    fig, ax = plt.subplots(figsize=(9, 5.2), dpi=180)
    ax.bar(labels, values, color=[MODEL_COLORS[model] for model in models], width=0.62)
    add_labels(ax, values, counts)
    style_percent_axis(ax, "RQ3 Feedback Repair Success Rate")
    fig.tight_layout()
    fig.savefig(OUT_DIR / "rq3_feedback_repair_rate_bar.png", bbox_inches="tight")
    plt.close(fig)


def save_valid_at_k_curve() -> pd.DataFrame:
    records = []
    for folder in result_dirs():
        with (folder / "summary.json").open("r", encoding="utf-8") as f:
            summary = json.load(f)
        row = summary["exp1_by_model"][0]
        model = row["model"]
        for k, rate in row["valid_at_rates"].items():
            records.append({"model": model, "k": int(k), "valid_at_k_rate": float(rate)})

    df = order_models(pd.DataFrame(records))
    df.to_csv(OUT_DIR / "valid_at_k_curve_data.csv", index=False)

    fig, ax = plt.subplots(figsize=(9, 5.2), dpi=180)
    for model in MODEL_ORDER:
        model_df = df[df["model"] == model].sort_values("k")
        ax.plot(
            model_df["k"],
            model_df["valid_at_k_rate"],
            marker="o",
            linewidth=2.2,
            markersize=5,
            label=MODEL_LABELS[model],
            color=MODEL_COLORS[model],
        )

    ax.set_title("RQ1 Valid@k Curve", fontsize=13, weight="bold", pad=12)
    ax.set_xlabel("Attempt k")
    ax.set_ylabel("Valid@k Rate (%)")
    ax.set_xticks([1, 2, 3, 4, 5])
    ax.set_ylim(35, 105)
    ax.grid(color="#D9D9D9", linewidth=0.8, alpha=0.8)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.legend(frameon=False, loc="lower right", fontsize=8)
    fig.tight_layout()
    fig.savefig(OUT_DIR / "rq1_valid_at_k_curve.png", bbox_inches="tight")
    plt.close(fig)
    return df


def save_case_heatmap(df: pd.DataFrame, rate_col: str, title: str, filename: str) -> None:
    pivot = df.pivot(index="case_study", columns="model", values=rate_col)
    pivot = pivot[MODEL_ORDER]

    fig, ax = plt.subplots(figsize=(10, 4.6), dpi=180)
    image = ax.imshow(pivot.values, cmap="YlGnBu", vmin=0, vmax=100, aspect="auto")
    ax.set_title(title, fontsize=13, weight="bold", pad=12)
    ax.set_xticks(range(len(pivot.columns)))
    ax.set_xticklabels([MODEL_LABELS[str(model)] for model in pivot.columns], rotation=25, ha="right")
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels(pivot.index)

    for i in range(pivot.shape[0]):
        for j in range(pivot.shape[1]):
            ax.text(j, i, f"{pivot.values[i, j]:.1f}", ha="center", va="center", fontsize=8, color="#1F1F1F")

    cbar = fig.colorbar(image, ax=ax, fraction=0.025, pad=0.02)
    cbar.set_label("Rate (%)")
    fig.tight_layout()
    fig.savefig(OUT_DIR / filename, bbox_inches="tight")
    plt.close(fig)


def markdown_table(df: pd.DataFrame) -> str:
    headers = [str(col) for col in df.columns]
    rows = []
    for _, row in df.iterrows():
        rows.append([str(row[col]) for col in df.columns])

    def clean(value: str) -> str:
        return value.replace("|", "\\|")

    lines = [
        "| " + " | ".join(clean(header) for header in headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    lines.extend("| " + " | ".join(clean(value) for value in row) + " |" for row in rows)
    return "\n".join(lines)


def write_markdown(rq1: pd.DataFrame, rq2: pd.DataFrame, rq3: pd.DataFrame, valid_curve: pd.DataFrame) -> None:
    report = OUT_DIR / "rq_analysis_report.md"
    rq1_show = rq1.copy()
    rq2_show = rq2.copy()
    rq3_show = rq3.copy()
    for df in (rq1_show, rq2_show, rq3_show):
        df["model"] = df["model"].astype(str).map(MODEL_LABELS)

    report.write_text(
        "\n".join(
            [
                "# RQ1-RQ3 Analysis Report",
                "",
                "## Figure Format",
                "",
                "- All figures use PNG format, 180 dpi, white background.",
                "- Percentage metrics use 0-100% y-axis where possible.",
                "- Model colors are consistent across all figures.",
                "- Bar labels show percentage and count, e.g. `70/114`.",
                "- `rq1_valid_at_k_curve.png` is the main curve chart for Valid@k.",
                "",
                "## RQ1 Syntax Validity",
                "",
                markdown_table(rq1_show),
                "",
                "![RQ1 Syntax Validity](rq1_syntax_validity_bar.png)",
                "",
                "![RQ1 Valid@k Curve](rq1_valid_at_k_curve.png)",
                "",
                "## RQ2 Execution Success",
                "",
                markdown_table(rq2_show),
                "",
                "![RQ2 Execution Success](rq2_execution_success_rate_bar.png)",
                "",
                "![RQ2 By Case](rq2_execution_success_by_case_heatmap.png)",
                "",
                "## RQ3 Feedback Utility",
                "",
                markdown_table(rq3_show),
                "",
                "![RQ3 Feedback Repair](rq3_feedback_repair_rate_bar.png)",
                "",
                "![RQ3 By Case](rq3_feedback_repair_by_case_heatmap.png)",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    rq1 = read_by_model("rq1_syntax_validity_by_model.csv")
    rq2 = read_by_model("rq2_execution_success_by_model.csv")
    rq3 = read_by_model("rq3_feedback_utility_by_model.csv")
    rq1_case = read_by_case("rq1_syntax_validity_by_case.csv")
    rq2_case = read_by_case("rq2_execution_success_by_case.csv")
    rq3_case = read_by_case("rq3_feedback_utility_by_case.csv")

    rq1.to_csv(OUT_DIR / "rq1_syntax_validity_summary.csv", index=False)
    rq2.to_csv(OUT_DIR / "rq2_execution_success_summary.csv", index=False)
    rq3.to_csv(OUT_DIR / "rq3_feedback_utility_summary.csv", index=False)
    rq1_case.to_csv(OUT_DIR / "rq1_syntax_validity_by_case.csv", index=False)
    rq2_case.to_csv(OUT_DIR / "rq2_execution_success_by_case.csv", index=False)
    rq3_case.to_csv(OUT_DIR / "rq3_feedback_utility_by_case.csv", index=False)

    save_bar(
        rq1,
        "syntax_validity_rate",
        "syntax_valid_count",
        "total_operations",
        "RQ1 Syntax Validity Rate",
        "rq1_syntax_validity_bar.png",
    )
    save_bar(
        rq2,
        "execution_success_rate",
        "execution_success_count",
        "total_operations",
        "RQ2 Execution Success Rate",
        "rq2_execution_success_rate_bar.png",
    )
    save_feedback_bar(rq3)
    valid_curve = save_valid_at_k_curve()
    save_case_heatmap(rq1_case, "syntax_validity_rate", "RQ1 Syntax Validity by Case Study", "rq1_syntax_validity_by_case_heatmap.png")
    save_case_heatmap(rq2_case, "execution_success_rate", "RQ2 Execution Success by Case Study", "rq2_execution_success_by_case_heatmap.png")
    save_case_heatmap(rq3_case, "repair_success_rate", "RQ3 Feedback Repair Rate by Case Study", "rq3_feedback_repair_by_case_heatmap.png")
    write_markdown(rq1, rq2, rq3, valid_curve)


if __name__ == "__main__":
    main()
