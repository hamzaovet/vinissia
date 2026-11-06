"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import {
  Home,
  Layers,
  Calculator,
  QrCode,
  ShoppingBag,
} from "lucide-react";

export default function MobileBottomNav({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/pos")) return null;

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070d18]/95 backdrop-blur-lg border-t border-slate-800 md:hidden no-print">
        <div className="grid grid-cols-5 h-16 text-center text-[10px] font-bold">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 transition ${
              pathname === "/" ? "text-amber-400 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>الرئيسية</span>
          </Link>

          <a
            href="#categories"
            className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition"
          >
            <Layers className="w-5 h-5" />
            <span>الأقسام</span>
          </a>

          <Link
            href="/pos"
            className="flex flex-col items-center justify-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
          >
            <Calculator className="w-5 h-5" />
            <span>كاشير</span>
          </Link>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-400 transition"
          >
            <QrCode className="w-5 h-5" />
            <span>كارت QR</span>
          </button>

          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-amber-400 font-black relative"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>السلة</span>
            {itemCount > 0 && (
              <span className="absolute top-2 right-4 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <CardQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        settings={settings}
      />
    </>
  );
}
