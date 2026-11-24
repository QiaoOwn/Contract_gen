# Owner adjudications for v4

These are project-owner laboratory requirements approved in chat on 2026-11-03.
They are not claims about unchanged RM2PT source contracts or independent expert signatures.

## Airport_raiseRepair_finishRepair
When the referenced Repair does not exist, reject the operation before applying effects.
Original `airms.remodel` does not state this missing-Repair behavior.

## CoCoME_processSale_enterItem
The entered quantity must not exceed the selected Item's stock at operation entry.
Original `cocome.remodel` requires positive stock but does not state this bound.
