# hanaworlds-building-exterior-painter · 插件级验收

真实运行时：**fixture + 存根模型**；真模型（gpt-5.6-luna 经宿主附件路径）可选，CI 默认不调。
Painter 只产出 BUILD/V2，不写世界。证据上限：`FIXTURE`（真模型 job 为 `REAL_RUNTIME`）。

| ID | 验收条目 | 可见结果 | 怎么跑 | 证据上限 |
| --- | --- | --- | --- | --- |
| EP-01 | 固定图文输入产出合法 BUILD/V2 | 存根模型给出固定回答时，输出通过 BUILD/V2 schema，并能被 vendored Brush 编译出与 golden 相同的 operations | `npm test`（painter / region 用例） | FIXTURE |
| EP-02 | 缺图时返回「需要图片」而不是猜 | 只有文字、没有图片绑定时返回类型化 `IMAGE_REQUIRED` 类错误，不产出 BUILD，不调用模型 | `npm test`（text-only 用例） | FIXTURE |
| EP-03 | 区域事实不匹配时拒绝 | 传入的 REGION_INSPECTED 事实与 Frame/digest 不一致 → `TARGET_FACTS_STALE`；Interior 请求带区域事实 → `TARGET_REQUIRED`；无 BUILD | `npm test`（INV-PAINTER-REGION-MISMATCH、INV-INTERIOR-ON-REGION） | FIXTURE |
| EP-04 | 公开错误不泄露输入 | 所有错误响应通过公开响应合约，且不包含用户文字、图片字节或路径 | `npm test`（public-errors 用例） | FIXTURE |
| EP-05 | 一个方块的 fixture 输出（竖切用） | 固定 fixture「放一个方块」产出单格 BUILD/V2 并通过 Brush 编译 | `npm test`（single-cell fixture） | FIXTURE |
