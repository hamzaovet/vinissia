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
  Store,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("maestro");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !pin) {
      setError("يرجى ملء جميع الحقول المطلوبة للدخول");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, pin }),
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
        setError(data.error || "فشل تسجيل الدخول");
      }
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string, pi: string) => {
    setUsername(u);
    setPassword(p);
    setPin(pi);
  };

  return (
    <div className="min-h-screen bg-[#080e1a] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
              🥛
            </div>
            <span className="text-2xl font-black text-white group-hover:text-amber-400 transition">
              ألبان فينيسيا
            </span>
          </Link>

          <h2 className="text-xl font-bold text-white">بوابة تسجيل دخول الطاقم والإدارة</h2>
          <p className="text-xs text-slate-400">
            صلاحيات المالك (المايسترو)، مدير الفرع، كاشير الصالة، ومسؤول التوصيل
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">اسم المستخدم (Username)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="maestro"
                  className="w-full py-2.5 pr-10 pl-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">كلمة المرور (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full py-2.5 pr-10 pl-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* PIN Code (Hidden as password type) */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">كود الأمان والـ PIN (مخفي)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full py-2.5 pr-10 pl-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono tracking-widest focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "جارٍ التحقق والتسجيل..." : "دخول المنظومة"}</span>
            </button>
          </form>

          {/* Quick Demo Credentials Helpers */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 block text-center font-bold">
              تعبئة سريعة لحسابات الاختبار المجهزة:
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("maestro", "123456789", "157230")}
                className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition text-right truncate"
              >
                👑 المالك (المايسترو)
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("manager", "manager123", "112233")}
                className="py-1.5 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold transition text-right truncate"
              >
                💼 مدير الفرع
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("cashier", "cashier123", "998877")}
                className="py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold transition text-right truncate"
              >
                📟 كاشير صالة POS
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("delivery", "delivery123", "445566")}
                className="py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold transition text-right truncate"
              >
                🛵 كابتن دليفري
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة المتجر الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
