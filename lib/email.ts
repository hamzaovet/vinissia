import "dotenv/config";
import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.EMAIL_USER || "hamzaovet@gmail.com";
  const rawPass = process.env.EMAIL_PASS || "goyl rmse icox vrdh";
  const pass = rawPass.replace(/\s+/g, "");

  if (!pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function sendOtpEmail(
  to: string,
  name: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn("⚠️ [Email] EMAIL_PASS not configured. Test OTP code is:", code);
      return { success: true };
    }

    const fromAddress = `"ألبان فينيسيا - Venice Dairy 🥛" <${process.env.EMAIL_USER || "hamzaovet@gmail.com"}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 24px 12px;
          }
          .container {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #f59e0b;
            border-radius: 28px;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 10px 35px rgba(245, 158, 11, 0.12);
          }
          .brand-title {
            color: #0284c7;
            font-size: 30px;
            font-weight: 900;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }
          .slogan {
            color: #d97706;
            font-size: 14px;
            font-weight: 800;
            margin-bottom: 24px;
          }
          .greeting {
            color: #0f172a;
            font-size: 19px;
            font-weight: 800;
            margin: 0 0 12px 0;
          }
          .info {
            color: #475569;
            font-size: 14px;
            line-height: 1.7;
            margin: 0 0 18px 0;
          }
          .otp-box {
            background: #fffbeb;
            border: 2px dashed #f59e0b;
            border-radius: 20px;
            padding: 20px;
            margin: 22px 0;
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 10px;
            color: #b45309;
            font-family: monospace;
          }
          .warning {
            color: #b91c1c;
            font-size: 12px;
            font-weight: 700;
            background: #fef2f2;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid #fecaca;
            display: inline-block;
            margin-bottom: 24px;
          }
          .footer {
            margin-top: 28px;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #f1f5f9;
            padding-top: 18px;
            line-height: 1.8;
          }
          .footer strong {
            color: #334155;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand-title">🥛 ألبان فينيسيا</div>
          <div class="slogan">✨ مش بس لبن وزبادي — خير المزارع الطبيعي</div>
          
          <h2 class="greeting">أهلاً بك يا ${name || "عميلنا العزيز"} 👋</h2>
          <p class="info">لتأكيد تفعيل حسابك وحفظ بياناتك وسرعة طلب الدليفري، استخدم كود التحقق السري التالي:</p>

          <div class="otp-box">${code}</div>

          <div class="warning">
            ⚠️ هذا الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز السري مع أي شخص.
          </div>

          <div class="footer">
            <strong>ألبان فينيسيا (Venice Dairy)</strong><br/>
            📍 فرع سنترال مصر الجديدة: 0226342212<br/>
            📍 فرع حدائق القبة: 0224555203<br/>
            🛵 واتساب وخدمة الدليفري: 01118400150
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `رمز تأكيد وتفعيل حسابك في ألبان فينيسيا 🥛: ${code}`,
      html: htmlContent,
    });

    return { success: true };
  } catch (err: any) {
    console.error("❌ [Venice Email Error]:", err);
    return { success: false, error: err.message };
  }
}
