import {
  generateAblationStudyExperimentResult,
  generateExperimentResult,
} from '@/app/service/generateExperimentResult';
import {FC} from 'react';
import ExperimentTable from './component/ExperimentTable';

const Experiment: FC = () => {
  const result = generateExperimentResult();
  const ablationResult = generateAblationStudyExperimentResult();
  return <ExperimentTable result={result} ablationResult={ablationResult} />;
};
export default Experiment;
