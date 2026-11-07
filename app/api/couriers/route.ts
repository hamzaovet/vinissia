import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const couriers = await prisma.courier.findMany({
      include: {
        _count: {
          select: {
            orders: {
              where: { status: { in: ["PREPARING", "OUT_FOR_DELIVERY"] } },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, couriers });
  } catch (error: any) {
    console.error("Couriers GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, vehicleType } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "الاسم ورقم الهاتف مطلوبين" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const existing = await prisma.courier.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      return NextResponse.json({ success: false, error: "رقم هاتف الطيار مسجل بالفعل" }, { status: 400 });
    }

    const courier = await prisma.courier.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        vehicleType: vehicleType?.trim() || "موتوسيكل سريع",
        isAvailable: true,
      },
    });

    return NextResponse.json({ success: true, courier, message: "تمت إضافة الطيار بنجاح" });
  } catch (error: any) {
    console.error("Couriers POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isAvailable, name, phone, vehicleType } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الطيار مطلوب" }, { status: 400 });
    }

    const updated = await prisma.courier.update({
      where: { id },
      data: {
        ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(vehicleType ? { vehicleType: vehicleType.trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, courier: updated, message: "تم تحديث بيانات الطيار بنجاح" });
  } catch (error: any) {
    console.error("Couriers PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
