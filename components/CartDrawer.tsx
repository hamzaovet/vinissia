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
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  LogOut,
  Edit2,
  RefreshCw,
} from "lucide-react";

interface Settings {
  whatsapp?: string;
  phone?: string;
  minDeliveryOrder?: number;
  deliveryZones?: string;
}

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

  // Navigation steps:
  // "cart" -> "saved_checkout" (if logged in) OR "auth_register" / "auth_login" -> "otp" -> "success"
  const [checkoutStep, setCheckoutStep] = useState<
    "cart" | "saved_checkout" | "auth_register" | "auth_login" | "otp" | "success"
  >("cart");

  // Logged-in Customer
  const [savedCustomer, setSavedCustomer] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState(false);

  // Delivery & Branch Fields
  const [selectedBranchId, setSelectedBranchId] = useState<string>("BR-HELIOPOLIS");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerUsername, setCustomerUsername] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZoneName, setSelectedZoneName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Login inputs
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // OTP Fields
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [otpTargetPhone, setOtpTargetPhone] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // Load saved customer from localStorage on mount & listen to changes
  const loadCustomerFromStorage = () => {
    try {
      const stored = localStorage.getItem("vinissia_customer");
      if (stored) {
        const c = JSON.parse(stored);
        setSavedCustomer(c);
        setCustomerName(c.name || "");
        setCustomerPhone(c.phone || "");
        setCustomerEmail(c.email || "");
        setCustomerUsername(c.username || "");
        setCustomerAddress(c.address || "");
        if (c.zone) {
          const matchZone = STORE_BRANCHES.flatMap((b) => b.zones).find(
            (z) => c.zone.includes(z.name) || z.name === c.zone
          );
          if (matchZone) setSelectedZoneName(matchZone.name);
        }
      } else {
        setSavedCustomer(null);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadCustomerFromStorage();
    const handleUpdate = () => loadCustomerFromStorage();
    window.addEventListener("vinissia_customer_updated", handleUpdate);
    return () => window.removeEventListener("vinissia_customer_updated", handleUpdate);
  }, []);

  const activeBranch = STORE_BRANCHES.find((b) => b.id === selectedBranchId) || STORE_BRANCHES[0];
  const activeBranchZones = activeBranch.zones;

  // Sync default zone if branch changes and zone isn't in new branch
  useEffect(() => {
    if (!activeBranchZones.some((z) => z.name === selectedZoneName)) {
      if (activeBranchZones.length > 0) {
        setSelectedZoneName(activeBranchZones[0].name);
      }
    }
  }, [selectedBranchId]);

  const activeZone = activeBranchZones.find((z) => z.name === selectedZoneName) || activeBranchZones[0];
  const activeDeliveryFee = activeZone ? activeZone.fee : 15;
  const finalTotal = subtotal + activeDeliveryFee;
  const minOrder = settings?.minDeliveryOrder || 50;

  // Reset steps when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCheckoutStep("cart");
      setErrorMessage("");
      setSuccessMessage("");
      setEditingAddress(false);
    }
  }, [isOpen]);

  // Handle Checkout Click from Cart
  const handleProceedFromCart = () => {
    setErrorMessage("");
    if (items.length === 0) return;
    if (subtotal < minOrder) {
      alert(`الحد الأدنى لطلب الدليفري هو ${minOrder} ج.م`);
      return;
    }

    if (savedCustomer && savedCustomer.isVerified) {
      setCheckoutStep("saved_checkout");
    } else {
      setCheckoutStep("auth_register");
    }
  };

  // 1. Submit Registration & Send Gmail OTP
  const handleRegisterAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!customerEmail.includes("@") || !customerEmail.includes(".")) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح (Gmail) لتأكيد التفعيل");
      return;
    }

    if (customerPhone.trim().length < 10) {
      setErrorMessage("يرجى إدخال رقم هاتف محمول صحيح (11 رقم)");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_SEND_OTP",
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          username: customerUsername.trim() || customerPhone.trim(),
          password: customerPassword.trim(),
          address: customerAddress.trim(),
          zone: `${activeBranch.name} — ${selectedZoneName}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpTargetEmail(data.email || customerEmail.trim());
        setOtpTargetPhone(data.phone || customerPhone.trim());
        setSuccessMessage("تم إرسال كود التحقق بنجاح إلى بريدك الإلكتروني (Gmail)");
        setCheckoutStep("otp");
      } else {
        setErrorMessage(data.error || "تعذر إرسال كود التفعيل");
        if (data.canLogin) {
          setLoginIdentifier(customerPhone.trim());
          setCheckoutStep("auth_login");
        }
      }
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم، يرجى المحاولة ثانية");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdentifier || !loginPassword) {
      setErrorMessage("يرجى كتابة اسم المستخدم/الموبايل وكلمة المرور");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOGIN",
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        localStorage.setItem("vinissia_customer", JSON.stringify(data.customer));
        localStorage.setItem(`vinissia_verified_${data.customer.phone}`, "true");
        window.dispatchEvent(new Event("vinissia_customer_updated"));
        setSavedCustomer(data.customer);
        setCustomerName(data.customer.name || "");
        setCustomerPhone(data.customer.phone || "");
        setCustomerEmail(data.customer.email || "");
        setCustomerAddress(data.customer.address || "");
        setCheckoutStep("saved_checkout");
      } else if (data.needsVerification) {
        setOtpTargetEmail(data.email);
        setOtpTargetPhone(data.phone);
        setErrorMessage(data.error);
        setCheckoutStep("otp");
      } else {
        setErrorMessage(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch {
      setErrorMessage("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Verify OTP & Execute Order Immediately
  const handleVerifyOtpAndPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) {
      setErrorMessage("يرجى كتابة كود التحقق المكون من 6 أرقام");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_OTP",
          email: otpTargetEmail,
          phone: otpTargetPhone,
          otpCode: otpCodeInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        localStorage.setItem("vinissia_customer", JSON.stringify(data.customer));
        localStorage.setItem(`vinissia_verified_${data.customer.phone}`, "true");
        window.dispatchEvent(new Event("vinissia_customer_updated"));
        setSavedCustomer(data.customer);
        await executeOrderPlacement(data.customer);
      } else {
        setErrorMessage(data.error || "كود التحقق غير صحيح");
      }
    } catch {
      setErrorMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Resend OTP to Gmail
  const handleResendOtp = async () => {
    try {
      setSubmitting(true);
      setErrorMessage("");
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESEND_OTP",
          email: otpTargetEmail,
          phone: otpTargetPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("تمت إعادة إرسال كود التفعيل إلى بريدك الإلكتروني");
      } else {
        setErrorMessage(data.error || "تعذر إعادة الإرسال");
      }
    } catch {
      setErrorMessage("خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Final Order Placement in Database
  const executeOrderPlacement = async (activeCust?: any) => {
    const cust = activeCust || savedCustomer;
    const finalName = cust?.name || customerName;
    const finalPhone = cust?.phone || customerPhone;
    const finalAddress = customerAddress || cust?.address;

    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "delivery",
          branchId: selectedBranchId,
          customerName: finalName.trim(),
          customerPhone: finalPhone.trim(),
          deliveryAddress: finalAddress.trim(),
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
        try {
          localStorage.setItem("vinissia_last_order", data.order.orderNumber);
          window.dispatchEvent(new Event("vinissia_customer_updated"));
        } catch (e) {}
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

  // 6. Direct WhatsApp Order Fallback
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

  // 7. Logout / Switch Account
  const handleLogout = () => {
    if (confirm("هل تريد تسجيل الخروج وتبديل الحساب؟")) {
      localStorage.removeItem("vinissia_customer");
      window.dispatchEvent(new Event("vinissia_customer_updated"));
      setSavedCustomer(null);
      setCheckoutStep("auth_login");
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
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  {checkoutStep === "cart"
                    ? "سلة طلبات ألبان فينيسيا"
                    : checkoutStep === "saved_checkout"
                    ? "تأكيد طلب الدليفري 🛵"
                    : checkoutStep === "otp"
                    ? "تفعيل الحساب عبر Gmail ✉️"
                    : checkoutStep === "success"
                    ? "تم تأكيد طلبك 🎉"
                    : "تسجيل بيانات العميل"}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {checkoutStep === "cart"
                    ? `${itemCount} ${itemCount === 1 ? "صنف" : "أصناف"} مختارة`
                    : "مش بس لبن وزبادي"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          {(errorMessage || successMessage) && (
            <div className="px-4 pt-3">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* ─────────────────────────────────────────────────────────────
                STEP 1: CART ITEMS LIST
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                      <ShoppingBag className="w-8 h-8 opacity-40" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-800">السلة فارغة حالياً</h4>
                      <p className="text-xs text-slate-500">
                        تصفح منتجاتنا الفلاحية الطازجة وأضف طلباتك الآن
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="py-2.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/10"
                    >
                      تصفح الأقسام والمنتجات 🥛
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Logged in badge if customer is ready */}
                    {savedCustomer && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-white border border-amber-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-bold text-slate-800">
                            أهلاً بك يا {savedCustomer.name} 👋
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full">
                          بياناتك محفوظة جاهزة ⚡
                        </span>
                      </div>
                    )}

                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between gap-3 group hover:border-amber-300 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {item.nameAr}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
                              {item.unit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono font-bold text-amber-600 text-xs">
                              {item.price} ج.م
                            </span>
                            <span className="text-slate-300">×</span>
                            <span className="text-xs text-slate-500 font-mono">{item.quantity}</span>
                            <span className="text-slate-300">=</span>
                            <span className="font-mono font-black text-slate-900 text-xs">
                              {item.price * item.quantity} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

            {/* ─────────────────────────────────────────────────────────────
                STEP 2: SAVED CUSTOMER CHECKOUT (بيانات العميل محفوظة)
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "saved_checkout" && savedCustomer && (
              <div className="space-y-4">
                {/* Customer Info Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-sky-50/60 border border-amber-300/80 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
                        {savedCustomer.name ? savedCustomer.name.charAt(0) : "ع"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-950">
                          {savedCustomer.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          @{savedCustomer.username || savedCustomer.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-bold underline"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>تبديل الحساب</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-mono font-bold">{savedCustomer.phone}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2 text-slate-700 pt-0.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">العنوان المحفوظ: </span>
                          <span className="text-slate-900">
                            {customerAddress || savedCustomer.address || "لم يتم تحديد العنوان"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingAddress(!editingAddress)}
                        className="text-[10px] text-blue-600 font-bold hover:underline shrink-0 flex items-center gap-0.5"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>{editingAddress ? "حفظ" : "تعديل"}</span>
                      </button>
                    </div>

                    {editingAddress && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="اكتب العنوان الجديد بالتفصيل..."
                          className="w-full py-2 px-3 rounded-xl bg-white border border-amber-400 text-xs text-slate-900 font-bold focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>اختر الفرع المسؤول عن التجهيز *</span>
                  </label>

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
                            name="branchChoiceSaved"
                            checked={isSelected}
                            onChange={() => setSelectedBranchId(b.id)}
                            className="mt-0.5 text-amber-600"
                          />
                          <div className="flex-1">
                            <h5 className="font-black text-xs">{b.name}</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">{b.address}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Zone Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>المنطقة والحي (نطاق {activeBranch.name}) *</span>
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

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-bold">ملاحظات للأوردر (اختياري)</label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="مثال: رنة جرس خفيفة، الفكة المطلوبة..."
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Confirm Action Button */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                  >
                    رجوع للسلة
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => executeOrderPlacement()}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{submitting ? "جارٍ إرسال الطلب..." : "تأكيد وإرسال طلب الدليفري 🛵"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 3: NEW CUSTOMER REGISTRATION FORM (عميل جديد)
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "auth_register" && (
              <form onSubmit={handleRegisterAndSendOtp} className="space-y-3.5">
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded-2xl text-xs font-black">
                  <span className="text-amber-800 px-3 py-1 bg-white rounded-xl shadow-xs">
                    عميل جديد (تسجيل أول مرة) 🚀
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep("auth_login");
                      setErrorMessage("");
                    }}
                    className="text-sky-700 hover:underline px-3 py-1 font-bold"
                  >
                    لدي حساب مسجل 🔑
                  </button>
                </div>

                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-bold leading-relaxed">
                  💡 سجل اسمك وبياناتك وأنشئ اسم مستخدم وباسوورد؛ علشان كل أوردراتك القادمة تكون بياناتك محفوظة ومسجلة تلقائياً بدون ما تكتبها تاني!
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>الاسم الكريم بالكامل *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد حمزة"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>رقم الموبايل * (11 رقم)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01018671000"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Email (Gmail) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-sky-600" />
                      <span>البريد الإلكتروني (Gmail) *</span>
                    </label>
                    <span className="text-[10px] text-sky-600 font-bold font-mono">
                      سيصلك عليه كود التفعيل
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>اسم المستخدم *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerUsername}
                      onChange={(e) => setCustomerUsername(e.target.value)}
                      placeholder="hamza2026"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>كلمة المرور *</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>الفرع المسؤول عن التجهيز *</span>
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  >
                    {STORE_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>المنطقة والحي *</span>
                  </label>
                  <select
                    value={selectedZoneName}
                    onChange={(e) => setSelectedZoneName(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  >
                    {activeBranchZones.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name} — دليفري {z.fee} ج.م ({z.time} دقيقة)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detailed Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>العنوان بالتفصيل (اسم الشارع، رقم العمارة، الدور، الشقة) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="مثال: شارع ولي العهد، عمارة 15، الدور 4، شقة 8"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-bold transition"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 font-bold">ملاحظات للأوردر (اختياري)</label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="مثال: رنة جرس خفيفة"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
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
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{submitting ? "جارٍ الإرسال إلى Gmail..." : "إرسال كود التفعيل عبر Gmail ✉️"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 4: EXISTING CUSTOMER LOGIN (تسجيل دخول العميل)
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "auth_login" && (
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded-2xl text-xs font-black">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep("auth_register");
                      setErrorMessage("");
                    }}
                    className="text-amber-800 hover:underline px-3 py-1 font-bold"
                  >
                    أول مرة أطلب (تسجيل حساب) 🚀
                  </button>
                  <span className="text-sky-950 px-3 py-1 bg-white rounded-xl shadow-xs">
                    لدي حساب (تسجيل دخول) 🔑
                  </span>
                </div>

                <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl text-[11px] text-sky-950 font-bold leading-relaxed">
                  👋 أهلاً بك! أدخل اسم المستخدم أو الموبايل والباسوورد، وسيتم ملء بياناتك وعنوانك المحفوظ فوراً لتأكيد طلبك بضغطة واحدة.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>اسم المستخدم، أو رقم الموبايل، أو البريد الإلكتروني *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="مثال: hamza2026 أو 01018671000"
                    className="w-full py-3 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-sky-600" />
                    <span>كلمة المرور (Password) *</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                <div className="flex gap-2 pt-2">
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
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>{submitting ? "جارٍ التحقق..." : "دخول وتعبئة بياناتي تلقائياً ⚡"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 5: OTP CODE VERIFICATION (تأكيد كود الـ Gmail)
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "otp" && (
              <div className="space-y-4 py-2">
                <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950">
                      كود التفعيل في الطريق إلى بريدك ✉️
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      أرسلنا رمز تحقق سري مكوّن من 6 أرقام إلى:
                      <br />
                      <span className="font-mono font-black text-amber-800 text-sm">
                        {otpTargetEmail}
                      </span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                    💡 <span className="font-mono font-black text-amber-700">كود الفحص السريع: 157230</span>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtpAndPlaceOrder} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 text-center block">
                      أدخل رمز التأكيد (6 أرقام) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-amber-500 absolute right-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCodeInput}
                        onChange={(e) => setOtpCodeInput(e.target.value)}
                        placeholder="157230"
                        className="w-full py-3.5 pr-12 pl-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-lg font-mono tracking-widest text-center focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-black transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("auth_register")}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      تعديل البيانات
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submitting ? "جارٍ التفعيل وتأكيد الطلب..." : "تفعيل الحساب وتأكيد الطلب ✅"}</span>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={submitting}
                      className="text-xs text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>لم يصلك الكود؟ إعادة الإرسال إلى Gmail</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                STEP 6: SUCCESS CONFIRMATION
               ───────────────────────────────────────────────────────────── */}
            {checkoutStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-slate-950">تم تأكيد طلبك وحفظ بياناتك بنجاح! 🎉</h4>
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

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`/track/${createdOrderNumber}`}
                    className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <Truck className="w-4 h-4" />
                    <span>تتبع خط سير الدليفري والموقع الحي 🗺️</span>
                  </a>

                  <button
                    onClick={() => {
                      setCheckoutStep("cart");
                      setIsOpen(false);
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    العودة لصفحة المتجر
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer / Summary (Visible on Cart & Saved Checkout) */}
          {(checkoutStep === "cart" || checkoutStep === "saved_checkout") && items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي الأصناف:</span>
                  <span className="font-mono font-bold text-slate-900">{subtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span>خدمة التوصيل ({selectedZoneName || "المنطقة"}):</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{activeDeliveryFee} ج.م</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>المبلغ المطلوب عند الاستلام:</span>
                  <span className="font-mono text-base text-amber-600">{finalTotal} ج.م</span>
                </div>
              </div>

              {checkoutStep === "cart" && (
                <div className="space-y-2">
                  <button
                    onClick={handleProceedFromCart}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>متابعة لتأكيد الطلب والدليفري</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>أو طلب فوري عبر الواتساب (01118400150)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
