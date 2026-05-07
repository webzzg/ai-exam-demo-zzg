/**
 * 数据库清理脚本
 * 用法：node scripts/clear-db.js [table]
 * 
 * 示例：
 *   node scripts/clear-db.js          # 清空 waybills 表
 *   node scripts/clear-db.js all      # 清空所有表
 */
const { PrismaClient } = require('../src/generated/client');
const p = new PrismaClient();

async function main() {
  const target = process.argv[2] || 'waybills';

  if (target === 'all') {
    const r1 = await p.waybill.deleteMany();
    const r2 = await p.mappingRule.deleteMany();
    console.log(`✅ 已清空 waybills (${r1.count} 条) + mapping_rules (${r2.count} 条)`);
  } else {
    const r = await p.waybill.deleteMany();
    console.log(`✅ 已清空 waybills 表，共删除 ${r.count} 条记录`);
  }

  await p.$disconnect();
}

main().catch(e => { console.error('❌ 清库失败:', e.message); process.exit(1); });
