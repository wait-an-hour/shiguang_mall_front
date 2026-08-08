# Debug Session: save-product-no-response

## Hypotheses
1. 点击保存后表单校验失败，但 `validate()` 的异常没有被捕获，所以看起来“没有反应”。
2. 保存按钮没有真正触发到 `save()`，例如事件绑定或页面层级遮挡问题。
3. `save()` 进入了请求流程，但 `createMerchantProduct` / `updateMerchantProductContent` 抛错后没有提示用户。
4. 创建页 SKU 为空时被前置条件拦截，但提示没有被看到。
5. 编辑页在更新已有 SKU 时发生异常，导致流程中断。