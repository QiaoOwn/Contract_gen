!create ctx : OperationContext
!set ctx.sid := 1
!set ctx.rid := 99
!set ctx.reject := true
!set ctx.suggestion := 'ok'
!set ctx.Now := 1786422356
!set ctx.Today := 1786422356
!create o17 : Staff
!set o17.Id := 1
? let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.rid) in let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in Repair.allInstances()->exists(r: Repair|r.Id = ctx.rid) and Staff.allInstances()->exists(s: Staff|s.Id = ctx.sid)
exit
