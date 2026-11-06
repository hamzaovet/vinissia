import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, password, pin } = await req.json();

    if (!username || !password || !pin) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم وكلمة المرور والـ PIN مطلوبين" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();

    // Check special Maestro fallback credentials if DB not reached or direct
    if (cleanUser === "maestro" && password === "123456789" && pin === "157230") {
      let dbUser = await prisma.user.findUnique({ where: { username: "maestro" } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: "أ/ حمزة عباس (المايسترو — المالك العام)",
            username: "maestro",
            passwordHash: "123456789",
            pin: "157230",
            phone: "01018671000",
            role: "owner",
            permissions: JSON.stringify(["pos", "inventory", "orders", "settings", "reports", "users", "scale", "treasury"]),
            isActive: true,
          },
        });
      }

      if (!dbUser.isActive) {
        return NextResponse.json({ success: false, error: "هذا الحساب معطل من قبل الإدارة" }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          role: dbUser.role,
          phone: dbUser.phone,
          permissions: dbUser.permissions ? JSON.parse(dbUser.permissions) : [],
        },
      });
    }

    // Standard database user lookup
    const user = await prisma.user.findFirst({
      where: {
        username: { equals: cleanUser, mode: "insensitive" },
        passwordHash: password,
        pin: pin,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "بيانات الدخول غير صحيحة، تأكد من اسم المستخدم وكلمة المرور وكود PIN" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "تم تعطيل هذا الحساب بواسطة المالك (المايسترو)" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
