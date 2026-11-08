"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import {
  ShoppingBag,
  ArrowRight,
  Plus,
  Scale,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Search,
  Check,
  X,
  Truck,
  Heart,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Store,
} from "lucide-react";

interface Product {
  id: string;
  nameAr: string;
  categoryName: string;
  categoryId: string;
  unit: string;
  barcode?: string | null;
  pluCode?: string | null;
  isWeighted: boolean;
  pricePerKg?: number | null;
  basePrice: number;
  isHouseMade: boolean;
  inStock: boolean;
  badge?: string | null;
  image?: string | null;
  description?: string | null;
}

interface Category {
  id: string;
  nameAr: string;
  icon?: string | null;
  description?: string | null;
}

export default function HomePage() {
  const [activeOrderLive, setActiveOrderLive] = useState<any>(null);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const last = localStorage.getItem("vinissia_last_order");
        if (last) {
          const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(last)}`);
          const data = await res.json();
          if (data.success && data.orders && data.orders.length > 0) {
            const ord = data.orders[0];
            if (ord.status !== "DELIVERED" && ord.status !== "CANCELLED") {
              setActiveOrderLive(ord);
              return;
            }
          }
        }
        const savedCust = localStorage.getItem("vinissia_customer");
        if (savedCust) {
          const c = JSON.parse(savedCust);
          if (c.phone) {
            const res = await fetch(`/api/orders?phone=${encodeURIComponent(c.phone)}`);
            const data = await res.json();
            if (data.success && data.orders) {
              const act = data.orders.find((o: any) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
              if (act) {
                setActiveOrderLive(act);
                return;
              }
            }
          }
        }
        setActiveOrderLive(null);
      } catch (e) {}
    };

    fetchActive();
    const interval = setInterval(fetchActive, 10000);
    window.addEventListener("vinissia_customer_updated", fetchActive);
    return () => {
      clearInterval(interval);
      window.removeEventListener("vinissia_customer_updated", fetchActive);
    };
  }, []);
  const { addItem, setIsOpen } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  // Weight Selection Modal State
  const [weightedProduct, setWeightedProduct] = useState<Product | null>(null);
  const [selectedFraction, setSelectedFraction] = useState<"eighth" | "quarter" | "half" | "kilo" | "amount" | "grams">("quarter");
  const [customAmountEgp, setCustomAmountEgp] = useState<string>("30");
  const [customGrams, setCustomGrams] = useState<string>("250");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resC, resP] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        const dataC = await resC.json();
        const dataP = await resP.json();

        if (dataC.success) setCategories(dataC.categories || []);
        if (dataP.success) setProducts(dataP.products || []);
      } catch (err) {
        console.error("Failed to load store data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === "ALL" || p.categoryId === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nameAr.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.categoryName.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Handle adding weighted item to cart
  const handleAddWeightedToCart = () => {
    if (!weightedProduct) return;
    const ratePerKg = weightedProduct.pricePerKg || weightedProduct.basePrice;

    if (selectedFraction === "eighth") {
      addItem(weightedProduct, {
        type: "fraction",
        value: 125,
        label: "ثمن كيلو (125 جم)",
        price: ratePerKg * 0.125,
      });
    } else if (selectedFraction === "quarter") {
      addItem(weightedProduct, {
        type: "fraction",
        value: 250,
        label: "ربع كيلو (250 جم)",
        price: ratePerKg * 0.25,
      });
    } else if (selectedFraction === "half") {
      addItem(weightedProduct, {
        type: "fraction",
        value: 500,
        label: "نصف كيلو (500 جم)",
        price: ratePerKg * 0.5,
      });
    } else if (selectedFraction === "kilo") {
      addItem(weightedProduct, {
        type: "fraction",
        value: 1000,
        label: "1 كيلو جرام",
        price: ratePerKg,
      });
    } else if (selectedFraction === "amount") {
      const egp = Number(customAmountEgp) || 30;
      const calculatedGrams = Math.round((egp / ratePerKg) * 1000);
      addItem(weightedProduct, {
        type: "amount",
        value: egp,
        label: `بـ ${egp} ج.م (${calculatedGrams} جم)`,
        price: egp,
      });
    } else if (selectedFraction === "grams") {
      const g = Number(customGrams) || 250;
      const price = Number(((g / 1000) * ratePerKg).toFixed(1));
      addItem(weightedProduct, {
        type: "grams",
        value: g,
        label: `${g} جم بالميزان`,
        price,
      });
    }

    setWeightedProduct(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans" dir="rtl">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-amber-50/20 to-white border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-200/40">
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
          {/* Logo & Brand Display: ألبان + Logo (Enlarged & Centered) */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
              <span className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight">
                ألبان
              </span>
              <div className="p-2 sm:p-3 rounded-3xl bg-white border border-amber-200/90 shadow-xl shadow-amber-500/10 ring-4 ring-amber-400/30 flex items-center justify-center transition-transform hover:scale-105 duration-300">
                <img
                  src="/logo.png"
                  alt="فينيسيا"
                  className="h-20 sm:h-28 md:h-32 lg:h-36 w-auto object-contain drop-shadow"
                />
              </div>
            </div>

            {/* Slogan Centered */}
            <p className="text-base sm:text-xl md:text-2xl font-black text-amber-700 flex items-center justify-center gap-2">
              <span className="text-amber-500">✨</span>
              <span>(مش بس لبن وزبادي)</span>
              <span className="text-slate-400 text-xs sm:text-sm font-bold font-mono">🥛</span>
            </p>

            {/* Fresh Milk Boiling Note */}
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold shadow-sm">
              <span>🥛</span>
              <span>تنبيه خير المزرعة: الرجاء غلي اللبن فوراً عند الاستلام!</span>
            </div>
          </div>

          {/* Symmetrical Balanced Middle Grid: Branches Card + Fresh Milk Visual Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-right">
            {/* Card 1: Official Branches & Delivery Info */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>فروعنا الرسمية</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] shrink-0">
                  ليس لدينا فروع أخرى ⛔
                </span>
              </div>

              <div className="space-y-2">
                <a
                  href="https://www.google.com/maps/place/30%C2%B006'20.6%22N+31%C2%B019'16.5%22E/@30.1057199,31.3186689,17z/data=!3m1!4b1!4m4!3m3!8m2!3d30.1057199!4d31.3212438?hl=en&entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-400 text-slate-800 text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition group"
                  title="افتح موقع فرع جسر السويس على خرائط Google"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="leading-snug">الفرع الأول: 17 ش أحمد خليل من جسر السويس (أمام سنترال مصر الجديدة)</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 underline font-mono shrink-0 group-hover:scale-105 transition">📍 الخريطة</span>
                </a>

                <a
                  href="https://www.google.com/maps/place/30%C2%B005'29.0%22N+31%C2%B017'23.1%22E/@30.0913819,31.2871864,17z/data=!3m1!4b1!4m4!3m3!8m2!3d30.0913819!4d31.2897613?hl=en&entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-sky-50/80 border border-slate-200 hover:border-sky-400 text-slate-800 text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition group"
                  title="افتح موقع فرع حدائق القبة على خرائط Google"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                    <span className="leading-snug">الفرع الثاني: 101 تقسيم الرقابة الإدارية ش المدينة المنورة (حدائق القبة)</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-blue-600 underline font-mono shrink-0 group-hover:scale-105 transition">📍 الخريطة</span>
                </a>
              </div>
            </div>

            {/* Card 2: Fresh Farm Dairy Visual Card */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-200/80 shadow-md min-h-[160px] sm:min-h-[180px] flex items-end group bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
                alt="لبن مزارعنا"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              <div className="relative z-10 p-4 w-full flex items-center justify-between text-white">
                <div>
                  <span className="text-xs sm:text-sm font-black block leading-tight drop-shadow">
                    لبن مزارعنا فجر اليوم 🥛
                  </span>
                  <span className="text-[10px] sm:text-xs text-amber-300 font-bold block mt-0.5 drop-shadow">
                    طبيعي 100% بدون أي إضافات
                  </span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs font-bold text-white shadow shrink-0">
                  خير بلدنا ✨
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs (Centered Prominently) */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              onClick={() => setIsOpen(true)}
              className="py-3 sm:py-3.5 px-6 sm:px-8 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm transition flex items-center gap-2.5 shadow-xl shadow-slate-900/15 hover:scale-[1.02] active:scale-95"
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>اطلب دليفري الآن لباب بيتك</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span>كارت الـ 2 QR (تطبيق أندرويد)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ACTIVE ORDER LIVE TRACKING NOTIFICATION BANNER */}
      {activeOrderLive && (
        <section className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl shadow-amber-500/20 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
              <Truck className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base">
                  أوردرك قيد التنفيذ والتوصيل الآن (#{activeOrderLive.orderNumber})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 font-black text-[11px] shadow-sm">
                  {activeOrderLive.status === "ON_THE_WAY"
                    ? "🛵 الطيار في الطريق إليك"
                    : activeOrderLive.status === "PREPARING"
                    ? "👨‍🍳 جاري التجهيز بالفرع"
                    : "⏳ قيد المراجعة والاستلام"}
                </span>
              </div>
              <p className="text-xs text-slate-900 font-bold mt-1">
                المبلغ المطلوب: {activeOrderLive.totalAmount} ج.م • الفرع: {activeOrderLive.branch?.name || "ألبان فينيسيا"}
              </p>
            </div>
          </div>

          <a
            href={`/track/${activeOrderLive.orderNumber}`}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition hover:scale-105 active:scale-95 shrink-0"
          >
            <span>متابعة خط سير الطيار واللوكيشن المباشر 🗺️📡</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </a>
        </section>
      )}

      {/* 2. CATEGORY TABS & SEARCH */}
      <section id="categories" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <button
              onClick={() => setSelectedCat("ALL")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCat === "ALL"
                  ? "bg-slate-900 text-white font-black shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
              }`}
            >
              <span>جميع الأصناف ({products.length})</span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCat === c.id
                    ? "bg-slate-900 text-white font-black shadow-md shadow-slate-900/10"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
                }`}
              >
                <span>{c.nameAr}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أرز بلبن، بسطرمة، سمنة..."
              className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm transition"
            />
          </div>
        </div>
      </section>

      {/* 3. PRODUCT GRID */}
      <section className="space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">جارٍ تحميل قائمة أصناف ألبان فينيسيا...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-base font-bold text-slate-900">لم نتمكن من العثور على نتائج</h3>
            <p className="text-xs text-slate-500">جرب البحث بكلمة أخرى أو اختر قسماً مختلفاً من الأعلى</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-xl hover:shadow-slate-200/60 transition group relative"
              >
                {/* Badge */}
                {prod.badge && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
                      {prod.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  {/* Real Gourmet Food Image */}
                  <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden relative group-hover:scale-[1.03] transition duration-300 border border-slate-100 bg-slate-50 shadow-inner">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.nameAr}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes("%")) {
                            try {
                              target.src = decodeURIComponent(target.src);
                              return;
                            } catch (_) {}
                          }
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-slate-50 to-amber-50">
                        🥛
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {prod.categoryName}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-950 line-clamp-1 group-hover:text-amber-600 transition">
                      {prod.nameAr}
                    </h3>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {prod.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price and Action Button */}
                <div className="pt-4 border-t border-slate-100 space-y-2 mt-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-black font-mono text-slate-950">
                        {prod.isWeighted ? prod.pricePerKg : prod.basePrice}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">ج.م</span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {prod.isWeighted ? "لكل 1 كجم" : `لكل ${prod.unit}`}
                    </span>
                  </div>

                  {/* Add Button */}
                  {prod.isWeighted ? (
                    <button
                      onClick={() => {
                        setWeightedProduct(prod);
                        setSelectedFraction("quarter");
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>تحديد الوزن أو المبلغ ⚖️</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => addItem(prod)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>أضف للسلة</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. WEIGHT SELECTION MODAL */}
      {weightedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-5 text-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-950">{weightedProduct.nameAr}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    سعر الكيلو: {weightedProduct.pricePerKg || weightedProduct.basePrice} ج.م
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWeightedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Quick Fraction Chips */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block">
                اختر وزن الصنف السريع (كسور الكيلو):
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    key: "eighth",
                    label: "ثمن كيلو (⅛ كجم)",
                    grams: "125 جم",
                    calc: ((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.125).toFixed(1),
                  },
                  {
                    key: "quarter",
                    label: "ربع كيلو (¼ كجم)",
                    grams: "250 جم",
                    calc: ((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.25).toFixed(1),
                  },
                  {
                    key: "half",
                    label: "نصف كيلو (½ كجم)",
                    grams: "500 جم",
                    calc: ((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.5).toFixed(1),
                  },
                  {
                    key: "kilo",
                    label: "كيلو كامل (1 كجم)",
                    grams: "1000 جم",
                    calc: (weightedProduct.pricePerKg || weightedProduct.basePrice).toFixed(1),
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedFraction(item.key as any)}
                    className={`p-3 rounded-2xl text-right transition flex flex-col justify-between border ${
                      selectedFraction === item.key
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="font-bold text-xs">{item.label}</span>
                    <div className="flex justify-between items-baseline mt-2">
                      <span className="font-mono text-[11px] opacity-75">{item.grams}</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          selectedFraction === item.key ? "text-amber-400" : "text-amber-600"
                        }`}
                      >
                        {item.calc} ج.م
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Buy by Fixed Cash Amount (بـ 30 جنيه جبنة) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 block">
                  أو اشتري بمبلغ نقدي محدد (مثلاً: بـ 30 جنيه):
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedFraction("amount")}
                  className={`text-[11px] font-bold ${
                    selectedFraction === "amount" ? "text-amber-600 underline font-black" : "text-slate-400"
                  }`}
                >
                  تفعيل
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={customAmountEgp}
                  onFocus={() => setSelectedFraction("amount")}
                  onChange={(e) => {
                    setSelectedFraction("amount");
                    setCustomAmountEgp(e.target.value);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
                  placeholder="30"
                />
                <span className="text-xs text-slate-500 font-bold">جنيه مصري</span>
              </div>

              {selectedFraction === "amount" && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex justify-between font-mono">
                  <span>الوزن المقدر بالجرام:</span>
                  <span className="font-bold">
                    {Math.round(
                      (Number(customAmountEgp) / (weightedProduct.pricePerKg || weightedProduct.basePrice)) * 1000
                    )}{" "}
                    جرام تقريباً
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddWeightedToCart}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة هذا الوزن للسلة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double QR Card Modal */}
      <CardQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
