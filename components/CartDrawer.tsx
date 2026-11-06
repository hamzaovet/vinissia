"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/cartContext";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  ArrowRight,
} from "lucide-react";

interface Settings {
  whatsapp?: string;
  phone?: string;
  minDeliveryOrder?: number;
  deliveryZones?: string;
}

export default function CartDrawer({ settings }: { settings?: Settings }) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState("حدائق القبة والوايلي الكبير");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  const whatsappNumber = settings?.whatsapp || "01018671000";
  const minOrder = settings?.minDeliveryOrder || 50;
  const deliveryFee = 15.0;
  const total = subtotal + (subtotal > 0 ? deliveryFee : 0);

  let parsedZones: Array<{ name: string; fee: number; time: number }> = [
    { name: "حدائق القبة والوايلي الكبير", fee: 15, time: 25 },
    { name: "الزاوية الحمراء ودير الملاك", fee: 20, time: 35 },
    { name: "منشية الصدر والعباسية", fee: 25, time: 40 },
  ];
  try {
    if (settings?.deliveryZones) {
      parsedZones = JSON.parse(settings.deliveryZones);
    }
  } catch {}

  const activeZone = parsedZones.find((z) => z.name === selectedZone) || parsedZones[0];
  const activeFee = activeZone ? activeZone.fee : deliveryFee;
  const finalTotal = subtotal + activeFee;

  // 1. Direct WhatsApp Order
  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    let text = `🥛 *طلب دليفري جديد من ألبان فينيسيا*\n`;
    text += `--------------------------------\n`;
    items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.nameAr}* (${item.unit}) × ${item.quantity} = ${item.price * item.quantity} ج.م\n`;
    });
    text += `--------------------------------\n`;
    text += `💰 *إجمالي الأصناف:* ${subtotal} ج.م\n`;
    text += `🛵 *خدمة التوصيل التقديرية:* ${activeFee} ج.م\n`;
    text += `🏷️ *الإجمالي المطلوب:* ${finalTotal} ج.م\n\n`;

    if (customerName) text += `👤 *الاسم:* ${customerName}\n`;
    if (customerPhone) text += `📞 *الهاتف:* ${customerPhone}\n`;
    if (customerAddress) text += `📍 *العنوان:* ${customerAddress} (${selectedZone})\n`;
    if (customerNotes) text += `📝 *ملاحظات:* ${customerNotes}\n`;

    const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/2${cleanWa}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  // 2. Online System Order
  const handleSubmitOnlineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert("يرجى ملء الاسم ورقم الهاتف والعنوان بالتفصيل");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "delivery",
          customerName,
          customerPhone,
          deliveryAddress: customerAddress,
          deliveryZone: selectedZone,
          items: items.map((i) => ({
            productId: i.productId,
            nameAr: i.nameAr,
            unit: i.unit,
            qty: i.quantity,
            unitPrice: i.price,
            total: i.price * i.quantity,
            isWeighted: i.isWeighted,
            weightGrams: i.weightGrams,
          })),
          subtotal,
          deliveryFee: activeFee,
          totalAmount: finalTotal,
          paymentMethod: "cash",
          notes: customerNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setCreatedOrderNumber(data.order.orderNumber);
        setCheckoutStep("success");
        clearCart();
      } else {
        alert(data.error || "حدث خطأ أثناء إرسال الطلب");
      }
    } catch (err) {
      console.error(err);
      alert("تعذر الاتصال بالخادم، يمكنك إرسال الطلب عبر الواتساب فوراً");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0a1220] border-r border-cyan-500/20 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">سلة طلبات ألبان فينيسيا</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {itemCount} {itemCount === 1 ? "صنف" : "أصناف"} مختارة
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {checkoutStep === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">سلتك فارغة حالياً</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        تصفح منتجاتنا الطازجة من الألبان والأجبان المصنعة وحلويات فينيسيا وأضف ما تشتهي!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{item.nameAr}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              {item.unit}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              {item.price} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono font-bold text-xs text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="حذف من السلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={clearCart}
                        className="text-[11px] text-rose-400/80 hover:text-rose-300 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>تفريغ السلة بالكامل</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CHECKOUT FORM STEP */}
            {checkoutStep === "form" && (
              <form onSubmit={handleSubmitOnlineOrder} className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>بيانات مستلم الطلب</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">الاسم الكريم *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: أ/ حمزة عباس"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">رقم الهاتف / الواتساب *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01018671000"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>عنوان التوصيل والمنطقة</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">المنطقة والحي *</label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                    >
                      {parsedZones.map((z) => (
                        <option key={z.name} value={z.name}>
                          {z.name} (دليفري {z.fee} ج.م — حوالي {z.time} دقيقة)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">العنوان بالتفصيل (الشارع، العمارة، الشقة) *</label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="مثال: 464 شارع سكة الوايلي، الدور الثالث، شقة 6"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">ملاحظات خاصة للأوردر (اختياري)</label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="مثال: اللبن بارد، رنة جرس خفيفة"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? "جارٍ تسجيل الطلب..." : "تأكيد الطلب الآن في السيستم"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* SUCCESS STEP */}
            {checkoutStep === "success" && (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white">تم استلام طلبك بنجاح! 🎉</h4>
                  <p className="text-xs text-slate-300">
                    رقم الطلب الخاص بك: <span className="font-mono font-bold text-amber-400 text-sm">#{createdOrderNumber}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    معمل ألبان فينيسيا يقوم الآن بتجهيز طلبك وسيخرج مع طيار الدليفري بأسرع وقت.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <a
                    href={`/track/${createdOrderNumber}`}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>تتبع خط سير الأوردر لايف</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutStep("cart");
                      setIsOpen(false);
                    }}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    العودة للمتجر
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Action Buttons */}
          {items.length > 0 && checkoutStep === "cart" && (
            <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-3">
              {/* Summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono text-white">{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>خدمة التوصيل ({selectedZone}):</span>
                  <span className="font-mono text-white">{activeFee} ج.م</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>الإجمالي:</span>
                  <span className="font-mono text-amber-400 text-lg">{finalTotal} ج.م</span>
                </div>
              </div>

              {subtotal < minOrder && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 text-center">
                  الحد الأدنى لطلب الدليفري هو {minOrder} ج.م
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. WhatsApp Button */}
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>اطلب بالواتساب</span>
                </button>

                {/* 2. Online Checkout Button */}
                <button
                  onClick={() => setCheckoutStep("form")}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Truck className="w-4 h-4" />
                  <span>دليفري أونلاين</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
