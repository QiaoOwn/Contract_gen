!create ctx : OperationContext
!set ctx.id := 1
!set ctx.sid := 1
!set ctx.score := 3
!set ctx.des := 'good'
!set ctx.Now := 1786422359
!set ctx.Today := 1786422359
!create o1 : Repair
!create o2 : Staff
!set o1.Id := 1
!set o1.Close := false
!set o1.Process := 7
!set o2.Id := 1
!set o2.Role := 0
!insert (o1, o2) into Repair_RaiseStaff_Staff
? let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.id) in repair.RaiseStaff = staff and staff.Role = 0 and repair.Process = 7
exit
