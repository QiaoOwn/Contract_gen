!create ctx : OperationContext
!set ctx.id := 99
!set ctx.Now := 1786422322
!set ctx.Today := 1786422322
? let productCatalog : ProductCatalog = ProductCatalog.allInstances()->any(candidate: ProductCatalog|candidate.Id = ctx.id) in productCatalog.oclIsUndefined() = false
exit
