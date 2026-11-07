import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "private", "vinissia.apk"),
      path.join(process.cwd(), "public", "downloads", "vinissia.apk"),
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
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
            "X-APK-Version": "1.0.0",
            "X-APK-Package": "com.vinissia.app",
          },
        });
      }
    }

    // Fallback to GitHub Release asset
    return NextResponse.redirect(
      "https://github.com/hamzaovet/vinissia/releases/latest/download/vinissia.apk",
      { status: 302 }
    );
  } catch (err: any) {
    console.error("APK Download error:", err);
    return new Response("Error serving APK file", { status: 500 });
  }
}
