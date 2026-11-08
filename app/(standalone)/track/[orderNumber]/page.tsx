"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import QRCode from "qrcode";

const LiveTrackingMap = dynamic(() => import("@/components/LiveTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span>جارٍ تحميل خريطة التتبع الحي المباشر... 🛵</span>
      </div>
    </div>
  ),
});

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
  User,
  Layers,
} from "lucide-react";

export default function TrackOrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params?.orderNumber ? decodeURIComponent(params.orderNumber as string).trim() : "";
  const isCourierParam = searchParams.get("mode") === "courier";
  const isStoreParam = searchParams.get("mode") === "store";

  // Viewer Role: "customer" | "courier" | "store"
  const [viewerRole, setViewerRole] = useState<"customer" | "courier" | "store">("customer");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Live GPS Tracking & Courier Broadcast State
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lng: number; speed?: number; lastUpdated?: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef<number | null>(null);

  // Multi-order Queue Status
  const [courierActiveCount, setCourierActiveCount] = useState(1);
  const [stopNumber, setStopNumber] = useState(1);
  const [courierName, setCourierName] = useState<string | null>(null);
  const [courierPhone, setCourierPhone] = useState<string | null>(null);

  // Digital Receipt State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // In-App Segmented Chat State
  // Channels: "customer_courier" | "customer_store" | "courier_store"
  const [activeChatTab, setActiveChatTab] = useState<"tab1" | "tab2">("tab1");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; channel?: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Determine role based on params and staff auth
  useEffect(() => {
    try {
      const staffUser = JSON.parse(localStorage.getItem("vinissia_staff_user") || "null");
      if (isCourierParam || staffUser?.role === "delivery") {
        setViewerRole("courier");
      } else if (isStoreParam || (staffUser && (staffUser.role === "owner" || staffUser.role === "manager" || staffUser.role === "cashier"))) {
        setViewerRole("store");
      } else {
        setViewerRole("customer");
      }
    } catch {
      setViewerRole("customer");
    }
  }, [isCourierParam, isStoreParam]);

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

  // 2. Fetch Live GPS, Chat Thread & Multi-stop Queue
  const fetchLiveData = async () => {
    if (!orderNumber) return;
    try {
      const res = await fetch(`/api/orders/live?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success) {
        if (data.liveData) {
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
        if (data.courierActiveCount) setCourierActiveCount(data.courierActiveCount);
        if (data.stopNumber) setStopNumber(data.stopNumber);
        if (data.courierName) setCourierName(data.courierName);
        if (data.courierPhone) setCourierPhone(data.courierPhone);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOrder();
    fetchLiveData();

    if (typeof window !== "undefined" && orderNumber) {
      const courierUrl = `${window.location.origin}/track/${orderNumber}?mode=courier`;
      QRCode.toDataURL(courierUrl, { width: 180, margin: 1 })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }

    const liveInterval = setInterval(() => {
      fetchLiveData();
      fetchOrder();
    }, 4000);

    return () => clearInterval(liveInterval);
  }, [orderNumber]);

  // Clean up GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 3. Courier Real-Time GPS Broadcaster (Only accessible by courier)
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
        console.warn("GPS error:", err);
        setGpsError("تعذر التقاط إشارة الـ GPS بدقة، تأكد من تفعيل الموقع بالهاتف");
        setIsBroadcastingGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcastingGps(false);
  };

  // 4. Send In-App Chat Message according to selected channel
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !orderNumber) return;

    // Resolve channel based on role & active tab:
    // For Customer: tab1 = customer_courier, tab2 = customer_store
    // For Courier: tab1 = customer_courier, tab2 = courier_store
    // For Store: tab1 = customer_store, tab2 = courier_store
    let channel: "customer_courier" | "customer_store" | "courier_store" = "customer_courier";
    if (viewerRole === "customer") {
      channel = activeChatTab === "tab1" ? "customer_courier" : "customer_store";
    } else if (viewerRole === "courier") {
      channel = activeChatTab === "tab1" ? "customer_courier" : "courier_store";
    } else {
      channel = activeChatTab === "tab1" ? "customer_store" : "courier_store";
    }

    try {
      setSendingMsg(true);
      const res = await fetch("/api/orders/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_MESSAGE",
          orderNumber,
          sender: viewerRole,
          channel,
          message: chatInput.trim(),
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

  // 5. Courier Status Update (Authorized Courier Only)
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
  const isDelivered = order.status === "DELIVERED";
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.deliveryAddress || "حدائق القبة، القاهرة"
  )}`;

  // Compute Active Chat Channel & Filter Messages
  let currentTargetChannel: "customer_courier" | "customer_store" | "courier_store" = "customer_courier";
  let tab1Label = "شات مع الطيار 🛵";
  let tab2Label = "شات مع المحل 🏪";

  if (viewerRole === "customer") {
    tab1Label = "محادثة الطيار 🛵";
    tab2Label = "محادثة المحل 🏪";
    currentTargetChannel = activeChatTab === "tab1" ? "customer_courier" : "customer_store";
  } else if (viewerRole === "courier") {
    tab1Label = "محادثة العميل 👤";
    tab2Label = "محادثة المحل 🏢";
    currentTargetChannel = activeChatTab === "tab1" ? "customer_courier" : "courier_store";
  } else {
    // Store staff
    tab1Label = "محادثة العميل 👤";
    tab2Label = "محادثة الطيار 🛵";
    currentTargetChannel = activeChatTab === "tab1" ? "customer_store" : "courier_store";
  }

  const filteredChat = chatMessages.filter((msg) => {
    if (!msg.channel) {
      // Legacy backwards compatibility
      if (currentTargetChannel === "customer_courier") return msg.sender === "customer" || msg.sender === "courier";
      if (currentTargetChannel === "customer_store") return msg.sender === "customer" || msg.sender === "store";
      return msg.sender === "courier" || msg.sender === "store";
    }
    return msg.channel === currentTargetChannel;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-6 sm:py-8 px-4 font-sans select-none" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Navbar */}
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

        {/* ROLE INDICATOR BADGE */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">أنت تشاهد الشاشة بصفتك:</span>
            {viewerRole === "courier" ? (
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>كابتن التوصيل (الطيار) 🛵</span>
              </span>
            ) : viewerRole === "store" ? (
              <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-900 border border-sky-300 font-black flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-sky-600" />
                <span>إدارة الفرع والمحل 🏢</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>العميل صاحب الطلب 🥛</span>
              </span>
            )}
          </div>

          {/* Multi-Order Stop Indicator */}
          {courierActiveCount > 1 && (
            <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-400 text-[11px] font-black border border-slate-800 shadow-xs">
              خط سير متعدد: محطة {stopNumber} من {courierActiveCount}
            </span>
          )}
        </div>

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
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                {order.status === "OUT_FOR_DELIVERY" || order.status === "ON_THE_WAY"
                  ? "الطيار في طريقه إليك الآن 🛵"
                  : order.status === "DELIVERED"
                  ? "تم تسليم الطلب بنجاح ✅"
                  : order.status === "PREPARING"
                  ? "جارٍ تجهيز وتعبئة الطلب بالمعمل 🥣"
                  : "تم استلام الطلب وبانتظار التأكيد ⏳"}
              </h2>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 block">وقت الوصول التقديري</span>
              <span className="text-sm sm:text-base font-black text-amber-600">
                {order.status === "DELIVERED" ? "وصل بالسلامة ✅" : "15 - 25 دقيقة"}
              </span>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="space-y-2">
            <LiveTrackingMap
              branch={
                order.branch?.name?.includes("مصر الجديدة") ||
                order.deliveryAddress?.includes("مصر الجديدة") ||
                order.deliveryAddress?.includes("جسر السويس")
                  ? { name: "فرع مصر الجديدة وجسر السويس", lat: 30.1057199, lng: 31.3212438 }
                  : { name: "فرع حدائق القبة (الرئيسي)", lat: 30.0913819, lng: 31.2897613 }
              }
              courierLocation={courierLocation}
              customerAddress={order.deliveryAddress}
              orderStatus={order.status}
              height="380px"
              onOpenExternalNavigation={() => {
                window.open(googleMapsSearchUrl, "_blank");
              }}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────
              ROLE-BASED ACTIONS:
              1. COURIER ONLY CONTROLS (Only visible if viewerRole === "courier")
             ───────────────────────────────────────────────────────────── */}
          {viewerRole === "courier" && order.orderType === "delivery" && !isDelivered && !isCancelled && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                  <LocateFixed className="w-4 h-4 text-amber-600" />
                  <span>لوحة تحكم الطيار وتحديث حالة التوصيل</span>
                </span>

                {isBroadcastingGps ? (
                  <button
                    onClick={stopGpsBroadcast}
                    className="py-1 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow-xs"
                  >
                    إيقاف البث ⏹️
                  </button>
                ) : (
                  <button
                    onClick={startGpsBroadcast}
                    className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>تفعيل بث GPS المباشر 📡</span>
                  </button>
                )}
              </div>

              {gpsError && (
                <p className="text-[11px] text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {gpsError}
                </p>
              )}

              {/* Status Action Buttons for Courier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={updatingStatus || order.status === "ON_THE_WAY" || order.status === "OUT_FOR_DELIVERY"}
                  onClick={() => handleUpdateStatus("ON_THE_WAY")}
                  className={`py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
                    order.status === "ON_THE_WAY" || order.status === "OUT_FOR_DELIVERY"
                      ? "bg-sky-100 text-sky-800 border border-sky-300 opacity-80"
                      : "bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {order.status === "ON_THE_WAY" || order.status === "OUT_FOR_DELIVERY"
                      ? "الطلب في الطريق للعميل حالياً 🛵"
                      : "استلمت وبدأت التحرك للعميل 🛵"}
                  </span>
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

          {/* ─────────────────────────────────────────────────────────────
              2. STORE STAFF MONITOR BANNER (Only visible if viewerRole === "store")
             ───────────────────────────────────────────────────────────── */}
          {viewerRole === "store" && !isDelivered && !isCancelled && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  شاشة متابعة الإدارة والفرع: الطيار يبث مساره الحقيقي للعميل. تأكيد التسليم يتم من تطبيق الطيار فور استلام العميل.
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="py-1 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shrink-0 transition"
              >
                طباعة الريسيت 🖨️
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. CUSTOMER HELPER CARD (Only visible if viewerRole === "customer")
             ───────────────────────────────────────────────────────────── */}
          {viewerRole === "customer" && !isDelivered && !isCancelled && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-950 font-bold flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {courierActiveCount > 1
                    ? `الطيار في الطريق ومعه (${courierActiveCount}) طلبات في خط السير — أوردرك هو المحطة رقم (${stopNumber}) 🛵`
                    : "الطيار متجه إليك مباشرة بعنوانك المسجل 🛵"}
                </span>
              </div>

              {courierPhone ? (
                <a
                  href={`tel:${courierPhone}`}
                  className="py-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال بالطيار ({courierName || "الكابتن"})</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">
                  جاهزون للتوصيل لباب بيتك بأعلى جودة 🥛
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SEGMENTED IN-APP LIVE CHAT (مقسم حسب القنوات)
           ───────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>المحادثة الفورية المباشرة 💬</span>
            </h3>

            {/* Segmented Chat Channel Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-black gap-1">
              <button
                type="button"
                onClick={() => setActiveChatTab("tab1")}
                className={`py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 ${
                  activeChatTab === "tab1"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab1Label}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChatTab("tab2")}
                className={`py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 ${
                  activeChatTab === "tab2"
                    ? "bg-white text-slate-950 shadow-xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab2Label}</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="h-44 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            {filteredChat.length === 0 ? (
              <p className="text-center text-slate-400 py-8 font-bold">
                لا توجد رسائل سابقة في هذه المحادثة. يمكنك كتابة أي استفسار الآن!
              </p>
            ) : (
              filteredChat.map((msg) => {
                const isMe = msg.sender === viewerRole;
                const senderLabel =
                  msg.sender === "customer"
                    ? "العميل 👤"
                    : msg.sender === "courier"
                    ? "الطيار 🛵"
                    : "المحل والفرع 🏢";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-2.5 rounded-2xl font-sans ${
                        isMe
                          ? "bg-amber-500 text-slate-950 rounded-br-none font-bold"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs"
                      }`}
                    >
                      <span className="text-[10px] block opacity-75 font-mono mb-0.5">
                        {isMe ? "أنت" : senderLabel}
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
            {(viewerRole === "customer" && activeChatTab === "tab2"
              ? [
                  "لو في صنف ناقص بدله بصنف مناسب 🥛",
                  "ممكن تلغي الصنف الناقص وتخصمه من الفاتورة؟ ❌",
                  "تمام موافق على التعديل الجديد 👍",
                  "محتاج أضيف صنف تاني لو متاح 🧀",
                ]
              : [
                  "لو سمحت رن الجرس بهدوء 🔔",
                  "أنا منتظرك بالأسفل 🛵",
                  "العنوان واضح بالظبط؟ 📍",
                  "شكراً جزيلاً! ⭐",
                ]
            ).map((pill) => (
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
              placeholder={
                activeChatTab === "tab1"
                  ? `اكتب رسالة إلى ${tab1Label}...`
                  : `اكتب رسالة إلى ${tab2Label}...`
              }
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

            <div className="flex items-center gap-2">
              {viewerRole === "customer" && !isDelivered && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveChatTab("tab2");
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 py-1 px-2.5 rounded-xl transition flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>طلب تعديل صنف مع المحل 💬</span>
                </button>
              )}

              <button
                onClick={() => setShowReceiptModal(true)}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>عرض ريسيت الطابعة 🧾</span>
              </button>
            </div>
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
                <span>خدمة التوصيل:</span>
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
