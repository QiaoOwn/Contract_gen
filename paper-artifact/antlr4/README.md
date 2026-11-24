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

The executable dialect also provides `source->sumBy(element:Type | numericSelector)`:
one explicitly typed iterator, a pure Integer/Real selector, and a scalar total.
Distinct source objects contribute separately even when their numeric projections
are equal; repeated references to one source object contribute once. Empty Sets
return zero. Undefined/non-numeric/non-finite contributions and overflow fail.
This is an OCLTSVM extension, not a standard OCL operation or support for Bag/collect.
See `docs/OCLTSVM_NUMERIC_PROJECTION_EXTENSION.md` for the execution and checking contract.

The dialect additionally provides `source->projectSet(element:Type | objectSelector)`:
one explicitly typed iterator and a pure selector returning one declared model
object per distinct source element. Results are deduplicated by object identity;
different objects with equal attributes remain distinct. Empty Sets return an
empty Set. Undefined, scalar, collection-valued and effectful selectors fail.
Projection does not require separate repository registration of referenced objects
and does not flatten collections. This is an OCLTSVM extension, not standard
`collect` or Bag support. See `docs/RM2PT_R05_R07_ALIGNMENT.md` for validation.

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
