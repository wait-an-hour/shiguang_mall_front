<template><main class="result-page"><el-result icon="warning" title="403 无权访问" sub-title="当前账号没有访问该页面所需的平台权限。"><template #extra><router-link to="/admin"><el-button type="primary">返回后台首页</el-button></router-link></template></el-result></main></template>
<style scoped lang="scss">.result-page{display:grid;min-height:100vh;place-items:center;background:var(--sg-page-bg);}</style>
