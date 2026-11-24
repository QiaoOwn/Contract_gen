import {z} from 'zod';

export type DevelopmentOperation = {project: string; useCase: string; operation: string};
export type DevelopmentSource = {id: string; path: string; sha256: string; note?: string};
export type DevelopmentObligation = {
  id: string;
  clause: 'precondition' | 'postcondition';
  requirement: string;
  documentLine: number;
  requirementSourceId?: string;
  evidenceNote?: string;
  modelLines: [number, number];
  modelFeatures: string[];
  // Explicit source-linked targets, distinct from lookup and other contextual dependencies.
  localizationTargets?: readonly string[];
};
export type DevelopmentScenarioRegistration = {
  id: string;
  obligationIds: readonly string[];
};

const observationStatus = z.enum(['matched', 'mismatched', 'inconclusive']);
const diagnosticSchema = z.object({
  kind: z.literal('development-behavior'),
  scenarioId: z.string().min(1),
  code: z.enum([
    'OBLIGATION_MISMATCH',
    'SPECIFICATION_DETAIL_MISMATCH',
    'UNEXPECTED_REJECTION',
    'EXECUTION_ERROR',
    'REJECTION_UNRESOLVED',
  ]),
  obligationIds: z.array(z.string().min(1)),
  expected: z.unknown(),
  observed: z.unknown(),
  message: z.string(),
});
export type DevelopmentDiagnostic = z.infer<typeof diagnosticSchema>;

export const developmentReportSchema = z
  .object({
    schemaVersion: z.string().min(1),
    operationId: z.string().min(1),
    role: z.literal('development_only'),
    reviewStatus: z.string().min(1),
    hiddenEvaluationUsed: z.literal(false),
    dynamicRepairEnabled: z.boolean(),
    coverageScope: z.literal('finite-development-scenarios'),
    businessAssessmentBasis: z.string().min(1),
    businessStatus: observationStatus,
    executionConventionStatus: observationStatus,
    scenarioCount: z.number().int().positive(),
    scenarioResults: z.array(
      z.object({
        id: z.string().min(1),
        passed: z.boolean(),
        checkCount: z.number().int().nonnegative(),
      })
    ),
    checks: z.array(
      z.object({
        scenarioId: z.string().min(1),
        obligationId: z.string().min(1),
        passed: z.boolean().nullable(),
        expected: z.unknown(),
        observed: z.unknown(),
      })
    ),
    diagnostics: z.array(diagnosticSchema),
    executionObservations: z.array(
      z.object({
        scenarioId: z.string().min(1),
        classification: z.enum([
          'completed',
          'explicit-rejection',
          'definition-failure-unresolved',
          'runtime-error',
          'return-without-rejection-signal',
          'postcondition-check-failure',
        ]),
        conventionStatus: observationStatus,
        rejectionEvidence: z.object({
          obligationId: z.string().min(1),
          preconditionSatisfied: z.literal(false),
          basis: z.literal('independent-source-precondition-observation'),
          rootCauseEstablished: z.literal(false),
          expected: z.unknown(),
          observed: z.unknown(),
        }).optional(),
      })
    ),
    unobservedObligationIds: z.array(z.string().min(1)),
    passed: z.boolean(),
  })
  .passthrough();
export type DevelopmentBehaviorReport = z.infer<typeof developmentReportSchema>;

export type DevelopmentRegistration = DevelopmentOperation & {
  id: string;
  schemaVersion: string;
  reviewStatus: string;
  fixedClock: string;
  sources: readonly DevelopmentSource[];
  requirementSourceId: string;
  modelSourceId: string;
  obligations: readonly DevelopmentObligation[];
  scenarios: readonly DevelopmentScenarioRegistration[];
  moduleExports: Readonly<Record<string, 'function' | 'object'>>;
  run: (candidate: unknown, options: {requirementText: string}) => unknown | Promise<unknown>;
};
