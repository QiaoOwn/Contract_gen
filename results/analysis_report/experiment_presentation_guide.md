# ContractGen 实验汇报整理

## 1. 汇报目标

本实验评估 ContractGen 在 operation-level OCL contract generation 任务上的有效性，重点回答以下问题：

- **RQ1：Syntax Validity**  
  ContractGen 能否生成符合 OCLTSVM 语法和结构要求的 OCL 合约？
- **RQ2：Execution-Grounded Correctness**  
  生成的合约能否通过 TypeScript/Jest oracle，并正确表达 Operation 的预期行为？
- **RQ3：Architecture and Feedback Ablation**  
  分阶段生成架构与验证反馈分别带来了什么效果？
- **Baseline Comparison**  
  ContractGen 与 PureLLM、CodexPrompt-style 和 PathOCL-style 方法相比表现如何？
- **Differential Validation**  
  OCLTSVM 接受的表达式能否被独立 OCL 工具 USE 识别？

---

## 2. 统一实验设置

主要实验尽量保持以下条件一致：

| 项目 | 设置 |
| --- | --- |
| 数据集 | 114 个 operation requirements |
| 输出目标 | 完整 OCL operation contract |
| 合约结构 | `definition`、`precondition`、`postcondition` |
| 最大预算 | 最多 5 次生成尝试 |
| 语法验证 | OCLTSVM parser |
| 转换验证 | OCL-to-TypeScript generation |
| 编译验证 | TypeScript compilation |
| 行为验证 | Jest execution oracle |
| 主要指标 | Syntax Validity、Execution Accuracy、Repair Success Rate |

统一验证流程如下：

```text
Operation Requirement
        ↓
Contract Generation
        ↓
OCLTSVM Parsing
        ↓
OCL-to-TypeScript Generation
        ↓
TypeScript Compilation
        ↓
Jest Execution
        ↓
Final Syntax / Execution Result
```

---

## 3. RQ1：Syntax Validity

### 研究问题

> ContractGen 能否生成符合 OCLTSVM 语法和结构要求的 OCL 合约？

### 输入内容

每个 Operation 输入主要包含：

- 自然语言需求；
- Operation 名称、参数与返回值类型；
- 所属服务与用例；
- Project Context；
- 实体、属性和关联信息；
- OCL transformation rules；
- 目标输出格式。

### 实验流程

```text
Natural-Language Requirement
        ↓
OCL Generator
        ↓
Generate Definition / Precondition / Postcondition
        ↓
Contract Generator assembles complete contract
        ↓
OCLTSVM Parser
        ↓
Valid / Invalid
```

若解析失败，系统可以根据语法错误进行修复，最多尝试 5 次。

### 使用模型与结果

| 模型 | Valid Count | Syntax Validity |
| --- | ---: | ---: |
| Claude Opus 4.7 | 114/114 | **100.0%** |
| GPT-5.4 | 114/114 | **100.0%** |
| GPT-5.4 Mini | 114/114 | **100.0%** |
| Qwen3 Coder Plus | 93/114 | 81.6% |
| Qwen3 Coder Flash | 82/114 | 71.9% |

### 汇报结论

> ContractGen can achieve perfect syntactic validity with strong models, while the lower results of the Qwen models show that model capability remains influential.

---

## 4. RQ2：Execution-Grounded Correctness

### 研究问题

> 通过语法验证的 OCL 合约是否真正表达了 Operation 的预期行为？

### 设计原因

Parser 通过只能说明合约在语法上可被处理，不能说明其业务语义正确。因此，RQ2 将 OCL 合约转换为可执行 TypeScript，并通过 Jest oracle 验证行为。

### 实验流程

```text
Syntax-valid OCL Contract
        ↓
OCL-to-TypeScript Mapping
        ↓
Generate Executable TypeScript
        ↓
TypeScript Compilation
        ↓
Jest Oracle Execution
        ↓
Pass / Fail
```

Jest oracle 主要检查：

- 满足前置条件的合法输入；
- 不满足前置条件的非法输入；
- Operation 执行后的状态变化；
- 返回值约束；
- 对象集合的增加、删除或更新。

### 实验结果

| 模型 | Pass Count | Execution Accuracy |
| --- | ---: | ---: |
| Claude Opus 4.7 | **70/114** | **61.4%** |
| GPT-5.4 | 60/114 | 52.6% |
| GPT-5.4 Mini | 52/114 | 45.6% |
| Qwen3 Coder Plus | 51/114 | 44.7% |
| Qwen3 Coder Flash | 39/114 | 34.2% |

---

## 5. RQ3-A：Feedback Ablation

### 研究问题

> 具体的验证反馈是否能够帮助 ContractGen 定向修复错误？

### 控制变量

- 相同的 114 个 Operations；
- 相同模型；
- 相同 Project Context；
- 相同 transformation rules；
- 相同输出结构；
- 相同 OCLTSVM、TypeScript 和 Jest 验证流程；
- 相同的最大 5 次尝试预算。

唯一改变是反馈内容。

### Full Feedback

系统向修复阶段提供可获得的验证信息：

- 失败阶段；
- Parser error；
- TypeScript generation error；
- TypeScript compilation error；
- Execution pass/fail result；
- 上一轮失败合约。

模型可以根据错误重新生成或修复合约。

### Generic Feedback

不提供错误位置与具体原因，只提供通用提示，例如：

> The generated contract failed validation. Please regenerate a corrected contract.

该设置用于区分“再次尝试”与“获得具体诊断”的效果。

### No Feedback

后续尝试不接收上一轮的具体诊断信息，不能针对失败原因进行定向修复。

### GPT-5.4 对比

| 设置 | Syntax Validity | Execution Accuracy |
| --- | ---: | ---: |
| Full Feedback | **100.0%** | **52.6%** |
| Generic Feedback | **100.0%** | 48.2% |
| No Feedback | 94.7% | 28.9% |

### 修复能力

| 模型 | 出现中间错误 | 修复成功 | Repair Rate |
| --- | ---: | ---: | ---: |
| Claude Opus 4.7 | 40 | 10 | 25.0% |
| GPT-5.4 | 71 | 31 | 43.7% |
| GPT-5.4 Mini | 58 | 19 | 32.8% |
| Qwen3 Coder Plus | 45 | 22 | **48.9%** |
| Qwen3 Coder Flash | 56 | 23 | 41.1% |

---

## 6. RQ3-B：Single-Agent Architecture Ablation

### 研究问题

> ContractGen 的分阶段生成架构是否能够提高合约生成的可靠性？

### ContractGen

```text
Requirement + Project Context + Rules
        ↓
Staged OCL Generation
        ↓
Generate and assemble Def / Pre / Post
        ↓
OCLTSVM / TypeScript / Jest Validation
```

其特点包括：

- 分阶段生成合约子句；
- 对 Definition、Precondition 和 Postcondition 提供结构约束；
- 由 Contract Generator 组装完整合约；
- 使用统一验证流水线检查结果。

### Single-Agent Full-Feedback

```text
Requirement + Project Context + Rules
        ↓
One LLM Agent generates the complete contract
        ↓
OCLTSVM / TypeScript / Jest Validation
        ↓
Failure result returned to the same agent
        ↓
Regenerate complete contract, up to 5 attempts
```

Single-Agent 不使用：

- Def/Pre/Post 分阶段规划；
- 独立的 Contract assembly；
- 分阶段结构约束。

### GPT-5.4 结果

| 方法 | Syntax Validity | Execution Accuracy | 平均尝试次数 |
| --- | ---: | ---: | ---: |
| ContractGen Full | **114/114（100.0%）** | 60/114（52.6%） | 约 1.05 |
| Single-Agent Full-Feedback | 109/114（95.6%） | **63/114（55.3%）** | 3.18 |

Single-Agent 的具体变化：

- 第一次尝试执行通过：25/114；
- 最终执行通过：63/114；
- 通过后续反馈修复：38 个；
- 最终语法失败：5 个；
- 最终执行失败：46 个。

### 结果解释

- Single-Agent 通过多轮完整重生成取得略高的 Execution Accuracy；
- ContractGen 达到 100% Syntax Validity；
- ContractGen 使用的外部尝试次数更少，结构更稳定；

---

## 7. PureLLM Baseline

### 研究问题

> 不使用 ContractGen 的分阶段生成与项目验证反馈时，LLM 直接生成完整合约的效果如何？

### 流程

```text
Operation Requirement
        ↓
Single LLM Prompt
        ↓
Generate Complete OCL Contract
        ↓
Unified OCLTSVM and Jest Evaluation
```

### 与其他设置的区别

| 方法 | 生成方式 | Project Context/Rules | 验证反馈 |
| --- | --- | ---: | ---: |
| PureLLM | 直接生成完整合约 | 基础或有限 | 无完整项目反馈 |
| Single-Agent Full-Feedback | 直接生成完整合约 | 完整注入 | 有验证结果反馈 |
| ContractGen | 分阶段生成与组装 | 完整注入 | 分阶段验证 |

### GPT-5.4 结果

| 指标 | 结果 |
| --- | ---: |
| Syntax Validity | 107/114（93.9%） |
| Execution Accuracy | 55/114（48.2%） |

---

## 8. CodexPrompt-Style Baseline

### 实验目的

> 测试以传统 Prompt 为中心的 OCL 生成方法能否适用于完整 operation-level contract generation。

CodexPrompt 原方法更偏向语句级或局部 OCL 表达式。适配实验要求模型生成完整 Contract，包括：

- Definition；
- Precondition；
- Postcondition；
- OCLTSVM 所需的 Contract 结构。

### 实验流程

```text
Operation Requirement
        ↓
CodexPrompt-style Prompt
        ↓
Generate Complete Contract
        ↓
OCLTSVM Parsing
        ↓
TypeScript/Jest Evaluation
```

### GPT-5.4 结果

| 指标 | 结果 |
| --- | ---: |
| Syntax Validity | 45/114（39.5%） |
| Execution Accuracy | 1/114（0.9%） |

### 局限性

- 原始任务和本实验任务粒度不同；
- 缺少面向 OCLTSVM 方言的 transformation rules；
- 缺少项目级结构约束；
- 不具备 ContractGen 的分阶段组装流程。

因此应表述为：

> **CodexPrompt-style adapted baseline**

不能声称这是对原论文实验的完全复现。

---

## 9. PathOCL-Style Baseline

### 实验目的

> 测试基于上下文或执行路径提示的生成方法能否直接生成 operation-level OCL contracts。

### 输入内容

- Operation requirement；
- Operation signature；
- 相关模型上下文；
- 路径或状态变化信息；
- PathOCL-style Prompt。

### 实验流程

```text
Requirement + Contextual Path
        ↓
LLM generates complete contract
        ↓
OCLTSVM Syntax Validation
        ↓
TypeScript/Jest Execution Validation
```

### GPT-5.4 结果

| 指标 | 结果 |
| --- | ---: |
| Syntax Validity | 59/114（51.8%） |
| Execution Accuracy | 6/114（5.3%） |

---

## 10. Baseline 综合比较

为减少模型差异，下面统一展示 GPT-5.4 在 114 个 Operations 上的结果。

| 方法 | 主要设计 | Syntax Validity | Execution Accuracy |
| --- | --- | ---: | ---: |
| ContractGen | 分阶段生成 + OCLTSVM 验证 | **100.0%** | **52.6%** |
| PureLLM | LLM 直接生成完整合约 | 93.9% | 48.2% |
| PathOCL-style | 上下文路径驱动 Prompt | 51.8% | 5.3% |
| CodexPrompt-style | 语句级 Prompt 适配完整合约 | 39.5% | 0.9% |

---

## 11. USE Differential Validation

### 研究问题

> OCLTSVM 接受的 OCL 表达式能否被独立标准 OCL 工具识别？

### 输入并非自然语言 Requirement

USE 的输入不是原始的 114 条自然语言需求，而是根据以下内容形成的 `.use` 文件：

- `model_context` 中的类、属性和关联；
- ContractGen 已生成的 OCL 合约；
- 转换后的 Definition 和 Precondition 表达式。

### 实验流程

```text
114 Operation Requirements
        ↓
ContractGen Generated Contracts
        ↓
Convert Project Model and Expressions to .use
        ↓
USE Semantic Load / Type Check
        ↓
Pass / Fail
```

### 检查范围

- 根据 `model_context` 构建 USE class model；
- 将 Definition 和 Precondition 转换为 USE invariants；
- 检查属性访问、标识符、类型和表达式语义；
- Postcondition 作为注释保留；
- Postcondition 的行为正确性仍由 TypeScript/Jest oracle 检查。

### 实验结果

| 指标 | 数量 |
| --- | ---: |
| Total Operations | 114 |
| With Generated Contract | 114 |
| With Precondition Expression | 113 |
| USE Pass | **110** |
| USE Fail | 4 |
| USE Acceptance Rate | **96.5%** |

四个未通过 USE semantic load 的案例包括：

- `CoCoME_orderProducts_orderItem`
- `LibraryManagementSystem_borrowBook_borrowBook`
- `LibraryManagementSystem_listBookHistory_listOverDueBook`
- `LibraryManagementSystem_listBookHistory_listReservationBook`

---

## 12. 各实验之间的逻辑关系

```text
RQ1：合约能否被正确解析？
        ↓
RQ2：合约行为是否符合预期？
        ↓
RQ3-A：反馈是否帮助修复失败？
        ↓
RQ3-B：分阶段生成架构是否有价值？
        ↓
Baselines：是否优于直接生成或 Prompt-style 方法？
        ↓
USE Check：OCLTSVM 结果能否获得独立工具支持？
```
