import Database from 'better-sqlite3'
import { join } from 'path'
import { copyFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'

let dbPath = join(process.cwd(), 'prisma', 'dev.db')

// Vercel Serverless 环境文件系统是只读的，必须将 sqlite 放入 /tmp (基于实例的临时持久性)
if (process.env.VERCEL) {
  const tmpDbPath = join(tmpdir(), 'dev.db')
  // 首次冷启动时，把初始数据数据库拷贝到 /tmp 赋予可写权限
  if (!existsSync(tmpDbPath) && existsSync(dbPath)) {
    try {
      copyFileSync(dbPath, tmpDbPath)
    } catch (err) {
      console.error('Failed to copy db to tmp:', err)
    }
  }
  dbPath = tmpDbPath
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS Todo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)

export default db
