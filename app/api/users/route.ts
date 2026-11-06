import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        pin: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Users GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, password, pin, phone, role, permissions } = body;

    if (!name || !username || !password || !pin) {
      return NextResponse.json({ success: false, error: "الاسم واسم المستخدم وكلمة المرور وكود PIN مطلوبة" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      return NextResponse.json({ success: false, error: "اسم المستخدم هذا مسجل بالفعل لموظف آخر" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        passwordHash: password,
        pin: pin.trim(),
        phone: phone?.trim() || null,
        role: role || "cashier",
        permissions: typeof permissions === "string" ? permissions : JSON.stringify(permissions || []),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser, message: "تم إضافة الحساب بنجاح" });
  } catch (error: any) {
    console.error("Users POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isActive, name, password, pin, role, permissions } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Safety: prevent deactivating the main owner maestro
    if (user.username === "maestro" && isActive === false) {
      return NextResponse.json({ success: false, error: "لا يمكن تعطيل حساب المالك العام (المايسترو)" }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (name) updateData.name = name.trim();
    if (password) updateData.passwordHash = password;
    if (pin) updateData.pin = pin.trim();
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = typeof permissions === "string" ? permissions : JSON.stringify(permissions);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updated, message: "تم تحديث بيانات الحساب بنجاح" });
  } catch (error: any) {
    console.error("Users PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الحساب مطلوب" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.username === "maestro") {
      return NextResponse.json({ success: false, error: "لا يمكن حذف حساب المالك العام (المايسترو)" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف الحساب بنجاح" });
  } catch (error: any) {
    console.error("Users DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
