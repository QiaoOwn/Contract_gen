!create ctx : OperationContext
!set ctx.id := 1
!set ctx.sid := 1
!set ctx.did := 1
!set ctx.res := 'fixed'
!set ctx.Now := 1786422362
!set ctx.Today := 1786422362
!create o5 : Repair
!create o6 : Staff
!create o7 : Staff
!create o8 : Device
!set o5.Id := 1
!set o5.Process := 3
!set o6.Id := 1
!set o6.Role := 3
!set o7.Id := 2
!set o7.Role := 3
!set o8.Id := 1
!insert (o8, o7) into Device_Contacts_Staff
? let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.id) in let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in let device : Device = Device.allInstances()->any(d: Device|d.Id = ctx.did) in device.Contacts = staff and staff.Role = 3
exit
