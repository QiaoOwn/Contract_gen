!create ctx : OperationContext
!set ctx.sid := 1
!set ctx.rid := 1
!set ctx.reject := true
!set ctx.suggestion := 'ok'
!set ctx.Now := 1786422356
!set ctx.Today := 1786422356
!create o1 : Repair
!create o2 : Staff
!set o1.Id := 1
!set o1.Process := 0
!set o2.Id := 1
!set o2.Role := 1
? let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.rid) in let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in Repair.allInstances()->exists(r: Repair|r.Id = ctx.rid) and Staff.allInstances()->exists(s: Staff|s.Id = ctx.sid)
exit
