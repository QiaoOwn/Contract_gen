!create ctx : OperationContext
!set ctx.id := 1
!set ctx.sid := 2
!set ctx.score := 3
!set ctx.des := 'good'
!set ctx.Now := 1786422359
!set ctx.Today := 1786422359
!create o7 : Repair
!create o8 : Staff
!create o9 : Staff
!set o7.Id := 1
!set o7.Process := 7
!set o8.Id := 1
!set o8.Role := 0
!set o9.Id := 2
!set o9.Role := 0
!insert (o7, o8) into Repair_RaiseStaff_Staff
? let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.id) in repair.RaiseStaff = staff and staff.Role = 0 and repair.Process = 7
exit
