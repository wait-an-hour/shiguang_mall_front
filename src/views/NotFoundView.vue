<template><main class="result-page"><el-result icon="info" title="404 页面不存在" sub-title="请检查访问路径是否正确。"><template #extra><router-link to="/admin"><el-button type="primary">返回后台首页</el-button></router-link></template></el-result></main></template>
<style scoped lang="scss">.result-page{display:grid;min-height:100vh;place-items:center;background:var(--sg-page-bg);}</style>
