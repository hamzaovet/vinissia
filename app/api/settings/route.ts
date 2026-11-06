import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          storeName: "ألبان فينيسيا",
          tagline: "خير المزارع الطبيعي على أصوله — ألبان طازجة، أجبان معتقة، وحلويات بلدي فاخرة",
          address: "80 المدينة المنورة، الوايلي الكبير شرق، حدائق القبة، محافظة القاهرة",
          googleMapsUrl: "https://share.google/UrPJjxJ0JpFBb4OHt",
          phone: "0224382540",
          hotline: "01018671000",
          whatsapp: "01018671000",
        },
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      storeName,
      tagline,
      address,
      googleMapsUrl,
      phone,
      hotline,
      whatsapp,
      deliveryZones,
      minDeliveryOrder,
      freeDeliveryAbove,
      isOpen,
      workingHours,
      announcement,
      weightScalePrefix,
    } = body;

    const updated = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        storeName: storeName || "ألبان فينيسيا",
        tagline: tagline || "",
        address: address || "",
        googleMapsUrl: googleMapsUrl || "",
        phone: phone || "",
        hotline: hotline || "",
        whatsapp: whatsapp || "",
        deliveryZones: typeof deliveryZones === "string" ? deliveryZones : JSON.stringify(deliveryZones || []),
        minDeliveryOrder: Number(minDeliveryOrder) || 50,
        freeDeliveryAbove: Number(freeDeliveryAbove) || 350,
        isOpen: isOpen ?? true,
        workingHours: workingHours || "",
        announcement: announcement || "",
        weightScalePrefix: weightScalePrefix || "20,21",
      },
      create: {
        id: "default",
        storeName: storeName || "ألبان فينيسيا",
        tagline: tagline || "",
        address: address || "",
        googleMapsUrl: googleMapsUrl || "",
        phone: phone || "",
        hotline: hotline || "",
        whatsapp: whatsapp || "",
        deliveryZones: typeof deliveryZones === "string" ? deliveryZones : JSON.stringify(deliveryZones || []),
        minDeliveryOrder: Number(minDeliveryOrder) || 50,
        freeDeliveryAbove: Number(freeDeliveryAbove) || 350,
        isOpen: isOpen ?? true,
        workingHours: workingHours || "",
        announcement: announcement || "",
        weightScalePrefix: weightScalePrefix || "20,21",
      },
    });

    return NextResponse.json({ success: true, settings: updated, message: "تم حفظ الإعدادات بنجاح" });
  } catch (error: any) {
    console.error("Settings PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
