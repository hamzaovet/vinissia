import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Categories GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameAr, nameEn, icon, description, sortOrder } = body;

    if (!nameAr || !nameAr.trim()) {
      return NextResponse.json({ success: false, error: "اسم القسم بالعربية مطلوب" }, { status: 400 });
    }

    const cleanName = nameAr.trim();
    const existing = await prisma.category.findUnique({ where: { nameAr: cleanName } });
    if (existing) {
      return NextResponse.json({ success: false, error: "هذا القسم موجود بالفعل" }, { status: 400 });
    }

    const newCat = await prisma.category.create({
      data: {
        nameAr: cleanName,
        nameEn: nameEn?.trim() || null,
        icon: icon || "Layers",
        description: description?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, category: newCat, message: "تمت إضافة القسم بنجاح" });
  } catch (error: any) {
    console.error("Categories POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nameAr, nameEn, icon, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف القسم مطلوب" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        nameAr: nameAr?.trim(),
        nameEn: nameEn?.trim() || null,
        icon: icon || undefined,
        description: description !== undefined ? description : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({ success: true, category: updated, message: "تم تحديث القسم بنجاح" });
  } catch (error: any) {
    console.error("Categories PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف القسم مطلوب" }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف القسم بنجاح" });
  } catch (error: any) {
    console.error("Categories DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
