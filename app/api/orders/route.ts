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

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (orderType && orderType !== "ALL") where.orderType = orderType;
    if (courierId) where.courierId = courierId;
    if (phone) where.customerPhone = phone;
    if (orderNumber) where.orderNumber = orderNumber;

    const orders = await prisma.order.findMany({
      where,
      include: {
        courier: { select: { id: true, name: true, phone: true } },
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
    } = body;

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

    // Deduct stock for ordered items
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
