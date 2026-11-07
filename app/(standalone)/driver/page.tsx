"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        // Show all delivery orders that are not done or cancelled
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
    // Allow delivery, owner, manager to see this page
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
        alert("تعذر الحصول على موقعك، تأكد من تفعيل GPS");
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
      alert("اضغط على 'موقعي الحالي' أولاً لتحديد موقعك");
      return;
    }
    const mapsLink = `https://www.google.com/maps?q=${myLocation.lat},${myLocation.lng}`;
    const msg = `📍 مرحباً، أنا طيار ألبان فينيسيا 🛵\nجارٍ التوصيل لطلبك رقم #${orderNumber}\nموقعي الحالي: ${mapsLink}`;
    window.open(
      `https://wa.me/2${String(customerPhone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
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
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto animate-pulse">
            <Truck className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-slate-600 font-bold text-sm">جارٍ تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  const activeCount = orders.length;
  const inDeliveryCount = orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans" dir="rtl">

      {/* ===== COMPACT HEADER ===== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center justify-between gap-2">

          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="فينيسيا" className="h-8 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="text-[11px] font-black text-slate-800 leading-none">بوابة طيار</p>
              <p className="text-[9px] text-slate-500 leading-none truncate max-w-[100px]">
                {currentUser?.name || "الطيار"}
              </p>
            </div>
          </div>

          {/* GPS Location Button */}
          <button
            onClick={getMyLocation}
            disabled={sharingLocation}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
              myLocation
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            } disabled:opacity-50`}
          >
            <Navigation2 className="w-3.5 h-3.5" />
            {sharingLocation ? "جارٍ تحديد..." : myLocation ? "✅ تم تحديد موقعك" : "موقعي الحالي"}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
              title="تحديث الطلبات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-4 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">طلب نشط</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-2xl font-black text-emerald-700">{readyCount}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">جاهز للاستلام</p>
          </div>
          <div className="bg-white border border-sky-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-2xl font-black text-sky-700">{inDeliveryCount}</p>
            <p className="text-[10px] text-sky-600 font-bold mt-0.5">في التوصيل</p>
          </div>
        </div>

        {/* Contact Store Bar */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950">التواصل مع المحل</p>
              <p className="text-[10px] text-amber-700">لأي سؤال أو مشكلة</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <a href="tel:0226342212" className="py-1.5 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-800 font-bold text-[10px] hover:bg-amber-100 transition flex items-center gap-1">
              <Phone className="w-3 h-3" />مصر الجديدة
            </a>
            <a href="https://wa.me/201118400150" target="_blank" rel="noreferrer"
              className="py-1.5 px-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />واتساب
            </a>
          </div>
        </div>

        {/* Last refresh time */}
        <p className="text-[10px] text-slate-400 text-center">
          آخر تحديث: {lastRefresh.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {" "}— يتحدث تلقائياً كل 20 ثانية
        </p>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm space-y-3">
            <Package className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-sm font-black text-slate-600">لا توجد طلبات نشطة الآن</p>
            <p className="text-xs text-slate-400">سيتم التحديث تلقائياً عند ورود طلبات جديدة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
              const isExpanded = expandedOrder === order.id;
              const isUpdating = updatingOrder === order.id;

              return (
                <div key={order.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

                  {/* ORDER HEADER — always visible */}
                  <div className="p-4 space-y-2">

                    {/* Top row: order # + status badge + amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900">#{orderNum}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                          {STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </span>
                      </div>
                      <span className="text-base font-black text-emerald-700 shrink-0">
                        {order.totalAmount} ج.م
                      </span>
                    </div>

                    {/* Customer name + phone */}
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">{order.customerName || "عميل"}</span>
                      {order.customerPhone && (
                        <a href={`tel:${order.customerPhone}`}
                          className="text-[10px] font-mono text-blue-600 hover:underline ml-auto">
                          {order.customerPhone}
                        </a>
                      )}
                    </div>

                    {/* ADDRESS — most important for driver! */}
                    {(order.deliveryAddress || order.customerAddress) ? (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 leading-snug">
                            {order.deliveryAddress || order.customerAddress}
                          </p>
                          {order.deliveryZone && (
                            <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                              📍 {order.deliveryZone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => openDirections(order.deliveryAddress || order.customerAddress)}
                          className="shrink-0 py-1 px-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-500 transition flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" />خرائط
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <p className="text-xs text-rose-700 font-bold">⚠️ لم يحدد العميل العنوان — اتصل به مباشرة</p>
                      </div>
                    )}

                    {/* Quick action buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Call customer */}
                      <a href={`tel:${order.customerPhone}`}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-slate-200">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />اتصال
                      </a>

                      {/* WhatsApp customer */}
                      <a href={`https://wa.me/2${String(order.customerPhone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-emerald-200">
                        <MessageCircle className="w-3.5 h-3.5" />واتساب
                      </a>

                      {/* Share live location */}
                      <button
                        onClick={() => shareLiveLocation(order.customerPhone, orderNum)}
                        className="py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px] transition flex items-center justify-center gap-1 border border-sky-200"
                        title="أرسل موقعك الحالي للعميل عبر واتساب"
                      >
                        <Navigation2 className="w-3.5 h-3.5" />موقعي
                      </button>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-[11px] text-amber-900">
                        <AlertCircle className="w-3 h-3 inline ml-1 text-amber-600" />
                        <span className="font-bold">ملاحظة: </span>{order.notes}
                      </div>
                    )}

                    {/* STATUS ACTION BUTTONS */}
                    <div>
                      {order.status === "READY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          <Truck className="w-5 h-5" />
                          {isUpdating ? "جارٍ التحديث..." : "🛵 بدء التوصيل — استلمت الطلب"}
                        </button>
                      )}
                      {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          {isUpdating ? "جارٍ التأكيد..." : "✅ تأكيد التسليم للعميل"}
                        </button>
                      )}
                      {(order.status === "PENDING" || order.status === "PREPARING") && (
                        <div className="w-full py-2.5 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200">
                          <Clock className="w-4 h-4" />
                          جارٍ التجهيز في المحل — انتظر التنبيه
                        </div>
                      )}
                    </div>

                    {/* Expand for order items */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1 py-1 transition"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-3.5 h-3.5" />إخفاء تفاصيل الطلب</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" />عرض تفاصيل الطلب</>
                      )}
                    </button>
                  </div>

                  {/* ORDER ITEMS (expandable) */}
                  {isExpanded && (() => {
                    // items may be a JSON string from DB — parse safely
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
                      <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-1.5">
                        <p className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-2">
                          <Package className="w-3.5 h-3.5" />محتويات الطلب
                        </p>
                        {parsedItems.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-800">
                              {item.quantity || item.qty || 1}× {item.productName || item.nameAr || item.name || "صنف"}
                            </span>
                            <span className="font-mono text-slate-500">
                              {item.totalPrice ?? ((Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1))} ج.م
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200">
                          <span>الإجمالي</span>
                          <span className="text-emerald-700">{order.totalAmount} ج.م</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 space-y-1">
          <p className="text-[10px] text-slate-400 font-bold">ألبان فينيسيا — مش بس لبن وزبادي 🥛</p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-400">
            <a href="tel:0226342212" className="hover:text-slate-600 transition">مصر الجديدة: 0226342212</a>
            <a href="tel:0224555203" className="hover:text-slate-600 transition">حدائق القبة: 0224555203</a>
          </div>
        </div>
      </main>
    </div>
  );
}
