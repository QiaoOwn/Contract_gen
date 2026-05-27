# Paper Tables from Current Results

Detected paper tables: 7. Tables 1-3 are mostly static. Tables 4-7 below use the current formal experiment results in `results/rq_*_full_oracle_fixed`.

## Table 1. Summary of representative approaches to natural-language-to-OCL generation
| Approach | Statement | Contract | Rule | DL | Prompt Eng. | Compilation | Agents | Test |
|---|---|---|---|---|---|---|---|---|
| DeepOCL | Yes | No | - | Yes | - | No | No | No |
| Codex Prompt | Yes | No | - | - | Yes | No | No | No |
| PathOCL | Yes | No | - | - | Yes | No | No | No |
| SBVR | Yes | No | Yes | - | - | No | No | No |
| Contract Gen | Yes | Yes | - | - | Yes | Yes | Yes | Yes |

## Table 2. Comparison of representative OCL execution backends
| Feature | OCLVM (Willink) | RM2PT | CrossEcore | VMTS | OCLVM (ours) |
|---|---|---|---|---|---|
| Compiler language | Java | Java | Java | C# | TypeScript |
| Target language | Java | Java | Java, C#, Swift, TS | C# | TypeScript |
| Runtime | JVM | JVM | EMF Core | .NET | Browser, Node.js |
| Core technique | EMF | Xtext, Xtend | - | ANTLR, CodeDOM | ANTLR4, Babel |
| Decoupled from Eclipse | No | No | No | Yes | Yes |
| Supports semantics-aware execution | No | No | No | No | Yes |
| Supports localized diagnostics | No | No | No | No | Yes |

## Table 3. Dataset summary across five case studies
| Case study | #Operations | #Services | #Entities |
|---|---:|---:|---:|
| Airport | 5 | 3 | 4 |
| ATM | 22 | 5 | 2 |
| CoCoME | 41 | 16 | 13 |
| Library Management | 24 | 19 | 11 |
| Loan Processing | 22 | 10 | 8 |
| Total | 114 | 53 | 38 |

## Table 4. Validity rate comparison (RQ1) on 114 operations
| Method / Model | #Valid | Validity (%) |
|---|---:|---:|
| PathOCL | - | 61.90 |
| Codex Prompt | - | 53.20 |
| Contract Gen + gpt-5.4 | 114 | 100.00 |
| Contract Gen + gpt-5.4-mini | 114 | 100.00 |
| Contract Gen + claude-opus-4-7 | 114 | 100.00 |
| Contract Gen + qwen3-coder-plus | 108 | 94.74 |
| Contract Gen + qwen3-coder-flash | 113 | 99.12 |

## Table 4b. Syntax Valid@k under the five-attempt budget
| Model | Valid@1 | Valid@2 | Valid@3 | Valid@4 | Valid@5 |
|---|---:|---:|---:|---:|---:|
| gpt-5.4 | 94.74% (108) | 100.00% (114) | 100.00% (114) | 100.00% (114) | 100.00% (114) |
| gpt-5.4-mini | 94.74% (108) | 99.12% (113) | 100.00% (114) | 100.00% (114) | 100.00% (114) |
| claude-opus-4-7 | 95.61% (109) | 99.12% (113) | 99.12% (113) | 100.00% (114) | 100.00% (114) |
| qwen3-coder-plus | 87.72% (100) | 92.11% (105) | 92.11% (105) | 94.74% (108) | 94.74% (108) |
| qwen3-coder-flash | 78.95% (90) | 88.60% (101) | 93.86% (107) | 95.61% (109) | 99.12% (113) |

## Table 5. Execution-grounded validation success (RQ2) on 114 operations
| Method / Model | #Pass | Success (%) |
|---|---:|---:|
| PathOCL | - | 47.60 |
| Codex Prompt | - | 39.00 |
| Contract Gen + gpt-5.4 | 60 | 52.63 |
| Contract Gen + gpt-5.4-mini | 52 | 45.61 |
| Contract Gen + claude-opus-4-7 | 70 | 61.40 |
| Contract Gen + qwen3-coder-plus | 58 | 50.88 |
| Contract Gen + qwen3-coder-flash | 39 | 34.21 |

## Table 6. Feedback utility and repair outcomes (RQ3)
Note: this table uses current feedback-loop results. It is not the old no-feedback ablation table unless full no-feedback runs are available.
| Model | Error Ops | Repaired | Unrepaired | Repair Success (%) | Avg Repair Rounds | Avg Intermediate Errors |
|---|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | 71 | 31 | 40 | 43.66 | 2.34 | 1.34 |
| gpt-5.4-mini | 58 | 19 | 39 | 32.76 | 2.97 | 1.97 |
| claude-opus-4-7 | 40 | 10 | 30 | 25.00 | 1.74 | 0.74 |
| qwen3-coder-plus | 54 | 24 | 30 | 44.44 | 3.03 | 2.12 |
| qwen3-coder-flash | 88 | 23 | 65 | 26.14 | 6.91 | 6.11 |

## Table 7. Intermediate error distribution by validation stage
| Model | Contract Generator | TypeScript Generator | TypeScript Parser | Total |
|---|---:|---:|---:|---:|
| gpt-5.4 | 47 | 17 | 106 | 170 |
| gpt-5.4-mini | 71 | 82 | 72 | 225 |
| claude-opus-4-7 | 36 | 5 | 43 | 84 |
| qwen3-coder-plus | 152 | 46 | 105 | 303 |
| qwen3-coder-flash | 368 | 308 | 230 | 906 |

## Optional Appendix Table A1. RQ1 by case study
| Model | Case study | Total | #Valid | Validity (%) |
|---|---|---:|---:|---:|
| gpt-5.4 | ATM | 22 | 22 | 100.00 |
| gpt-5.4 | Airport | 5 | 5 | 100.00 |
| gpt-5.4 | CoCoME | 41 | 41 | 100.00 |
| gpt-5.4 | Library Management | 24 | 24 | 100.00 |
| gpt-5.4 | Loan Processing | 22 | 22 | 100.00 |
| gpt-5.4-mini | ATM | 22 | 22 | 100.00 |
| gpt-5.4-mini | Airport | 5 | 5 | 100.00 |
| gpt-5.4-mini | CoCoME | 41 | 41 | 100.00 |
| gpt-5.4-mini | Library Management | 24 | 24 | 100.00 |
| gpt-5.4-mini | Loan Processing | 22 | 22 | 100.00 |
| claude-opus-4-7 | ATM | 22 | 22 | 100.00 |
| claude-opus-4-7 | Airport | 5 | 5 | 100.00 |
| claude-opus-4-7 | CoCoME | 41 | 41 | 100.00 |
| claude-opus-4-7 | Library Management | 24 | 24 | 100.00 |
| claude-opus-4-7 | Loan Processing | 22 | 22 | 100.00 |
| qwen3-coder-plus | ATM | 22 | 22 | 100.00 |
| qwen3-coder-plus | Airport | 5 | 5 | 100.00 |
| qwen3-coder-plus | CoCoME | 41 | 41 | 100.00 |
| qwen3-coder-plus | Library Management | 24 | 24 | 100.00 |
| qwen3-coder-plus | Loan Processing | 22 | 16 | 72.73 |
| qwen3-coder-flash | ATM | 22 | 22 | 100.00 |
| qwen3-coder-flash | Airport | 5 | 5 | 100.00 |
| qwen3-coder-flash | CoCoME | 41 | 40 | 97.56 |
| qwen3-coder-flash | Library Management | 24 | 24 | 100.00 |
| qwen3-coder-flash | Loan Processing | 22 | 22 | 100.00 |

## Optional Appendix Table A2. RQ2 by case study
| Model | Case study | Total | #Pass | Success (%) |
|---|---|---:|---:|---:|
| gpt-5.4 | ATM | 22 | 13 | 59.09 |
| gpt-5.4 | Airport | 5 | 2 | 40.00 |
| gpt-5.4 | CoCoME | 41 | 25 | 60.98 |
| gpt-5.4 | Library Management | 24 | 14 | 58.33 |
| gpt-5.4 | Loan Processing | 22 | 6 | 27.27 |
| gpt-5.4-mini | ATM | 22 | 7 | 31.82 |
| gpt-5.4-mini | Airport | 5 | 3 | 60.00 |
| gpt-5.4-mini | CoCoME | 41 | 23 | 56.10 |
| gpt-5.4-mini | Library Management | 24 | 13 | 54.17 |
| gpt-5.4-mini | Loan Processing | 22 | 6 | 27.27 |
| claude-opus-4-7 | ATM | 22 | 18 | 81.82 |
| claude-opus-4-7 | Airport | 5 | 3 | 60.00 |
| claude-opus-4-7 | CoCoME | 41 | 29 | 70.73 |
| claude-opus-4-7 | Library Management | 24 | 14 | 58.33 |
| claude-opus-4-7 | Loan Processing | 22 | 6 | 27.27 |
| qwen3-coder-plus | ATM | 22 | 13 | 59.09 |
| qwen3-coder-plus | Airport | 5 | 1 | 20.00 |
| qwen3-coder-plus | CoCoME | 41 | 22 | 53.66 |
| qwen3-coder-plus | Library Management | 24 | 14 | 58.33 |
| qwen3-coder-plus | Loan Processing | 22 | 8 | 36.36 |
| qwen3-coder-flash | ATM | 22 | 6 | 27.27 |
| qwen3-coder-flash | Airport | 5 | 1 | 20.00 |
| qwen3-coder-flash | CoCoME | 41 | 21 | 51.22 |
| qwen3-coder-flash | Library Management | 24 | 8 | 33.33 |
| qwen3-coder-flash | Loan Processing | 22 | 3 | 13.64 |

## Additional Table 8. Execution Pass@k under the five-attempt budget
| Model | Pass@1 | Pass@2 | Pass@3 | Pass@4 | Pass@5 |
|---|---:|---:|---:|---:|---:|
| gpt-5.4 | 52.63% (60) | 52.63% (60) | 52.63% (60) | 52.63% (60) | 52.63% (60) |
| gpt-5.4-mini | 43.86% (50) | 45.61% (52) | 45.61% (52) | 45.61% (52) | 45.61% (52) |
| claude-opus-4-7 | 60.53% (69) | 61.40% (70) | 61.40% (70) | 61.40% (70) | 61.40% (70) |
| qwen3-coder-plus | 48.25% (55) | 50.88% (58) | 50.88% (58) | 50.88% (58) | 50.88% (58) |
| qwen3-coder-flash | 32.46% (37) | 34.21% (39) | 34.21% (39) | 34.21% (39) | 34.21% (39) |

## Additional Table 9. Gap between syntactic validity and execution-grounded validity
| Model | #Syntax Valid | Syntax (%) | #Execution Valid | Execution (%) | Gap (pp) | Retention (%) |
|---|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | 114 | 100.00 | 60 | 52.63 | 47.37 | 52.63 |
| gpt-5.4-mini | 114 | 100.00 | 52 | 45.61 | 54.39 | 45.61 |
| claude-opus-4-7 | 114 | 100.00 | 70 | 61.40 | 38.60 | 61.40 |
| qwen3-coder-plus | 108 | 94.74 | 58 | 50.88 | 43.86 | 53.70 |
| qwen3-coder-flash | 113 | 99.12 | 39 | 34.21 | 64.91 | 34.51 |

## Additional Table 10. Final failure taxonomy by model
| Model | Final Failed Ops | missing_context | parser_internal_error |
|---|---:|---:|---:|
| gpt-5.4 | 0 | 0 | 0 |
| gpt-5.4-mini | 0 | 0 | 0 |
| claude-opus-4-7 | 0 | 0 | 0 |
| qwen3-coder-plus | 6 | 0 | 6 |
| qwen3-coder-flash | 1 | 1 | 0 |

## Additional Table 11. Attempt and latency profile
| Model | Ops | Attempts | Avg Attempts/Op | Max Attempts/Op | Avg Latency (s) | Median Latency (s) | Avg First Syntax Attempt | Avg First Execution Attempt |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | 114 | 120 | 1.05 | 2 | 13.40 | 7.48 | 1.05 | 1.00 |
| gpt-5.4-mini | 114 | 121 | 1.06 | 3 | 10.07 | 5.17 | 1.06 | 1.04 |
| claude-opus-4-7 | 114 | 121 | 1.06 | 4 | 18.64 | 5.91 | 1.06 | 1.01 |
| qwen3-coder-plus | 114 | 152 | 1.33 | 5 | 58.61 | 15.41 | 1.13 | 1.05 |
| qwen3-coder-flash | 114 | 163 | 1.43 | 5 | 56.89 | 30.92 | 1.40 | 1.05 |

## Optional Appendix Table A3. Final failed operations by case study
| Model | Airport | ATM | CoCoME | Library Management | Loan Processing | Total |
|---|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | 0 | 0 | 0 | 0 | 0 | 0 |
| gpt-5.4-mini | 0 | 0 | 0 | 0 | 0 | 0 |
| claude-opus-4-7 | 0 | 0 | 0 | 0 | 0 | 0 |
| qwen3-coder-plus | 0 | 0 | 0 | 0 | 6 | 6 |
| qwen3-coder-flash | 0 | 0 | 1 | 0 | 0 | 1 |

## Optional Appendix Table A4. LLM API error rerun merge summary
| Model | Rerun Pairs | Removed Old Attempts | Added Rerun Attempts | Official Attempts After Merge |
|---|---:|---:|---:|---:|
| gpt-5.4 | 1 | 2 | 2 | 120 |
| qwen3-coder-flash | 32 | 160 | 42 | 163 |
| qwen3-coder-plus | 21 | 105 | 48 | 152 |

## Additional Table 12. Pure LLM baseline vs Contract Gen on GPT-family models
This table incorporates the new pure-LLM baseline runs in `results/baseline_llm_only`.
| Model | Method | Total | RQ1 #Valid | RQ1 Validity (%) | RQ2 #Pass | RQ2 Success (%) | Valid@1 (%) | Valid@5 (%) | Pass@1 (%) | Pass@5 (%) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | Pure LLM | 114 | 107 | 93.86 | 55 | 48.25 | 92.98 | 93.86 | 42.11 | 48.25 |
| gpt-5.4 | Contract Gen | 114 | 114 | 100.00 | 60 | 52.63 | 94.74 | 100.00 | 52.63 | 52.63 |
| gpt-5.4-mini | Pure LLM | 114 | 114 | 100.00 | 59 | 51.75 | 92.98 | 100.00 | 43.86 | 51.75 |
| gpt-5.4-mini | Contract Gen | 114 | 114 | 100.00 | 52 | 45.61 | 94.74 | 100.00 | 43.86 | 45.61 |

## Additional Table 13. Pure LLM stage-wise execution-grounded validation
This table reports operation-level Best@5 success for each validation stage.
| Model | Method | Total | Parser/Syntax #Pass | Parser/Syntax (%) | TypeScript Generation #Pass | TypeScript Generation (%) | TypeScript Compile #Pass | TypeScript Compile (%) | Jest Execution #Pass | Jest Execution (%) | Execution #Pass | Execution (%) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-5.4 | Pure LLM | 114 | 107 | 93.86 | 103 | 90.35 | 80 | 70.18 | 55 | 48.25 | 55 | 48.25 |
| gpt-5.4-mini | Pure LLM | 114 | 114 | 100.00 | 110 | 96.49 | 87 | 76.32 | 59 | 51.75 | 59 | 51.75 |

## Additional Table 14. Pure LLM Syntax Valid@k under the five-attempt budget
| Model | Method | Valid@1 | Valid@2 | Valid@3 | Valid@4 | Valid@5 |
|---|---|---:|---:|---:|---:|---:|
| gpt-5.4 | Pure LLM | 92.98% (106) | 93.86% (107) | 93.86% (107) | 93.86% (107) | 93.86% (107) |
| gpt-5.4-mini | Pure LLM | 92.98% (106) | 97.37% (111) | 98.25% (112) | 100.00% (114) | 100.00% (114) |

