import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { address: { contains: q, mode: "insensitive" } },
        { zone: { contains: q, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { totalSpent: "desc" },
    });

    return NextResponse.json({ success: true, count: customers.length, customers });
  } catch (error: any) {
    console.error("Customers GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
