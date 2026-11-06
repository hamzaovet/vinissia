"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageCircle, MapPin, Clock, Heart, ExternalLink, ShieldCheck } from "lucide-react";

export default function Footer({ settings }: { settings?: any }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/pos")) return null;

  const storeName = settings?.storeName || "ألبان فينيسيا";
  const address = settings?.address || "80 المدينة المنورة، الوايلي الكبير شرق، حدائق القبة، محافظة القاهرة";
  const hotline = settings?.hotline || "01018671000";
  const phone = settings?.phone || "0224382540";
  const mapsUrl = settings?.googleMapsUrl || "https://share.google/UrPJjxJ0JpFBb4OHt";

  return (
    <footer className="bg-[#050912] border-t border-slate-800 text-slate-400 text-xs py-10 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">🥛</span>
              <h3 className="text-xl font-black text-white">{storeName}</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              معمل ومصنع ألبان بلدي طبيعي متخصص في الألبان الطازجة كاملة الدسم، الأجبان المعتقة، اللحوم المصنعة، وحلويات الألبان الشرقية الفاخرة.
            </p>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>يومياً من 7:00 ص حتى 2:00 بعد منتصف الليل</span>
            </div>
          </div>

          {/* Col 2: Location & Google Maps */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>عنوان المتجر والموقع</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {address}
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs transition"
            >
              <span>فتح الموقع على جوجل مابس</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Col 3: Delivery & Contacts */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>هواتف الطلبات والدليفري</span>
            </h4>
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span>الخط الساخن:</span>
                <a href={`tel:${hotline}`} className="hover:underline">{hotline}</a>
              </div>
              {phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span>الهاتف الأرضي:</span>
                  <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-amber-400 transition text-[11px]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>دخول الطاقم والإدارة (المايسترو)</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} {storeName} — حدائق القبة
          </div>
          <div className="flex items-center gap-1">
            <span>تم التطوير بأعلى معايير الجودة التقنية والطبخ الفندقي</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
