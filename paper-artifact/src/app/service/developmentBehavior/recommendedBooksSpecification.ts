import type {DevelopmentObligation, DevelopmentSource} from './types';
import type {FiniteScenario} from './finiteScenarioReport';

export const RECOMMENDATION_VIEWS = ['listBookHistory', 'listRecommendBook'] as const;
export type RecommendationView = typeof RECOMMENDATION_VIEWS[number];
export const recommendationId = (view: RecommendationView) => `LibraryManagementSystem_${view}_listRecommendBook`;
export const recommendationService = (view: RecommendationView) => view === 'listBookHistory' ? 'ListBookHistory' : 'LibraryManagementSystemSystem';
export const RECOMMENDATION_VERSION = 'development-recommendation-list-rm2pt-v1';
export const recommendationSources: readonly DevelopmentSource[] = [
  {id: 'requirement-document', path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/RequirementDocument.md',
    sha256: '0ce4f753e2df4b33c621d927c52da55890b0815ab151bb492c5523259582b48c',
    note: 'OP19. Both use-case views share one original operation; the document and model are not independent sources.'},
  {id: 'upstream-model', path: 'data/operation_revision/upstream_rm2pt/LibraryManagementSystem/library.remodel',
    sha256: 'd7f4ac436ae349c70b0e908c098f0f02e49516f3e2efec0da673a70ce74fdc53',
    note: 'Active ListBookHistory::listRecommendBook, lines 965-993. No collection ordering or global frame condition is added.'},
];
export const recommendationMappingSource: DevelopmentSource = {
  id: 'adjudication-R08', path: 'data/operation_revision/rm2pt_authority_decisions/R08_listRecommendBook.json',
  sha256: 'a7102a77ca012e3a9736dd4f77849482941d9cecd6563db956663a8f4284c9eb',
  note: 'User-approved service alias for the standalone view; not a new independent source operation.',
};
export const recommendationObligations: DevelopmentObligation[] = [
  {id: 'P01', clause: 'precondition', requirement: 'The referenced User exists.', documentLine: 3399,
    modelLines: [974, 983], modelFeatures: ['User.UserID', '$parameter.uid']},
  {id: 'P02', clause: 'precondition', requirement: 'The selected User recommendation collection can be resolved.', documentLine: 3399,
    modelLines: [975, 984], modelFeatures: ['User.UserID', 'User.RecommendedBook', '$parameter.uid']},
  {id: 'Q01', clause: 'postcondition', requirement: 'Return all and only the RecommendBook objects linked to the selected User.',
    documentLine: 3403, modelLines: [991, 991], modelFeatures: ['User.UserID', 'User.RecommendedBook', 'RecommendBook', '$parameter.uid', '$result']},
];
export type RecommendationScenario = FiniteScenario & {count: number; emptyId?: boolean; missingUser?: boolean; missingCollection?: boolean};
export const recommendationScenarios: RecommendationScenario[] = [
  {id: 'dev-one-recommendation', count: 1, obligationIds: ['P01', 'P02', 'Q01']},
  {id: 'dev-distinct-objects-equal-attributes', count: 2, obligationIds: ['P01', 'P02', 'Q01']},
  {id: 'dev-empty-collection', count: 0, obligationIds: ['P01', 'P02', 'Q01']},
  {id: 'dev-empty-user-id', count: 2, emptyId: true, obligationIds: ['P01', 'P02', 'Q01']},
  {id: 'dev-unresolved-collection', count: 0, missingCollection: true, rejectObligation: 'P02', obligationIds: ['P02']},
  {id: 'dev-missing-user', count: 0, missingUser: true, rejectObligation: 'P01', obligationIds: ['P01']},
];
