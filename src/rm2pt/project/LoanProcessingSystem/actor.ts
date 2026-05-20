import {Actor} from '../../model/Actor';

export const LoanAssistant = new Actor({
  name: 'LoanAssistant',
  description:
    'The loan assistant is responsible for manually capturing and entering into the system the credit information',
});

export const LoanClerk = new Actor({
  name: 'LoanClerk',
  description: 'The loan clerk is responsible for booking (recording and setting up) the loan',
});

export const LoanOfficer = new Actor({
  name: 'LoanOfficer',
  description:
    'a loan officer is an officer of the bank who has the designated responsibilitiy of evaluating requests for a loan',
});

export const Scheduler = new Actor({
  name: 'Scheduler',
  description: 'system scheduler',
});

export const Applicant = new Actor({
  name: 'Applicant',
  description:
    'An applicant is an individual or organization who sumits an application for a loan to the bank',
});
