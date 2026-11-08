import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory live store for active delivery coordinates and segmented chat threads
// keyed by orderNumber for instant real-time synchronization
interface ChatMessage {
  id: string;
  sender: "customer" | "courier" | "store";
  channel: "customer_courier" | "customer_store" | "courier_store";
  text: string;
  time: string;
}

const liveOrdersCache: Record<
  string,
  {
    courierLat?: number;
    courierLng?: number;
    heading?: number;
    speed?: number;
    lastUpdated?: number;
    chat: Array<ChatMessage>;
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
    if (!liveOrdersCache[cleanOrderNumber]) {
      liveOrdersCache[cleanOrderNumber] = {
        chat: [
          {
            id: "welcome-store",
            sender: "store",
            channel: "customer_store",
            text: "مرحباً بك! فريق عمل ألبان فينيسيا يقوم بتجهيز طلبك بعناية فائقة 🥛",
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      };
    }

    // Check Multi-Stop Delivery Queue Info for Courier
    let courierActiveCount = 1;
    let stopNumber = 1;
    let courierName: string | null = null;
    let courierPhone: string | null = null;

    try {
      const orderRecord = await prisma.order.findUnique({
        where: { orderNumber: cleanOrderNumber },
        include: {
          courier: { select: { id: true, name: true, phone: true } },
        },
      });

      if (orderRecord?.courier) {
        courierName = orderRecord.courier.name;
        courierPhone = orderRecord.courier.phone;

        const siblings = await prisma.order.findMany({
          where: {
            courierId: orderRecord.courier.id,
            status: { in: ["PENDING", "PREPARING", "ON_THE_WAY", "OUT_FOR_DELIVERY"] },
          },
          orderBy: { createdAt: "asc" },
          select: { orderNumber: true },
        });

        courierActiveCount = Math.max(1, siblings.length);
        const idx = siblings.findIndex((o) => o.orderNumber === cleanOrderNumber);
        stopNumber = idx !== -1 ? idx + 1 : 1;
      }
    } catch (e) {
      // Non-blocking database check
    }

    return NextResponse.json({
      success: true,
      liveData: liveOrdersCache[cleanOrderNumber],
      courierActiveCount,
      stopNumber,
      courierName,
      courierPhone,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, orderNumber, orderNumbers, lat, lng, heading, speed, message, sender, channel } = body;

    // ─────────────────────────────────────────────────────────────
    // 1. UPDATE LIVE GPS LOCATION (Single Order or Multi-Order Batch)
    // ─────────────────────────────────────────────────────────────
    if (action === "UPDATE_LOCATION") {
      const targetNumbers: string[] = [];
      if (Array.isArray(orderNumbers) && orderNumbers.length > 0) {
        targetNumbers.push(...orderNumbers.map((n: string) => String(n).trim()));
      } else if (orderNumber) {
        targetNumbers.push(String(orderNumber).trim());
      }

      if (targetNumbers.length === 0) {
        return NextResponse.json({ success: false, error: "رقم الطلب أو قائمة الطلبات مطلوبة" }, { status: 400 });
      }

      targetNumbers.forEach((ordNum) => {
        if (!liveOrdersCache[ordNum]) {
          liveOrdersCache[ordNum] = {
            chat: [
              {
                id: `welcome-${ordNum}`,
                sender: "store",
                channel: "customer_store",
                text: "مرحباً بك! فريق عمل ألبان فينيسيا يقوم بتجهيز طلبك بعناية فائقة 🥛",
                time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              },
            ],
          };
        }

        liveOrdersCache[ordNum].courierLat = lat;
        liveOrdersCache[ordNum].courierLng = lng;
        liveOrdersCache[ordNum].heading = heading;
        liveOrdersCache[ordNum].speed = speed;
        liveOrdersCache[ordNum].lastUpdated = Date.now();
      });

      return NextResponse.json({
        success: true,
        message: `تم تحديث موقع الـ GPS لـ (${targetNumbers.length}) طلبات جارية`,
        updatedOrders: targetNumbers,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SEND IN-APP CHAT MESSAGE (Segmented by Channel)
    // ─────────────────────────────────────────────────────────────
    if (action === "SEND_MESSAGE") {
      if (!orderNumber) {
        return NextResponse.json({ success: false, error: "رقم الطلب مطلوب" }, { status: 400 });
      }
      if (!message || !message.trim()) {
        return NextResponse.json({ success: false, error: "نص الرسالة مطلوب" }, { status: 400 });
      }

      const cleanOrderNumber = String(orderNumber).trim();
      if (!liveOrdersCache[cleanOrderNumber]) {
        liveOrdersCache[cleanOrderNumber] = { chat: [] };
      }

      // Determine valid channel
      // Channels:
      // - "customer_courier": Chat between Customer and Courier
      // - "customer_store": Chat between Customer and Store/Branch
      // - "courier_store": Chat between Courier and Store/Branch
      let validChannel: "customer_courier" | "customer_store" | "courier_store" = channel;
      if (!validChannel) {
        if (sender === "courier") validChannel = "customer_courier";
        else if (sender === "store") validChannel = "customer_store";
        else validChannel = "customer_courier";
      }

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender: sender || "customer",
        channel: validChannel,
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
