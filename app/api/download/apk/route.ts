import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // In production, this can redirect to an S3/GitHub release or serve the built APK file
  // For now, it provides a direct downloadable APK or redirect to release
  const host = request.headers.get("host") || "vinissia.vercel.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  
  // Return downloadable APK response or redirect to GitHub releases
  const apkDownloadUrl = "https://github.com/hamzaovet/vinissia/releases/download/v1.0.0/vinissia.apk";
  
  return NextResponse.redirect(apkDownloadUrl, {
    status: 307,
    headers: {
      "Content-Disposition": 'attachment; filename="vinissia.apk"',
      "Content-Type": "application/vnd.android.package-archive",
    },
  });
}
