# USE--OCLTSVM Semantic Agreement Experiment

This experiment evaluates explicit Boolean decisions produced by USE,
OCLTSVM, and the Jest oracle on the same semantic scenarios. It must not be
described as execution-level agreement when USE is only compiling a model.

## 1. Prepare the stratified sample

Run from the repository root:

```powershell
python scripts/run_use_ocltsvm_semantic_agreement.py prepare `
  --operations data/operations.jsonl `
  --attempts results/contractgen-study-v6/contract_gen/full_feedback/gpt-5.5/attempts.jsonl `
  --model gpt-5.5 `
  --sample-size 30
```

The command selects ten simple, ten medium, and ten complex operations while
balancing the five case studies and covering the detected OCL constructs. It
creates three scenario templates for every selected operation:

- a pre-state that satisfies the precondition;
- a boundary or negative pre-state that violates the precondition;
- a paired pre/post state produced from a valid pre-state.

Prepared templates are not experimental observations.

Before configuring the complete sample, run the executable `checkBalance`
pilot that exercises a positive pre-state, a negative pre-state, and a paired
post-state through all three validators:

```powershell
python -B scripts/run_use_ocltsvm_semantic_agreement.py configure-smoke

python -B scripts/run_use_ocltsvm_semantic_agreement.py run `
  --operation-id AutomatedTellerMachine_checkBalance_checkBalance `
  --use-bat tools/use-7.5.0/bin/use.bat `
  --output-dir results/contractgen-study-v6/validation/use_ocltsvm_semantic_agreement/smoke_run
```

The pilot is a pipeline check and must not be reported as the final 30-operation
agreement result.

## 2. Configure the 30-operation batch

The batch adapter executes each operation's existing Jest oracle against the
selected GPT-5.5 contract, captures the exact pre-state, and exports that state
to USE. Run:

```powershell
python -B scripts/run_use_ocltsvm_semantic_agreement.py configure-batch `
  --operations data/operations.jsonl `
  --attempts results/contractgen-study-v6/contract_gen/full_feedback/gpt-5.5/attempts.jsonl `
  --model gpt-5.5 `
  --refresh-captures
```

The adapter configures one successful and, when the oracle provides it, one
precondition-rejecting execution per operation. A missing negative oracle is
reported as unsupported instead of being synthesized. Dates retain second-level
ordering, and object-valued service fields are exported as USE associations.

The batch comparison is deliberately limited to **same-pre-state precondition
decisions**. USE post-state execution is not claimed here. Complete-contract
loading/typechecking and Jest postcondition tests remain separate evidence.

## 3. Inspect or edit semantic scenarios

Scenario files are written under:

```text
results/contractgen-study-v6/validation/use_ocltsvm_semantic_agreement/scenarios
```

Each validator should execute the same state and print exactly one final
decision marker:

```text
SEMANTIC_DECISION: true
```

or:

```text
SEMANTIC_DECISION: false
```

For USE, either provide a complete command list or set `model_file` and
`command_file`; the runner then invokes the bundled USE executable. For an
unsupported construct, set `status` to `unsupported` and record the reason.
Pending, unsupported, timeout, and error outcomes are reported but excluded
from agreement denominators.

## 4. Run and summarize

```powershell
python -B scripts/run_use_ocltsvm_semantic_agreement.py run `
  --use-bat tools/use-7.5.0/bin/use.bat `
  --output-dir results/contractgen-study-v6/validation/use_ocltsvm_semantic_agreement/final_30ops
```

The run produces:

- `scenario_results.csv` and `scenario_results.json`;
- `disagreements.json` with every pairwise mismatch;
- `summary.json` for artifact processing;
- `summary.md` with rates and Wilson 95% confidence intervals;
- raw validator logs for auditability.

The paper should report both the agreement rate and its denominator, together
with unsupported/error cases and a short disagreement taxonomy. The verified
run produced explicit USE decisions for 55 precondition scenarios, with 54/55
agreement (98.18%, Wilson 95% CI 90.39%--99.68%). Three operations had no
negative oracle, two `endSale` scenarios exposed a standard OCL `Bag`/`Set`
typing error, and one `listRecommendBook` negative scenario exposed the semantic
difference between an empty multi-valued OCL association and an undefined
TypeScript field.

## 5. Test the experiment code

```powershell
python -B -m unittest -v scripts/test_run_use_ocltsvm_semantic_agreement.py
```
