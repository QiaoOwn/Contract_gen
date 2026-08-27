!create ctx : OperationContext
!set ctx.id := 1
!set ctx.Now := 1786422322
!set ctx.Today := 1786422322
!create o1 : ProductCatalog
!set o1.Id := 1
!set o1.Name := 'test'
? let productCatalog : ProductCatalog = ProductCatalog.allInstances()->any(candidate: ProductCatalog|candidate.Id = ctx.id) in productCatalog.oclIsUndefined() = false
exit
