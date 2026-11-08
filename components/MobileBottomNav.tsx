"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import CustomerAuthModal from "@/components/CustomerAuthModal";
import {
  Home,
  Layers,
  Calculator,
  QrCode,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

export default function MobileBottomNav({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const savedCust = localStorage.getItem("vinissia_customer");
        const custObj = savedCust ? JSON.parse(savedCust) : null;
        setCustomer(custObj);

        const lastOrd = localStorage.getItem("vinissia_last_order");
        if (lastOrd) {
          const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(lastOrd)}`);
          const data = await res.json();
          if (data.success && data.orders && data.orders.length > 0) {
            const ord = data.orders[0];
            if (ord.status !== "DELIVERED" && ord.status !== "CANCELLED") {
              setActiveOrderNumber(ord.orderNumber);
              return;
            }
          }
        }

        if (custObj?.phone) {
          const res = await fetch(`/api/orders?phone=${encodeURIComponent(custObj.phone)}`);
          const data = await res.json();
          if (data.success && data.orders) {
            const active = data.orders.find((o: any) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
            if (active) {
              setActiveOrderNumber(active.orderNumber);
              return;
            }
          }
        }
        setActiveOrderNumber(null);
      } catch (e) {}
    };

    loadState();
    const interval = setInterval(loadState, 10000);
    window.addEventListener("vinissia_customer_updated", loadState);
    return () => {
      clearInterval(interval);
      window.removeEventListener("vinissia_customer_updated", loadState);
    };
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/pos")) return null;

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070d18]/95 backdrop-blur-lg border-t border-slate-800 md:hidden no-print" dir="rtl">
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

          {/* Middle Tab: Live Tracker or Customer Orders */}
          {activeOrderNumber ? (
            <Link
              href={`/track/${activeOrderNumber}`}
              className="flex flex-col items-center justify-center gap-1 text-amber-400 font-black animate-pulse relative"
            >
              <Truck className="w-5 h-5 text-amber-400" />
              <span>تتبع لايف</span>
              <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </Link>
          ) : (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-400 transition"
            >
              <User className="w-5 h-5 text-sky-400" />
              <span>{customer ? "طلباتي" : "حسابي"}</span>
            </button>
          )}

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

      <CustomerAuthModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
      />
    </>
  );
}
