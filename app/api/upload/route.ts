import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "1705736b8f2b46dcbaeec8a6025aca83";
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "ImgBB API Key is not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64 = formData.get("image") as string | null;

    let imagePayload: string | Blob;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      imagePayload = buffer.toString("base64");
    } else if (base64) {
      imagePayload = base64.replace(/^data:image\/\w+;base64,/, "");
    } else {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    const imgbbForm = new FormData();
    imgbbForm.append("image", imagePayload as string);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbForm,
    });

    const data = await res.json();

    if (data.success && data.data?.url) {
      return NextResponse.json({
        success: true,
        url: data.data.display_url || data.data.url,
        thumb: data.data.thumb?.url,
        deleteUrl: data.data.delete_url,
      });
    } else {
      console.error("ImgBB upload error:", data);
      return NextResponse.json(
        { success: false, error: data.error?.message || "فشل رفع الصورة إلى ImgBB" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
