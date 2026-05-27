# RQ Analysis Across 5 Models

| Model | Ops | RQ1 syntax valid | RQ2 execution valid | Error cases | Repaired | RQ3 repair rate | Avg repair rounds | Avg intermediate errors |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | 114 | 100.00% (114) | 52.63% (60) | 71 | 31 | 43.66% | 2.34 | 1.34 |
| gpt-5.4-mini | 114 | 100.00% (114) | 45.61% (52) | 58 | 19 | 32.76% | 2.97 | 1.97 |
| claude-opus-4-7 | 114 | 100.00% (114) | 61.40% (70) | 40 | 10 | 25.00% | 1.74 | 0.74 |
| qwen3-coder-plus | 114 | 94.74% (108) | 50.88% (58) | 54 | 24 | 44.44% | 3.03 | 2.12 |
| qwen3-coder-flash | 114 | 99.12% (113) | 34.21% (39) | 88 | 23 | 26.14% | 6.91 | 6.11 |

RQ1 pooled syntax validity: 98.77% (563/570).
RQ2 pooled execution success: 48.95% (279/570).
RQ3 pooled repair success: 34.41% (107/311).