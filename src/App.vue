<script setup>
import { ref, onMounted, reactive, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'

// --- 数据定义 ---
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 详情弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null,
  title: '',
  completed: false
})

// --- API 调用 ---
const API_BASE = '/api/todos'

// 获取数据
async function fetchList() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}?page=${currentPage.value}&pageSize=${pageSize.value}`)
    const data = await res.json()
    tableData.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 保存（新增或编辑）
async function handleSave() {
  if (!form.title.trim()) {
    return ElMessage.warning('请输入标题')
  }

  const method = isEdit.value ? 'PUT' : 'POST'
  const payload = isEdit.value ? { id: form.id, title: form.title, completed: form.completed } : { title: form.title }

  try {
    const res = await fetch(API_BASE, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      fetchList()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除
async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这项内容吗？', '确认删除', { type: 'warning' })
    const res = await fetch(API_BASE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除操作失败')
    }
  }
}

// --- 事件处理 ---
function openAdd() {
  isEdit.value = false
  form.id = null
  form.title = ''
  form.completed = false
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.completed = row.completed
  dialogVisible.value = true
}

function handlePageChange(page) {
  currentPage.value = page
  fetchList()
}

// --- 虚拟表格配置 ---
const columns = [
  { key: 'id', dataKey: 'id', title: 'ID', width: 80 },
  { key: 'title', dataKey: 'title', title: '任务标题', width: 250, flexGrow: 1 },
  { 
    key: 'completed', 
    dataKey: 'completed', 
    title: '状态', 
    width: 100,
    cellRenderer: ({ cellData }) => h(
      'span', 
      { style: { color: cellData ? '#67C23A' : '#E6A23C' } }, 
      cellData ? '✅ 已完成' : '🕒 待处理'
    )
  },
  {
    key: 'createdAt',
    dataKey: 'createdAt',
    title: '创建时间',
    width: 180,
    cellRenderer: ({ cellData }) => new Date(cellData).toLocaleString()
  },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    fixed: 'right',
    cellRenderer: ({ rowData }) => h('div', [
      h(
        'button', 
        { 
          class: 'el-button el-button--primary el-button--small', 
          onClick: () => openEdit(rowData) 
        }, 
        '修改'
      ),
      h(
        'button', 
        { 
          class: 'el-button el-button--danger el-button--small', 
          style: { marginLeft: '8px' },
          onClick: () => handleDelete(rowData.id) 
        }, 
        '删除'
      )
    ])
  }
]

onMounted(fetchList)
</script>

<template>
  <div class="fullstack-container">
    <header class="page-header">
      <div class="logo">🚀 AI Full-Stack Demo</div>
      <div class="actions">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增任务</el-button>
        <el-button :icon="Refresh" @click="fetchList" circle />
      </div>
    </header>

    <main class="table-section" v-loading="loading">
      <!-- 虚拟表格 -->
      <div style="height: 500px; width: 100%">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              :columns="columns"
              :data="tableData"
              :width="width"
              :height="height"
              fixed
            />
          </template>
        </el-auto-resizer>
      </div>

      <!-- 分页栏 -->
      <div class="pagination-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
          background
        />
      </div>
    </main>

    <!-- 说明卡片 -->
    <section class="explanation-card">
      <h3>💡 技术选型说明</h3>
      <p><strong>数据库:</strong> SQLite (文件: <code>dev.db</code>)。优点是零配置、无需搭建数据库服务器，极其适合 Exam Demo 演示。</p>
      <p><strong>为何全栈:</strong> 通过 Vercel Serverless API 实现了完整的分页 CRUD 闭环，这正是面试或向领导汇报时展示“全栈自闭环能力”的核心点。</p>
    </section>

    <!-- 编辑/新增 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="400px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入任务内容" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEdit">
          <el-switch v-model="form.completed" active-text="已完成" inactive-text="待处理" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style>
/* 全局基础样式（Element Plus 虚拟表格依赖部分弹性布局） */
body {
  margin: 0;
  background-color: #f5f7fa;
  font-family: 'Inter', system-ui, sans-serif;
}

.fullstack-container {
  max-width: 1000px;
  margin: 40px auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: #409eff;
}

.table-section {
  padding: 24px;
}

.pagination-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.explanation-card {
  margin: 0 24px 24px;
  padding: 20px;
  background-color: #f0f9eb;
  border-left: 4px solid #67C23A;
  border-radius: 4px;
}

.explanation-card h3 {
  margin: 0 0 10px;
  color: #1f2f3d;
  font-size: 1rem;
}

.explanation-card p {
  margin: 5px 0;
  font-size: 0.85rem;
  color: #5e6d82;
  line-height: 1.6;
}

/* 适配 el-table-v2 的按钮样式 */
.el-button--small {
    padding: 5px 11px;
    font-size: 12px;
    border-radius: 3px;
}
</style>
