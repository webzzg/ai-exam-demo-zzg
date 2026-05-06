import prisma from '../api/lib/prisma.js'

async function main() {
  console.log('🚀 正在尝试连接数据库...')

  try {
    // 尝试查询数据
    const count = await prisma.todo.count()
    console.log('✅ 连接成功！')
    console.log(`📊 当前数据库中有 ${count} 条任务。`)
  } catch (e) {
    console.error('❌ 连接失败！')
    console.error('错误详情:', e.message)
    console.log('\n💡 提示：请确保已经在 Vercel 控制台创建了 Postgres 并将 DATABASE_URL 填入了 .env 文件。')
  } finally {
    await prisma.$disconnect()
  }
}

main()
