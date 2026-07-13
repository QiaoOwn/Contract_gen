from pathlib import Path


OUT = Path("results/oclvm_sanity_check")
MODEL_DIR = OUT / "use_models"
CMD_DIR = OUT / "use_cmds"


SAMPLES = {
    "01_Airport_manageUser_createStaff": (
        r"""model AirportCreateStaffSanity

class Staff
attributes
  Id : Integer
  Name : String
  Password : String
  Phone : String
  Role : Integer
end

association StaffBoss between
  Staff[*] role Subordinates
  Staff[0..1] role Boss
end

constraints

context Staff
  inv CreateStaffPreconditionSanity:
    let oldStaff : Staff = Staff.allInstances()->any(s | s.Id = 100) in
    let boss : Staff = Staff.allInstances()->any(b | b.Id = 1) in
    let hasBoss : Boolean = if boss.oclIsUndefined() = true then false else true endif in
      oldStaff.oclIsUndefined() = true and (1 <= 0 or hasBoss = true)
""",
        r"""!create boss : Staff
!set boss.Id := 1
!set boss.Name := 'Alice'
!set boss.Password := 'pw'
!set boss.Phone := '10086'
!set boss.Role := 1
check
""",
    ),
    "02_Airport_raiseRepair_approve": (
        r"""model AirportApproveRepairSanity

class Staff
attributes
  Id : Integer
  Role : Integer
end

class Repair
attributes
  Id : Integer
  Process : Integer
  Result : Boolean
end

class ApprovalHistory
attributes
  StaffId : Integer
  Reject : Boolean
  Suggestion : String
end

association RepairHistory between
  Repair[1] role Repair
  ApprovalHistory[*] role History
end

constraints

context Repair
  inv ApprovePreconditionSanity:
    let repair : Repair = Repair.allInstances()->any(r | r.Id = 1) in
    let staff : Staff = Staff.allInstances()->any(s | s.Id = 10) in
    let nextProcess : Integer = if false = false then 1 else 0 endif in
      repair.oclIsUndefined() = false and staff.oclIsUndefined() = false and nextProcess = 1
""",
        r"""!create staff : Staff
!set staff.Id := 10
!set staff.Role := 2
!create repair : Repair
!set repair.Id := 1
!set repair.Process := 0
!set repair.Result := false
check
""",
    ),
    "04_Airport_raiseRepair_finishRepair": (
        r"""model AirportFinishRepairSanity

class Staff
attributes
  Id : Integer
  Role : Integer
end

class Device
attributes
  Id : Integer
end

class Repair
attributes
  Id : Integer
  Process : Integer
  Result : Boolean
end

association DeviceContacts between
  Device[*] role Devices
  Staff[1] role Contacts
end

association RepairRelatedDevice between
  Repair[*] role Repairs
  Device[1] role RelatedDevice
end

constraints

context Repair
  inv FinishRepairPreconditionSanity:
    let repair : Repair = Repair.allInstances()->any(r | r.Id = 1) in
    let staff : Staff = Staff.allInstances()->any(s | s.Id = 3) in
    let device : Device = Device.allInstances()->any(d | d.Id = 20) in
      repair.oclIsUndefined() = false and staff.oclIsUndefined() = false and device.oclIsUndefined() = false
      and device.Contacts = staff and staff.Role = 3 and repair.RelatedDevice = device
""",
        r"""!create staff : Staff
!set staff.Id := 3
!set staff.Role := 3
!create device : Device
!set device.Id := 20
!create repair : Repair
!set repair.Id := 1
!set repair.Process := 1
!set repair.Result := false
!insert (device, staff) into DeviceContacts
!insert (repair, device) into RepairRelatedDevice
check
""",
    ),
    "06_AutomatedTellerMachine_manageBankCard_modifyBankCard": (
        r"""model ATMModifyBankCardSanity

class BankCard
attributes
  CardID : Integer
  Password : String
  Balance : Real
  Valid : Boolean
end

constraints

context BankCard
  inv ModifyBankCardPreconditionSanity:
    let bankCard : BankCard = BankCard.allInstances()->any(b | b.CardID = 100) in
      bankCard.oclIsUndefined() = false and 'newpass'.oclIsUndefined() = false
""",
        r"""!create card : BankCard
!set card.CardID := 100
!set card.Password := 'oldpass'
!set card.Balance := 50.0
!set card.Valid := true
check
""",
    ),
    "07_AutomatedTellerMachine_manageUser_createUser": (
        r"""model ATMCreateUserSanity

class User
attributes
  UserID : Integer
  Name : String
  Address : String
end

constraints

context User
  inv CreateUserPreconditionSanity:
    let oldUser : User = User.allInstances()->any(u | u.UserID = 100) in
      oldUser.oclIsUndefined() = true and 'Alice'.oclIsUndefined() = false and 'Road'.oclIsUndefined() = false
""",
        r"""!create user : User
!set user.UserID := 99
!set user.Name := 'Existing'
!set user.Address := 'Old Road'
check
""",
    ),
    "08_AutomatedTellerMachine_manageUser_modifyUser": (
        r"""model ATMModifyUserSanity

class User
attributes
  UserID : Integer
  Name : String
  Address : String
end

constraints

context User
  inv ModifyUserPreconditionSanity:
    let user : User = User.allInstances()->any(u | u.UserID = 100) in
      user.oclIsUndefined() = false and 'Bob'.oclIsUndefined() = false and 'New Road'.oclIsUndefined() = false
""",
        r"""!create user : User
!set user.UserID := 100
!set user.Name := 'Bob'
!set user.Address := 'Old Road'
check
""",
    ),
    "09_CoCoME_processSale_enterItem": (
        r"""model CoCoMEEnterItemSanity

class ProcessSaleService
end

class Sale
attributes
  IsComplete : Boolean
  IsReadytoPay : Boolean
  Amount : Real
end

class Item
attributes
  Barcode : Integer
  SalesPrice : Real
end

class SalesLineItem
attributes
  Quantity : Integer
  Subamount : Real
end

association ServiceCurrentSale between
  ProcessSaleService[1] role Service
  Sale[0..1] role CurrentSale
end

association SaleContainedSalesLine between
  Sale[1] role BelongedSale
  SalesLineItem[*] role ContainedSalesLine
end

constraints

context ProcessSaleService
  inv EnterItemPreconditionSanity:
    let currentSale : Sale = self.CurrentSale in
    let item : Item = Item.allInstances()->any(i | i.Barcode = 100) in
    let subAmount : Real = item.SalesPrice * 2 in
      currentSale.oclIsUndefined() = false and currentSale.IsComplete = false
      and item.oclIsUndefined() = false and 2 > 0 and subAmount = 20.0
""",
        r"""!create service : ProcessSaleService
!create sale : Sale
!set sale.IsComplete := false
!set sale.IsReadytoPay := false
!set sale.Amount := 0.0
!create item : Item
!set item.Barcode := 100
!set item.SalesPrice := 10.0
!insert (service, sale) into ServiceCurrentSale
check
""",
    ),
    "10_CoCoME_orderProducts_orderItem": (
        r"""model CoCoMEOrderItemSanity

enum OrderStatus { NEW, SUBMITTED }

class OrderProduct
attributes
  OrderStatus : OrderStatus
end

class Item
attributes
  Barcode : Integer
  OrderPrice : Real
end

class OrderEntry
attributes
  Quantity : Integer
  Subamount : Real
end

association OrderProductContainedEntries between
  OrderProduct[1] role BelongedOrder
  OrderEntry[*] role ContainedEntries
end

constraints

context OrderProduct
  inv OrderItemPreconditionSanity:
    let currentOrderProduct : OrderProduct = OrderProduct.allInstances()->any(o | o.OrderStatus = #NEW) in
    let item : Item = Item.allInstances()->any(i | i.Barcode = 100) in
    let subAmount : Real = item.OrderPrice * 3 in
      currentOrderProduct.oclIsUndefined() = false and item.oclIsUndefined() = false
      and 3 > 0 and currentOrderProduct.OrderStatus = #NEW and subAmount = 21.0
""",
        r"""!create order : OrderProduct
!set order.OrderStatus := #NEW
!create item : Item
!set item.Barcode := 100
!set item.OrderPrice := 7.0
check
""",
    ),
    "12_CoCoME_manageItem_modifyItem": (
        r"""model CoCoMEModifyItemSanity

class Item
attributes
  Barcode : Integer
  Name : String
  SalesPrice : Real
  OrderPrice : Real
  StockNumber : Integer
end

constraints

context Item
  inv ModifyItemPreconditionSanity:
    let item : Item = Item.allInstances()->any(i | i.Barcode = 100) in
      item.oclIsUndefined() = false and Item.allInstances()->includes(item)
""",
        r"""!create item : Item
!set item.Barcode := 100
!set item.Name := 'Milk'
!set item.SalesPrice := 9.0
!set item.OrderPrice := 7.0
!set item.StockNumber := 5
check
""",
    ),
    "13_LibraryManagementSystem_manageUser_createUser": (
        r"""model LibraryCreateUserSanity

enum Sex { MALE, FEMALE }
enum BorrowStatus { NORMAL, SUSPEND }

class User
attributes
  UserID : String
  Name : String
  Address : String
  UserSex : Sex
  Status : BorrowStatus
end

constraints

context User
  inv CreateUserPreconditionSanity:
    let oldUser : User = User.allInstances()->any(u | u.UserID = 'u100') in
      oldUser.oclIsUndefined() = true and 'u100'.size() > 0 and 'Alice'.size() > 0 and 'Road'.size() > 0
""",
        r"""!create user : User
!set user.UserID := 'u099'
!set user.Name := 'Existing'
!set user.Address := 'Old Road'
!set user.UserSex := #FEMALE
!set user.Status := #NORMAL
check
""",
    ),
    "14_LibraryManagementSystem_manageBook_createBook": (
        r"""model LibraryCreateBookSanity

class Book
attributes
  CallNo : String
  ISBN : String
  Title : String
  Author : String
  Press : String
  CopyNum : Integer
end

constraints

context Book
  inv CreateBookPreconditionSanity:
    let oldBook : Book = Book.allInstances()->any(b | b.CallNo = 'C100') in
      oldBook.oclIsUndefined() = true and 'C100'.size() > 0 and 'ISBN'.size() > 0
      and 'Title'.size() > 0 and 'Author'.size() > 0 and 'Press'.size() > 0 and 2 > 0
""",
        r"""!create book : Book
!set book.CallNo := 'C099'
!set book.ISBN := 'ISBN-099'
!set book.Title := 'Existing Book'
!set book.Author := 'Author'
!set book.Press := 'Press'
!set book.CopyNum := 1
check
""",
    ),
    "15_LibraryManagementSystem_recommendBook_recommendBook": (
        r"""model LibraryRecommendBookSanity

class User
attributes
  UserID : String
end

class Book
attributes
  CallNo : String
  Title : String
  Author : String
  Press : String
end

class RecommendBook
attributes
  CallNo : String
  Title : String
  Author : String
  Press : String
end

association UserRecommendedBooks between
  User[1] role RecommendUser
  RecommendBook[*] role RecommendedBooks
end

constraints

context User
  inv RecommendBookPreconditionSanity:
    let user : User = User.allInstances()->any(u | u.UserID = 'u100') in
    let books : Set(Book) = Book.allInstances()->select(b | b.CallNo = 'C100')->asSet() in
      user.oclIsUndefined() = false and User.allInstances()->includes(user)
      and books->isEmpty() = true and 'C100'.size() > 0 and 'Title'.size() > 0
""",
        r"""!create user : User
!set user.UserID := 'u100'
!create book : Book
!set book.CallNo := 'C099'
!set book.Title := 'Existing Book'
!set book.Author := 'Author'
!set book.Press := 'Press'
check
""",
    ),
    "18_LoanProcessingSystem_evaluateLoanRequest_addLoanTerm": (
        r"""model LoanAddLoanTermSanity

enum LoanRequestStatus { NEW, READYFORREVIEW, APPROVED }

class LoanRequest
attributes
  Id : Integer
  Status : LoanRequestStatus
end

class LoanTerm
attributes
  ItemID : Integer
end

association LoanRequestAttachedTerms between
  LoanRequest[0..1] role LoanRequest
  LoanTerm[*] role AttachedLoanTerms
end

constraints

context LoanRequest
  inv AddLoanTermPreconditionSanity:
    let currentLoanRequest : LoanRequest = LoanRequest.allInstances()->any(l | l.Id = 1 and l.Status = #READYFORREVIEW) in
    let loanTerm : LoanTerm = LoanTerm.allInstances()->any(t | t.ItemID = 10) in
      currentLoanRequest.oclIsUndefined() = false and loanTerm.oclIsUndefined() = false
      and currentLoanRequest.AttachedLoanTerms->includes(loanTerm) = false
""",
        r"""!create request : LoanRequest
!set request.Id := 1
!set request.Status := #READYFORREVIEW
!create term : LoanTerm
!set term.ItemID := 10
check
""",
    ),
    "19_LoanProcessingSystem_evaluateLoanRequest_listAvaiableLoanTerm": (
        r"""model LoanListAvailableLoanTermSanity

enum LoanRequestStatus { NEW, READYFORREVIEW, APPROVED }

class LoanRequest
attributes
  Id : Integer
  Status : LoanRequestStatus
end

class LoanTerm
attributes
  ItemID : Integer
end

association LoanRequestAttachedTerms between
  LoanRequest[1] role LoanRequest
  LoanTerm[*] role AttachedLoanTerms
end

constraints

context LoanRequest
  inv ListAvailableLoanTermPreconditionSanity:
    let currentLoanRequest : LoanRequest = LoanRequest.allInstances()->any(l | l.Id = 1 and l.Status = #READYFORREVIEW) in
    let loanTerms : Set(LoanTerm) = currentLoanRequest.AttachedLoanTerms->asSet() in
      currentLoanRequest.oclIsUndefined() = false and loanTerms->isEmpty() = false
""",
        r"""!create request : LoanRequest
!set request.Id := 1
!set request.Status := #READYFORREVIEW
!create term : LoanTerm
!set term.ItemID := 10
!insert (request, term) into LoanRequestAttachedTerms
check
""",
    ),
    "20_LoanProcessingSystem_evaluateLoanRequest_reviewCheckingAccount": (
        r"""model LoanReviewCheckingAccountSanity

enum LoanRequestStatus { NEW, READYFORREVIEW, APPROVED }

class LoanRequest
attributes
  Id : Integer
  Status : LoanRequestStatus
end

class CheckingAccount
attributes
  AccountID : Integer
  Balance : Real
end

association LoanRequestCheckingAccount between
  LoanRequest[*] role LoanRequests
  CheckingAccount[1] role RequestedCAHistory
end

constraints

context LoanRequest
  inv ReviewCheckingAccountPreconditionSanity:
    let currentLoanRequest : LoanRequest = LoanRequest.allInstances()->any(l | l.Id = 1 and l.Status = #READYFORREVIEW) in
    let checkingAccount : CheckingAccount = currentLoanRequest.RequestedCAHistory in
      currentLoanRequest.oclIsUndefined() = false and checkingAccount.oclIsUndefined() = false
      and CheckingAccount.allInstances()->includes(checkingAccount)
""",
        r"""!create request : LoanRequest
!set request.Id := 1
!set request.Status := #READYFORREVIEW
!create account : CheckingAccount
!set account.AccountID := 100
!set account.Balance := 500.0
!insert (request, account) into LoanRequestCheckingAccount
check
""",
    ),
}


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    CMD_DIR.mkdir(parents=True, exist_ok=True)
    for name, (model, cmd) in SAMPLES.items():
        (MODEL_DIR / f"{name}.use").write_text(model.rstrip() + "\n", encoding="utf-8")
        (CMD_DIR / f"{name}.cmd").write_text(cmd.rstrip() + "\n", encoding="utf-8")
    print(f"Generated {len(SAMPLES)} USE sanity samples in {OUT}")


if __name__ == "__main__":
    main()
