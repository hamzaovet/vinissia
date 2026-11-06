import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const weightedOnly = searchParams.get("weightedOnly");
    const activeOnly = searchParams.get("activeOnly");

    const where: any = {};
    if (activeOnly !== "false") where.isActive = true;
    if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;
    if (weightedOnly === "true") where.isWeighted = true;
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { nameAr: { contains: q, mode: "insensitive" } },
        { nameEn: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q } },
        { pluCode: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, nameAr: true, icon: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    console.error("Products GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nameAr,
      nameEn,
      categoryId,
      unit,
      barcode,
      pluCode,
      isWeighted,
      pricePerKg,
      basePrice,
      costPrice,
      isHouseMade,
      inStock,
      stockQty,
      minStockQty,
      image,
      description,
      badge,
      sortOrder,
    } = body;

    if (!nameAr || !categoryId || basePrice === undefined) {
      return NextResponse.json(
        { success: false, error: "اسم الصنف، القسم، وسعر البيع حقول مطلوبة" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, error: "القسم المحدد غير موجود" }, { status: 404 });
    }

    const generatedBarcode = barcode?.trim() || `622${Date.now().toString().slice(-7)}`;

    const newProduct = await prisma.product.create({
      data: {
        nameAr: nameAr.trim(),
        nameEn: nameEn?.trim() || null,
        categoryId: category.id,
        categoryName: category.nameAr,
        unit: unit?.trim() || (isWeighted ? "1 كجم" : "قطعة"),
        barcode: generatedBarcode,
        pluCode: pluCode?.trim() || null,
        isWeighted: Boolean(isWeighted),
        pricePerKg: isWeighted ? Number(pricePerKg || basePrice) : null,
        basePrice: Number(basePrice),
        costPrice: Number(costPrice) || 0,
        isHouseMade: isHouseMade !== undefined ? Boolean(isHouseMade) : true,
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        stockQty: Number(stockQty) || 100,
        minStockQty: Number(minStockQty) || 10,
        image: image || null,
        description: description?.trim() || null,
        badge: badge?.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, product: newProduct, message: "تمت إضافة الصنف بنجاح" });
  } catch (error: any) {
    console.error("Products POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الصنف مطلوب" }, { status: 400 });
    }

    const updateData: any = {};
    if (fields.nameAr) updateData.nameAr = fields.nameAr.trim();
    if (fields.nameEn !== undefined) updateData.nameEn = fields.nameEn ? fields.nameEn.trim() : null;
    if (fields.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: fields.categoryId } });
      if (cat) {
        updateData.categoryId = cat.id;
        updateData.categoryName = cat.nameAr;
      }
    }
    if (fields.unit) updateData.unit = fields.unit.trim();
    if (fields.barcode !== undefined) updateData.barcode = fields.barcode ? fields.barcode.trim() : null;
    if (fields.pluCode !== undefined) updateData.pluCode = fields.pluCode ? fields.pluCode.trim() : null;
    if (fields.isWeighted !== undefined) updateData.isWeighted = Boolean(fields.isWeighted);
    if (fields.pricePerKg !== undefined) updateData.pricePerKg = Number(fields.pricePerKg);
    if (fields.basePrice !== undefined) updateData.basePrice = Number(fields.basePrice);
    if (fields.costPrice !== undefined) updateData.costPrice = Number(fields.costPrice);
    if (fields.isHouseMade !== undefined) updateData.isHouseMade = Boolean(fields.isHouseMade);
    if (fields.inStock !== undefined) updateData.inStock = Boolean(fields.inStock);
    if (fields.stockQty !== undefined) updateData.stockQty = Number(fields.stockQty);
    if (fields.minStockQty !== undefined) updateData.minStockQty = Number(fields.minStockQty);
    if (fields.image !== undefined) updateData.image = fields.image;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.badge !== undefined) updateData.badge = fields.badge;
    if (fields.sortOrder !== undefined) updateData.sortOrder = Number(fields.sortOrder);
    if (fields.isActive !== undefined) updateData.isActive = Boolean(fields.isActive);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product: updated, message: "تم تحديث الصنف بنجاح" });
  } catch (error: any) {
    console.error("Products PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, adjustQty, setStockQty } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الصنف مطلوب" }, { status: 400 });
    }

    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, error: "الصنف غير موجود" }, { status: 404 });
    }

    let newStock = current.stockQty;
    if (adjustQty !== undefined) {
      newStock = Math.max(0, Number((current.stockQty + Number(adjustQty)).toFixed(3)));
    } else if (setStockQty !== undefined) {
      newStock = Math.max(0, Number(Number(setStockQty).toFixed(3)));
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockQty: newStock,
        inStock: newStock > 0,
      },
    });

    return NextResponse.json({
      success: true,
      product: updated,
      message: `تم تحديث رصيد المخزن بنجاح إلى ${newStock} ${updated.unit}`,
    });
  } catch (error: any) {
    console.error("Products PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الصنف مطلوب" }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف الصنف بنجاح" });
  } catch (error: any) {
    console.error("Products DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
