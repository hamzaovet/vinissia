import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory live store for active delivery coordinates and chat threads
// keyed by orderNumber for instant real-time synchronization
const liveOrdersCache: Record<
  string,
  {
    courierLat?: number;
    courierLng?: number;
    heading?: number;
    speed?: number;
    lastUpdated?: number;
    chat: Array<{ id: string; sender: "customer" | "courier" | "store"; text: string; time: string }>;
  }
> = {};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "رقم الطلب مطلوب" }, { status: 400 });
    }

    const cleanOrderNumber = orderNumber.trim();
    const live = liveOrdersCache[cleanOrderNumber] || {
      chat: [
        {
          id: "welcome",
          sender: "store",
          text: "مرحباً بك! فريق عمل ألبان فينيسيا يقوم بتجهيز طلبك بعناية فائقة 🥛",
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    return NextResponse.json({
      success: true,
      liveData: live,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, orderNumber, lat, lng, heading, speed, message, sender } = body;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "رقم الطلب مطلوب" }, { status: 400 });
    }

    const cleanOrderNumber = orderNumber.trim();
    if (!liveOrdersCache[cleanOrderNumber]) {
      liveOrdersCache[cleanOrderNumber] = {
        chat: [
          {
            id: "welcome",
            sender: "store",
            text: "مرحباً بك! فريق عمل ألبان فينيسيا يقوم بتجهيز طلبك بعناية فائقة 🥛",
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      };
    }

    // 1. UPDATE LIVE GPS LOCATION
    if (action === "UPDATE_LOCATION") {
      liveOrdersCache[cleanOrderNumber].courierLat = lat;
      liveOrdersCache[cleanOrderNumber].courierLng = lng;
      liveOrdersCache[cleanOrderNumber].heading = heading;
      liveOrdersCache[cleanOrderNumber].speed = speed;
      liveOrdersCache[cleanOrderNumber].lastUpdated = Date.now();

      return NextResponse.json({
        success: true,
        message: "تم تحديث موقع الـ GPS المباشر",
        liveData: liveOrdersCache[cleanOrderNumber],
      });
    }

    // 2. SEND IN-APP CHAT MESSAGE
    if (action === "SEND_MESSAGE") {
      if (!message || !message.trim()) {
        return NextResponse.json({ success: false, error: "نص الرسالة مطلوب" }, { status: 400 });
      }

      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: sender || "customer",
        text: message.trim(),
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };

      liveOrdersCache[cleanOrderNumber].chat.push(newMsg);

      return NextResponse.json({
        success: true,
        message: "تم إرسال الرسالة بنجاح",
        chat: liveOrdersCache[cleanOrderNumber].chat,
      });
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
