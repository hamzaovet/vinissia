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
  ChevronLeft,
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
      const price = Math.round((ratePerKg * 0.125) * 10) / 10;
      addItem(weightedProduct, {
        type: "fraction",
        value: 125,
        label: "ثمن كجم (125 جم)",
        price,
      });
    } else if (selectedFraction === "quarter") {
      const price = Math.round((ratePerKg * 0.25) * 10) / 10;
      addItem(weightedProduct, {
        type: "fraction",
        value: 250,
        label: "ربع كجم (250 جم)",
        price,
      });
    } else if (selectedFraction === "half") {
      const price = Math.round((ratePerKg * 0.5) * 10) / 10;
      addItem(weightedProduct, {
        type: "fraction",
        value: 500,
        label: "نصف كجم (500 جم)",
        price,
      });
    } else if (selectedFraction === "kilo") {
      addItem(weightedProduct, {
        type: "fraction",
        value: 1000,
        label: "1 كجم (1000 جم)",
        price: ratePerKg,
      });
    } else if (selectedFraction === "amount") {
      const amt = Number(customAmountEgp) || 30;
      const calculatedGrams = Math.round((amt / ratePerKg) * 1000);
      addItem(weightedProduct, {
        type: "amount",
        value: amt,
        label: `بـ ${amt} ج.م (~${calculatedGrams} جم)`,
        price: amt,
      });
    } else if (selectedFraction === "grams") {
      const g = Number(customGrams) || 250;
      const price = Math.round(((g / 1000) * ratePerKg) * 10) / 10;
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
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1a2d] via-[#091220] to-[#050b14] border-2 border-amber-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <span>🥛</span>
            <span>معمل ألبان فينيسيا — حدائق القبة والوايلي الكبير</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            خير المزارع الطبيعي <br />
            <span className="gold-gradient-text">طازج فلاحي على أصوله</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            لبن جاموسي طازج كامل الدسم، أجبان معتقة بالميزان (رومي بطارخ، براميلي فلفل، إسطنبولي)، لحوم مصنعة ومبردات، وحلويات مصنعة يدوياً في معملنا يومياً (رز بلبن، زبادي بلدي، وزبادو فواكه فريش).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Truck className="w-4 h-4" />
              <span>اطلب دليفري الآن لباب بيتك</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-3 px-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>كارت الـ 2 QR Codes</span>
            </button>

            <a
              href="https://share.google/UrPJjxJ0JpFBb4OHt"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>موقعنا بالخريطة</span>
            </a>
          </div>
        </div>

        {/* Floating Dairy Art */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-center opacity-85">
          <div className="text-8xl filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)] animate-pulse">
            🥛
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 mt-2 bg-slate-900/80 px-3 py-1 rounded-full border border-amber-500/30">
            طازج 100% بدون إضافات
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
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
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
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
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
              placeholder="ابحث عن لبن، رومي، رز بلبن..."
              className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>
      </section>

      {/* 3. PRODUCTS GRID */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>قائمة المنتجات الطازجة</span>
            <span className="text-xs font-normal text-slate-400 font-mono">
              ({filteredProducts.length} صنف متاح)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const rate = p.isWeighted ? (p.pricePerKg || p.basePrice) : p.basePrice;

              return (
                <div
                  key={p.id}
                  className="glass-card rounded-3xl p-5 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition group relative overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Badge & Unit */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {p.badge || (p.isHouseMade ? "صنع فينيسيا 🥛" : p.categoryName)}
                      </span>

                      {p.isWeighted ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          <Scale className="w-3 h-3" />
                          <span>بالميزان</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {p.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition leading-snug">
                      {p.nameAr}
                    </h3>

                    {p.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Add Button */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-lg font-black font-mono text-amber-400">
                        {rate} <span className="text-xs font-normal">ج.م</span>
                      </span>
                      {p.isWeighted && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          / لكل كجم
                        </span>
                      )}
                    </div>

                    {p.isWeighted ? (
                      <button
                        onClick={() => {
                          setWeightedProduct(p);
                          setSelectedFraction("quarter");
                        }}
                        className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 border border-amber-500/30"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>وزن وكسور</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => addItem(p)}
                        className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
            <h4 className="font-bold text-white text-base">لا توجد منتجات مطابقة للبحث</h4>
            <p className="text-xs text-slate-400">جرب البحث بكلمة أخرى أو اختر قسماً مختلفاً</p>
          </div>
        )}
      </section>

      {/* 4. HOUSE SPECIALTIES HIGHLIGHTS (حلويات ومعلبات مصنعة يدوي) */}
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400">قسم الحلويات والأطباق الفاخرة</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">حلويات وأطباق مصنعة في معمل فينيسيا</h3>
          </div>
          <span className="text-2xl">🍯</span>
        </div>

        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          جميع أطباق الأرز باللبن، الزبادي البلدي بالفخار، الزبادي اليوناني عالي البروتين، ومشروبات الزبادو الطبيعية بالفواكه مصنعة يدوياً بأيدي شيفات ألبان فينيسيا من حليب طبيعي 100% بدون مواد حافظة.
        </p>
      </section>

      {/* 5. LOCATION & GOOGLE MAPS CARD */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-400" />
              <h3 className="text-lg font-black text-white">فرع ومعمل ألبان فينيسيا الرئيسي</h3>
            </div>
            <p className="text-xs text-slate-300">
              80 شارع المدينة المنورة، الوايلي الكبير شرق، حدائق القبة، محافظة القاهرة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://share.google/UrPJjxJ0JpFBb4OHt"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5"
            >
              <span>افتح بالخريطة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="tel:01018671000"
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصل بالفرع</span>
            </a>
          </div>
        </div>
      </section>

      {/* 6. WEIGHT & SCALE SELECTION MODAL */}
      {weightedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0a1220] border-2 border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl text-white">
            <button
              onClick={() => setWeightedProduct(null)}
              className="absolute left-4 top-4 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Scale className="w-4 h-4" />
                <span>ميزان فينيسيا الديجيتال — تحديد الوزن والكسور</span>
              </div>
              <h3 className="text-xl font-black text-white">{weightedProduct.nameAr}</h3>
              <p className="text-xs text-slate-400 font-mono">
                سعر الكيلو الكامل: <span className="font-bold text-amber-400">{weightedProduct.pricePerKg || weightedProduct.basePrice} ج.م</span>
              </p>
            </div>

            {/* Fraction Chips */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">
                اختر وزن الكسر المعتاد:
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "eighth", label: "ثمن كجم (125 جم)", price: Math.round(((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.125) * 10) / 10 },
                  { key: "quarter", label: "ربع كجم (250 جم)", price: Math.round(((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.25) * 10) / 10 },
                  { key: "half", label: "نصف كجم (500 جم)", price: Math.round(((weightedProduct.pricePerKg || weightedProduct.basePrice) * 0.5) * 10) / 10 },
                  { key: "kilo", label: "1 كجم كامل (1000 جم)", price: weightedProduct.pricePerKg || weightedProduct.basePrice },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSelectedFraction(f.key as any)}
                    className={`p-3 rounded-2xl border text-right transition flex items-center justify-between ${
                      selectedFraction === f.key
                        ? "bg-amber-500/20 border-amber-500 text-white font-black"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="text-xs">{f.label}</div>
                      <div className="text-xs font-mono font-bold text-amber-400">{f.price} ج.م</div>
                    </div>
                    {selectedFraction === f.key && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom By Amount or Custom Grams */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-300 font-bold block">
                أو اطلب بقيمة نقدية محددة:
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFraction("amount")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                    selectedFraction === "amount"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  بمبلغ مالي
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="10"
                    value={customAmountEgp}
                    onChange={(e) => {
                      setCustomAmountEgp(e.target.value);
                      setSelectedFraction("amount");
                    }}
                    placeholder="اكتب المبلغ (مثلاً 30 ج)"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">
                    ج.م
                  </span>
                </div>
              </div>

              {selectedFraction === "amount" && (
                <div className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/20">
                  الوزن التقديري المحسوب:{" "}
                  <span className="font-bold">
                    {Math.round(((Number(customAmountEgp) || 30) / (weightedProduct.pricePerKg || weightedProduct.basePrice)) * 1000)} جم
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setWeightedProduct(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleAddWeightedToCart}
                className="flex-1 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة الوزن للسلة</span>
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
