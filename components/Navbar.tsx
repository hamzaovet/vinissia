"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import {
  ShoppingBag,
  Phone,
  MessageCircle,
  QrCode,
  Store,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Calculator,
} from "lucide-react";

export default function Navbar({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);

  const isManagementRoute = pathname.startsWith("/admin") || pathname.startsWith("/pos");

  const hotline = settings?.hotline || "01018671000";
  const storeName = settings?.storeName || "ألبان فينيسيا";

  // If on admin or POS, show isolated top management bar or null
  if (isManagementRoute) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#070d18]/90 backdrop-blur-md border-b border-cyan-500/15 shadow-lg">
        {/* Top Info Strip */}
        <div className="bg-gradient-to-r from-amber-600/20 via-sky-600/10 to-amber-600/20 py-1.5 px-4 text-center text-[11px] font-bold text-amber-300 border-b border-amber-500/20 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{settings?.announcement || "🥛 ألبان طازجة وارد المزرعة فجر اليوم — جرب الرز بلبن والزبادي البلدي والجبنة الرومي البطارخ!"}</span>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md group-hover:scale-105 transition">
              🥛
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition">
                  {storeName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  مفتوح الآن 🟢
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                خير المزارع الطبيعي على أصوله — حدائق القبة
              </p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Double QR Card Modal Trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
              title="كارت الدعاية و2 كيو ار كود"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">كارت الـ 2 QR</span>
            </button>

            {/* Direct POS Link */}
            <Link
              href="/pos"
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 hidden lg:flex"
              title="شاشة كاشير الصالة السريعة"
            >
              <Calculator className="w-4 h-4" />
              <span>كاشير صالة (POS)</span>
            </Link>

            {/* Admin / Maestro Portal Link */}
            <Link
              href="/admin"
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              title="بوابة إدارة المالك والمدير"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">الإدارة (المايسترو)</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>السلة</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Double QR Card Modal */}
      <CardQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        settings={settings}
      />
    </>
  );
}
