# V2 数据修复与实验准入检查

## 结论

主文件仍保留全部 114 条。局部源证据核验通过 106 条，待复核 0 条，缺依据 8 条；尚未完全确认 8 条。
VERIFIED 表示与仓库内参考合约和审计后的场景声明静态一致；其中有固定上游来源的记录还核对了对应 RM2PT 形式规范。它仍不表示独立人工确认、完整测试覆盖或论文发布批准。

已从确认记录导出 106 条无参考答案的输入候选，位于 `data/operations_v2_generation_candidates.jsonl`。这不是 114 条正式实验清单，当前不能直接交给原实验命令。未确认记录没有填充、复制或替换来凑足 114 条。

## 本轮有依据的修复

- 对原 27 条问题记录逐条复核：19 条已消除来源、类型或 oracle 表示问题，8 条因上游形式规范本身仍有歧义而保持 NEEDS_SOURCE。没有补写业务常识。
- 对固定上游 RM2PT 文件进行哈希与 commit 固定；仅在 operation owner 和形式规范能够明确映射时记录上游来源。
- 旧 Jest 中超出合约的数组身份、顺序、额外 frame 条件，以及 String 参数误用数字的断言，被放入独立 V2 oracle 副本修正。历史 Jest 文件保持不变。
- `sendNotificationEmail` 仅作为非空输入并返回 true 的抽象第三方服务 stub；未声称真实发送、送达或外部副作用。

## 当前实验阻碍

1. 冻结上下文与当前服务上下文不一致：114/114。冻结上下文没有 Today 声明的有 114 条，没有 Now 声明的有 114 条。此处是输入版本差异，不等于这些 operation 全部缺少业务语义。
2. 当前服务在 buildOperationInput 中重新构造上下文；仅传 userInput 只能替换需求，不能保留冻结的 model_context。直接跑 Next 后端会改变实验输入，且输入哈希检查无法通过。
3. 当前实验脚本要求 114 条 canonical manifest，以及输入、上下文、提示词和生成配置的哈希字段；候选视图仅 106 条且没有伪造这些字段。实际调用其清单校验器得到的错误已保存在 experiment_readiness.json。
4. 仍有 8 条 source ambiguity；它们不能进入当前候选输入，也不能通过改写 NL 或放宽测试来消除。

## 输入边界

- 主文件的 description_original、description 和所有禁止修改的标识、签名、类型、参数、model_context 均未改变。
- 候选文件的 description 从 operation_intent / preconditions_nl / postconditions_nl 派生，采用当前服务要求的 Operation intent / Preconditions / Postconditions 标题。
- 候选文件只保留明确白名单字段，没有 reference_contract、证据引文、审计结论、oracle_refs 或原始模板描述。
- 不确定记录继续保留在 114 条主文件；候选数量不是最终 benchmark 样本量，更不能与旧 114 条实验结果直接混报。

## 现有测试检查

检查 107 个既有测试文件，共 251 个测试；通过 251，失败 0。总体成功：True。
检查对象是原有 entry.ts 与 Jest 文件，不是用 V2 新需求生成的合约，也不是独立正确性证据。没有修改原 oracle、entry 或历史结果。详情见 existing_jest_check.json / existing_jest_check.log。
独立 V2 oracle 共 14 个文件、30 个测试；通过 30，失败 0。这些文件只校正历史断言与来源合约的表示差异，不是新生成的 ground truth。详情见 v2_oracle_jest_check.json / v2_oracle_jest_check.log。

## 剩余记录与具体补充项

### CoCoME_orderProducts_orderItem (NEEDS_SOURCE)
- Confirm the required session invariant or the operation's behavior when CurrentOrderProduct is absent. The retrieved original specification also lacks this guard. Confirm the upstream subAmount versus local SubAmount adaptation without silently changing the frozen model context.
- 本地参考：`src/rm2pt/project/CoCoME/orderProducts.ts`；测试：`test/CoCoME-CoCoMEOrderProducts-orderItem/index.test.ts`。

### CoCoME_orderProducts_placeOrder (NEEDS_SOURCE)
- Author confirmation is required for the intended total calculation: the original per-entry previous-amount equations differ from the local sum repair. Also confirm whether equal subtotals contribute per entry. No total-calculation requirement or corrected reference is invented.
- Original: one previous-amount equation per entry. Local: previous amount plus summed collected subtotals. These are not equivalent for ordinary multi-entry orders.
- 本地参考：`src/rm2pt/project/CoCoME/orderProducts.ts`；测试：`test/CoCoME-CoCoMEOrderProducts-placeOrder/index.test.ts`。

### CoCoME_processSale_endSale (NEEDS_SOURCE)
- Confirm whether the total counts each sales line or each distinct subtotal value. The original Set/collect formulation and its generated documentation do not independently resolve multiplicity; existing tests use distinct subtotals only.
- 本地参考：`src/rm2pt/project/CoCoME/processSale.ts`；测试：`test/CoCoME-ProcessSaleService-endSale/index.test.ts`。

### CoCoME_processSale_makeCashPayment (NEEDS_SOURCE)
- Provide or confirm the session invariant guaranteeing CurrentStore before payment, or specify failure behavior when it is missing. The retrieved original formal contract has the same missing guard; test setup is not sufficient evidence to invent one.
- 本地参考：`src/rm2pt/project/CoCoME/processSale.ts`；测试：`test/CoCoME-ProcessSaleService-makeCashPayment/index.test.ts`。

### CoCoME_receiveOrderedProduct_receiveOrderedProduct (NEEDS_SOURCE)
- Confirm an order-entry uniqueness invariant or a different intended receipt rule for repeated Item references. The original and local contracts both contain potentially conflicting per-entry equations against one pre-state.
- 本地参考：`src/rm2pt/project/CoCoME/receiveOrderedProduct.ts`；测试：`test/CoCoME-CoCoMESystem-receiveOrderedProduct/index.test.ts`。

### LibraryManagementSystem_countDownSuspensionDay_countDownSuspensionDay (NEEDS_SOURCE)
- The pinned RM2PT specification requires an authoritative clarification of the conditional transition timing: whether SUSPEND, zero fee and zero remaining days are evaluated before or after decrementing the suspension duration.
- 本地参考：`src/rm2pt/project/LibraryManagementSystem/countDownSuspensionDay.ts`；测试：`test/LibraryManagementSystem-LibraryManagementSystemSystem-countDownSuspensionDay/index.test.ts`。

### LibraryManagementSystem_listBookHistory_listOverDueBook (NEEDS_SOURCE)
- The pinned RM2PT specification does not resolve the declared Set(BookCopy) result against potentially repeated LoanedCopy values. A domain uniqueness invariant or an authoritative deduplication rule is required.
- 本地参考：`src/rm2pt/project/LibraryManagementSystem/listBookHistory.ts`；测试：`test/LibraryManagementSystem-listBookHistory-listOverDueBook/index.test.ts`。

### LibraryManagementSystem_listBookHistory_listReservationBook (NEEDS_SOURCE)
- The pinned RM2PT specification does not resolve the declared Set(BookCopy) result against potentially repeated ReservedCopy values. A domain uniqueness invariant or an authoritative deduplication rule is required.
- 本地参考：`src/rm2pt/project/LibraryManagementSystem/listBookHistory.ts`；测试：`test/LibraryManagementSystem-listBookHistory-listReservationBook/index.test.ts`。

## 下一步顺序

1. 对 8 条 NEEDS_SOURCE 取得作者确认、领域不变量或修订后的权威规范；在此之前保持隔离。
2. 由至少一名未参与当前整理的研究者，对 106 条候选的来源映射与原子化 NL 做独立复核并记录签字/分歧处理。
3. 确认 V2 上下文策略。若继续冻结原上下文，应实现独立版本的输入通道并统一各实验组；若升级上下文，必须另建版本、说明变化并重新运行，不能静默替换本主文件。
4. 冻结完整 manifest、评估器和样本清单后再运行新实验。旧 results 不重标为 V2。

## 重现本检查

```powershell
python scripts/prepare_operations_v2_experiment.py --check-existing-jest
```
