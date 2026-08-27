import {
  generateAblationStudyExperimentResult,
  generateExperimentResult,
} from '@/app/service/generateExperimentResult';
import {notFound} from 'next/navigation';
import {FC} from 'react';
import ExperimentTable from './component/ExperimentTable';

export const dynamic = 'force-dynamic';

const Experiment: FC = () => {
  if (process.env.ENABLE_LEGACY_EXPERIMENT_UI !== 'true') {
    notFound();
  }
  const result = generateExperimentResult();
  const ablationResult = generateAblationStudyExperimentResult();
  return <ExperimentTable result={result} ablationResult={ablationResult} />;
};
export default Experiment;
