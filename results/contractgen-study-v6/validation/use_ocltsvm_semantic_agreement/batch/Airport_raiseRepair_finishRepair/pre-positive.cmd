!create ctx : OperationContext
!set ctx.id := 1
!set ctx.sid := 1
!set ctx.did := 1
!set ctx.res := 'fixed'
!set ctx.Now := 1786422362
!set ctx.Today := 1786422362
!create o1 : Repair
!create o2 : Staff
!create o3 : Device
!set o1.Id := 1
!set o1.Process := 3
!set o2.Id := 1
!set o2.Role := 3
!set o3.Id := 1
!insert (o1, o3) into Repair_RelatedDevice_Device
!insert (o3, o2) into Device_Contacts_Staff
? let repair : Repair = Repair.allInstances()->any(r: Repair|r.Id = ctx.id) in let staff : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.sid) in let device : Device = Device.allInstances()->any(d: Device|d.Id = ctx.did) in device.Contacts = staff and staff.Role = 3
exit
