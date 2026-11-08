"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Truck,
  Crown,
  Calculator,
  Store,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fillCredentials = (u: string, p: string, pinCode: string) => {
    setUsername(u);
    setPassword(p);
    setPin(pinCode);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !pin) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور وكود الـ PIN السري");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem("vinissia_staff_user", JSON.stringify(data.user));

        if (data.user.role === "cashier") {
          router.push("/pos");
        } else if (data.user.role === "delivery") {
          router.push("/driver");
        } else {
          router.push("/admin");
        }
      } else {
        setError(data.error || "بيانات الدخول غير صحيحة، يرجى التحقق وإعادة المحاولة");
      }
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 font-sans selection:bg-amber-100"
      dir="rtl"
    >
      <div className="w-full max-w-lg space-y-6">
        {/* Real Brand Logo Emblem */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group transition transform hover:scale-[1.02]">
            <div className="p-2 rounded-3xl bg-white border border-slate-200 shadow-xl inline-flex flex-col items-center justify-center ring-4 ring-amber-400/30">
              <img
                src="/logo.png"
                alt="ألبان فينيسيا"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>
          </Link>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              بوابة تسجيل دخول الطاقم والإدارة والطيارين
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              صلاحيات المالك (المايسترو)، مدير الفروع، كاشير الصالة، وأسطول الدليفري
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-slate-200/50">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold block">
                اسم المستخدم (Username) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم المسجل لك"
                  className="w-full py-3 pr-10 pl-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold block">
                كلمة المرور (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pr-10 pl-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            {/* PIN Code */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-bold block">
                  كود الأمان والـ PIN السري (مخفي) *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">6 أرقام</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full py-3 pr-10 pl-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-mono tracking-widest text-center focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 disabled:opacity-50 mt-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{loading ? "جارٍ التحقق والتسجيل..." : "دخول المنظومة الآمن"}</span>
            </button>
          </form>

          {/* Quick Credential Autofill Helper for Authorized Staff */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-center">
              <p className="text-[11px] font-black text-slate-700">
                حسابات الدخول المعتمدة (انقر لتعبئة البيانات تلقائياً):
              </p>
            </div>

            {/* 1. Admin & Owner */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block pr-1">👑 الإدارة والمالك</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("maestro", "123", "157230")}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-amber-950 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>المالك (المايسترو)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-mono mt-0.5">maestro / 157230</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials("manager", "123", "112233")}
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-sky-950 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    <span>المدير العام</span>
                  </span>
                  <span className="text-[10px] text-sky-700 font-mono mt-0.5">manager / 112233</span>
                </button>
              </div>
            </div>

            {/* 2. Cashiers */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-400 block pr-1">📟 كاشير الفروع</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("cashier_heliopolis", "123", "223344")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-slate-900 flex items-center gap-1">
                    <Store className="w-3 h-3 text-slate-600" />
                    <span>كاشير مصر الجديدة</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">cashier_heliopolis / 223344</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials("cashier_qobba", "123", "334455")}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-slate-900 flex items-center gap-1">
                    <Store className="w-3 h-3 text-slate-600" />
                    <span>كاشير حدائق القبة</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">cashier_qobba / 334455</span>
                </button>
              </div>
            </div>

            {/* 3. Couriers - Heliopolis */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-amber-700 block pr-1">
                🛵 طياري فرع مصر الجديدة وجسر السويس (2 طيارين)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("courier_helio1", "123", "101103")}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-emerald-950 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" />
                    <span>كابتن إسلام سمير</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono mt-0.5">courier_helio1 / 101103</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials("courier_helio2", "123", "101104")}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-emerald-950 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" />
                    <span>كابتن أحمد فؤاد</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono mt-0.5">courier_helio2 / 101104</span>
                </button>
              </div>
            </div>

            {/* 4. Couriers - Qobba */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-sky-700 block pr-1">
                🛵 طياري فرع حدائق القبة (2 طيارين)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials("courier_qobba1", "123", "201103")}
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-sky-950 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-sky-600" />
                    <span>كابتن محمد طارق</span>
                  </span>
                  <span className="text-[10px] text-sky-700 font-mono mt-0.5">courier_qobba1 / 201103</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials("courier_qobba2", "123", "201104")}
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-right transition flex flex-col justify-center"
                >
                  <span className="font-black text-[11px] text-sky-950 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-sky-600" />
                    <span>كابتن مصطفى علي</span>
                  </span>
                  <span className="text-[10px] text-sky-700 font-mono mt-0.5">courier_qobba2 / 201104</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة متجر ألبان فينيسيا</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
