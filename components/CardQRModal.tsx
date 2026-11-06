"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  X,
  Download,
  Printer,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  QrCode,
  Smartphone,
  Globe,
  Share2,
} from "lucide-react";

interface CardQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: any;
}

export default function CardQRModal({ isOpen, onClose, settings }: { isOpen: boolean; onClose: () => void; settings?: any }) {
  const [webQrDataUrl, setWebQrDataUrl] = useState<string>("");
  const [appQrDataUrl, setAppQrDataUrl] = useState<string>("");

  const storeName = settings?.storeName || "ألبان فينيسيا";
  const hotline = settings?.hotline || "01018671000";
  const phone = settings?.phone || "0224382540";
  const address = settings?.address || "80 المدينة المنورة، الوايلي الكبير، حدائق القبة، القاهرة";
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://vinissia.vercel.app";

  useEffect(() => {
    if (!isOpen) return;

    // Generate Web Store QR Code
    QRCode.toDataURL(appUrl, {
      width: 260,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(setWebQrDataUrl);

    // Generate Mobile PWA App QR Code
    QRCode.toDataURL(`${appUrl}?source=pwa_card_scan`, {
      width: 260,
      margin: 1,
      color: { dark: "#0284c7", light: "#ffffff" },
    }).then(setAppQrDataUrl);
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#080e1a] border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 no-print">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>كارت الدعاية التسويقي الرسمي المزدوج</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">كارت ألبان فينيسيا (2 كيو ار كود)</h2>
          <p className="text-xs text-slate-400">
            كود مباشر لطلب الأوردرات أونلاين + كود لتحميل وتثبيت أبلكيشن الموبايل
          </p>
        </div>

        {/* PRINTABLE CARD PREVIEW */}
        <div
          id="vinissia-card-print"
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1829] via-[#09111e] to-[#040811] border-2 border-amber-500/40 shadow-2xl text-white space-y-6"
        >
          {/* Card Top Branding */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🥛</span>
                <h3 className="text-2xl sm:text-3xl font-black gold-gradient-text">
                  {storeName}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-bold">
                خير المزارع الطبيعي على أصوله — ألبان طازجة، أجبان معتقة، وحلويات بلدي
              </p>
            </div>

            <div className="text-left font-mono text-xs text-amber-400 font-bold hidden sm:block">
              <div>حدائق القبة — القاهرة</div>
              <div className="text-[10px] text-slate-400">توصيل سريع لجميع المناطق</div>
            </div>
          </div>

          {/* Double QR Codes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* QR Code 1: Web Store */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-center space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Globe className="w-4 h-4" />
                <span>امسح الكود لطلب الأوردر أونلاين</span>
              </div>

              <div className="p-2 bg-white rounded-2xl shadow-lg w-40 h-40 flex items-center justify-center">
                {webQrDataUrl ? (
                  <img src={webQrDataUrl} alt="Web Store QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>

              <span className="text-[11px] text-slate-300 font-bold">
                تصفح قائمة الأصناف والأسعار الحالية
              </span>
            </div>

            {/* QR Code 2: Mobile App PWA */}
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 text-center space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <Smartphone className="w-4 h-4" />
                <span>امسح لتثبيت تطبيق الموبايل (PWA)</span>
              </div>

              <div className="p-2 bg-white rounded-2xl shadow-lg w-40 h-40 flex items-center justify-center">
                {appQrDataUrl ? (
                  <img src={appQrDataUrl} alt="Mobile App QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>

              <span className="text-[11px] text-slate-300 font-bold">
                تثبيت سريع بدون تحميل من المتجر
              </span>
            </div>
          </div>

          {/* Card Bottom Contacts */}
          <div className="pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>هواتف الدليفري والواتساب:</span>
              <span className="font-mono font-bold text-amber-400">{hotline}</span>
              {phone && <span className="font-mono text-slate-400">| {phone}</span>}
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
          <p className="text-xs text-slate-400">
            يمكنك طباعة هذا الكارت وتوزيعه مع طلبات الدليفري أو تعليقه على واجهة المحل.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الكارت فوراً</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
            >
              تم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
