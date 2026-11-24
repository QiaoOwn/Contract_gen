import bookNewLoan from './bookNewLoan';
import closeOutLoan from './closeOutLoan';
import enterValidatedCreditReferences from './enterValidatedCreditReferences';
import evaluateLoanRequest from './evaluateLoanRequest';
import generateLateNotice from './generateLateNotice';
import generateLoanLetterAndAgreement from './generateLoanLetterAndAgreement';
import generateStandardPaymentNotice from './generateStandardPaymentNotice';
import loanPayment from './loanPayment';
import manageLoanTerm from './manageLoanTerm';
import submitLoanRequest from './submitLoanRequest';
export * as actor from './actor';
export {default as entity} from './entity';
export const useCase = {
  bookNewLoan,
  closeOutLoan,
  enterValidatedCreditReferences,
  evaluateLoanRequest,
  generateLateNotice,
  generateLoanLetterAndAgreement,
  generateStandardPaymentNotice,
  loanPayment,
  manageLoanTerm,
  submitLoanRequest,
};
