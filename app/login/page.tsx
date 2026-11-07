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
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <div className="w-full max-w-md space-y-6">
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
              بوابة تسجيل دخول الطاقم والإدارة
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              صلاحيات المالك (المايسترو)، مدير الفروع، وكاشير الصالة
            </p>
          </div>
        </div>

        {/* Login Form Card (Fresh Milk Theme) */}
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
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block text-center">
              حسابات الدخول المعتمدة (انقر لتعبئة البيانات تلقائياً):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setUsername("maestro");
                  setPassword("123456789");
                  setPin("157230");
                }}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-200 transition text-right"
              >
                👑 <span className="font-black">المالك (المايسترو)</span>
                <span className="block text-[9px] text-amber-800 font-mono mt-0.5">maestro / 157230</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("manager");
                  setPassword("123456789");
                  setPin("112233");
                }}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold border border-blue-200 transition text-right"
              >
                👔 <span className="font-black">المدير العام (مدير التشغيل)</span>
                <span className="block text-[9px] text-blue-800 font-mono mt-0.5">manager / 112233</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("cashier_heliopolis");
                  setPassword("123456789");
                  setPin("223344");
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 transition text-right"
              >
                🏪 <span className="font-black">كاشير مصر الجديدة</span>
                <span className="block text-[9px] text-slate-600 font-mono mt-0.5">cashier_heliopolis / 223344</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("cashier_qobba");
                  setPassword("123456789");
                  setPin("334455");
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 transition text-right"
              >
                🏪 <span className="font-black">كاشير حدائق القبة</span>
                <span className="block text-[9px] text-slate-600 font-mono mt-0.5">cashier_qobba / 334455</span>
              </button>
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
