import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "public", "downloads", "vinissia.apk"),
      path.join(process.cwd(), "public", "vinissia.apk"),
      path.join(process.cwd(), "private", "vinissia.apk"),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Disposition": 'attachment; filename="vinissia.apk"',
            "Content-Length": fileBuffer.length.toString(),
            "Cache-Control": "public, max-age=1800, must-revalidate",
            "X-APK-Version": "1.0.0",
            "X-APK-Package": "com.vinissia.app",
          },
        });
      }
    }

    return new Response("جارٍ تجهيز ملف التطبيق، يرجى المحاولة بعد لحظات", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("APK Download error:", err);
    return new Response("خطأ في تحميل ملف التطبيق", { status: 500 });
  }
}
