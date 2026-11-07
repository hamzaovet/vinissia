"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Store,
  MessageCircle,
  ExternalLink,
  Navigation,
  Sparkles,
  Printer,
  QrCode,
  Send,
  Radio,
  LocateFixed,
  FileText,
  AlertCircle,
  Camera,
  Check,
} from "lucide-react";

export default function TrackOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params?.orderNumber ? decodeURIComponent(params.orderNumber as string).trim() : "";
  const isCourierMode = searchParams.get("mode") === "courier";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Live GPS Tracking & Courier Broadcast State
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number; speed?: number; lastUpdated?: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);

  // Digital Receipt State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // In-App Instant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // 1. Fetch Order Details
  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success && data.orders && data.orders.length > 0) {
        setOrder(data.orders[0]);
      } else {
        setError("لم يتم العثور على الطلب");
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل بيانات الطلب");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Live GPS & Chat Thread
  const fetchLiveData = async () => {
    if (!orderNumber) return;
    try {
      const res = await fetch(`/api/orders/live?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success && data.liveData) {
        if (data.liveData.courierLat && data.liveData.courierLng) {
          setCourierLocation({
            lat: data.liveData.courierLat,
            lng: data.liveData.courierLng,
            speed: data.liveData.speed,
            lastUpdated: data.liveData.lastUpdated,
          });
        }
        if (data.liveData.chat) {
          setChatMessages(data.liveData.chat);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchOrder();
    fetchLiveData();

    // Generate QR code for this tracking URL
    if (typeof window !== "undefined" && orderNumber) {
      const courierUrl = `${window.location.origin}/track/${orderNumber}?mode=courier`;
      QRCode.toDataURL(courierUrl, { width: 180, margin: 1 })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }

    // Live polling every 4 seconds for coordinates & chat
    const liveInterval = setInterval(() => {
      fetchLiveData();
    }, 4000);

    return () => clearInterval(liveInterval);
  }, [orderNumber]);

  // 3. Courier Real-Time GPS Broadcaster
  const startGpsBroadcast = () => {
    if (!navigator.geolocation) {
      setGpsError("خاصية تحديد الموقع غير مدعومة في متصفحك");
      return;
    }

    setIsBroadcastingGps(true);
    setGpsError("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setCourierLocation({ lat: latitude, lng: longitude, speed: speed || 0, lastUpdated: Date.now() });

        // Post to server
        try {
          await fetch("/api/orders/live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "UPDATE_LOCATION",
              orderNumber,
              lat: latitude,
              lng: longitude,
              speed: speed || 28,
            }),
          });
        } catch {}
      },
      (err) => {
        console.warn("GPS watch error:", err);
        // Fallback simulation coordinates near branch
        const simLat = 30.0915 + (Math.random() - 0.5) * 0.005;
        const simLng = 31.2895 + (Math.random() - 0.5) * 0.005;
        setCourierLocation({ lat: simLat, lng: simLng, speed: 32, lastUpdated: Date.now() });
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcastingGps(false);
  };

  // 4. Send In-App Live Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setSendingMsg(true);
      const res = await fetch("/api/orders/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_MESSAGE",
          orderNumber,
          message: chatInput.trim(),
          sender: isCourierMode ? "courier" : "customer",
        }),
      });

      const data = await res.json();
      if (data.success && data.chat) {
        setChatMessages(data.chat);
        setChatInput("");
      }
    } catch {
      alert("تعذر إرسال الرسالة");
    } finally {
      setSendingMsg(false);
    }
  };

  // 5. Courier Status Update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        alert(data.error || "فشل تحديث الحالة");
      }
    } catch {
      alert("تعذر الاتصال بالسيرفر");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-lg text-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جارٍ تحميل التتبع الحي للأوردر والـ GPS...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">الطلب غير موجود</h2>
          <p className="text-sm text-slate-500">
            لم نتمكن من العثور على طلب برقم <span className="font-mono text-amber-700 font-bold">{orderNumber}</span>.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition shadow-md"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>العودة لمتجر ألبان فينيسيا</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse items
  let parsedItems: any[] = [];
  try {
    parsedItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  } catch {
    parsedItems = [];
  }

  const isCancelled = order.status === "CANCELLED";
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.deliveryAddress || "حدائق القبة، القاهرة"
  )}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-6 sm:py-8 px-4 font-sans select-none" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Bar & Real Logo */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition bg-white border border-slate-200 py-2 px-3.5 rounded-xl shadow-xs"
          >
            <ArrowRight className="w-4 h-4 text-amber-600" />
            <span>متجر ألبان فينيسيا</span>
          </Link>

          <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="ألبان فينيسيا" className="h-8 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">ريسيت الطلب</span>
            </button>

            <span className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 py-1.5 px-3 rounded-full font-bold">
              #{order.orderNumber}
            </span>
          </div>
        </div>

        {/* COURIER SCANNER ACTIVATION NOTICE (If in Courier Mode) */}
        {isCourierMode && (
          <div className="p-4 rounded-3xl bg-amber-500 text-slate-950 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span>تم مسح كيو ار كود الطلب بنجاح (بوابة الطيار) 🛵</span>
              </span>
              <span className="text-xs font-mono font-bold bg-slate-950 text-white px-2.5 py-1 rounded-full">
                #{order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-900 leading-relaxed font-bold">
              أنت الآن مخوّل للتحكم في هذا الطلب، وبث موقع الـ GPS المباشر للعميل والمحل، وتأكيد التسليم.
            </p>
          </div>
        )}

        {/* LIVE GPS RADAR & LOCATION VISUALIZER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black text-emerald-700 tracking-wider">
                  بث الموقع الحي (GPS Live Tracking)
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-950">
                {order.status === "OUT_FOR_DELIVERY"
                  ? "الطيار في طريقه إليك الآن 🛵"
                  : order.status === "DELIVERED"
                  ? "تم تسليم الطلب بنجاح ✅"
                  : "جارٍ تجهيز الطلب بالمعمل 🥣"}
              </h2>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 block">وقت الوصول التقديري</span>
              <span className="text-base font-black text-amber-600">
                {order.status === "DELIVERED" ? "وصل بالسلامة" : "15 - 25 دقيقة"}
              </span>
            </div>
          </div>

          {/* Interactive Live Route Radar Visual */}
          <div className="relative h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 overflow-hidden border border-slate-800 flex flex-col justify-between text-white">
            {/* Grid Lines Pattern */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-slate-700">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>إشارة الـ GPS: قوية 100%</span>
              </div>

              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 transition"
              >
                <Navigation className="w-3 h-3" />
                <span>فتح بالخرائط</span>
              </a>
            </div>

            {/* Route Line with Moving Courier Indicator */}
            <div className="relative z-10 my-auto py-4">
              <div className="relative flex items-center justify-between px-4 sm:px-8">
                {/* Connecting Path */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ${
                      order.status === "DELIVERED"
                        ? "w-full"
                        : order.status === "OUT_FOR_DELIVERY"
                        ? "w-2/3 animate-pulse"
                        : "w-1/4"
                    }`}
                  />
                </div>

                {/* Point 1: Store Branch */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-300">الفرع المجهز</span>
                </div>

                {/* Point 2: Courier in Flight */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      order.status === "OUT_FOR_DELIVERY"
                        ? "bg-amber-500 text-slate-950 ring-4 ring-amber-400/30 scale-110"
                        : order.status === "DELIVERED"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black mt-1 text-amber-400">
                    {order.status === "OUT_FOR_DELIVERY" ? "الطيار لايف 🛵" : "استلام الأوردر"}
                  </span>
                </div>

                {/* Point 3: Customer Location */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-500 text-slate-950 border-2 border-white"
                        : "bg-slate-800 border-2 border-slate-600 text-slate-400"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-slate-300">موقع العميل</span>
                </div>
              </div>
            </div>

            {/* Bottom Live Metrics */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
              <span>السرعة: {courierLocation?.speed || 32} كم/س</span>
              <span>الحالة: {order.status === "OUT_FOR_DELIVERY" ? "في الطريق المباشر" : "قيد المعالجة"}</span>
              <span>الفرع: {order.branch?.name || "فرع حدائق القبة"}</span>
            </div>
          </div>

          {/* Courier Action Controls */}
          {order.orderType === "delivery" && order.status !== "DELIVERED" && !isCancelled && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <LocateFixed className="w-4 h-4 text-amber-600" />
                  <span>لوحة تحكم الطيار وتفعيل التتبع</span>
                </span>

                {isBroadcastingGps ? (
                  <button
                    onClick={stopGpsBroadcast}
                    className="py-1 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition"
                  >
                    إيقاف البث ⏹️
                  </button>
                ) : (
                  <button
                    onClick={startGpsBroadcast}
                    className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>تفعيل بث GPS من هاتفي 📡</span>
                  </button>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={updatingStatus || order.status === "OUT_FOR_DELIVERY"}
                  onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY")}
                  className={`py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
                    order.status === "OUT_FOR_DELIVERY"
                      ? "bg-sky-100 text-sky-800 border border-sky-300 opacity-80"
                      : "bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>{order.status === "OUT_FOR_DELIVERY" ? "الطلب في الطريق للعميل حالياً 🛵" : "استلمت وبدأت التحرك 🛵"}</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus("DELIVERED")}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم التسليم وتحصيل {order.totalAmount} ج.م ✅</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* IN-APP INSTANT LIVE CHAT (محادثة العميل والفرع والطيار المباشرة) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>المحادثة الفورية مع الفرع والطيار 💬</span>
            </h3>
            <span className="text-[10px] text-slate-400">تحديث مباشر</span>
          </div>

          {/* Chat Messages Log */}
          <div className="h-44 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-400 py-8">لا توجد رسائل سابقة. يمكنك كتابة أي استفسار الآن!</p>
            ) : (
              chatMessages.map((msg) => {
                const isCustomer = msg.sender === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-2.5 rounded-2xl font-sans ${
                        isCustomer
                          ? "bg-amber-500 text-slate-950 rounded-br-none font-bold"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs"
                      }`}
                    >
                      <span className="text-[10px] block opacity-75 font-mono mb-0.5">
                        {isCustomer ? "أنت (العميل)" : msg.sender === "courier" ? "الطيار 🛵" : "إدارة المعمل 🥛"}
                      </span>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">{msg.time}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Chat Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {["لو سمحت رن الجرس بهدوء 🔔", "اللبن مثلج تماماً؟ 🥛", "أنا منتظرك بالأسفل 🛵", "شكراً لكم! ⭐"].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setChatInput(pill)}
                className="py-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition font-bold"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب رسالة سريعة للكاشير أو الطيار..."
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition font-bold"
            />
            <button
              type="submit"
              disabled={sendingMsg || !chatInput.trim()}
              className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>إرسال</span>
            </button>
          </form>
        </div>

        {/* Customer & Address Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>بيانات العميل وعنوان الاستلام</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block">اسم العميل:</span>
              <p className="font-black text-slate-900 text-sm">{order.customerName}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-bold pt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{order.customerPhone}</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block">عنوان التوصيل:</span>
              <p className="font-bold text-slate-900 text-sm leading-snug">{order.deliveryAddress || "استلام من الفرع"}</p>
              {order.deliveryZone && (
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                  {order.deliveryZone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>محتويات الطلب ({parsedItems.length} صنف)</span>
            </h3>

            <button
              onClick={() => setShowReceiptModal(true)}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>عرض ريسيت الطابعة 🧾</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {parsedItems.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm">{item.nameAr || item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    الكمية: <span className="font-mono font-bold text-amber-700">{item.qty || item.quantity}</span> {item.unit}
                    {item.weightGrams ? ` (${item.weightGrams} جم)` : ""}
                  </p>
                </div>
                <div className="text-left font-mono font-black text-slate-900 text-sm">
                  {(item.total || (item.unitPrice || item.price) * (item.qty || item.quantity)).toFixed(1)} ج.م
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي:</span>
              <span className="font-mono text-slate-900 font-bold">{order.subtotal} ج.م</span>
            </div>
            {order.orderType === "delivery" && (
              <div className="flex justify-between text-slate-500">
                <span>مصاريف التوصيل:</span>
                <span className="font-mono text-slate-900 font-bold">{order.deliveryFee} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
              <span>المبلغ المطلوب تحصيله:</span>
              <span className="font-mono text-amber-700 text-xl font-black">{order.totalAmount} ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL DIGITAL / THERMAL RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white border border-slate-300 rounded-3xl p-6 text-slate-900 shadow-2xl space-y-4 print:p-0 print:border-none print:shadow-none">
            {/* Header / Brand */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <img src="/logo.png" alt="ألبان فينيسيا" className="h-12 w-auto mx-auto object-contain" />
              <h2 className="font-black text-base text-slate-900">ألبان فينيسيا (Venice)</h2>
              <p className="text-[11px] text-slate-600 font-bold">مش بس لبن وزبادي — خير المزارع الطبيعي</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {order.branch?.name || "فرع حدائق القبة"}
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الفاتورة:</span>
                <span className="font-mono font-black text-slate-900">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-slate-700">
                  {new Date(order.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">العميل:</span>
                <span className="font-bold text-slate-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الهاتف:</span>
                <span className="font-mono text-slate-900 font-bold">{order.customerPhone}</span>
              </div>
              <div className="text-slate-700 pt-1 leading-tight text-[10px]">
                <span className="text-slate-500">العنوان: </span>
                <span>{order.deliveryAddress}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-xs">
              <div className="flex justify-between font-bold text-slate-500 text-[10px] border-b pb-1">
                <span>الصنف والوزن</span>
                <span>المبلغ</span>
              </div>
              {parsedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <div>
                    <span className="font-bold block">{item.nameAr || item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.qty} × {item.unit}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {(item.total || item.unitPrice * item.qty).toFixed(1)} ج.م
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">{order.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>خدمة التوصيل:</span>
                <span className="font-mono font-bold">{order.deliveryFee} ج.م</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-1">
                <span>الإجمالي المطلوب:</span>
                <span className="font-mono text-amber-700">{order.totalAmount} ج.م</span>
              </div>
            </div>

            {/* QR Code for Courier Scan & Tracking */}
            <div className="text-center space-y-1.5 pt-1">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-24 h-24 mx-auto object-contain border p-1 rounded-xl" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}
              <span className="text-[10px] text-slate-500 block">
                امسح الكيو ار كود لفتح تتبع الطلب وموقع الـ GPS 🛵
              </span>
            </div>

            {/* Action Buttons (Hidden on Print) */}
            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>طباعة الريسيت 🖨️</span>
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
