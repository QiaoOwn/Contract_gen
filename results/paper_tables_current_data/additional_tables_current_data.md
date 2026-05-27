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
