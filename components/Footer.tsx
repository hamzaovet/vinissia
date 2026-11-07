"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, MapPin, Clock, ShieldCheck, Store } from "lucide-react";

export default function Footer({ settings }: { settings?: any }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/pos")) return null;

  const storeName = settings?.storeName || "ألبان فينيسيا";

  return (
    <footer className="bg-white border-t border-slate-200/90 text-slate-600 text-xs py-12 mt-16 no-print shadow-sm" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand Info & Real Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm ring-2 ring-amber-400/30">
                <img
                  src="/logo.png"
                  alt="ألبان فينيسيا — مش بس لبن وزبادي"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">{storeName}</h3>
                <span className="text-[11px] font-black text-rose-600">مش بس لبن وزبادي</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              معمل ومصنع ألبان بلدي طبيعي 100% متخصص في الألبان الطازجة كاملة الدسم، الأجبان الفاخرة والمعتقة، وحلويات الألبان المصنعة يدوياً يومياً بالمعمل.
            </p>
            <div className="flex items-center gap-2 text-slate-700 font-mono text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 w-fit">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>يومياً من 7:00 ص حتى 2:00 بعد منتصف الليل</span>
            </div>
          </div>

          {/* Col 2: Both Official Branches (From Printed Bag) */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-950 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>فروعنا الرسمية (ليس لدينا فروع أخرى)</span>
            </h4>

            {/* Branch 1 */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-slate-900 text-xs block">
                الفرع الأول: مصر الجديدة (جسر السويس)
              </span>
              <p className="text-[11px] text-slate-600">
                17 شارع أحمد خليل متفرع من شارع جسر السويس أمام سنترال مصر الجديدة
              </p>
              <div className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-2 pt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href="tel:0226342212" className="hover:underline">ت: 0226342212</a>
              </div>
            </div>

            {/* Branch 2 */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-slate-900 text-xs block">
                الفرع الثاني: حدائق القبة
              </span>
              <p className="text-[11px] text-slate-600">
                101 تقسيم الرقابة الإدارية شارع المدينة المنورة متفرع من ولي العهد
              </p>
              <div className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-2 pt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href="tel:0224555203" className="hover:underline">0224555203</a>
                <span>-</span>
                <a href="tel:01500905334" className="hover:underline">01500905334</a>
              </div>
            </div>
          </div>

          {/* Col 3: Delivery & Unified WhatsApp */}
          <div className="space-y-4">
            <h4 className="font-black text-slate-950 text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>الواتساب الموحد وخدمة الدليفري</span>
            </h4>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-950 block">
                واتساب الطلبات لجميع الفروع:
              </span>
              <a
                href="https://wa.me/201118400150"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-base font-black text-emerald-800 hover:underline block"
              >
                01118400150
              </a>
              <span className="text-[10px] text-emerald-700 block">
                توصيل سريع لباب بيتك طازج وساقع 🛵
              </span>
            </div>

            <div className="pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold text-xs transition border border-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>دخول الطاقم والإدارة والمايسترو 🔐</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} {storeName} (Venice) — مش بس لبن وزبادي
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-500">
            <span>ليس لدينا فروع أخرى</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
