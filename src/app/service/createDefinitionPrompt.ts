import {whatIsDefination, whatIsPrecondition, whatIsPostcondition} from '../constant';

export const createDefinitionPrompt = () => {
  return [
    'Now I will tell you the tell you some context about the rules:',
    `\`definition\`: ${whatIsDefination}`,
    `\`precondition\`: ${whatIsPrecondition}`,
    `\`postcondition\`: ${whatIsPostcondition}`,
  ].join('\n');
};
