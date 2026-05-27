## Additional Table 12. Pure LLM baseline vs Contract Gen on GPT-family models
| Model | Method | Total | RQ1 #Valid | RQ1 Validity (%) | RQ2 #Pass | RQ2 Success (%) | Valid@1 (%) | Valid@5 (%) | Pass@1 (%) | Pass@5 (%) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | Pure LLM | 114 | 107 | 93.86 | 55 | 48.25 | 92.98 | 93.86 | 42.11 | 48.25 |
| gpt-5.4 | Contract Gen | 114 | 114 | 100.00 | 60 | 52.63 | 94.74 | 100.00 | 52.63 | 52.63 |
| gpt-5.4-mini | Pure LLM | 114 | 114 | 100.00 | 59 | 51.75 | 92.98 | 100.00 | 43.86 | 51.75 |
| gpt-5.4-mini | Contract Gen | 114 | 114 | 100.00 | 52 | 45.61 | 94.74 | 100.00 | 43.86 | 45.61 |

## Additional Table 13. Pure LLM stage-wise execution-grounded validation
| Model | Method | Total | Parser/Syntax #Pass | Parser/Syntax (%) | TypeScript Generation #Pass | TypeScript Generation (%) | TypeScript Compile #Pass | TypeScript Compile (%) | Jest Execution #Pass | Jest Execution (%) | Execution #Pass | Execution (%) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | Pure LLM | 114 | 107 | 93.86 | 103 | 90.35 | 80 | 70.18 | 55 | 48.25 | 55 | 48.25 |
| gpt-5.4-mini | Pure LLM | 114 | 114 | 100.00 | 110 | 96.49 | 87 | 76.32 | 59 | 51.75 | 59 | 51.75 |
