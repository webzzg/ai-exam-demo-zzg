import prisma from './lib/prisma.js'

// CSV 转义辅助函数
function escapeCsvField(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const pathname = req.url.split('?')[0]
  const action = pathname.split('/').pop() || req.query.action

  try {
    if (action === 'list') {
      const page = parseInt(req.query.page) || 1
      const pageSize = parseInt(req.query.pageSize) || 20
      
      const [todos, total] = await Promise.all([
        prisma.todo.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.todo.count()
      ])

      return res.status(200).json({ list: todos, total, page, pageSize })
    } 
    
    if (action === 'add') {
      const { title } = req.body || {}
      if (!title) return res.status(400).json({ error: '标题不能为空' })
      const todo = await prisma.todo.create({ data: { title: title.trim() } })
      return res.status(201).json(todo)
    }

    if (action === 'update') {
      const { id, completed, title } = req.body || {}
      if (!id) return res.status(400).json({ error: '缺少 id' })
      const data = {}
      if (typeof completed === 'boolean') data.completed = completed
      if (typeof title === 'string') data.title = title.trim()

      const todo = await prisma.todo.update({ where: { id: Number(id) }, data })
      return res.status(200).json(todo)
    }

    if (action === 'delete') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: '缺少 id' })
      await prisma.todo.delete({ where: { id: Number(id) } })
      return res.status(200).json({ success: true })
    }

    if (action === 'export') {
      const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
      const header = 'ID,标题,状态,创建时间,更新时间'
      const rows = todos.map(t => [
        t.id,
        escapeCsvField(t.title),
        t.completed ? '已完成' : '待处理',
        t.createdAt.toISOString(),
        t.updatedAt.toISOString()
      ].join(','))
      const csv = [header, ...rows].join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=todos_export.csv')
      return res.status(200).end('\uFEFF' + csv)
    }

    if (action === 'import') {
      const { items } = req.body || {}
      if (!Array.isArray(items)) return res.status(400).json({ error: '无效的数据' })
      
      const created = await prisma.$transaction(
        items.map(item => prisma.todo.create({
          data: {
            title: item.title,
            completed: item.completed === true || item.completed === '已完成'
          }
        }))
      )
      return res.status(200).json({ success: true, imported: created.length })
    }

    return res.status(404).json({ error: `未知接口: ${action}` })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: '服务端错误', msg: error.message })
  }
}

