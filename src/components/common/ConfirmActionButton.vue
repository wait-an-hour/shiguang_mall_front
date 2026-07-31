<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

const props = withDefaults(defineProps<{ text: string; confirmText: string; type?: 'primary' | 'danger' | 'warning' | 'default'; link?: boolean }>(), { type: 'default', link: true })
const emit = defineEmits<{ confirm: [] }>()

async function handleClick() {
  // 状态变更按钮统一走确认框，避免强制下架、冻结账号、审核售后等高影响操作被误触。
  await ElMessageBox.confirm(props.confirmText, '操作确认', { type: props.type === 'danger' ? 'warning' : 'info' })
  emit('confirm')
}
</script>

<template>
  <el-button :type="type === 'default' ? undefined : type" :link="link" @click="handleClick">{{ text }}</el-button>
</template>
