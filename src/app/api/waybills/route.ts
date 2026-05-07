import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const batchId = uuidv4();
    
    // Check global uniqueness for external codes in the DB if any exist in the payload
    const externalCodes = data.map(item => item.externalCode).filter(Boolean);
    let duplicatesInDb: string[] = [];
    
    if (externalCodes.length > 0) {
      const existing = await prisma.waybill.findMany({
        where: {
          externalCode: { in: externalCodes }
        },
        select: { externalCode: true }
      });
      duplicatesInDb = existing.map((e: any) => e.externalCode!).filter(Boolean);
    }

    if (duplicatesInDb.length > 0) {
      return NextResponse.json({
        error: "External codes already exist in database",
        duplicates: duplicatesInDb
      }, { status: 400 });
    }

    // Insert
    const waybills = data.map(item => ({
      externalCode: item.externalCode || null,
      senderName: item.senderName,
      senderPhone: item.senderPhone,
      senderAddress: item.senderAddress,
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      receiverAddress: item.receiverAddress,
      weight: Number(item.weight),
      quantity: Number(item.quantity),
      tempZone: item.tempZone,
      remark: item.remark || null,
      batchId,
    }));

    const result = await prisma.waybill.createMany({
      data: waybills,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      batchId
    });
  } catch (error) {
    console.error("Error saving waybills:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { externalCode: { contains: search, mode: "insensitive" } },
        { receiverName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.waybill.count({ where: whereClause }),
      prisma.waybill.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      total,
      items,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching waybills:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
