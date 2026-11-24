# v4 Oracle semantic audit: Airport and Library creation

Scope: all 27 Airport obligations and 13 Library creation/reservation obligations below.
Each judgment compares the frozen v4 requirement with a selected Jest
assertion, not merely a test title. Historical RM2PT inputs and historical
Oracle files were not edited. New tests are v4-only and manifest-bound.

| Obligation | Selected test evidence | Judgment |
| --- | --- | --- |
| createDevice/P1 | Rejects an existing identifier; repository retains its member | Covered |
| createDevice/P2 | Rejects an unknown Staff contact; no Device is inserted | Covered |
| createDevice/Q1 | Exactly one new Device has the supplied ID, name and location | Covered |
| createDevice/Q2 | The new Device is stored and Contacts has the selected Staff identity | Covered |
| createDevice/Q3 | Successful invocation returns true | Covered |
| createStaff/P1 | Duplicate staff ID is rejected with repository unchanged | Covered |
| createStaff/Q1 | Exactly one new Staff stores ID, name, password, phone and role | Covered |
| createStaff/Q2 | When boss ID resolves, new Staff.Boss is the existing Staff instance | Covered |
| createStaff/Q3 | Both success paths return true | Covered |
| approve/P1 | Missing Repair is rejected without ApprovalHistory creation | Covered |
| approve/P2 | Missing Staff is rejected without history or process update | Covered |
| approve/Q1 | Every decision path creates one stored history linked through Repair.History, with decision and suggestion | Covered |
| approve/Q2 | Tests check 0->1, 1->2 and 2->3 transitions for roles 1, 2 and 3 | Covered |
| approve/Q3 | False decision sets Process to 5 | Covered |
| approve/Q4 | Returned object is the stored, linked ApprovalHistory instance | Covered |
| finishRepair/P1 | A Device assigned to another Staff is rejected with process unchanged | Covered |
| finishRepair/P2 | A non-Worker Staff is rejected with process unchanged | Covered |
| finishRepair/P3 | Missing Repair is rejected; laboratory-adjudicated v4 rule, not active RM2PT source precondition | Covered for v4 only |
| finishRepair/Q1 | Successful execution sets Process to 7 | Covered |
| finishRepair/Q2 | Successful execution returns true | Covered |
| feedback/P1 | A different Staff is rejected without score, closure or process change | Covered |
| feedback/P2 | A non-GroundStaff raiser is rejected without score, closure or process change | Covered |
| feedback/P3 | A Repair not at stage 7 is rejected without score, closure or process change | Covered |
| feedback/Q1 | Both high and low branches assert the stored score | Covered |
| feedback/Q2 | Boundary score 3 and score 4 both close the Repair | Covered |
| feedback/Q3 | Score 2 leaves closure false, records Description, and resets Process to 0 | Covered |
| feedback/Q4 | Both successful branches return true | Covered |
| createBook/P1 | Duplicate call number is rejected without adding or replacing a Book | Covered |
| createBook/Q1 | Exactly one new Book contains all eight supplied fields | Covered |
| createBook/Q2 | Book is stored and operation returns true | Covered |
| addBookCopy/P1 | Missing Book is rejected without creating a copy | Covered |
| addBookCopy/P2 | Barcode already linked to selected Book is rejected even without repository entry | Covered |
| addBookCopy/Q1 | Exactly one new copy has barcode, location, AVAILABLE status and unreserved flag | Covered |
| addBookCopy/Q2 | New copy belongs to selected Book, is linked and stored; CopyNum increases by one | Covered |
| addBookCopy/Q3 | Successful invocation returns true | Covered |
| makeReservation/P1 | Missing User and missing BookCopy are rejected without storing a reservation | Covered |
| makeReservation/P2 | Available copy or already-reserved flag is rejected without storage or flag change | Covered |
| makeReservation/Q1 | Exactly one new open Reserve has today's date and links the selected User and BookCopy | Covered |
| makeReservation/Q2 | The new reservation is stored and the copy's reserved flag becomes true | Covered |
| makeReservation/Q3 | Successful invocation returns true | Covered |

Source-candidate replay for the seven newly strengthened operations passed:
createDevice 5/5, createStaff 3/3, approve 6/6, feedback 6/6,
createBook 2/2, addBookCopy 5/5, makeReservation 6/6. The existing finishRepair suite remains
the v4 laboratory clarification case; its missing-Repair check intentionally
rejects behavior left undefined by the active RM2PT source contract.

These finite tests establish explicit assertion support for the listed
obligations, not completeness over all possible implementations. The other
339 obligations still require individual semantic review and fault controls.
