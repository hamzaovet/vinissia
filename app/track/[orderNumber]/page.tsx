import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function TrackOrderPage({ params }: Props) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber: decodeURIComponent(orderNumber).trim() },
    include: {
      courier: true,
      customer: true,
    },
  });

  const settings = await prisma.systemSettings.findFirst();

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black">الطلب غير موجود</h2>
          <p className="text-sm text-slate-400">
            لم نتمكن من العثور على طلب برقم <span className="font-mono text-amber-400 font-bold">{orderNumber}</span>. يرجى التأكد من الرقم والمحاولة مرة أخرى.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20"
            >
              <Store className="w-4 h-4" />
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
    { key: "PREPARING", label: "قيد التجهيز بالمعمل", desc: "جارٍ وزن وتقطيع منتجات فينيسيا الطازجة", icon: ChefHat },
    { key: "OUT_FOR_DELIVERY", label: "خرج مع الطيار", desc: "الأوردر في الطريق إلى عنوانك الآن", icon: Truck },
    { key: "DELIVERED", label: "تم التسليم بنجاح", desc: "بالهنا والشفا - شكراً لثقتكم في فينيسيا", icon: CheckCircle2 },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "CANCELLED";

  const storePhone = settings?.phone || "01018671000";
  const storeWhatsapp = settings?.whatsapp || "01018671000";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header / Nav Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition bg-slate-900 border border-slate-800 py-2 px-3.5 rounded-xl"
          >
            <ArrowRight className="w-4 h-4" />
            <span>متجر ألبان فينيسيا</span>
          </Link>

          <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 py-1.5 px-3 rounded-full font-bold">
            #{order.orderNumber}
          </span>
        </div>

        {/* Live Status Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">تتبع مباشر للطلب</span>
              </div>
              <h1 className="text-2xl font-black text-white">
                طلب {order.orderType === "delivery" ? "دليفري توصيل للمنازل" : "استلام من المحل"}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                تاريخ الطلب: {new Date(order.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span
                className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black ${
                  isCancelled
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : order.status === "DELIVERED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : order.status === "OUT_FOR_DELIVERY"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {isCancelled
                  ? "ملغي"
                  : order.status === "DELIVERED"
                  ? "تم التسليم ✅"
                  : order.status === "OUT_FOR_DELIVERY"
                  ? "في الطريق 🛵"
                  : order.status === "PREPARING"
                  ? "قيد التجهيز 🥣"
                  : "تم الاستلام 📋"}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {!isCancelled ? (
            <div className="pt-8">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 right-5 left-5 h-1 bg-slate-800 -z-0 hidden sm:block" />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
                  {statusSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isDone = currentStatusIndex >= idx;
                    const isCurrent = currentStatusIndex === idx;

                    return (
                      <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all ${
                            isCurrent
                              ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30 scale-110"
                              : isDone
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <div className="sm:mt-2 text-right sm:text-center">
                          <h4 className={`text-xs font-black ${isCurrent ? "text-amber-400" : isDone ? "text-white" : "text-slate-500"}`}>
                            {step.label}
                          </h4>
                          <p className="text-[11px] text-slate-400 sm:line-clamp-2 mt-0.5 leading-tight">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-6 text-center text-rose-400 text-sm font-bold">
              تم إلغاء هذا الطلب. للتواصل مع الإدارة يرجى الاتصال على {storePhone}
            </div>
          )}
        </div>

        {/* Courier Info (If Assigned) */}
        {order.courier && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-cyan-400 font-bold">طيار التوصيل المسؤول</span>
                <h3 className="text-base font-black text-white">{order.courier.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{order.courier.phone}</p>
              </div>
            </div>

            <a
              href={`tel:${order.courier.phone}`}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال بالكابتن</span>
            </a>
          </div>
        )}

        {/* Customer & Address Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>بيانات التسليم والعنوان</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-slate-400">اسم العميل:</span>
              <p className="font-bold text-white text-sm">{order.customerName}</p>
              <p className="font-mono text-slate-400">{order.customerPhone}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-slate-400">العنوان والمنطقة:</span>
              <p className="font-bold text-white text-sm">{order.deliveryAddress}</p>
              <p className="text-amber-400 font-semibold">{order.deliveryZone}</p>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-slate-400">ملاحظات العميل:</span>
              <p className="text-slate-300 mt-1">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Items Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>محتويات الطلب ({parsedItems.length} صنف)</span>
          </h3>

          <div className="divide-y divide-slate-800/80">
            {parsedItems.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{item.nameAr || item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    الكمية: <span className="font-mono font-bold text-amber-300">{item.qty || item.quantity}</span> {item.unit}
                    {item.weightGrams ? ` (${item.weightGrams} جرام)` : ""}
                  </p>
                </div>
                <div className="text-left font-mono font-bold text-white text-sm">
                  {(item.total || (item.unitPrice || item.price) * (item.qty || item.quantity)).toFixed(1)} ج.م
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الفرعي:</span>
              <span className="font-mono text-white">{order.subtotal} ج.م</span>
            </div>
            {order.orderType === "delivery" && (
              <div className="flex justify-between text-slate-400">
                <span>مصاريف التوصيل:</span>
                <span className="font-mono text-white">{order.deliveryFee} ج.م</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>الخصم:</span>
                <span className="font-mono">-{order.discount} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>الإجمالي المطلوب:</span>
              <span className="font-mono text-amber-400 text-lg">{order.totalAmount} ج.م</span>
            </div>
          </div>
        </div>

        {/* Quick Help Footer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>منتجات فينيسيا طازجة ومصنعة يومياً بأعلى معايير الجودة</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/2${storeWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `مرحباً ألبان فينيسيا، أستفسر عن طلبي رقم #${order.orderNumber}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب الفرع</span>
            </a>

            <a
              href={`tel:${storePhone}`}
              className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال هاتفي</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
