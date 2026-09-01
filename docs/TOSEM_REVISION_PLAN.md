# ContractGen 论文与项目修改计划

核对日期：2026-08-31。状态：完成第一轮证据核对、复现入口修复与修改稿整理；尚未完成新增实验，也尚未修改论文源文件。

## 1. 如何使用这份评审意见

依据用户提供的《总体结论.md》，对照当前仓库与下载目录中的
`Contract_Gen__Validation_Guided_Generation_of_Executable_OCL_Operation_Contracts (2).pdf`（29 页）核查。
评审文档提到的 PDF 文件名与本次可用文件名不同，因此不假定两个版本逐字一致。

文档中的 Reject/Strong Reject 是评审性判断，不是期刊的正式决定；其中建议的实验规模和理论证明也不是已经核实的 TOSEM 硬性条款。我们将其用作风险清单，而不是为了满足结论去调整数据。是否录用不能由本轮修改保证。

本轮原则：保留历史输入、Prompt、测试、运行语义和 v6 结果；不补造数据，不把离线分析写成在线实验，不把内部一致性写成独立语义证明，不自动提交 GitHub 或发布 Zenodo。

## 2. 核查结论

| 问题 | 当前证据 | 处理 |
| --- | --- | --- |
| 78.60% 调用节省能否全部归因于反馈？ | 主实验 122 次，固定五次 PureLLM 570 次；同一 PureLLM 序列早停回放为 139 次。 | 不能。摘要、贡献、RQ1、讨论、结论一起修改归因。 |
| 是否还可以称为“相当准确率”？ | 当前通过数为 104/114 与 103/114；PDF 报告差异不显著。 | 不显著不等于等效或非劣；本轮没有重做显著性检验。 |
| Generic 是否比 No Feedback 好？ | 配对初始失败中分别恢复 1/5 与 2/5；Full 为 5/5。 | 删除普遍递增的解释，将配对证据定位为小规模机制 pilot。 |
| 114 个配对输入是否等于 114 个修复样本？ | 仅 5 个初始候选未通过执行前检查。 | 报告失败发生率 5/114 和条件恢复分母 5，不放大修复样本量。 |
| 是否需要删除整个 USE 实验？ | 完整转换合约编译 105/114；外部前置状态一致 54/55。 | 不需要。保留为转换兼容性和限定范围的一致性证据。 |
| USE 是否验证了后置条件行为？ | 30 个计划后置场景中，独立 USE 决策为 0；OCLTSVM-Jest 内部一致为 28/30。 | 编译与执行分开；新增独立后状态实验，不把 0 个决策写为 100% 一致。 |
| 多 Agent 是不是多个大模型协作？ | `graph.ts` 中一个生成式 OCL 节点，其余为确定性阶段。 | 使用 one generative LLM with staged deterministic validation。 |
| Jest 是否进入修复循环？ | `Test Result` 直接到终点，成功或失败均不返回生成节点。 | 最新 PDF 已明确这一点，保留并统一摘要、图示和算法口径。 |
| 是否是自由自然语言生成？ | 输入有 intent/preconditions/postconditions、签名、模型上下文和生成指导。 | 使用 structured requirements；明确 114 上下文实例、107 操作、106 需求组。 |
| CodexPrompt/PathOCL 是否严格相同输入？ | 文本输出，没有相同的 generation grammar/rules；PathOCL 有路径选择。 | 称为任务迁移对比，不作为独立证明反馈作用的受控消融。 |
| 项目能否按原 README 复算？ | 旧核验入口因不存在的目录失败，版本号也落后。 | 本轮已修复，且限定为“部分关键指标核验”，不声称所有表格都可复算。 |
| 当前是否具备归档完成条件？ | 作者/引用元数据仍为 example；本仓库没有 LaTeX 源文件。 | 不填造作者或 DOI；正式 release 需单独核对。 |

最新版 PDF 已经将 Jest 描述为隐藏终端评估，说明 USE 未执行生成后置条件，也承认部分统计限制。因此应针对仍然过强的归因补强，而非把已经正确的内容全部重写。

## 3. 第一轮已落实

- 修复 `scripts/verify_artifact_tables.py` 的目录、模型、版本与统计口径。
- 核验 9 个保留运行目录，按内部 LLM generation 数计费，不把流记录条数当调用数。
- 加入纯离线 EarlyStop-NoFB 回放，并通过 `--json` 输出 114 个输入各自的停止位置。
- 核查配对初始候选哈希、输入一致性、分支完整性，以及原始分支与汇总的恢复数/调用数。
- 分开显示 USE 编译、外部前置条件、外部后置条件和内部前后状态一致性分母。
- 更新 README、ARTIFACT_README、ARTIFACT_MANIFEST，移除不存在的当前版本实验路径与过度解释。
- 新增 14 个回归测试，覆盖“不能看 Jest 结果决定早停”、缺失/重复记录、预算、错误哈希与无效外部决策。

这些修改不会重新调用模型，不会改变原始实验结论，也没有修复或改动 OCLTSVM 的映射语义。

## 4. 论文第一步怎么改

### 4.1 贡献定位

保留 ContractGen 与 OCLTSVM，但将核心定位收敛为：面向特定可执行合约子集的验证控制流程、可诊断的执行前修复，以及不同验证边界的实证分析。

不要将现有数据概括为“多 Agent 显著提高行为正确率”“完整支持标准 OCL”“已证明语义保持”或“完整 78.60% 节省来自分阶段反馈”。仅通过改措辞也不能消除独立后置条件验证不足的问题。

暂不强制改标题。当前 Validation-Guided 标题已经比 Verification-Driven 更贴近实现；应先确定新实验支持的主张，再决定最终标题。

### 4.2 摘要中的效率段落替换稿

> On 114 operation-context instances, ContractGen with GPT-5.5 attains parser acceptance for 114 instances and execution-grounded success for 104, using 122 model calls. Fixed-five PureLLM sampling attains parser acceptance for 111 instances and execution-grounded success for 103, using 570 calls. Offline replay of the same PureLLM sequences, stopping at the first pre-execution-valid candidate, requires 139 counterfactual calls and preserves these attainment counts. Most of the fixed-budget call difference is therefore explained by stopping on these recorded sequences; the remaining 17-call difference is descriptive rather than an isolated effect of diagnostic feedback. These observations do not establish behavioral equivalence or a general accuracy advantage.

将摘要中的所有旧效率句一起替换，避免新增限定段后仍保留相反的 headline。

### 4.3 RQ1 建议展示

| GPT-5.5 配置 | Parse@5 计数 | Pass@5 计数 | 调用数 | 证据类型 |
| --- | ---: | ---: | ---: | --- |
| PureLLM Fixed-5 | 111/114 | 103/114 | 570 | 已运行 |
| PureLLM EarlyStop-NoFB | 111/114 | 103/114 | 139 | 固定序列离线回放，不是在线新实验 |
| ContractGen Full | 114/114 | 104/114 | 122 | 已运行，但不是与回放共享修复轨迹的因果对照 |

调用差额是 570−122=448；其中 570−139=431 可由本次回放中的早停解释。139−122=17 不应命名为“feedback causal gain”。调用数也不能直接写成 token、金额或耗时节省。

### 4.4 RQ3 替换稿

> The paired pilot shares 114 initial candidates across all treatments, of which five fail pre-execution validation. Full diagnostics recover five of these failures, compared with two under unguided retry and one under generic feedback. This conditional five-case comparison suggests a diagnostic benefit on the observed failures but is too small to establish general recovery effectiveness. The paired Full treatment uses 124 calls, distinct from the 122-call primary run. Jest remains hidden from all repair prompts.

将非配对的 Generic/NoFB 记录保留为辅助描述，不能和这 5 个共享失败合并当作同一配对实验。四模型自然发生的修复轨迹同样不能当作额外的受控配对样本。

### 4.5 USE 与语义边界替换稿

> USE compiles 105 of 114 converted complete contracts, providing evidence about syntax and type compatibility after the documented adaptations. In the shared-state study, USE and OCLTSVM agree on 54 of 55 decidable precondition scenarios out of 60 planned scenarios. No independent USE postcondition decisions are available in this study. The separate OCLTSVM-Jest comparison agrees on 57 of 57 recorded precondition pairs and 28 of 30 postcondition pairs. This latter result is an internal consistency check, not independent validation of postcondition semantics or a general translation-correctness guarantee.

在主文保留完整计划分母和不可判定原因。编译成功不叫 operation execution success；USE 转换后的表达式也不能无条件称为与原始生成合约等价。

### 4.6 Discussion、Threats 和 Conclusion

- RQ1 的统计解释避免用 comparable/equivalent 暗示已完成等效检验。
- 单次托管模型运行、重复需求上下文、同一 RM2PT 来源以及作者构造场景都列为有效性限制。
- 不将 Pass@5 解释为“自然语言需求完整满足”，它只是当前场景 oracle 下的成功。
- 限定后置条件 effect witness 与 predicate checker 的意义：共享同一错误假设时可能一起通过。
- 相关工作中的 PAT-Agent、Event-B Agent、SpecGen、Fun2spec 先核对原文和任务边界，再引用；本轮未核实这些引用，不编造对比结论。
- 将重复流程图压缩为总流程、effect/check 语义边界图和一个算法；图中只有 eligible pre-execution diagnostics 返回生成节点，Jest 到终点。
- 未独立建立训练/检索错误语料时，将 Error Dataset 改成实际实现对应的 diagnostic records 或 error taxonomy。

上述英文是可替换段落草稿，不是已写入或编译的论文正文。待提供 LaTeX 源文件后，再同步摘要、贡献、表注、算法、讨论和结论，并核查交叉引用。

## 5. P0-A：先隔离停止规则与反馈

目标：区分“什么时候停止”与“失败后收到什么内容”，而不是再次拿固定五次采样直接证明诊断机制节省成本。

| 处理 | 下一轮输入 | 停止条件 | 地位 |
| --- | --- | --- | --- |
| Fixed-5 NoFB | 独立完整生成，不给诊断 | 固定五次 | 固定预算参照 |
| EarlyStop-Parse NoFB | 无反馈重新生成 | 首次 parser 接受 | 检查停止边界影响 |
| EarlyStop-PreExec NoFB | 无反馈重新生成 | 首次 parser+translation+TS 通过 | 与反馈组的公平停止规则 |
| EarlyStop-PreExec Generic | 失败候选加固定通用失败提示 | 同上 | 反馈内容对照 |
| EarlyStop-PreExec Full | 失败候选加阶段和具体诊断 | 同上 | 被检验处理 |

1. 每个 operation、model、repetition 生成一个共享初始候选，冻结内容与哈希，所有处理从同一候选开始。之后各处理真实在线调用模型，不把历史后续候选当成收到反馈后的输出。
2. 保持相同签名、上下文、规则、schema、模型配置、验证器版本、最多五次生成预算。首次共享生成计入每个处理的逻辑预算；同时单独记录实际 API 账单，避免重复计费含义混淆。
3. Generic 与 Full 使用同样的失败候选承载格式，仅诊断内容不同；无反馈独立重采样的定义必须明确。Jest 对所有主处理保持隐藏，不据其结果继续生成或挑选候选。
4. 按预先确定的操作/重复块随机化处理执行顺序，减小服务时间漂移影响。记录 provider、模型精确标识、参数、时间、可用的 seed、请求/回复哈希、token usage、生成及验证耗时。
5. 同时报告初始失败率、失败条件下的恢复率、所有输入上的最终成功率、生成数、token 和耗时。不要只报告修好了多少而隐藏有多少输入进入修复。
6. 基础设施异常单列，保留日志；按预设规则重跑，不因结果不好临时删除。超时、API 错误与语法/翻译错误不能混为一种失败。
7. 先定最小有意义效应、主比较和预算，再做样本量/功效规划。当前失败率 5/114 很低，应根据预期失败数规划重复次数；不能保证简单追加一轮就足够。固定重复数或预先规定的规则后执行，不能跑到显著为止。
8. 114 上下文实例并非完全独立；按需求组进行配对聚类重采样并报告区间，另外报告实例级原始计数。若要声称非劣，先定义有实际意义的非劣界值，再做对应设计，不能看到结果后倒推界值。

人工注入的 parser/TS 故障可作为机制压力测试，但必须与自然失败分开报告。允许看到 Jest 的 oracle-guided 处理只能是单独标注的上界实验，不能混入无泄漏的主比较。

目前 `run_paired_feedback_ablation.py` 已有共享初始候选机制，可作为实现基础；尚不能声称它已完成上述五处理、多重复、成本完整记录的设计。

## 6. P0-B：独立后置条件验证与映射边界

目标：验证相同合约在同一 pre/post-state 上的解释是否一致，不只是重新编译更多 `.use` 文件。

1. 冻结选中的真实生成合约、模型、参数、前状态、后状态、result 和对象身份映射。保存源合约到 USE 表达的逐条转换说明。
2. 先定义可直接比较的子集；时间、对象新建、集合类型或状态表示无法忠实转换时标记 unsupported，不用替代表达式掩盖差异。
3. 在 USE 的可用机制中先做一个真正的后置条件微型验证，确认工具是否能对指定前后状态给出独立判定。`oclIsNew`、`@pre` 与 result 的可执行支持必须实测，不假定编译通过即可使用。
4. 若 USE 接口无法覆盖目标特性，再评估 Eclipse OCL 或明确限定的独立参考判定器。不能把两个入口调用同一 TypeScript helper 称为独立后端。
5. 对每个支持的构造至少准备满足后条件的状态和只违反一项义务的状态。后状态由独立 fixture/oracle 规定，不只使用 OCLTSVM 自己生成的“正确状态”。
6. 特别覆盖重复元素、Set/Bag、空集合、未定义导航、别名、冲突赋值、分支选择、未修改字段、对象新建及集合插入/删除。
7. 输出每例的 support status、外部判定、OCLTSVM 判定、expected 判定、错误/超时及原始日志。报告计划、可判定、一致、分歧四种计数。

方法节需增加映射规则登记表：源构造、目标效果、纯检查谓词、类型/状态前提、支持范围、反例和测试位置。对 alias、frame、求值顺序和矛盾赋值没有建立保证时明确标为未证明。不要直接补一个没有论证的 soundness theorem。

发现实际映射缺陷时建立独立回归用例，再版本化修复。新后端验证结果存入新研究配置，不能覆盖旧 v6 记录或让旧表格看起来像由新语义生成。

## 7. P0-C：Oracle 与数据泛化

- 对现有 Jest 场景做 mutation analysis：关系符反转、边界数值改变、遗漏字段更新、错误返回值、集合多/少一个元素等。突变发生在候选实现/合约，不通过修改 oracle 使其符合候选。
- 对每个突变报告 killed/survived/equivalent/invalid/timeout；只分析可执行非等价突变的检测率，同时保留全部原始类别数量。
- 新增负例与边界 fixture 必须从需求推导，不能为消除当前失败而定制。修复有误的 oracle 时给出理由并版本化重评所有受影响方法。
- 选择明确非 RM2PT 来源的外部系统并先冻结数据及许可；不把同来源重命名后的案例叫外部验证。
- 需要人工需求一致性评估时，由独立评估者使用预定义量表，盲化方法标签，报告分歧处理和一致性；不能填写未开展的专家评估。

## 8. 下一阶段顺序与交付物

| 顺序 | 交付物 | 完成条件 |
| --- | --- | --- |
| 1 | 论文源文件修订 | 获取 LaTeX/Word 源，替换第 4 节草稿对应段落并编译核查；现 PDF 不被覆盖。 |
| 2 | 停止规则/反馈在线实验脚本 | 五处理协议、共享初始候选、日志隔离、成本记录、单元测试；先少量 smoke，后按冻结计划正式运行。 |
| 3 | 独立后置状态微型实验 | 一个真实合约、正反状态、外部真值、无共用判定 helper；确认方法有效再扩展。 |
| 4 | 语义边界与 mutation/external 数据 | 支持表、分歧案例、突变结果及新的外部基准；保留不支持项。 |
| 5 | 全论文数字可追溯 | 表格/图/区间/检验逐项映射到脚本、配置与原始记录；当前只完成关键计数核验。 |
| 6 | GitHub/Zenodo 冻结 | 作者与许可确认、真实引用元数据、清洁复现、版本标签和真实 DOI；单独执行发布。 |

可立即使用的只读核验命令：

```powershell
python scripts/verify_artifact_tables.py
python scripts/verify_artifact_tables.py --json
python -m unittest scripts.test_verify_artifact_tables -v
```

执行上述命令不代表已完成新实验。不要再次运行 114 个 USE 编译案例就宣称补足了独立后置条件证据，也不要为了获得有利结论而更改历史通过数。
