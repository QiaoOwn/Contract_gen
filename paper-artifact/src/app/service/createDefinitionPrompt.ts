import {whatIsDefinition, whatIsPrecondition, whatIsPostcondition} from '../constant';

export const createDefinitionPrompt = () =>
  [
    'Contract-field semantics:',
    'definition: ' + whatIsDefinition.trim(),
    'precondition: ' + whatIsPrecondition.trim(),
    'postcondition: ' + whatIsPostcondition.trim(),
  ].join('\n');
