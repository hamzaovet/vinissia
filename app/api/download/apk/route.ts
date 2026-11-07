import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "private", "vinissia.apk");

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": 'attachment; filename="vinissia.apk"',
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "X-APK-Version": "1.0.0",
          "X-APK-Size": fileBuffer.length.toString(),
        },
      });
    }

    return new Response("APK file not found on server", { status: 404 });
  } catch (err: any) {
    console.error("APK Download error:", err);
    return new Response("Error serving APK file", { status: 500 });
  }
}
