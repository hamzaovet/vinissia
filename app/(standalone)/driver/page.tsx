"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Package,
  LogOut,
  RefreshCw,
  Navigation,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Navigation2,
  Store,
  Send,
  ExternalLink,
  QrCode,
  Check,
} from "lucide-react";

type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "في الانتظار ⏳",
  PREPARING: "جارٍ التجهيز 🔪",
  READY: "جاهز للتسليم ✅",
  OUT_FOR_DELIVERY: "خرج للتوصيل 🛵",
  DELIVERED: "تم التوصيل ✅",
  CANCELLED: "ملغي ❌",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PREPARING: "bg-blue-100 text-blue-800 border-blue-300",
  READY: "bg-emerald-100 text-emerald-800 border-emerald-300",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-800 border-sky-300",
  DELIVERED: "bg-slate-100 text-slate-500 border-slate-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function DriverPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);

  // In-App Chat States per Order
  const [quickMessages, setQuickMessages] = useState<{ [orderId: string]: string }>({});
  const [sendingMsgId, setSendingMsgId] = useState<string | null>(null);
  const [msgSuccessId, setMsgSuccessId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        // Show all active delivery orders
        const deliveryOrders = (data.orders || []).filter(
          (o: any) =>
            o.orderType === "delivery" &&
            o.status !== "CANCELLED" &&
            o.status !== "DELIVERED"
        );
        setOrders(deliveryOrders);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("vinissia_staff_user");
    if (!saved) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(saved);
    if (parsed.role !== "delivery" && parsed.role !== "owner" && parsed.role !== "manager") {
      router.push("/login");
      return;
    }
    setCurrentUser(parsed);
    fetchOrders().finally(() => setLoading(false));
  }, [router, fetchOrders]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Get driver's current GPS location
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert("جهازك لا يدعم تحديد الموقع الجغرافي");
      return;
    }
    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSharingLocation(false);
      },
      () => {
        alert("تعذر الحصول على موقعك، تأكد من تفعيل GPS في الهاتف");
        setSharingLocation(false);
      }
    );
  };

  // Open Google Maps directions from driver location to customer address
  const openDirections = (address: string) => {
    if (!address) return;
    const dest = encodeURIComponent(address + ", القاهرة، مصر");
    if (myLocation) {
      window.open(
        `https://www.google.com/maps/dir/${myLocation.lat},${myLocation.lng}/${dest}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${dest}`,
        "_blank"
      );
    }
  };

  // Share live location link with customer via WhatsApp
  const shareLiveLocation = (customerPhone: string, orderNumber: string) => {
    if (!myLocation) {
      alert("اضغط على 'موقعي الحالي' بالأعلى أولاً لتحديد موقعك عبر الـ GPS");
      return;
    }
    const mapsLink = `https://www.google.com/maps?q=${myLocation.lat},${myLocation.lng}`;
    const msg = `📍 مرحباً، أنا طيار ألبان فينيسيا 🛵\nجارٍ التوصيل لطلبك رقم #${orderNumber}\nموقعي الحالي المباشر: ${mapsLink}`;
    window.open(
      `https://wa.me/2${String(customerPhone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  // Send In-App Chat Message directly from the driver cockpit
  const handleSendQuickMessage = async (orderNumber: string, orderId: string, customText?: string) => {
    const textToSend = customText || (quickMessages[orderId] || "").trim();
    if (!textToSend) return;

    try {
      setSendingMsgId(orderId);
      const res = await fetch("/api/orders/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_MESSAGE",
          orderNumber,
          sender: "courier",
          message: textToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickMessages((prev) => ({ ...prev, [orderId]: "" }));
        setMsgSuccessId(orderId);
        setTimeout(() => setMsgSuccessId(null), 3000);
      } else {
        alert(data.error || "فشل إرسال الرسالة للشات");
      }
    } catch {
      alert("تعذر الاتصال بخادم الشات");
    } finally {
      setSendingMsgId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        if (status === "DELIVERED") {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          );
        }
      } else {
        alert(data.error || "فشل تحديث حالة الطلب");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vinissia_staff_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto animate-pulse">
            <Truck className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-slate-700 font-black text-sm">جارٍ تحميل قائمة طلبات الدليفري...</p>
        </div>
      </div>
    );
  }

  const activeCount = orders.length;
  const inDeliveryCount = orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-10" dir="rtl">

      {/* ===== COMPACT CLEAN HEADER (NO STORE NAVBAR) ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center justify-between gap-2">

          {/* Brand & Driver Info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="ألبان فينيسيا" className="h-8 w-auto object-contain" />
            <div>
              <p className="text-xs font-black text-slate-900 leading-none">بوابة كابتن الدليفري</p>
              <p className="text-[10px] text-slate-500 font-bold leading-tight mt-0.5 truncate max-w-[120px]">
                كابتن: {currentUser?.name || "الطيار"}
              </p>
            </div>
          </div>

          {/* GPS Location Button */}
          <button
            onClick={getMyLocation}
            disabled={sharingLocation}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
              myLocation
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
            } disabled:opacity-50`}
          >
            <Navigation2 className={`w-3.5 h-3.5 ${sharingLocation ? "animate-spin" : ""}`} />
            <span>
              {sharingLocation ? "تحديد الموقع..." : myLocation ? "✅ موقعك محدد" : "موقعي الحالي"}
            </span>
          </button>

          {/* Refresh & Logout */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition disabled:opacity-50"
              title="تحديث قائمة الطلبات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-4 space-y-3">

        {/* Live Metrics Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">طلب نشط</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-3 text-center shadow-xs">
            <p className="text-2xl font-black text-emerald-700">{readyCount}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">جاهز للاستلام</p>
          </div>
          <div className="bg-white border border-sky-200 rounded-2xl p-3 text-center shadow-xs">
            <p className="text-2xl font-black text-sky-700">{inDeliveryCount}</p>
            <p className="text-[10px] text-sky-600 font-bold mt-0.5">في التوصيل</p>
          </div>
        </div>

        {/* Live Refresh Timestamp */}
        <p className="text-[10px] text-slate-400 text-center">
          آخر تحديث: {lastRefresh.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {" "}— يتحدث تلقائياً كل 20 ثانية
        </p>

        {/* Active Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-700">لا توجد طلبات توصيل نشطة حالياً</p>
            <p className="text-xs text-slate-400">أي طلب دليفري جديد سيظهر هنا فوراً وتلقائياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
              const isExpanded = expandedOrder === order.id;
              const isUpdating = updatingOrder === order.id;
              const address = order.deliveryAddress || order.customerAddress;
              const branchName = order.branch?.name || "فرع حدائق القبة (الرئيسي)";

              return (
                <div key={order.id} className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">

                  {/* ORDER HEADER */}
                  <div className="p-4 space-y-3">

                    {/* Row 1: Order # + Status + Total */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-900">#{orderNum}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                          {STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </span>
                      </div>
                      <span className="text-base font-black text-emerald-700 shrink-0">
                        {order.totalAmount} ج.م
                      </span>
                    </div>

                    {/* Row 2: Branch Info (Dynamic - Not Hardcoded) */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-700">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>فرع التحضير:</span>
                        <span className="text-slate-900 font-black">{branchName}</span>
                      </span>
                      {order.branch?.phone && (
                        <a href={`tel:${order.branch.phone}`} className="font-mono text-blue-600 text-[10px] hover:underline">
                          {order.branch.phone}
                        </a>
                      )}
                    </div>

                    {/* Row 3: Customer Info */}
                    <div className="flex items-center justify-between bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">{order.customerName || "العميل"}</span>
                      </div>
                      {order.customerPhone && (
                        <a href={`tel:${order.customerPhone}`}
                          className="text-xs font-mono font-bold text-blue-600 hover:underline">
                          {order.customerPhone}
                        </a>
                      )}
                    </div>

                    {/* Row 4: DELIVERY ADDRESS */}
                    {address ? (
                      <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200 rounded-2xl p-3">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 leading-snug">
                            {address}
                          </p>
                          {order.deliveryZone && (
                            <p className="text-[10px] text-amber-800 font-bold mt-1">
                              📍 منطقة: {order.deliveryZone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => openDirections(address)}
                          className="shrink-0 py-1.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition flex items-center gap-1 shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>خرائط GPS</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl p-3">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <p className="text-xs text-rose-700 font-bold">⚠️ لم يحدد العميل العنوان — اتصل به هاتفياً</p>
                      </div>
                    )}

                    {/* Row 5: Action Buttons (Call / WhatsApp / Live GPS) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>اتصال بالعميل</span>
                      </a>

                      <a
                        href={`https://wa.me/2${String(order.customerPhone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      <button
                        onClick={() => shareLiveLocation(order.customerPhone, orderNum)}
                        className="py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-sky-200"
                        title="أرسل موقعك المباشر للعميل على واتساب"
                      >
                        <Navigation2 className="w-3.5 h-3.5" />
                        <span>إرسال موقعي</span>
                      </button>
                    </div>

                    {/* Row 6: IN-APP INTERNAL CHAT WITH CUSTOMER & STORE */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>الشات الداخلي (المحل والعميل)</span>
                        </span>
                        {msgSuccessId === order.id && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                            <Check className="w-3 h-3" /> تم الإرسال للشات
                          </span>
                        )}
                      </div>

                      {/* Quick Chips for Driver */}
                      <div className="flex flex-wrap gap-1">
                        {[
                          "🛵 أنا في طريقي إليك الآن",
                          "📍 أنا تحت العمارة حالياً",
                          "📞 يرجى الرد على الهاتف",
                          "✅ تم التسليم بنجاح، شكراً لك",
                        ].map((msg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendQuickMessage(orderNum, order.id, msg)}
                            disabled={sendingMsgId === order.id}
                            className="text-[9px] font-bold py-1 px-2 rounded-lg bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 transition"
                          >
                            {msg}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="اكتب رسالة للعميل أو المحل..."
                          value={quickMessages[order.id] || ""}
                          onChange={(e) =>
                            setQuickMessages((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendQuickMessage(orderNum, order.id);
                          }}
                          className="flex-1 py-1.5 px-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendQuickMessage(orderNum, order.id)}
                          disabled={sendingMsgId === order.id || !(quickMessages[order.id] || "").trim()}
                          className="py-1.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>إرسال</span>
                        </button>
                      </div>
                    </div>

                    {/* Row 7: OPEN LIVE COCKPIT & QR RECEIPT */}
                    <div className="pt-1">
                      <a
                        href={`/track/${orderNum}?mode=courier`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>فتح غرفة التتبع والريسيت الإلكتروني وشات العميل 📱</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    </div>

                    {/* Notes (if any) */}
                    {order.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-[11px] text-amber-900">
                        <AlertCircle className="w-3 h-3 inline ml-1 text-amber-600" />
                        <span className="font-bold">ملاحظة الطلب: </span>{order.notes}
                      </div>
                    )}

                    {/* Row 8: STATUS ACTION BUTTONS */}
                    <div className="pt-1">
                      {order.status === "READY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          <Truck className="w-5 h-5" />
                          {isUpdating ? "جارٍ التحديث..." : "🛵 استلمت الأوردر — بدء التوصيل"}
                        </button>
                      )}
                      {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          {isUpdating ? "جارٍ التأكيد..." : "✅ تأكيد التسليم للعميل وتحصيل المبلغ"}
                        </button>
                      )}
                      {(order.status === "PENDING" || order.status === "PREPARING") && (
                        <div className="w-full py-2.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>جارٍ التجهيز في المعمل — انتظر تسليم الكاشير</span>
                        </div>
                      )}
                    </div>

                    {/* Expand / Collapse Button for Order Items */}
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1 py-1.5 transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>إخفاء أصناف الطلب</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>عرض تفاصيل أصناف الطلب</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* ORDER ITEMS (Safe Expandable) */}
                  {isExpanded && (() => {
                    let parsedItems: any[] = [];
                    try {
                      if (Array.isArray(order.items)) {
                        parsedItems = order.items;
                      } else if (typeof order.items === "string" && order.items) {
                        parsedItems = JSON.parse(order.items);
                      }
                    } catch {
                      parsedItems = [];
                    }
                    if (parsedItems.length === 0) return null;
                    return (
                      <div className="border-t border-slate-100 bg-slate-50/80 p-4 space-y-2">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          <span>محتويات وأصناف الطلب:</span>
                        </p>
                        {parsedItems.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-800">
                              {item.quantity || item.qty || 1}× {item.productName || item.nameAr || item.name || "صنف"}
                            </span>
                            <span className="font-mono text-slate-600 font-bold">
                              {item.totalPrice ?? ((Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1))} ج.م
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-black text-sm pt-2.5 border-t border-slate-200">
                          <span>إجمالي الفاتورة المطلوب تحصيلها:</span>
                          <span className="text-emerald-700 font-mono text-base">{order.totalAmount} ج.م</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}