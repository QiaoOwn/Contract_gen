# v4 Oracle semantic audit: creation and renewal continuation

The selected Jest assertions were compared with the frozen v4 obligations.
The three source-active creation operations use v4-only tests that require
exactly one new stored object and no replacement after a duplicate-ID rejection.
The loan-account operation is an approved laboratory restoration of a
commented draft, not an active upstream RM2PT contract.

| Obligation | Selected assertion evidence | Judgment |
| --- | --- | --- |
| createLibrarian/P1 | Duplicate LibrarianID rejects; repository still contains the same object | Covered |
| createLibrarian/Q1 | Exactly one stored Librarian has supplied ID, name, password | Covered |
| createLibrarian/Q2 | Successful invocation returns true | Covered |
| createUser/P1 | Duplicate UserID rejects; repository still contains the same object | Covered |
| createUser/Q1 | Exactly one stored User has all ten supplied values | Covered |
| createUser/Q2 | Successful invocation returns true | Covered |
| createLoanTerm/P1 | Duplicate ItemID rejects; repository still contains the same object | Covered |
| createLoanTerm/Q1 | Exactly one stored LoanTerm has supplied ID and content | Covered |
| createLoanTerm/Q2 | Successful invocation returns true | Covered |
| createLoanAccount/P1 | Duplicate account ID rejects; repository still contains the same object | Covered for lab-restored draft |
| createLoanAccount/Q1 | Exactly one new stored LoanAccount has the supplied ID, balance and status | Covered for lab-restored draft |
| createLoanAccount/Q2 | Successful invocation returns true | Covered for lab-restored draft |
| renewBook/P1 | Missing User, BookCopy or matching Loan rejects | Covered; source mismatch on missing User |
| renewBook/P2 | Reserved, due-today, past-due and nonzero-fee cases reject without Loan mutation | Covered |
| renewBook/P3 | Student 3-renewal and non-Student 6-renewal limits reject; below-limit cases succeed | Covered |
| renewBook/Q1 | Every success branch increments renewal count and records today | Covered |
| renewBook/Q2 | Bachelor/Master/other Student/non-Student branches extend the previous due date by 20/40/60/60 days | Covered |
| renewBook/Q3 | Every success branch returns true | Covered |
| borrowBook/P1 | Missing User and missing BookCopy are rejected without new Loan | Covered |
| borrowBook/P2 | SUSPEND status and nonzero SuspensionDays reject without changing count or copy status | Covered |
| borrowBook/P3 | Bachelor/Master/other Student and Faculty quotas reject at their limits; Student below-limit cases succeed | Covered |
| borrowBook/P4 | Available and valid on-hold paths succeed; foreign, absent and closed reservations reject | Covered |
| borrowBook/Q1 | One new unreturned Loan links User and BookCopy and records today | Covered |
| borrowBook/Q2 | Borrower's LoanedBook contains exactly the new Loan in the seeded scenario | Covered |
| borrowBook/Q3 | Copy's LoanedRecord contains exactly the new Loan in the seeded scenario | Covered |
| borrowBook/Q4 | Student and Faculty due dates are 30 and 60 days from today | Covered |
| borrowBook/Q5 | Count increases, copy becomes LOANED and all four overdue flags start false | Covered |
| borrowBook/Q6 | Valid on-hold borrowing clears reserved flag and closes matching reservation; invalid reservation paths preserve state | Covered |
| borrowBook/Q7 | Both successful branches return true | Covered |

Source-candidate replay passed createLibrarian 2/2, createUser 2/2, and
createLoanTerm 2/2. The approved commented loan-account draft passed the
separate laboratory replay 4/4; this is not evidence of an active upstream
contract. The active renewBook source passed 16/17; the no-user case throws
TypeError while the v4 Oracle expects PreconditionError. The negative-state
assertions did not introduce another failure. This difference remains open
and is not hidden by weakening the Oracle.

The strengthened borrowBook Oracle passed active-source replay 16/16,
including its newly added reservation boundary cases.

These 29 obligations have assertion-level review, not exhaustive behavioral
equivalence or mutation-adequacy certification.
