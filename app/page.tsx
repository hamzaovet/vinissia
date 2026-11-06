"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/lib/cartContext";
import CardQRModal from "@/components/CardQRModal";
import {
  ShoppingBag,
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
  description?: string | null;
}

interface Category {
  id: string;
  nameAr: string;
  icon?: string | null;
  description?: string | null;
}

export default function HomePage() {
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
      {/* 1. HERO BANNER (Fresh Dairy Cream & Venice Emblem) */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-200/40">
        <div className="relative z-10 max-w-2xl space-y-4">
          {/* Venice Official Oval Emblem */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border-2 border-slate-900 shadow-lg ring-4 ring-amber-400/40">
            <span className="text-2xl sm:text-3xl font-black text-slate-950 font-serif">
              فِـيـنِـيـسِـيـا
            </span>
            <span className="text-amber-500 text-lg">💧</span>
            <span className="text-xs font-black text-rose-600 border-r-2 border-slate-300 pr-2.5">
              مش بس لبن وزبادي
            </span>
            <span className="italic font-serif text-slate-400 text-xs hidden sm:inline">
              Venice
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 leading-tight">
            خير المزارع الطبيعي <br />
            <span className="gold-gradient-text">طازج فلاحي على أصوله</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            لبن جاموسي طازج كامل الدسم، أجبان فاخرة ومعتقة (رومي، كيري، شيدر، موتزريلا، براميلي)، حلويات مصنعة يدوياً بالمعمل يومياً (رز بلبن، مهلبية، أم علي، وقشطوطة فاخرة)، لحوم مصنعة ومبردات، وسمن وزبدة وقشطة مزارعنا الطبيعية 100%.
          </p>

          {/* Fresh Milk Boiling Note */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs font-bold shadow-sm">
            <span>🥛</span>
            <span>تنبيه خير المزرعة: الرجاء غلي اللبن فوراً عند الاستلام!</span>
          </div>

          {/* Branches Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5 shadow-sm">
              <Store className="w-4 h-4 text-amber-500" />
              <span>فرع حدائق القبة (80 ش المدينة المنورة)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5 shadow-sm">
              <Store className="w-4 h-4 text-sky-500" />
              <span>فرع سكة الوايلي الكبير</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-slate-900/15"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>اطلب دليفري الآن لباب بيتك</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span>كارت الـ 2 QR Codes</span>
            </button>

            <a
              href="https://share.google/UrPJjxJ0JpFBb4OHt"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>موقع الفرع بالخريطة</span>
            </a>
          </div>
        </div>

        {/* Floating Dairy Art */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center text-7xl shadow-xl shadow-amber-500/10 animate-pulse">
            🥛
          </div>
          <span className="text-xs font-black text-amber-900 mt-3 bg-amber-100 px-3.5 py-1 rounded-full border border-amber-300">
            طبيعي 100% بدون أي مواد حافظة
          </span>
        </div>
      </section>

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
                  {/* Icon Card Representation */}
                  <div className="w-full h-24 rounded-2xl bg-gradient-to-tr from-slate-50 to-amber-50/50 flex items-center justify-center text-4xl group-hover:scale-105 transition border border-slate-100">
                    {prod.categoryName.includes("حلو") || prod.categoryName.includes("لبن")
                      ? "🥣"
                      : prod.categoryName.includes("لحوم")
                      ? "🥩"
                      : prod.categoryName.includes("سمن") || prod.categoryName.includes("مزارع")
                      ? "🧈"
                      : prod.categoryName.includes("عسل")
                      ? "🍯"
                      : "🥛"}
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
