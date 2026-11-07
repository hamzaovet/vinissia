import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const orderType = searchParams.get("orderType");
    const courierId = searchParams.get("courierId");
    const phone = searchParams.get("phone");
    const orderNumber = searchParams.get("orderNumber");
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (orderType && orderType !== "ALL") where.orderType = orderType;
    if (courierId) where.courierId = courierId;
    if (phone) where.customerPhone = phone;
    if (orderNumber) where.orderNumber = orderNumber;
    if (branchId && branchId !== "ALL") where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        courier: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true, code: true, phone: true, address: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error("Orders GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderType, // "pos" | "delivery" | "takeaway"
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryZone,
      items,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      paymentMethod,
      cashierName,
      notes,
      branchId,
    } = body;

    let activeBranchId: string | null = null;
    if (branchId) {
      const foundBranch = await prisma.branch.findFirst({
        where: {
          OR: [
            { id: String(branchId).trim() },
            { code: String(branchId).trim() },
            { name: { contains: String(branchId).trim() } },
          ],
        },
      });
      activeBranchId = foundBranch?.id || null;
    }
    if (!activeBranchId) {
      const defaultBranch = await prisma.branch.findFirst({ orderBy: { createdAt: "asc" } });
      activeBranchId = defaultBranch?.id || null;
    }

    if (!items || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "بيانات العميل والأصناف مطلوبة" },
        { status: 400 }
      );
    }

    const orderNumber = `VIN-${Math.floor(1000 + Math.random() * 9000)}`;

    // Upsert Customer in DB for real records
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone.trim() },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName.trim(),
          address: deliveryAddress?.trim() || customer.address,
          zone: deliveryZone || customer.zone,
          totalOrders: { increment: 1 },
          totalSpent: { increment: Number(totalAmount) || 0 },
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: deliveryAddress?.trim() || null,
          zone: deliveryZone || null,
          totalOrders: 1,
          totalSpent: Number(totalAmount) || 0,
        },
      });
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        branchId: activeBranchId,
        orderType: orderType || "delivery",
        customerId: customer.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress?.trim() || "صالة المحل",
        deliveryZone: deliveryZone || "حدائق القبة والوايلي",
        items: typeof items === "string" ? items : JSON.stringify(items),
        subtotal: Number(subtotal) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        discount: Number(discount) || 0,
        totalAmount: Number(totalAmount) || 0,
        paymentMethod: paymentMethod || "cash",
        status: orderType === "pos" ? "DELIVERED" : "PENDING",
        cashierName: cashierName || null,
        notes: notes?.trim() || null,
      },
      include: {
        courier: true,
      },
    });

    // Deduct stock for ordered items (Global and Branch-Specific)
    try {
      const orderItems = typeof items === "string" ? JSON.parse(items) : items;
      if (Array.isArray(orderItems)) {
        for (const item of orderItems) {
          if (item.productId) {
            const deductionQty =
              item.isWeighted && item.weightGrams
                ? Number((item.weightGrams / 1000).toFixed(3))
                : Number(item.qty || 1);

            const prod = await prisma.product.findUnique({ where: { id: item.productId } });
            if (prod) {
              const remainingStock = Math.max(0, Number((prod.stockQty - deductionQty).toFixed(3)));
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stockQty: remainingStock,
                  inStock: remainingStock > 0,
                },
              });

              // Branch specific stock deduction
              if (activeBranchId) {
                const bStock = await prisma.branchStock.findUnique({
                  where: { branchId_productId: { branchId: activeBranchId, productId: item.productId } },
                });
                if (bStock) {
                  const bRem = Math.max(0, Number((bStock.stockQty - deductionQty).toFixed(3)));
                  await prisma.branchStock.update({
                    where: { id: bStock.id },
                    data: {
                      stockQty: bRem,
                      totalOut: { increment: deductionQty },
                    },
                  });

                  // Log Movement in Stock Card
                  await prisma.stockMovement.create({
                    data: {
                      branchId: activeBranchId,
                      productId: item.productId,
                      productName: item.nameAr || prod.nameAr,
                      type: "SALE",
                      qty: -deductionQty,
                      balanceAfter: bRem,
                      reference: `فاتورة #${orderNumber}`,
                      notes: `مبيعات ${orderType === "pos" ? "كاشير صالة" : "دليفري"}`,
                      recordedBy: cashierName || "الكاشير",
                    },
                  });
                }
              }
            }
          }
        }
      }
    } catch (stockErr) {
      console.error("Stock deduction warning:", stockErr);
    }

    // Record Treasury Transaction if POS cash sale
    if (orderType === "pos") {
      await prisma.treasuryTransaction.create({
        data: {
          branchId: activeBranchId,
          type: "IN",
          category: "POS_SALE",
          amount: Number(totalAmount) || 0,
          description: `مبيعات كاشير صالة فاتورة #${orderNumber}`,
          reference: orderNumber,
          recordedBy: cashierName || "الكاشير",
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: `تم إنشاء الطلب بنجاح #${newOrder.orderNumber}`,
    });
  } catch (error: any) {
    console.error("Orders POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, courierId, notes } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "معرف الطلب مطلوب" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (courierId !== undefined) updateData.courierId = courierId ? courierId : null;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { courier: true },
    });

    // If order was delivered, update courier pending cash
    if (status === "DELIVERED" && updated.courierId && updated.orderType === "delivery") {
      await prisma.courier.update({
        where: { id: updated.courierId },
        data: {
          pendingCash: { increment: updated.totalAmount },
          activeOrdersCount: { decrement: 1 },
        },
      });

      await prisma.treasuryTransaction.create({
        data: {
          branchId: updated.branchId || null,
          type: "IN",
          category: "DELIVERY_COLLECTION",
          amount: updated.totalAmount,
          description: `تحصيل أوردر دليفري #${updated.orderNumber} كابتن ${updated.courier?.name}`,
          reference: updated.orderNumber,
          recordedBy: "مسؤول الدليفري",
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message: `تم تحديث حالة الطلب إلى ${status}`,
    });
  } catch (error: any) {
    console.error("Orders PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
