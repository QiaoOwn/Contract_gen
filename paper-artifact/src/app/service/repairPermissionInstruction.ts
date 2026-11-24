import type {RepairPermission} from './dependencyRepairPermissions';

export function repairPermissionInstruction(permission:Pick<RepairPermission,'mode'|'coarseClauses'>){
 if(permission.mode==='syntax-clause-fallback')return `Parser fallback has no reliable AST holes. Edit only these complete clause bodies: ${permission.coarseClauses.join(', ')||'none'}. coarseClauses is the edit authority; mayEdit is empty by design. Preserve every other clause's OCL tokens, including names, operators and string literals. Local bindings must stay inside an authorized clause; do not add a top-level Definition or change other clauses without authorization. mustRevalidate is not edit permission.`;
 if(permission.mode==='evidence-only')return 'Evidence-only repair: keep D/P/Q byte-identical. Update only the requested evidence. mustRevalidate is not edit permission.';
 if(permission.mode==='unresolved')return 'No determinate edit permission is available. Do not invent authorization or change D/P/Q.';
 return 'Repair the complete D/P/Q within the supplied mayEdit regions. Preserve protected structure. mustRevalidate is not edit permission.';
}
