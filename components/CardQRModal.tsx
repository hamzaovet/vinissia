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
  QrCode,
  Smartphone,
  Globe,
  Store,
} from "lucide-react";

interface CardQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: any;
}

export default function CardQRModal({
  isOpen,
  onClose,
  settings,
}: CardQRModalProps) {
  const [webQrDataUrl, setWebQrDataUrl] = useState<string>("");
  const [apkQrDataUrl, setApkQrDataUrl] = useState<string>("");

  const storeName = settings?.storeName || "ألبان فينيسيا";
  const hotline = settings?.hotline || "01018671000";
  const phone = settings?.phone || "0224382540";
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://vinissia.vercel.app";
  const apkDownloadUrl = `${appUrl}/api/download/apk`;

  useEffect(() => {
    if (!isOpen) return;

    // 1. Generate Web Store QR Code
    QRCode.toDataURL(appUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(setWebQrDataUrl);

    // 2. Generate Android APK Download QR Code
    QRCode.toDataURL(apkDownloadUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#047857", light: "#ffffff" },
    }).then(setApkQrDataUrl);
  }, [isOpen, appUrl, apkDownloadUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 no-print">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>كارت الدعاية التسويقي الرسمي المزدوج (2 QR Codes)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            كارت ألبان فينيسيا — المتجر وتطبيق الأندرويد (APK)
          </h2>
          <p className="text-xs text-slate-500">
            كود مباشر لطلب الأوردرات أونلاين + كود لتحميل وتثبيت ملف تطبيق الأندرويد (APK)
          </p>
        </div>

        {/* PRINTABLE CARD (Fresh Milk White Design) */}
        <div
          id="vinissia-card-print"
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-[#f8fafc] border-2 border-slate-900 shadow-xl text-slate-900 space-y-6"
        >
          {/* Card Top Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-2xl bg-white border border-slate-200 shadow-sm ring-2 ring-amber-400/30">
                <img
                  src="/logo.png"
                  alt="ألبان فينيسيا"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-950">
                    ألبان فينيسيا (Venice)
                  </span>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    مش بس لبن وزبادي
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold">
                  خير المزارع الطبيعي على أصوله — ألبان طازجة، أجبان فاخرة، وحلويات بلدي
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left text-xs font-bold text-slate-700 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-amber-700 font-black">📍 فرعان لخدمتكم:</div>
              <div className="text-[11px] text-slate-600">مصر الجديدة • حدائق القبة</div>
              <div className="text-[9px] text-rose-600 font-bold">ليس لدينا فروع أخرى</div>
            </div>
          </div>

          {/* Double QR Codes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* QR Code 1: Web Store */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center space-y-2.5 flex flex-col items-center shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>1. امسح لطلب الأوردر أونلاين</span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner w-40 h-40 flex items-center justify-center">
                {webQrDataUrl ? (
                  <img
                    src={webQrDataUrl}
                    alt="Web Store QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>

              <span className="text-[11px] text-slate-600 font-bold block">
                تصفح قائمة الأصناف والأسعار الحالية
              </span>
            </div>

            {/* QR Code 2: Android APK Direct Download */}
            <div className="bg-white border-2 border-emerald-400 rounded-2xl p-4 text-center space-y-2.5 flex flex-col items-center shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>2. امسح لتحميل تطبيق أندرويد (APK)</span>
              </div>

              <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded-2xl shadow-inner w-40 h-40 flex items-center justify-center">
                {apkQrDataUrl ? (
                  <img
                    src={apkQrDataUrl}
                    alt="Android APK QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl" />
                )}
              </div>

              <span className="text-[11px] text-emerald-800 font-bold block">
                تحميل مباشر لملف APK وتثبيته على الهاتف
              </span>
            </div>
          </div>

          {/* Card Bottom Contacts */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 bg-white p-2 rounded-xl border border-slate-200">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>الواتساب والطلبات:</span>
              <span className="font-mono font-black text-emerald-700">01118400150</span>
              <span className="font-mono text-slate-500">| 0226342212</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate text-[11px]">
                فرع 1: جسر السويس أمام السنترال • فرع 2: ش المدينة المنورة - حدائق القبة
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
          <a
            href={apkDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تحميل ملف تطبيق فينيسيا (APK) الآن</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200"
            >
              <Printer className="w-4 h-4 text-amber-600" />
              <span>طباعة الكارت</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
