# Debug Session: after-sale-refund-500

Status: [OPEN]

## Symptom

管理员端处理售后申诉，选择同意仅退款后返回 `INTERNAL_ERROR` / `服务端处理失败`。

Latest requestId: `53091870-dea3-4acb-acbb-3b3c0a0c87b9`
Latest timestamp: `2026-08-13T14:30:25.722929364+08:00`

## Hypotheses

1. `refundNo` 未生成即将售后更新为 `REFUNDING/PROCESSING`，触发数据库约束。
2. 买家钱包不存在或状态异常。
3. 商家结算余额不足或冲回流程异常。
4. 订单、订单明细或库存数据为空或不一致。
5. 幂等键对应请求状态异常，导致裁决事务重复或回放失败。

## Evidence

待收集运行时日志。

## Changes

尚未修改业务逻辑。
