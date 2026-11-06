import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true, orders: true, stocks: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, count: branches.length, branches });
  } catch (error: any) {
    console.error("Branches GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, address, phone, whatsapp } = body;

    if (!name || !code || !address || !phone) {
      return NextResponse.json(
        { success: false, error: "اسم الفرع وكوده والعنوان ورقم الهاتف حقول مطلوبة" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await prisma.branch.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ success: false, error: "كود الفرع هذا مسجل بالفعل" }, { status: 400 });
    }

    const newBranch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim() || phone.trim(),
        isActive: true,
      },
    });

    // Automatically initialize stock records for all existing products for this new branch
    const allProducts = await prisma.product.findMany();
    for (const prod of allProducts) {
      await prisma.branchStock.create({
        data: {
          branchId: newBranch.id,
          productId: prod.id,
          stockQty: 0,
          openingStock: 0,
        },
      });
    }

    return NextResponse.json({ success: true, branch: newBranch, message: "تمت إضافة الفرع بنجاح" });
  } catch (error: any) {
    console.error("Branches POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, address, phone, whatsapp, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الفرع مطلوب" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (address) updateData.address = address.trim();
    if (phone) updateData.phone = phone.trim();
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp ? whatsapp.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, branch: updated, message: "تم تحديث بيانات الفرع بنجاح" });
  } catch (error: any) {
    console.error("Branches PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
