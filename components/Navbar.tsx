"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import {
  ShoppingBag,
  QrCode,
  ShieldCheck,
  Calculator,
  Sparkles,
} from "lucide-react";

export default function Navbar({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);
  const [staffUser, setStaffUser] = useState<any>(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("vinissia_staff_user");
      if (saved) setStaffUser(JSON.parse(saved));
    } catch {}
  }, []);

  const isManagementRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/login");

  const hotline = settings?.hotline || "01018671000";
  const storeName = settings?.storeName || "ألبان فينيسيا";

  // If on admin or POS, do not show consumer navbar
  if (isManagementRoute) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm" dir="rtl">
        {/* Top Info Strip */}
        <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-amber-50 py-1.5 px-4 text-center text-[11px] font-bold text-slate-800 border-b border-amber-200/50 flex items-center justify-center gap-2">
          <span className="text-amber-500 font-bold">✨</span>
          <span>{settings?.announcement || "🥛 ألبان طازجة وارد المزرعة فجر اليوم — مش بس لبن وزبادي! زوروا فرعينا بحدائق القبة والوايلي"}</span>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand: Venice Emblem */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Real Official Venice Logo Image */}
            <div className="p-1 rounded-2xl bg-white border border-slate-200/90 shadow-md group-hover:scale-105 transition ring-2 ring-amber-400/40 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="ألبان فينيسيا — مش بس لبن وزبادي"
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-950 tracking-tight">
                  ألبان فينيسيا
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  الفرعان مفتوحان الآن 🟢
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مصر الجديدة (جسر السويس) & حدائق القبة
              </p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Double QR Card Modal Trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="كارت الدعاية وتطبيق الأندرويد"
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">كارت الـ 2 QR</span>
            </button>

            {/* Staff & Management Access Button (Prominent in Header) */}
            {staffUser ? (
              <Link
                href={staffUser.role === "cashier" ? "/pos" : "/admin"}
                className="py-2 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                title={staffUser.role === "cashier" ? "فتح شاشة الكاشير" : "لوحة الإدارة"}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">
                  {staffUser.role === "cashier" ? "الكاشير 📟" : "لوحة الإدارة 👑"}
                </span>
                <span className="sm:hidden">
                  {staffUser.role === "cashier" ? "الكاشير" : "الإدارة"}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="py-2 px-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                title="دخول الطاقم والإدارة والمايسترو"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">دخول الطاقم 🔐</span>
                <span className="sm:hidden">الطاقم 🔐</span>
              </Link>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>السلة</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-mono text-[11px] font-black flex items-center justify-center">
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
