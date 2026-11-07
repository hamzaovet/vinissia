import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const branchId = searchParams.get("branchId");

    if (!productId) {
      return NextResponse.json({ success: false, error: "معرف الصنف مطلوب" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        branchStocks: {
          include: { branch: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "الصنف غير موجود" }, { status: 404 });
    }

    const where: any = { productId };
    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      product,
      branchStocks: product.branchStocks,
      movements,
    });
  } catch (error: any) {
    console.error("Stock Movements GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      productId,
      branchId,
      type, // "SUPPLY" (إذن توريد), "AUDIT_ADJUST" (تسوية جرد فعلي)
      qty,
      actualCountedQty,
      reference,
      notes,
      recordedBy,
    } = body;

    if (!productId || !branchId || !type) {
      return NextResponse.json(
        { success: false, error: "معرف الصنف والفرع ونوع الحركة حقول مطلوبة" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: "الصنف غير موجود" }, { status: 404 });
    }

    // Get or create branch stock
    let bStock = await prisma.branchStock.findUnique({
      where: { branchId_productId: { branchId, productId } },
    });

    if (!bStock) {
      bStock = await prisma.branchStock.create({
        data: {
          branchId,
          productId,
          stockQty: 0,
          openingStock: 0,
        },
      });
    }

    let newStock = bStock.stockQty;
    let movementQty = Number(qty) || 0;

    if (type === "SUPPLY") {
      // Incoming shipment / supply
      newStock = Number((bStock.stockQty + movementQty).toFixed(3));
      await prisma.branchStock.update({
        where: { id: bStock.id },
        data: {
          stockQty: newStock,
          totalIn: { increment: movementQty },
        },
      });
    } else if (type === "UPDATE_OPENING") {
      // Setting or updating initial opening balance
      const newOpening = Number(Number(qty).toFixed(3));
      const diff = Number((newOpening - bStock.openingStock).toFixed(3));
      newStock = Number((bStock.stockQty + diff).toFixed(3));
      movementQty = newOpening;

      await prisma.branchStock.update({
        where: { id: bStock.id },
        data: {
          openingStock: newOpening,
          stockQty: newStock,
        },
      });
    } else if (type === "AUDIT_ADJUST") {
      // Actual physical count adjustment
      const actual = Number(Number(actualCountedQty).toFixed(3));
      movementQty = Number((actual - bStock.stockQty).toFixed(3));
      newStock = actual;
      await prisma.branchStock.update({
        where: { id: bStock.id },
        data: {
          stockQty: newStock,
          lastAuditDate: new Date(),
        },
      });
    }

    // Recalculate total global stock across all branches
    const allBranchStocks = await prisma.branchStock.findMany({
      where: { productId },
    });
    const totalGlobal = allBranchStocks.reduce((sum, bs) => sum + bs.stockQty, 0);

    await prisma.product.update({
      where: { id: productId },
      data: {
        stockQty: totalGlobal,
        inStock: totalGlobal > 0,
      },
    });

    // Record Stock Movement Log
    const movement = await prisma.stockMovement.create({
      data: {
        branchId,
        productId,
        productName: product.nameAr,
        type,
        qty: movementQty,
        balanceAfter: newStock,
        reference: reference || (type === "SUPPLY" ? "إذن توريد مخزن" : "محضر تسوية جرد فعلي"),
        notes: notes || null,
        recordedBy: recordedBy || "المايسترو",
      },
    });

    return NextResponse.json({
      success: true,
      movement,
      newStock,
      totalGlobal,
      message:
        type === "SUPPLY"
          ? `تم تسجيل توريد ${movementQty} ${product.unit} بنجاح. الرصيد الحالي بالفرع: ${newStock}`
          : type === "UPDATE_OPENING"
          ? `تم تعديل رصيد أول المدة إلى ${movementQty} ${product.unit} بنجاح. الرصيد الحالي: ${newStock}`
          : `تمت تسوية الجرد الفعلي بنجاح. الرصيد المعتمد بالفرع: ${newStock} ${product.unit}`,
    });
  } catch (error: any) {
    console.error("Stock Movement POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
