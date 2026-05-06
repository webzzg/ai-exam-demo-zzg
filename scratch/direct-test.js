import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function test() {
  const { Client } = pg
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🚀 正在通过 pg 驱动直接连接云数据库...')
    await client.connect()
    console.log('✅ 连接成功！')
    
    const res = await client.query('SELECT COUNT(*) FROM "Todo"')
    console.log(`📊 当前数据库中有 ${res.rows[0].count} 条任务。`)
  } catch (err) {
    console.error('❌ 连接失败！')
    console.error(err.message)
  } finally {
    await client.end()
  }
}

test()
