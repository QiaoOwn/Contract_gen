!create ctx : OperationContext
!set ctx.id := 1
!set ctx.name := 'radar'
!set ctx.location := 'T1'
!set ctx.contactsid := 1
!set ctx.Now := 1786422349
!set ctx.Today := 1786422349
!create o4 : Staff
!create o5 : Device
!set o4.Id := 1
!set o5.Id := 1
!insert (o5, o4) into Device_Contacts_Staff
? let contact : Staff = Staff.allInstances()->any(s: Staff|s.Id = ctx.contactsid) in Device.allInstances()->forAll(d: Device|d.Id<>ctx.id) and Staff.allInstances()->exists(s: Staff|s.Id = ctx.contactsid)
exit
