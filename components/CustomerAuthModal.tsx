"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Building2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  Truck,
  Package,
  Clock,
  ExternalLink,
  Receipt,
} from "lucide-react";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: any) => void;
  initialMode?: "login" | "register" | "profile";
}

const STORE_BRANCHES = [
  {
    id: "BR-HELIOPOLIS",
    name: "فرع مصر الجديدة وجسر السويس",
    zones: [
      "جسر السويس وسنترال مصر الجديدة",
      "روكسي والكوربة وهليوبوليس",
      "الألف مسكن وعين شمس الشرقية",
      "الحجاز وسانت فاتيما وميدان الحجاز",
      "النزهة الجديدة ومساكن شيراتون",
      "تريومف وميدان الإسماعيلية",
      "مدينة نصر (مكرم عبيد وعباس العقاد)",
    ],
  },
  {
    id: "HQ-QOBBA",
    name: "فرع حدائق القبة (الرئيسي)",
    zones: [
      "حدائق القبة والوايلي الكبير",
      "شارع مصر والسودان وسكة الوايلي",
      "الزيتون وسراي القبة",
      "العباسية ومنشية الصدر",
      "دير الملاك والزاوية الحمراء",
      "حمامات القبة وكوبري القبة",
      "الظاهر وباب الشعرية",
    ],
  },
];

export default function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "register",
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "otp" | "profile">("register");
  const [customer, setCustomer] = useState<any>(null);

  // Profile Sub-tab & Orders state
  const [profileSubTab, setProfileSubTab] = useState<"orders" | "info">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit Profile States
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editZone, setEditZone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Registration Fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regBranchId, setRegBranchId] = useState(STORE_BRANCHES[0].id);
  const [regZone, setRegZone] = useState(STORE_BRANCHES[0].zones[0]);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // OTP Fields
  const [otpCode, setOtpCode] = useState("");
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [otpTargetPhone, setOtpTargetPhone] = useState("");

  // Common Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check stored customer on mount & modal open
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vinissia_customer");
      if (stored) {
        const c = JSON.parse(stored);
        setCustomer(c);
        setEditName(c.name || "");
        setEditAddress(c.address || "");
        setEditZone(c.zone || "");
        setMode("profile");
        if (c.phone) fetchCustomerOrders(c.phone);
      } else {
        setCustomer(null);
        setMode(initialMode === "profile" ? "login" : initialMode);
      }
    } catch (e) {}
    setErrorMsg("");
    setSuccessMsg("");
  }, [isOpen, initialMode]);

  // Periodic polling for active orders when profile is open
  useEffect(() => {
    if (!isOpen || mode !== "profile" || !customer?.phone) return;
    const interval = setInterval(() => {
      fetchCustomerOrders(customer.phone, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, mode, customer?.phone]);

  // Fetch orders from API
  const fetchCustomerOrders = async (phone: string, silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const activeBranch = STORE_BRANCHES.find((b) => b.id === regBranchId) || STORE_BRANCHES[0];

  const handleBranchChange = (branchId: string) => {
    setRegBranchId(branchId);
    const branch = STORE_BRANCHES.find((b) => b.id === branchId) || STORE_BRANCHES[0];
    if (branch.zones.length > 0) {
      setRegZone(branch.zones[0]);
    }
  };

  // 1. Submit Registration & Request Gmail OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regEmail.includes("@") || !regEmail.includes(".")) {
      setErrorMsg("يرجى إدخال عنوان بريد إلكتروني صحيح لاستلام كود التفعيل");
      return;
    }

    if (regPhone.trim().length < 10) {
      setErrorMsg("يرجى إدخال رقم هاتف محمول صحيح (11 رقم)");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_SEND_OTP",
          name: regName.trim(),
          phone: regPhone.trim(),
          email: regEmail.trim(),
          username: regUsername.trim() || regPhone.trim(),
          password: regPassword.trim(),
          address: regAddress.trim(),
          zone: `${activeBranch.name} — ${regZone}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpTargetEmail(data.email || regEmail.trim());
        setOtpTargetPhone(data.phone || regPhone.trim());
        setSuccessMsg(data.message || "تم إرسال كود التفعيل إلى بريدك الإلكتروني بنجاح");
        setMode("otp");
      } else {
        setErrorMsg(data.error || "تعذر إرسال كود التحقق");
        if (data.canLogin) {
          setMode("login");
          setLoginIdentifier(regPhone.trim());
        }
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة ثانية");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit OTP Code to Activate Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMsg("يرجى كتابة كود التحقق المكون من 6 أرقام");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_OTP",
          email: otpTargetEmail,
          phone: otpTargetPhone,
          otpCode: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        localStorage.setItem("vinissia_customer", JSON.stringify(data.customer));
        localStorage.setItem(`vinissia_verified_${data.customer.phone}`, "true");
        window.dispatchEvent(new Event("vinissia_customer_updated"));
        setCustomer(data.customer);
        setEditName(data.customer.name || "");
        setEditAddress(data.customer.address || "");
        setEditZone(data.customer.zone || "");
        setSuccessMsg("تم تفعيل وتوثيق حسابك بنجاح! 🥛");
        setMode("profile");
        fetchCustomerOrders(data.customer.phone);
        if (onSuccess) onSuccess(data.customer);
      } else {
        setErrorMsg(data.error || "كود التحقق غير صحيح");
      }
    } catch {
      setErrorMsg("حدث خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend OTP Code
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
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
        setSuccessMsg("تمت إعادة إرسال كود التفعيل إلى بريدك الإلكتروني");
      } else {
        setErrorMsg(data.error || "تعذر إعادة الإرسال");
      }
    } catch {
      setErrorMsg("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginIdentifier || !loginPassword) {
      setErrorMsg("يرجى كتابة اسم المستخدم أو الموبايل وكلمة المرور");
      return;
    }

    try {
      setLoading(true);
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
        setCustomer(data.customer);
        setEditName(data.customer.name || "");
        setEditAddress(data.customer.address || "");
        setEditZone(data.customer.zone || "");
        setSuccessMsg(data.message || "تم تسجيل الدخول بنجاح!");
        setMode("profile");
        fetchCustomerOrders(data.customer.phone);
        if (onSuccess) onSuccess(data.customer);
      } else if (data.needsVerification) {
        setOtpTargetEmail(data.email);
        setOtpTargetPhone(data.phone);
        setErrorMsg(data.error);
        setMode("otp");
      } else {
        setErrorMsg(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // 5. Update Profile & Address
  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.phone) return;
    try {
      setSavingProfile(true);
      setErrorMsg("");
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PROFILE",
          phone: customer.phone,
          name: editName.trim(),
          address: editAddress.trim(),
          zone: editZone.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        localStorage.setItem("vinissia_customer", JSON.stringify(data.customer));
        window.dispatchEvent(new Event("vinissia_customer_updated"));
        setSuccessMsg("تم حفظ وتحديث بياناتك وعنوانك بنجاح! 🥛");
      } else {
        setErrorMsg(data.error || "تعذر حفظ التعديلات");
      }
    } catch {
      setErrorMsg("حدث خطأ في الاتصال بالخادم");
    } finally {
      setSavingProfile(false);
    }
  };

  // 6. Logout
  const handleLogout = () => {
    if (confirm("هل تريد تسجيل الخروج من حسابك؟")) {
      localStorage.removeItem("vinissia_customer");
      window.dispatchEvent(new Event("vinissia_customer_updated"));
      setCustomer(null);
      setOrders([]);
      setMode("login");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 text-slate-900 shadow-2xl overflow-hidden my-6">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-white to-sky-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-sm sm:text-base">
                  {mode === "profile" && customer
                    ? `حسابي وطلباتي — ${customer.name}`
                    : mode === "login"
                    ? "تسجيل دخول العميل 🔑"
                    : mode === "otp"
                    ? "تفعيل الحساب عبر Gmail ✉️"
                    : "تسجيل عميل جديد وحفظ البيانات 🥛"}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold">
                  ألبان فينيسيا — مش بس لبن وزبادي
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs (when not logged in and not in OTP) */}
          {mode !== "otp" && mode !== "profile" && (
            <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-100 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === "register"
                    ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>أول مرة أطلب (عميل جديد)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === "login"
                    ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                <span>لدي حساب (تسجيل دخول)</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          <div className="px-5 pt-3">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold mb-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-5 pt-2 max-h-[78vh] overflow-y-auto">
            {/* ─────────────────────────────────────────────────────────────
                0. LOGGED IN CUSTOMER DASHBOARD (حسابي وطلباتي والتتبع)
               ───────────────────────────────────────────────────────────── */}
            {mode === "profile" && customer && (
              <div className="space-y-4">
                {/* Greeting Card */}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                      {customer.name?.charAt(0) || "ع"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-950 text-sm">
                          {customer.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>موثق 🥛</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono font-bold mt-0.5">
                        {customer.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1 border border-slate-200 shadow-xs"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>

                {/* Sub Tabs Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setProfileSubTab("orders")}
                    className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      profileSubTab === "orders"
                        ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>طلباتي والتتبع الحي</span>
                    {orders.filter(
                      (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
                    ).length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileSubTab("info")}
                    className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                      profileSubTab === "info"
                        ? "bg-white text-slate-950 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <User className="w-4 h-4 text-sky-600" />
                    <span>بياناتي وعنواني</span>
                  </button>
                </div>

                {/* SUB-TAB 1: ORDERS & LIVE TRACKING */}
                {profileSubTab === "orders" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-slate-800">
                        سجل الطلبات والتتبع ({orders.length})
                      </span>
                      <button
                        onClick={() => customer.phone && fetchCustomerOrders(customer.phone)}
                        disabled={loadingOrders}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                        <span>تحديث</span>
                      </button>
                    </div>

                    {loadingOrders && orders.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs font-bold flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ تحميل طلباتك من السيستم... 🥛</span>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-900 text-sm">لا توجد طلبات سابقة</h5>
                          <p className="text-xs text-slate-500 mt-1">
                            تفضل باختيار منتجاتك المفضلة من المتجر وأرسل طلبك الآن!
                          </p>
                        </div>
                        <button
                          onClick={onClose}
                          className="py-2.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20"
                        >
                          تصفح المنتجات واطلب الآن 🥛
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => {
                          const isActive =
                            order.status !== "DELIVERED" && order.status !== "CANCELLED";
                          const statusConfig: { [key: string]: { label: string; bg: string; icon: string } } = {
                            PENDING: {
                              label: "قيد الاستلام والمراجعة",
                              bg: "bg-amber-100 text-amber-900 border-amber-300",
                              icon: "⏳",
                            },
                            PREPARING: {
                              label: "جارٍ التجهيز بالفرع",
                              bg: "bg-sky-100 text-sky-900 border-sky-300",
                              icon: "👨‍🍳",
                            },
                            ON_THE_WAY: {
                              label: "الطيار في الطريق إليك!",
                              bg: "bg-emerald-100 text-emerald-950 border-emerald-300 animate-pulse",
                              icon: "🛵",
                            },
                            OUT_FOR_DELIVERY: {
                              label: "الطيار في الطريق إليك!",
                              bg: "bg-emerald-100 text-emerald-950 border-emerald-300 animate-pulse",
                              icon: "🛵",
                            },
                            DELIVERED: {
                              label: "تم التوصيل بنجاح",
                              bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
                              icon: "✅",
                            },
                            CANCELLED: {
                              label: "طلب ملغي",
                              bg: "bg-rose-50 text-rose-700 border-rose-200",
                              icon: "❌",
                            },
                          };
                          const conf = statusConfig[order.status] || {
                            label: order.status,
                            bg: "bg-slate-100 text-slate-800 border-slate-200",
                            icon: "📦",
                          };

                          let parsedItems: any[] = [];
                          try {
                            parsedItems =
                              typeof order.items === "string"
                                ? JSON.parse(order.items)
                                : order.items || [];
                          } catch (e) {}

                          return (
                            <div
                              key={order.id || order.orderNumber}
                              className={`p-4 rounded-2xl border transition shadow-xs ${
                                isActive
                                  ? "bg-gradient-to-br from-amber-50/90 via-white to-sky-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              {/* Order Top Bar */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-sm text-slate-950">
                                      #{order.orderNumber}
                                    </span>
                                    {isActive && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                    {new Date(order.createdAt).toLocaleString("ar-EG", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                <div
                                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1.5 ${conf.bg}`}
                                >
                                  <span>{conf.icon}</span>
                                  <span>{conf.label}</span>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="space-y-1.5 text-xs text-slate-700">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-slate-500 shrink-0">الأصناف:</span>
                                  <span className="font-bold text-slate-900 text-left line-clamp-2">
                                    {parsedItems
                                      .map(
                                        (it: any) =>
                                          `${it.nameAr || it.name} (${it.quantity || it.qty || 1})`
                                      )
                                      .join("، ") || "أصناف متنوعة"}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">المبلغ المطلوب:</span>
                                  <span className="font-mono font-black text-amber-600 text-sm">
                                    {order.totalAmount} ج.م
                                  </span>
                                </div>

                                {order.branch && (
                                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                                    <span>الفرع المسؤول:</span>
                                    <span className="font-bold text-slate-800">
                                      {order.branch.name}
                                    </span>
                                  </div>
                                )}

                                {order.courier && (
                                  <div className="flex justify-between items-center text-[11px] text-emerald-900 bg-emerald-50/90 p-2 rounded-xl border border-emerald-200">
                                    <span className="flex items-center gap-1 font-bold">
                                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>كابتن التوصيل: {order.courier.name}</span>
                                    </span>
                                    <a
                                      href={`tel:${order.courier.phone}`}
                                      className="font-mono font-black text-emerald-700 underline text-[11px]"
                                    >
                                      📞 {order.courier.phone}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Big Action Link to Live Tracking Map */}
                              <div className="pt-3">
                                <Link
                                  href={`/track/${order.orderNumber}`}
                                  onClick={onClose}
                                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                                    isActive
                                      ? "bg-slate-950 hover:bg-slate-900 text-amber-400 shadow-md shadow-slate-950/20 hover:scale-[1.01]"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                  }`}
                                >
                                  <Truck className="w-4 h-4 text-amber-400" />
                                  <span>
                                    {isActive
                                      ? "تتبع خط سير الطيار واللوكيشن المباشر لايف 🗺️📡"
                                      : "عرض تفاصيل الطلب والفاتورة 🧾"}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: PROFILE & ADDRESS */}
                {profileSubTab === "info" && (
                  <form onSubmit={handleUpdateProfileSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        <span>الاسم الكريم بالكامل</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>رقم الهاتف المسجل (لا يمكن تغييره)</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={customer.phone}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>الفرع والمنطقة</span>
                      </label>
                      <input
                        type="text"
                        value={editZone}
                        onChange={(e) => setEditZone(e.target.value)}
                        placeholder="مثال: فرع حدائق القبة — الزيتون"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>عنوان التوصيل المحفوظ بالتفصيل</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="اسم الشارع، رقم العمارة، الدور، الشقة"
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{savingProfile ? "جارٍ الحفظ..." : "حفظ وتحديث بياناتي 💾"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                1. REGISTER FORM (عميل جديد)
               ───────────────────────────────────────────────────────────── */}
            {mode === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-bold leading-relaxed">
                  💡 سجل بياناتك مرة واحدة فقط وأنشئ اسم مستخدم وباسوورد؛ علشان كل أوردراتك القادمة تكون بياناتك وعنوانك محفوظة ومسجلة تلقائياً بدون تكرار!
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
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: أحمد حمزة"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-bold transition"
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
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
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
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>اسم المستخدم (Username) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="hamza2026"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>كلمة المرور (Password) *</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Branch & Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>الفرع الأقرب لك *</span>
                    </label>
                    <select
                      value={regBranchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="w-full py-2.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    >
                      {STORE_BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>المنطقة والحي *</span>
                    </label>
                    <select
                      value={regZone}
                      onChange={(e) => setRegZone(e.target.value)}
                      className="w-full py-2.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition"
                    >
                      {activeBranch.zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Detailed Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>عنوان التوصيل بالتفصيل (اسم الشارع، رقم العمارة، الدور، الشقة) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="مثال: شارع ولي العهد، عمارة 15، الدور 4، شقة 8"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-bold transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? "جارٍ إرسال كود التفعيل إلى Gmail..." : "إرسال كود التفعيل عبر Gmail ✉️"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────
                2. LOGIN FORM (تسجيل الدخول للعملاء الحاليين)
               ───────────────────────────────────────────────────────────── */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl text-[11px] text-sky-950 font-bold leading-relaxed">
                  👋 أهلاً بك! سجل دخولك باسم المستخدم أو رقم هاتفك المحمول، وستظهر كل طلباتك وبياناتك وعنوانك المحفوظة تلقائياً.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>اسم المستخدم، أو رقم الهاتف، أو البريد الإلكتروني *</span>
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>{loading ? "جارٍ التحقق..." : "دخول وتعبئة بياناتي تلقائياً ⚡"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ─────────────────────────────────────────────────────────────
                3. OTP VERIFICATION (تأكيد كود الـ Gmail)
               ───────────────────────────────────────────────────────────── */}
            {mode === "otp" && (
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

                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 text-center block">
                      أدخل كود التحقق (6 أرقام) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-amber-500 absolute right-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="157230"
                        className="w-full py-3.5 pr-12 pl-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-lg font-mono tracking-widest text-center focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-black transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                      تعديل البيانات
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{loading ? "جارٍ التفعيل..." : "تفعيل الحساب وحفظ البيانات ✅"}</span>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-xs text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>لم يصلك الكود؟ إعادة الإرسال إلى Gmail</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
