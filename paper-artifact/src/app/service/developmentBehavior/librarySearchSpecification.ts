import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export const LIBRARY_SEARCH_OPERATIONS = ['searchBookByBarCode', 'searchBookByTitle', 'searchBookByAuthor', 'searchBookByISBN', 'searchBookBySubject'] as const;
export type LibrarySearchOperation = typeof LIBRARY_SEARCH_OPERATIONS[number];
export const librarySearchSources: DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/RequirementDocument.md',
    sha256: '0ce4f753e2df4b33c621d927c52da55890b0815ab151bb492c5523259582b48c',
    note: 'OP1-OP5 active pre/post specifications; generated prose and remodel are one source lineage. Explicit empty-string expressions govern title/author despite the prose saying null.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/library.remodel',
    sha256: 'd7f4ac436ae349c70b0e908c098f0f02e49516f3e2efec0da673a70ce74fdc53',
    note: 'SearchBook contracts 177-267; exact equality, Book identities and association traversal; no added nonempty guard for barcode, ISBN or subject.'},
];
const definitions = [
  {operation: 'searchBookByBarCode', parameter: 'barcode', field: 'Barcode', association: 'Copys', entity: 'BookCopy', nonempty: false,
    lines: [177, 194], document: [1912, 1920], model: [184, 193], features: ['Book', 'Book.Copys', 'BookCopy.Barcode']},
  {operation: 'searchBookByTitle', parameter: 'title', field: 'Title', association: null, entity: null, nonempty: true,
    lines: [196, 212], document: [1969, 1976], model: [203, 211], features: ['Book', 'Book.Title']},
  {operation: 'searchBookByAuthor', parameter: 'authorname', field: 'Author', association: null, entity: null, nonempty: true,
    lines: [214, 230], document: [2025, 2032], model: [221, 229], features: ['Book', 'Book.Author']},
  {operation: 'searchBookByISBN', parameter: 'iSBNnumber', field: 'ISBn', association: null, entity: null, nonempty: false,
    lines: [232, 248], document: [2081, 2088], model: [239, 247], features: ['Book', 'Book.ISBn']},
  {operation: 'searchBookBySubject', parameter: 'subject', field: 'Name', association: 'Subject', entity: 'Subject', nonempty: false,
    lines: [250, 267], document: [2137, 2145], model: [257, 266], features: ['Book', 'Book.Subject', 'Subject.Name']},
] as const;
export const librarySearchSpecifications = Object.fromEntries(definitions.map(spec => {
  const obligations: DevelopmentObligation[] = [
    {id: 'P01', clause: 'precondition', requirement: spec.nonempty ? 'The supplied search value is not empty.' : 'The supplied search value is a String.',
      documentLine: spec.document[0], modelLines: [spec.model[0], spec.model[0]], modelFeatures: [`$parameter.${spec.parameter}`]},
    {id: 'Q01', clause: 'postcondition', requirement: `Return exactly the registered Book identities matching the supplied ${spec.parameter} by exact equality${spec.association ? ` through ${spec.association}` : ''}.`,
      documentLine: spec.document[1], modelLines: [spec.model[1], spec.model[1]],
      modelFeatures: [...spec.features, `$parameter.${spec.parameter}`, '$result']},
  ];
  return [spec.operation, {...spec, id: `LibraryManagementSystem_searchBook_${spec.operation}`, obligations}];
})) as Record<LibrarySearchOperation, typeof definitions[number] & {id: string; obligations: DevelopmentObligation[]}>;

export type LibrarySearchScenario = FiniteScenario & {value: unknown; values: string[][]; wanted: number[]; equalAttributes?: boolean};
export function librarySearchScenarios(operation: LibrarySearchOperation): LibrarySearchScenario[] {
  const spec = librarySearchSpecifications[operation];
  const fact = (id: string, values: string[][], wanted: number[], value: unknown = 'Key', extra: Partial<LibrarySearchScenario> = {}): LibrarySearchScenario =>
    ({id: `dev-${operation}-${id}`, obligationIds: ['P01', 'Q01'], value, values, wanted, ...extra});
  return [
    fact('empty-repository', [], []), fact('no-match', [['Other'], []], []),
    fact('nonfirst', [['Other'], [], ['Key']], [2]),
    fact('multiple-and-repeated-links', [['Key', 'Key'], ['Other'], ['Key']], [0, 2]),
    fact('equal-attributes-distinct-identities', [['Key'], ['Key']], [0, 1], 'Key', {equalAttributes: true}),
    fact('case-sensitive', [['key'], ['Key'], ['KEY']], [1]),
    fact('not-substring', [['Key-extra'], ['prefixKey'], ['Key']], [2]),
    fact('no-trimming', [['Key'], [' Key '], ['Key ']], [1], ' Key '),
    fact('empty-value', [['Other'], ['']], [1], '', spec.nonempty ? {rejectObligation: 'P01', obligationIds: ['P01']} : {}),
    ...(!spec.nonempty ? [fact('non-string', [['13']], [], 13, {rejectObligation: 'P01', obligationIds: ['P01']})] : []),
  ];
}
