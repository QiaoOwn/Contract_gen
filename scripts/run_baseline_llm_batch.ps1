# Pure-LLM baseline: one model per output folder (114 ops each).
# Requires OPENAI_API_KEY and OPENAI_BASE_URL in repo root .env.
# Optional syntax check: pass -Validate to enable REMODEL parser via npx tsx.
# Optional execution check: pass -EvalNextBaseUrl http://127.0.0.1:3000 after starting Next.

param(
    [switch]$Validate,
    [int]$MaxAttempts = 5,
    [string]$EvalNextBaseUrl = ""
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$models = @(
    "gpt-5.5",
    "gpt-5.4",
    "gemini-3.5-flash",
    "claude-opus-4-7"
)

$validateArgs = @()
if ($Validate) {
    $validateArgs = @(
        "--validate-cmd", "npx tsx script/validate-remodel-contract.ts {input_file}",
        "--parser-use-shell"
    )
}

foreach ($model in $models) {
    $out = "results/contractgen-study-v5/baselines/purellm/$model"
    Write-Host "=== $model -> $out ===" -ForegroundColor Cyan
    $evalArgs = @()
    if ($EvalNextBaseUrl) {
        $evalArgs = @(
            "--eval-next-base-url", $EvalNextBaseUrl,
            "--eval-timeout", "600"
        )
    }
    python script/run_baseline_llm_only.py `
        --models $model `
        --output-dir $out `
        --max-attempts $MaxAttempts `
        --force `
        @validateArgs `
        @evalArgs
}

Write-Host "All models finished. CSV/summary under results/contractgen-study-v5/baselines/purellm/<model>/" -ForegroundColor Green
