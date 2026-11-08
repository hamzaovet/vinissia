"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: any) => void;
  initialMode?: "login" | "register";
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
  const [mode, setMode] = useState<"login" | "register" | "otp" | "profile">(initialMode);
  const [customer, setCustomer] = useState<any>(null);

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

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vinissia_customer");
      if (stored) {
        const c = JSON.parse(stored);
        setCustomer(c);
      }
    } catch (e) {}
  }, [isOpen]);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
    setErrorMsg("");
    setSuccessMsg("");
  }, [initialMode, isOpen]);

  // Handle branch switch to sync zones
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
        setSuccessMsg("تم تفعيل وتوثيق حسابك بنجاح! 🥛");
        if (onSuccess) onSuccess(data.customer);
        setTimeout(() => onClose(), 1200);
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
        setSuccessMsg(data.message || "تم تسجيل الدخول بنجاح!");
        if (onSuccess) onSuccess(data.customer);
        setTimeout(() => onClose(), 800);
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

  // 5. Logout
  const handleLogout = () => {
    if (confirm("هل تريد تسجيل الخروج من حسابك؟")) {
      localStorage.removeItem("vinissia_customer");
      window.dispatchEvent(new Event("vinissia_customer_updated"));
      setCustomer(null);
      setMode("login");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 text-slate-900 shadow-2xl overflow-hidden my-6">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 via-white to-sky-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  {customer && mode === "profile"
                    ? `حسابي — ${customer.name}`
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

          {/* Mode Switcher Tabs (when not in OTP or logged in profile) */}
          {mode !== "otp" && (
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

          {/* Messages */}
          <div className="px-6 pt-4">
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
          <div className="p-6 pt-2 max-h-[75vh] overflow-y-auto">
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

                {/* Credentials: Username & Password */}
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

                {/* Delivery Branch & Zone */}
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
                  👋 أهلاً بك! سجل دخولك باسم المستخدم أو رقم هاتفك المحمول، وستظهر كل بياناتك وعنوانك المحفوظة تلقائياً في السلة والدليفري.
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
