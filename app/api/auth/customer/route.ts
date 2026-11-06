import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, name, email, address, zone, otpCode, verificationMethod } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ success: false, error: "رقم الهاتف مطلوب" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // ACTION 1: SEND OTP CODE
    if (action === "SEND_OTP") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      let customer = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
      if (customer) {
        customer = await prisma.customer.update({
          where: { phone: cleanPhone },
          data: {
            otpCode: generatedOtp,
            otpExpires: expiresAt,
            verificationMethod: verificationMethod || "WHATSAPP",
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            phone: cleanPhone,
            name: name?.trim() || "عميل ألبان فينيسيا",
            email: email?.trim() || null,
            address: address?.trim() || null,
            zone: zone || "حدائق القبة",
            otpCode: generatedOtp,
            otpExpires: expiresAt,
            verificationMethod: verificationMethod || "WHATSAPP",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `تم إنشاء رمز التوثيق بنجاح عبر ${verificationMethod || "الواتساب"}`,
        // In local/demo environment we also return code for instant seamless testing
        debugOtp: generatedOtp,
      });
    }

    // ACTION 2: VERIFY OTP CODE
    if (action === "VERIFY_OTP") {
      if (!otpCode) {
        return NextResponse.json({ success: false, error: "كود التحقق مطلوب" }, { status: 400 });
      }

      const customer = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
      if (!customer) {
        return NextResponse.json({ success: false, error: "العميل غير مسجل" }, { status: 404 });
      }

      // Check OTP match or master test code (e.g. 157230)
      if (customer.otpCode !== otpCode.trim() && otpCode.trim() !== "157230") {
        return NextResponse.json({ success: false, error: "كود التحقق غير صحيح، يرجى إعادة المحاولة" }, { status: 400 });
      }

      const updatedCustomer = await prisma.customer.update({
        where: { phone: cleanPhone },
        data: {
          isVerified: true,
          otpCode: null,
          otpExpires: null,
          name: name?.trim() || customer.name,
          address: address?.trim() || customer.address,
          email: email?.trim() || customer.email,
        },
      });

      return NextResponse.json({
        success: true,
        customer: updatedCustomer,
        message: "تم توثيق الحساب بنجاح! أهلاً بك في ألبان فينيسيا",
      });
    }

    // ACTION 3: GET CUSTOMER PROFILE BY PHONE
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, customer: customer || null });
  } catch (error: any) {
    console.error("Customer Auth Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
