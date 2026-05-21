# Pure-LLM baseline: one model per output folder (114 ops each).
# Requires API keys in repo root .env (OPENAI_API_KEY, ANTHROPIC_API_KEY, QWEN_API_KEY, ...).
# Optional syntax check: pass -Validate to enable REMODEL parser via npx tsx.

param(
    [switch]$Validate,
    [int]$MaxAttempts = 5
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$models = @(
    "claude-opus-4-7",
    "gpt-5.4",
    "gpt-5.4-mini",
    "qwen3-coder-plus",
    "qwen3-coder-flash"
)

$validateArgs = @()
if ($Validate) {
    $validateArgs = @(
        "--validate-cmd", "npx tsx script/validate-remodel-contract.ts {input_file}",
        "--parser-use-shell"
    )
}

foreach ($model in $models) {
    $out = "results/baseline_llm_only/$model"
    Write-Host "=== $model -> $out ===" -ForegroundColor Cyan
    python script/run_baseline_llm_only.py `
        --models $model `
        --output-dir $out `
        --max-attempts $MaxAttempts `
        --force `
        @validateArgs
}

Write-Host "All models finished. CSV/summary under results/baseline_llm_only/<model>/" -ForegroundColor Green
