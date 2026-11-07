"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  LogOut,
  RefreshCw,
  Navigation,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "في الانتظار",
  PREPARING: "جارٍ التجهيز",
  READY: "جاهز للتسليم",
  OUT_FOR_DELIVERY: "خرج للتوصيل 🛵",
  DELIVERED: "تم التوصيل ✅",
  CANCELLED: "ملغي",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PREPARING: "bg-blue-100 text-blue-800 border-blue-300",
  READY: "bg-emerald-100 text-emerald-800 border-emerald-300",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-800 border-sky-300",
  DELIVERED: "bg-slate-100 text-slate-700 border-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
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

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
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
      alert("غير مصرح لك بالدخول لهذه الصفحة");
      router.push("/login");
      return;
    }
    setCurrentUser(parsed);
    fetchOrders().finally(() => setLoading(false));
  }, [router, fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrder(orderId);
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
        alert("فشل تحديث حالة الطلب");
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
      <div
        className="min-h-screen bg-white flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center space-y-3">
          <Truck className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
          <p className="text-slate-600 font-bold">جارٍ تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center">
              <img src="/logo.png" alt="فينيسيا" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">
                🛵 بوابة الطيار
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {currentUser?.name || "الطيار"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-amber-600">{orders.length}</p>
            <p className="text-[10px] text-slate-500 font-bold">طلب نشط</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-sky-600">
              {orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">في التوصيل</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
            <p className="text-[10px] font-black text-slate-700">
              {lastRefresh.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">آخر تحديث</p>
          </div>
        </div>

        {/* Contact Store */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950">التواصل مع المحل</p>
              <p className="text-[10px] text-amber-700">لأي مشكلة أو سؤال أثناء التوصيل</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="tel:01118400150"
              className="py-1.5 px-3 rounded-xl bg-white border border-amber-300 text-amber-800 font-bold text-xs hover:bg-amber-100 transition flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              اتصال
            </a>
            <a
              href="https://wa.me/201118400150"
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              واتساب
            </a>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-700">لا توجد طلبات نشطة الآن</p>
            <p className="text-xs text-slate-400">سيتم تحديث الصفحة تلقائياً عند ورود طلبات جديدة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status as OrderStatus]}`}
                        >
                          {STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                        {order.customerName || "عميل"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        📍 {order.customerAddress || "لم يحدد العنوان"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-black text-emerald-700">
                        {order.totalAmount} ج.م
                      </span>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
                    {/* Customer Contact */}
                    <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {order.customerName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {order.customerPhone}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/2${String(order.customerPhone).replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {order.customerAddress}
                          </p>
                          {order.deliveryZone && (
                            <p className="text-[10px] text-slate-500">
                              المنطقة: {order.deliveryZone}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 mt-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-blue-200"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        فتح في خرائط جوجل
                      </a>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1.5">
                        <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          محتويات الطلب
                        </p>
                        {order.items.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between items-center text-[11px]"
                          >
                            <span className="text-slate-700 font-semibold">
                              {item.quantity}× {item.productName || item.nameAr}
                            </span>
                            <span className="text-slate-500 font-mono">
                              {item.totalPrice} ج.م
                            </span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black text-xs">
                          <span>الإجمالي</span>
                          <span className="text-emerald-700">{order.totalAmount} ج.م</span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 inline ml-1 text-amber-600" />
                        <span className="font-bold">ملاحظات العميل: </span>
                        {order.notes}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {order.status === "READY" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")
                          }
                          disabled={updatingOrder === order.id}
                          className="col-span-2 py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          {updatingOrder === order.id
                            ? "جارٍ التحديث..."
                            : "🛵 بدء التوصيل"}
                        </button>
                      )}

                      {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                          disabled={updatingOrder === order.id}
                          className="col-span-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {updatingOrder === order.id
                            ? "جارٍ التأكيد..."
                            : "✅ تأكيد التسليم للعميل"}
                        </button>
                      )}

                      {(order.status === "PENDING" || order.status === "PREPARING") && (
                        <div className="col-span-2 flex items-center gap-1.5 p-2.5 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold justify-center border border-slate-200">
                          <Clock className="w-3.5 h-3.5" />
                          جارٍ التجهيز في المحل...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Contact */}
        <div className="text-center py-4 text-[10px] text-slate-400 space-y-1">
          <p className="font-bold">ألبان فينيسيا — مش بس لبن وزبادي</p>
          <div className="flex justify-center gap-4">
            <a href="tel:0226342212" className="hover:text-slate-600 transition">
              مصر الجديدة: 0226342212
            </a>
            <a href="tel:0224555203" className="hover:text-slate-600 transition">
              حدائق القبة: 0224555203
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
