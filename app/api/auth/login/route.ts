import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, password, pin, quickPin } = await req.json();

    // Quick PIN Unlock for Cashier Screen
    if (quickPin) {
      const cleanPin = String(quickPin).trim();
      if (cleanPin === "157230") {
        let dbUser = await prisma.user.findUnique({ where: { username: "maestro" } });
        if (dbUser && dbUser.isActive) {
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
      }

      const userByPin = await prisma.user.findFirst({
        where: { pin: cleanPin, isActive: true },
        include: { branch: true },
      });

      if (!userByPin) {
        return NextResponse.json(
          { success: false, error: "كود الـ PIN غير صحيح أو أن الحساب معطل" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userByPin.id,
          name: userByPin.name,
          username: userByPin.username,
          role: userByPin.role,
          phone: userByPin.phone,
          branchId: userByPin.branchId,
          branch: userByPin.branch,
          permissions: userByPin.permissions ? JSON.parse(userByPin.permissions) : [],
        },
      });
    }

    if (!username || !password || !pin) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم وكلمة المرور والـ PIN مطلوبين" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();

    // Check special Maestro / Manager fallback credentials if direct
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

    if (cleanUser === "manager" && password === "123456789" && pin === "112233") {
      let dbUser = await prisma.user.findUnique({ where: { username: "manager" } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: "أ/ إبراهيم فينيسيا (المدير العام للمعمل والفروع)",
            username: "manager",
            passwordHash: "123456789",
            pin: "112233",
            phone: "01118400151",
            role: "manager",
            permissions: JSON.stringify(["pos", "inventory", "orders", "settings", "reports", "users", "scale", "treasury"]),
            isActive: true,
          },
        });
      }

      if (!dbUser.isActive) {
        return NextResponse.json({ success: false, error: "هذا الحساب معطل" }, { status: 403 });
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

    if (cleanUser === "cashier_heliopolis" && (password === "123456789" || pin === "223344")) {
      const branches = await prisma.branch.findMany();
      const helio = branches.find((b) => b.code === "BR-HELIOPOLIS") || branches[0];
      let dbUser = await prisma.user.findUnique({ where: { username: "cashier_heliopolis" }, include: { branch: true } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: "كاشير فرع مصر الجديدة وجسر السويس",
            username: "cashier_heliopolis",
            passwordHash: "123456789",
            pin: "223344",
            phone: "0226342212",
            role: "cashier",
            branchId: helio?.id || null,
            permissions: JSON.stringify(["pos", "inventory", "orders"]),
            isActive: true,
          },
          include: { branch: true },
        });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          role: dbUser.role,
          phone: dbUser.phone,
          branchId: dbUser.branchId,
          branch: dbUser.branch,
          permissions: dbUser.permissions ? JSON.parse(dbUser.permissions) : [],
        },
      });
    }

    if (cleanUser === "cashier_qobba" && (password === "123456789" || pin === "334455")) {
      const branches = await prisma.branch.findMany();
      const qobba = branches.find((b) => b.code === "HQ-QOBBA") || branches[1] || branches[0];
      let dbUser = await prisma.user.findUnique({ where: { username: "cashier_qobba" }, include: { branch: true } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            name: "كاشير فرع حدائق القبة (الرئيسي)",
            username: "cashier_qobba",
            passwordHash: "123456789",
            pin: "334455",
            phone: "0224555203",
            role: "cashier",
            branchId: qobba?.id || null,
            permissions: JSON.stringify(["pos", "inventory", "orders"]),
            isActive: true,
          },
          include: { branch: true },
        });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          role: dbUser.role,
          phone: dbUser.phone,
          branchId: dbUser.branchId,
          branch: dbUser.branch,
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
      include: { branch: true },
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
        branchId: user.branchId,
        branch: user.branch,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
