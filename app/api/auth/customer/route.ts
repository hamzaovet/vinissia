import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function sanitizeCustomer(cust: any) {
  if (!cust) return null;
  const { password, otpCode, otpExpires, ...safe } = cust;
  return safe;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // ─────────────────────────────────────────────────────────────
    // 1. REGISTER & SEND OTP VIA GMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === "REGISTER_SEND_OTP" || action === "SEND_OTP") {
      const { name, phone, email, address, zone, username, password } = body;

      if (!name || name.trim().length < 2) {
        return NextResponse.json({ success: false, error: "يرجى كتابة الاسم بالكامل" }, { status: 400 });
      }

      if (!phone || phone.trim().length < 10) {
        return NextResponse.json({ success: false, error: "يرجى إدخال رقم هاتف محمول صحيح (11 رقم)" }, { status: 400 });
      }

      if (!email || !email.includes("@") || !email.includes(".")) {
        return NextResponse.json({ success: false, error: "يرجى إدخال بريد إلكتروني صحيح (Gmail) لاستلام كود التفعيل" }, { status: 400 });
      }

      const cleanPhone = phone.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const cleanUsername = username ? username.trim().toLowerCase() : cleanPhone;
      const cleanPassword = password ? String(password).trim() : null;

      if (cleanPassword && cleanPassword.length < 4) {
        return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تكون 4 خانات على الأقل" }, { status: 400 });
      }

      // Check if another customer already has this username (and is verified)
      if (cleanUsername) {
        const existingUsername = await prisma.customer.findFirst({
          where: {
            username: cleanUsername,
            phone: { not: cleanPhone },
            isVerified: true,
          },
        });

        if (existingUsername) {
          return NextResponse.json(
            { success: false, error: "اسم المستخدم هذا محجوز لعميل آخر، يرجى اختيار اسم مستخدم مختلف" },
            { status: 400 }
          );
        }
      }

      // Check if phone already registered and has password
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (existingCustomer && existingCustomer.isVerified && existingCustomer.password) {
        return NextResponse.json(
          {
            success: false,
            error: "رقم الهاتف مسجل ومفعل بالفعل، يمكنك تسجيل الدخول بكلمة المرور مباشرة",
            canLogin: true,
          },
          { status: 400 }
        );
      }

      // Generate 6-digit OTP code & 10-minute expiry
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Save/Upsert customer record
      if (existingCustomer) {
        await prisma.customer.update({
          where: { phone: cleanPhone },
          data: {
            name: cleanName,
            email: cleanEmail,
            username: cleanUsername,
            password: cleanPassword || existingCustomer.password,
            address: address?.trim() || existingCustomer.address,
            zone: zone || existingCustomer.zone,
            otpCode: generatedOtp,
            otpExpires: expiresAt,
            verificationMethod: "GMAIL",
            isVerified: false,
          },
        });
      } else {
        await prisma.customer.create({
          data: {
            phone: cleanPhone,
            name: cleanName,
            email: cleanEmail,
            username: cleanUsername,
            password: cleanPassword,
            address: address?.trim() || null,
            zone: zone || null,
            otpCode: generatedOtp,
            otpExpires: expiresAt,
            verificationMethod: "GMAIL",
            isVerified: false,
          },
        });
      }

      // Send OTP via Gmail SMTP
      const mailRes = await sendOtpEmail(cleanEmail, cleanName, generatedOtp);
      if (!mailRes.success) {
        console.warn("⚠️ [Email Delivery Warning]:", mailRes.error);
      }

      return NextResponse.json({
        success: true,
        message: "تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني (Gmail)",
        email: cleanEmail,
        phone: cleanPhone,
        debugOtp: process.env.NODE_ENV !== "production" ? generatedOtp : undefined,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. VERIFY OTP CODE
    // ─────────────────────────────────────────────────────────────
    if (action === "VERIFY_OTP") {
      const { phone, email, otpCode } = body;

      if (!otpCode || !String(otpCode).trim()) {
        return NextResponse.json({ success: false, error: "كود التحقق مطلوب" }, { status: 400 });
      }

      const cleanCode = String(otpCode).trim();
      const cleanPhone = phone ? String(phone).trim() : null;
      const cleanEmail = email ? String(email).trim().toLowerCase() : null;

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });

      if (!customer) {
        return NextResponse.json({ success: false, error: "العميل غير مسجل بالنظام" }, { status: 404 });
      }

      // Match code against DB or Master bypass codes (157230 / 123456)
      const isMatch = customer.otpCode === cleanCode || cleanCode === "157230" || cleanCode === "123456";

      if (!isMatch) {
        return NextResponse.json({ success: false, error: "كود التحقق غير صحيح، يرجى مراجعة بريدك الإلكتروني" }, { status: 400 });
      }

      if (customer.otpExpires && new Date() > customer.otpExpires && cleanCode !== "157230") {
        return NextResponse.json({ success: false, error: "انتهت صلاحية كود التحقق (10 دقائق)، يرجى طلب كود جديد" }, { status: 400 });
      }

      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          isVerified: true,
          otpCode: null,
          otpExpires: null,
          verificationMethod: "GMAIL",
        },
      });

      return NextResponse.json({
        success: true,
        customer: sanitizeCustomer(updatedCustomer),
        message: "تم تفعيل وتوثيق حسابك بنجاح! أهلاً بك في ألبان فينيسيا 🥛",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. CUSTOMER LOGIN (USERNAME / PHONE / EMAIL + PASSWORD)
    // ─────────────────────────────────────────────────────────────
    if (action === "LOGIN") {
      const { identifier, password } = body;

      if (!identifier || !password) {
        return NextResponse.json({ success: false, error: "اسم المستخدم/الهاتف وكلمة المرور مطلوبان" }, { status: 400 });
      }

      const clean = String(identifier).trim();
      const cleanPass = String(password).trim();

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { username: clean.toLowerCase() },
            { phone: clean },
            { email: clean.toLowerCase() },
          ],
        },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "بيانات الدخول غير صحيحة (اسم المستخدم أو كلمة المرور)" },
          { status: 401 }
        );
      }

      // Check Password
      if (customer.password && customer.password !== cleanPass) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
          { status: 401 }
        );
      }

      // Check if verified
      if (!customer.isVerified && customer.email) {
        // Automatically send a fresh OTP if they haven't verified yet
        const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            otpCode: freshOtp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000),
          },
        });
        await sendOtpEmail(customer.email, customer.name, freshOtp);

        return NextResponse.json({
          success: false,
          needsVerification: true,
          email: customer.email,
          phone: customer.phone,
          error: "حسابك يحتاج تفعيل. تم إرسال كود تفعيل جديد إلى بريدك الإلكتروني الآن",
        });
      }

      return NextResponse.json({
        success: true,
        customer: sanitizeCustomer(customer),
        message: `أهلاً بك مجدداً يا ${customer.name}! 🥛`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. RESEND OTP CODE VIA GMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === "RESEND_OTP") {
      const { phone, email } = body;
      const cleanPhone = phone ? String(phone).trim() : null;
      const cleanEmail = email ? String(email).trim().toLowerCase() : null;

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });

      if (!customer || !customer.email) {
        return NextResponse.json({ success: false, error: "البريد الإلكتروني للعميل غير مسجل" }, { status: 404 });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          otpCode: generatedOtp,
          otpExpires: new Date(Date.now() + 10 * 60 * 1000),
          verificationMethod: "GMAIL",
        },
      });

      await sendOtpEmail(customer.email, customer.name, generatedOtp);

      return NextResponse.json({
        success: true,
        message: "تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح",
        email: customer.email,
        debugOtp: process.env.NODE_ENV !== "production" ? generatedOtp : undefined,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. GET SAVED CUSTOMER PROFILE
    // ─────────────────────────────────────────────────────────────
    if (action === "GET_PROFILE" || !action) {
      const { phone, username, id } = body;
      if (!phone && !username && !id) {
        return NextResponse.json({ success: false, error: "معرف العميل مطلوب" }, { status: 400 });
      }

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(phone ? [{ phone: String(phone).trim() }] : []),
            ...(username ? [{ username: String(username).trim().toLowerCase() }] : []),
            ...(id ? [{ id: String(id).trim() }] : []),
          ],
        },
        include: {
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, customer: sanitizeCustomer(customer) });
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("Customer Auth Error:", error);
    return NextResponse.json({ success: false, error: error.message || "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
