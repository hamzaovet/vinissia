"use client";

import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  Building2,
  KeyRound,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface Settings {
  whatsapp?: string;
  phone?: string;
  minDeliveryOrder?: number;
  deliveryZones?: string;
}

// Multi-Branch Definitions
const STORE_BRANCHES = [
  {
    id: "BR-HELIOPOLIS",
    name: "فرع مصر الجديدة وجسر السويس",
    address: "17 ش أحمد خليل من جسر السويس - أمام سنترال مصر الجديدة",
    phone: "0226342212",
    zones: [
      { name: "جسر السويس وسنترال مصر الجديدة", fee: 15, time: 20 },
      { name: "روكسي والكوربة وهليوبوليس", fee: 20, time: 25 },
      { name: "الألف مسكن وعين شمس الشرقية", fee: 20, time: 25 },
      { name: "الحجاز وسانت فاتيما وميدان الحجاز", fee: 20, time: 25 },
      { name: "النزهة الجديدة ومساكن شيراتون", fee: 25, time: 35 },
      { name: "تريومف وميدان الإسماعيلية", fee: 20, time: 30 },
      { name: "مدينة نصر (مكرم عبيد وعباس العقاد)", fee: 30, time: 40 },
    ],
  },
  {
    id: "HQ-QOBBA",
    name: "فرع حدائق القبة (الرئيسي)",
    address: "101 تقسيم الرقابة الإدارية - شارع المدينة المنورة متفرع من ولي العهد",
    phone: "0224555203",
    zones: [
      { name: "حدائق القبة والوايلي الكبير", fee: 15, time: 20 },
      { name: "شارع مصر والسودان وسكة الوايلي", fee: 15, time: 20 },
      { name: "الزيتون وسراي القبة", fee: 20, time: 25 },
      { name: "العباسية ومنشية الصدر", fee: 20, time: 30 },
      { name: "دير الملاك والزاوية الحمراء", fee: 20, time: 30 },
      { name: "حمامات القبة وكوبري القبة", fee: 15, time: 20 },
      { name: "الظاهر وباب الشعرية", fee: 25, time: 40 },
    ],
  },
];

export default function CartDrawer({ settings }: { settings?: Settings }) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "otp" | "success">("cart");
  
  // Branch & Delivery Details
  const [selectedBranchId, setSelectedBranchId] = useState<string>("BR-HELIOPOLIS");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZoneName, setSelectedZoneName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  
  // OTP Verification State
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [serverDebugOtp, setServerDebugOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  
  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  const activeBranch = STORE_BRANCHES.find((b) => b.id === selectedBranchId) || STORE_BRANCHES[0];
  const activeBranchZones = activeBranch.zones;

  // Set default zone when branch changes
  useEffect(() => {
    if (activeBranchZones.length > 0) {
      setSelectedZoneName(activeBranchZones[0].name);
    }
  }, [selectedBranchId]);

  const activeZone = activeBranchZones.find((z) => z.name === selectedZoneName) || activeBranchZones[0];
  const activeDeliveryFee = activeZone ? activeZone.fee : 15;
  const finalTotal = subtotal + activeDeliveryFee;
  const minOrder = settings?.minDeliveryOrder || 50;

  // 1. Direct WhatsApp Order
  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    let text = `🥛 *طلب دليفري جديد من ألبان فينيسيا*\n`;
    text += `🏢 *الفرع المختار:* ${activeBranch.name}\n`;
    text += `📍 *عنوان الفرع:* ${activeBranch.address}\n`;
    text += `--------------------------------\n`;
    items.forEach((item, idx) => {
      text += `${idx + 1}. *${item.nameAr}* (${item.unit}) × ${item.quantity} = ${item.price * item.quantity} ج.م\n`;
    });
    text += `--------------------------------\n`;
    text += `💰 *إجمالي الأصناف:* ${subtotal} ج.م\n`;
    text += `🛵 *خدمة التوصيل (${selectedZoneName}):* ${activeDeliveryFee} ج.م\n`;
    text += `🏷️ *الإجمالي المطلوب:* ${finalTotal} ج.م\n\n`;

    if (customerName) text += `👤 *الاسم:* ${customerName}\n`;
    if (customerPhone) text += `📞 *الهاتف:* ${customerPhone}\n`;
    if (customerAddress) text += `📍 *العنوان:* ${customerAddress}\n`;
    if (customerNotes) text += `📝 *ملاحظات:* ${customerNotes}\n`;

    const waNum = "01118400150";
    const waUrl = `https://wa.me/2${waNum}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  // 2. Start Online Order & Check WhatsApp Verification
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert("يرجى ملء الاسم ورقم الهاتف والعنوان بالتفصيل");
      return;
    }

    const cleanPhone = customerPhone.trim();
    const verifiedPhone = localStorage.getItem(`vinissia_verified_${cleanPhone}`);

    if (verifiedPhone === "true") {
      // Already verified customer, submit directly
      await executeOrderPlacement();
    } else {
      // Need WhatsApp OTP verification
      try {
        setSubmitting(true);
        setOtpError("");
        const res = await fetch("/api/auth/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SEND_OTP",
            phone: cleanPhone,
            name: customerName,
            address: customerAddress,
            zone: selectedZoneName,
            verificationMethod: "WHATSAPP",
          }),
        });

        const data = await res.json();
        if (data.success) {
          if (data.debugOtp) setServerDebugOtp(data.debugOtp);
          setCheckoutStep("otp");
        } else {
          setOtpError(data.error || "تعذر إرسال كود التحقق، يرجى المحاولة ثانية");
        }
      } catch {
        setOtpError("تعذر الاتصال بخادم التوثيق");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // 3. Verify WhatsApp OTP & Execute Order
  const handleVerifyOtpAndPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) {
      setOtpError("يرجى كتابة كود التحقق المكون من 6 أرقام");
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError("");

      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_OTP",
          phone: customerPhone.trim(),
          otpCode: otpCodeInput.trim(),
          name: customerName.trim(),
          address: customerAddress.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`vinissia_verified_${customerPhone.trim()}`, "true");
        await executeOrderPlacement();
      } else {
        setOtpError(data.error || "كود التحقق غير صحيح، يرجى التحقق من الرسالة");
      }
    } catch {
      setOtpError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 4. Final Order Placement in Database
  const executeOrderPlacement = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "delivery",
          branchId: selectedBranchId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: customerAddress.trim(),
          deliveryZone: `${activeBranch.name} — ${selectedZoneName}`,
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
          deliveryFee: activeDeliveryFee,
          totalAmount: finalTotal,
          paymentMethod: "cash",
          notes: customerNotes ? `[فرع: ${activeBranch.name}] ${customerNotes}` : `[فرع: ${activeBranch.name}]`,
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
    <div className="fixed inset-0 z-50 overflow-hidden font-sans" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        {/* PURE MILK WHITE CART PANEL */}
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-base">سلة طلبات ألبان فينيسيا</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {itemCount} {itemCount === 1 ? "صنف" : "أصناف"} مختارة
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* STEP 1: CART ITEMS */}
            {checkoutStep === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-800">سلتك فارغة حالياً</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        تصفح ألبان وأجبان فينيسيا الطازجة وحلوياتنا الفاخرة وأضف ما تشتهي لسلتك!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs hover:border-amber-400/60 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                            {item.nameAr}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              {item.unit}
                            </span>
                            <span className="text-xs font-mono font-black text-slate-700">
                              {item.price} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono font-black text-xs text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={clearCart}
                        className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>تفريغ السلة بالكامل</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM WITH BRANCH & ZONE SELECTION */}
            {checkoutStep === "form" && (
              <form onSubmit={handleProceedToVerification} className="space-y-4">
                {/* 1. Branch Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>اختر الفرع المسؤول عن تجهيز طلبك *</span>
                    </label>
                    <span className="text-[10px] text-slate-500">فرعين متاحين</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {STORE_BRANCHES.map((b) => {
                      const isSelected = b.id === selectedBranchId;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBranchId(b.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-400/20"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="branchChoice"
                            checked={isSelected}
                            onChange={() => setSelectedBranchId(b.id)}
                            className="mt-0.5 text-amber-600"
                          />
                          <div className="flex-1">
                            <h5 className="font-black text-xs">{b.name}</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">{b.address}</p>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              تليفون: {b.phone}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Customer Contact Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>بيانات مستلم الطلب</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-bold">الاسم الكريم *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: أ/ حمزة عباس"
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-bold transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] text-slate-600 font-bold">رقم الهاتف / الواتساب *</label>
                      <span className="text-[10px] text-emerald-600 font-bold">سيصلك كود التوثيق عليه</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01018671000"
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* 3. Address & Dynamic Zone */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>عنوان التوصيل والمنطقة</span>
                  </h4>

                  {/* Zone Filter (Tailored to chosen branch) */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-bold">
                      المنطقة والحي (نطاق {activeBranch.name}) *
                    </label>
                    <select
                      value={selectedZoneName}
                      onChange={(e) => setSelectedZoneName(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition"
                    >
                      {activeBranchZones.map((z) => (
                        <option key={z.name} value={z.name}>
                          {z.name} — دليفري {z.fee} ج.م (حوالي {z.time} دقيقة)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-bold">
                      العنوان بالتفصيل (الشارع، العمارة، الدور، الشقة) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="مثال: شارع سكة الوايلي، عمارة 12، الدور 3، شقة 5"
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-600 font-bold">ملاحظات للأوردر (اختياري)</label>
                    <input
                      type="text"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="مثال: اللبن بارد ومثلج، رنة جرس خفيفة"
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Form Nav Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                  >
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? "جارٍ التحقق..." : "متابعة لتأكيد الطلب والتوثيق"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: WHATSAPP OTP VERIFICATION */}
            {checkoutStep === "otp" && (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      تأكيد رقم الهاتف عبر الواتساب 💬
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      لضمان دقة توصيل الدليفري وحفظ بيانات طلبك، يرجى كتابة كود التحقق المرسل لرقمك{" "}
                      <span className="font-mono font-black">{customerPhone}</span>
                    </p>
                  </div>

                  {serverDebugOtp && (
                    <div className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-mono font-black">
                      كود التحقق الخاص بك هو: <span className="text-sm underline">{serverDebugOtp}</span>
                    </div>
                  )}

                  {/* Direct WhatsApp Trigger Button */}
                  <a
                    href={`https://wa.me/201118400150?text=${encodeURIComponent(
                      `مرحباً ألبان فينيسيا، أود تأكيد رقم هاتفي لطلب الدليفري: ${customerPhone}، كود التحقق: ${serverDebugOtp || "157230"}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>فتح محادثة الواتساب للتأكيد الفوري</span>
                  </a>
                </div>

                {otpError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{otpError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtpAndPlaceOrder} className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">أدخل كود التحقق (6 أرقام) *</label>
                      <span className="text-[10px] text-slate-400 font-mono">(كود تجربة: 157230)</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCodeInput}
                        onChange={(e) => setOtpCodeInput(e.target.value)}
                        placeholder="••••••"
                        className="w-full py-3 pr-10 pl-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-mono tracking-widest text-center focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("form")}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      تعديل البيانات
                    </button>
                    <button
                      type="submit"
                      disabled={verifyingOtp || submitting}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{verifyingOtp ? "جارٍ التحقق وتأكيد الطلب..." : "تأكيد الكود وإتمام الطلب ✅"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {checkoutStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-slate-950">تم تأكيد طلبك بنجاح! 🎉</h4>
                  <p className="text-xs text-slate-500">
                    رقم الطلب في المنظومة:{" "}
                    <span className="font-mono font-black text-amber-600 text-base">#{createdOrderNumber}</span>
                  </p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    الفرع المسؤول: <span className="font-bold text-slate-900">{activeBranch.name}</span>
                    <br />
                    العنوان: {activeBranch.address}
                  </p>
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`/track/${createdOrderNumber}`}
                    className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <Truck className="w-4 h-4" />
                    <span>تتبع خط سير الدليفري والموقع الحي 🗺️</span>
                  </a>

                  <a
                    href={`https://wa.me/201118400150?text=${encodeURIComponent(
                      `مرحباً ألبان فينيسيا، أتابع طلبي رقم #${createdOrderNumber}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>محادثة خدمة العملاء على الواتساب</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutStep("cart");
                      setIsOpen(false);
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    العودة لمتجر ألبان فينيسيا
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Action Buttons */}
          {items.length > 0 && checkoutStep === "cart" && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              {/* Summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono font-bold text-slate-900">{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>خدمة التوصيل ({selectedZoneName || activeBranch.zones[0]?.name}):</span>
                  <span className="font-mono font-bold text-slate-900">{activeDeliveryFee} ج.م</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>الإجمالي المطلوب:</span>
                  <span className="font-mono text-amber-700 text-lg font-black">{finalTotal} ج.م</span>
                </div>
              </div>

              {subtotal < minOrder && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold text-center">
                  الحد الأدنى لطلب الدليفري هو {minOrder} ج.م
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. WhatsApp Order */}
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>اطلب بالواتساب</span>
                </button>

                {/* 2. Online Delivery Checkout */}
                <button
                  onClick={() => setCheckoutStep("form")}
                  className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
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
