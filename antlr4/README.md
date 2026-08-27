# Grammar roles

- `REMODEL.g4` is the runtime grammar. It defines the project-specific operation-contract wrapper and the executable OCL subset consumed by ContractGen and OCLTSVM.
- `OCL.g4` is the upstream standards reference used to check standard OCL spelling and expression coverage. It is not a second runtime parser.
- The runtime parser retains `allInstance()` only for compatibility with historical contracts. Generation-facing prompts expose and require the standard `allInstances()` spelling.

## Conformance boundary

The runtime grammar does not claim complete OCL 2.4 conformance. It accepts the
operation-contract constructs for which `ContractToTypescript` provides an
executable lowering. This keeps parser acceptance aligned with runtime meaning,
which is more important for validation than accepting unsupported syntax.

Supported OCL-derived constructs include typed bindings, `if-then-else`,
parenthesized Boolean formulas, comparisons, the arithmetic used in benchmark
updates, `Set` types and literals, navigation, `@pre`, standard
`allInstances()`, the documented iterator and collection-query operations,
`oclIsUndefined()`, `oclIsTypeOf()`, and `oclIsNew()`.

REMODEL extensions include the `Contract` wrapper, the `definition` clause,
effect lowering in postconditions, external-call traces, the `Date` type, and
the `Today`, `Now`, `After`, and `Before` temporal forms.

The runtime subset intentionally rejects tuples, `invalid`/`OclInvalid`,
`UnlimitedNatural`, and the `Bag`, `Sequence`, `Collection`, and `OrderedSet`
families because OCLTSVM does not yet implement their distinct runtime
semantics. It also excludes `not`, `xor`, and `implies`; generators must express
equivalent conditions with comparisons, collection predicates, and nested
formulas. At one nesting level, `and` and `or` cannot be mixed. Parenthesize the
subformula when both operators are needed.

Generate the runtime TypeScript parser with `npm run remodel-antlr4-typescript`
after changing `REMODEL.g4`. The repository pins the official ANTLR 4.13.2
complete tool at `tools/antlr-4.13.2-complete.jar` (SHA-256
`EAE2DFA119A64327444672AFF63E9EC35A20180DC5B8090B7A6AB85125DF4D76`),
so parser generation does not depend on a machine-global `antlr4` command.
