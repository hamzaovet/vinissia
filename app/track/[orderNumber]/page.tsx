"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";

export default function TrackOrderPage() {
  const params = useParams();
  const orderNumber = params?.orderNumber ? decodeURIComponent(params.orderNumber as string).trim() : "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  // Handle Courier Status Change
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
          <p className="text-xs font-bold text-slate-600">جارٍ تحميل تفاصيل الطلب والتتبع...</p>
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

  // Status mapping
  const statusSteps = [
    { key: "PENDING", label: "تم استلام الطلب", desc: "الطلب مسجل في النظام وبانتظار بدء التجهيز", icon: Clock },
    { key: "PREPARING", label: "قيد التجهيز بالمعمل", desc: "جارٍ وزن وتجهيز منتجات فينيسيا الطازجة", icon: ChefHat },
    { key: "OUT_FOR_DELIVERY", label: "خرج مع الطيار", desc: "الأوردر في الطريق إلى عنوانك الآن", icon: Truck },
    { key: "DELIVERED", label: "تم التسليم بنجاح", desc: "بالهنا والشفا - شكراً لثقتكم في فينيسيا", icon: CheckCircle2 },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.deliveryAddress || "حدائق القبة، القاهرة"
  )}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-8 px-4 font-sans select-none" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header / Nav Back & Emblem */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition bg-white border border-slate-200 py-2 px-3.5 rounded-xl shadow-sm"
          >
            <ArrowRight className="w-4 h-4 text-amber-600" />
            <span>متجر ألبان فينيسيا</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="font-serif font-black text-slate-950 text-sm">فِـيـنِـيـسِـيـا</span>
            <span className="text-amber-500 text-xs">🥛</span>
            <span className="text-[10px] text-rose-600 font-bold border-r border-slate-200 pr-1.5">مش بس لبن وزبادي</span>
          </div>

          <span className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 py-1.5 px-3 rounded-full font-bold">
            #{order.orderNumber}
          </span>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">تتبع مباشر للطلب</span>
              </div>
              <h1 className="text-2xl font-black text-slate-950">
                طلب {order.orderType === "delivery" ? "دليفري وتوصيل للمنازل 🛵" : "استلام فوري من المحل 🏪"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                الفرع المسؤول: <span className="font-bold text-slate-800">{order.branch?.name || "فرع حدائق القبة (الرئيسي)"}</span> • التاريخ: {new Date(order.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>

            <div>
              <span
                className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm ${
                  isCancelled
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : order.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : order.status === "OUT_FOR_DELIVERY"
                    ? "bg-sky-50 text-sky-800 border border-sky-300 animate-pulse"
                    : "bg-amber-50 text-amber-800 border border-amber-300"
                }`}
              >
                {isCancelled
                  ? "ملغي"
                  : order.status === "DELIVERED"
                  ? "تم التسليم بنجاح ✅"
                  : order.status === "OUT_FOR_DELIVERY"
                  ? "خرج مع الطيار في الطريق 🛵"
                  : order.status === "PREPARING"
                  ? "قيد التجهيز والوزن 🥣"
                  : "تم الاستلام والتأكيد 📋"}
              </span>
            </div>
          </div>

          {/* Timeline Steps */}
          {!isCancelled ? (
            <div className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
                {statusSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;

                  return (
                    <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all ${
                          isCurrent
                            ? "bg-amber-500 text-slate-950 ring-4 ring-amber-400/30 shadow-md scale-105"
                            : isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <div className="text-right sm:text-center">
                        <h4 className={`text-xs font-black ${isCurrent ? "text-amber-800 font-black" : isDone ? "text-slate-900" : "text-slate-400"}`}>
                          {step.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 sm:line-clamp-2 mt-0.5 leading-tight">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-rose-600 text-sm font-bold bg-rose-50 rounded-2xl border border-rose-200">
              تم إلغاء هذا الطلب. للتواصل مع الإدارة يرجى الاتصال على 0224382540
            </div>
          )}
        </div>

        {/* COURIER INTERACTIVE PANEL (لوحة تحكم الطيار وسكان الكيو ار) */}
        {order.orderType === "delivery" && order.status !== "DELIVERED" && !isCancelled && (
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  🛵
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">لوحة تحكم طيار فينيسيا السريعة</h3>
                  <p className="text-[11px] text-amber-800">
                    أنت الآن في صفحة تتبع الطلب الخاصة بالطريق والتسليم
                  </p>
                </div>
              </div>

              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>فتح العنوان في Google Maps 🗺️</span>
              </a>
            </div>

            {/* Courier Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={updatingStatus || order.status === "OUT_FOR_DELIVERY"}
                onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY")}
                className={`py-3 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 ${
                  order.status === "OUT_FOR_DELIVERY"
                    ? "bg-sky-100 text-sky-800 border border-sky-300 opacity-80"
                    : "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{order.status === "OUT_FOR_DELIVERY" ? "الطلب في الطريق للعميل حالياً 🛵" : "استلمت الطلب وأنا في الطريق للعميل 🛵"}</span>
              </button>

              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleUpdateStatus("DELIVERED")}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تم تسليم الطلب وتحصيل {order.totalAmount} ج.م ✅</span>
              </button>
            </div>
          </div>
        )}

        {/* Customer & Address Details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>بيانات العميل وموقع التسليم</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[11px] block">اسم العميل:</span>
              <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
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
                  منطقة: {order.deliveryZone}
                </span>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
              <span className="text-amber-900 font-bold">ملاحظات العميل: </span>
              <span className="text-slate-700">{order.notes}</span>
            </div>
          )}
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>محتويات الطلب ({parsedItems.length} صنف)</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {parsedItems.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.nameAr || item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    الكمية: <span className="font-mono font-bold text-amber-700">{item.qty || item.quantity}</span> {item.unit}
                    {item.weightGrams ? ` (${item.weightGrams} جرام)` : ""}
                  </p>
                </div>
                <div className="text-left font-mono font-bold text-slate-900 text-sm">
                  {(item.total || (item.unitPrice || item.price) * (item.qty || item.quantity)).toFixed(1)} ج.م
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
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

        {/* Footer Contact */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>منتجات فينيسيا طازجة ومصنعة يومياً بأعلى معايير الجودة</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/201018671000?text=${encodeURIComponent(
                `مرحباً ألبان فينيسيا، أستفسر عن طلبي رقم #${order.orderNumber}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب الفرع</span>
            </a>

            <a
              href="tel:0224382540"
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <Phone className="w-4 h-4 text-amber-600" />
              <span>اتصال هاتفي</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
