import { PrismaClient } from '@prisma/client'

// 在 Prisma 6 中，标准的实例化即可自动读取环境变量
const prisma = new PrismaClient()

export default prisma
