"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Plus,
  Minus,
  Trash2,
  Printer,
  Barcode,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  RotateCcw,
  X,
  Check,
  Clock,
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
}

interface Category {
  id: string;
  nameAr: string;
}

interface PosItem {
  id: string;
  productId: string;
  nameAr: string;
  unit: string;
  unitPrice: number;
  price: number;
  qty: number;
  isWeighted: boolean;
  weightGrams?: number;
}

export default function PosPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Cart & POS State
  const [posCart, setPosCart] = useState<PosItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "instapay">("cash");
  const [customerName, setCustomerName] = useState("عميل صالة");
  const [customerPhone, setCustomerPhone] = useState("01000000000");

  // Weighted Selection Modal
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [scaleMode, setScaleMode] = useState<"fraction" | "amount" | "grams">("fraction");
  const [scaleFraction, setScaleFraction] = useState<number>(0.25);
  const [scaleAmount, setScaleAmount] = useState<string>("30");
  const [scaleGrams, setScaleGrams] = useState<string>("250");

  // Last completed order for printing receipt
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // Check Staff session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vinissia_staff_user");
      if (saved) setStaff(JSON.parse(saved));
    } catch {}
  }, []);

  // Load Data
  useEffect(() => {
    async function init() {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === "ALL" || p.categoryId === selectedCat;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nameAr.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.pluCode && p.pluCode.includes(q));
    return matchCat && matchSearch;
  });

  // Add Item to POS Cart
  const addToPosCart = (product: Product, variation?: { unit: string; price: number; qty: number; isWeighted: boolean; weightGrams?: number }) => {
    const rate = product.isWeighted ? (product.pricePerKg || product.basePrice) : product.basePrice;
    const unitLabel = variation?.unit || product.unit || "قطعة";
    const itemPrice = variation ? variation.price : product.basePrice;
    const itemQty = variation ? variation.qty : 1;
    const isWeighted = variation ? variation.isWeighted : Boolean(product.isWeighted);

    const itemId = `${product.id}-${unitLabel}`;

    setPosCart((prev) => {
      const exists = prev.find((i) => i.id === itemId);
      if (exists) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, qty: i.qty + itemQty } : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          nameAr: product.nameAr,
          unit: unitLabel,
          unitPrice: rate,
          price: itemPrice,
          qty: itemQty,
          isWeighted,
          weightGrams: variation?.weightGrams,
        },
      ];
    });
  };

  // Handle Weighted Add from modal
  const handleConfirmScale = () => {
    if (!scaleProduct) return;
    const ratePerKg = scaleProduct.pricePerKg || scaleProduct.basePrice;

    if (scaleMode === "fraction") {
      let label = "ربع كجم (250 جم)";
      let price = Math.round(ratePerKg * 0.25 * 10) / 10;
      let grams = 250;

      if (scaleFraction === 0.125) {
        label = "ثمن كجم (125 جم)";
        price = Math.round(ratePerKg * 0.125 * 10) / 10;
        grams = 125;
      } else if (scaleFraction === 0.5) {
        label = "نصف كجم (500 جم)";
        price = Math.round(ratePerKg * 0.5 * 10) / 10;
        grams = 500;
      } else if (scaleFraction === 1) {
        label = "1 كجم (1000 جم)";
        price = ratePerKg;
        grams = 1000;
      }

      addToPosCart(scaleProduct, {
        unit: label,
        price,
        qty: 1,
        isWeighted: true,
        weightGrams: grams,
      });
    } else if (scaleMode === "amount") {
      const amt = Number(scaleAmount) || 30;
      const calcGrams = Math.round((amt / ratePerKg) * 1000);
      addToPosCart(scaleProduct, {
        unit: `بـ ${amt} ج (~${calcGrams} جم)`,
        price: amt,
        qty: 1,
        isWeighted: true,
        weightGrams: calcGrams,
      });
    } else if (scaleMode === "grams") {
      const g = Number(scaleGrams) || 250;
      const price = Math.round(((g / 1000) * ratePerKg) * 10) / 10;
      addToPosCart(scaleProduct, {
        unit: `${g} جم ميزان`,
        price,
        qty: 1,
        isWeighted: true,
        weightGrams: g,
      });
    }

    setScaleProduct(null);
  };

  // Barcode Scanning / Manual Input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim();

    // 1. Direct barcode match
    const found = products.find((p) => p.barcode === code || p.pluCode === code);
    if (found) {
      if (found.isWeighted) {
        setScaleProduct(found);
      } else {
        addToPosCart(found);
      }
      setBarcodeInput("");
      return;
    }

    // 2. Scale Barcode parsing (Prefix 20 or 21)
    // Format: 20 + 5 digits PLU + 5 digits Weight/Price + 1 check digit
    if ((code.startsWith("20") || code.startsWith("21")) && code.length >= 12) {
      const plu = code.substring(2, 7);
      const weightOrPrice = Number(code.substring(7, 12));
      const pluProduct = products.find((p) => p.pluCode === plu);
      if (pluProduct) {
        const grams = weightOrPrice; // weight in grams
        const rate = pluProduct.pricePerKg || pluProduct.basePrice;
        const price = Math.round(((grams / 1000) * rate) * 10) / 10;
        addToPosCart(pluProduct, {
          unit: `${grams} جم (باركود ميزان)`,
          price,
          qty: 1,
          isWeighted: true,
          weightGrams: grams,
        });
        setBarcodeInput("");
        return;
      }
    }

    alert(`الباركود (${code}) غير مسجل في قائمة أصناف فينيسيا`);
    setBarcodeInput("");
  };

  // Calculations
  const subtotal = posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;
  const cashNum = Number(cashGiven) || 0;
  const changeDue = cashNum > total ? cashNum - total : 0;

  // Complete Order
  const handleCompleteOrder = async () => {
    if (posCart.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "pos",
          customerName,
          customerPhone,
          items: posCart.map((i) => ({
            productId: i.productId,
            nameAr: i.nameAr,
            unit: i.unit,
            qty: i.qty,
            unitPrice: i.price,
            total: i.price * i.qty,
            isWeighted: i.isWeighted,
            weightGrams: i.weightGrams,
          })),
          subtotal,
          deliveryFee: 0,
          totalAmount: total,
          paymentMethod,
          cashierName: staff?.name || "كاشير الصالة",
          notes: "فاتورة كاشير صالة",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setLastOrder(data.order);
        setPosCart([]);
        setCashGiven("");
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        alert(data.error || "فشل تسجيل الفاتورة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ الفاتورة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans select-none">
      {/* POS Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🥛</span>
            <span className="font-black text-white text-lg">ألبان فينيسيا — كاشير الصالة</span>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
            نظام الموازين والـ POS السريع
          </span>
        </div>

        <div className="flex items-center gap-3">
          {staff && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{staff.name}</span>
            </div>
          )}

          <Link
            href="/admin"
            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 transition flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>لوحة الإدارة</span>
          </Link>
        </div>
      </header>

      {/* POS Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden no-print">
        {/* RIGHT SIDE: Products & Categories (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-60px)]">
          {/* Top Barcode Scanner & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Barcode Form */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Barcode className="w-4 h-4 text-amber-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود أو كود الميزان (PLU)..."
                className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400 transition"
              />
            </form>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث سريع باسم الصنف..."
                className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCat === "ALL"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              الكل ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCat === c.id
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {c.nameAr}
              </button>
            ))}
          </div>

          {/* Product Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto">
            {filteredProducts.map((p) => {
              const rate = p.isWeighted ? (p.pricePerKg || p.basePrice) : p.basePrice;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.isWeighted) {
                      setScaleProduct(p);
                    } else {
                      addToPosCart(p);
                    }
                  }}
                  className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3 text-right flex flex-col justify-between h-28 transition group shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono truncate">{p.categoryName}</span>
                      {p.isWeighted && (
                        <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                          <Scale className="w-3 h-3" />
                          <span>وزني</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs line-clamp-2 group-hover:text-amber-400 transition leading-snug">
                      {p.nameAr}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
                    <span className="text-sm font-black text-amber-400">{rate} ج.م</span>
                    <span className="text-[10px] text-slate-400">{p.unit}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LEFT SIDE: POS Cart & Checkout Ticket (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#0a101d] border-r border-slate-800 p-4 flex flex-col justify-between h-[calc(100vh-60px)]">
          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
              <span>الفاتورة الحالية ({posCart.length} صنف)</span>
              {posCart.length > 0 && (
                <button
                  onClick={() => setPosCart([])}
                  className="text-rose-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تصفير</span>
                </button>
              )}
            </div>

            {posCart.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs">اضغط على الأصناف أو امسح الباركود للبدء</p>
              </div>
            ) : (
              posCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-white text-xs truncate">{item.nameAr}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-amber-400 font-bold">{item.unit}</span>
                      <span>({item.price} ج.م)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => {
                          if (item.qty <= 1) {
                            setPosCart((prev) => prev.filter((i) => i.id !== item.id));
                          } else {
                            setPosCart((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i))
                            );
                          }
                        }}
                        className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => {
                          setPosCart((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
                          );
                        }}
                        className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center text-xs"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-xs text-amber-400 w-14 text-left">
                      {item.price * item.qty} ج
                    </span>

                    <button
                      onClick={() => setPosCart((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Payment Section */}
          <div className="pt-3 border-t border-slate-800 space-y-3 bg-[#0a101d]">
            {/* Total Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">الإجمالي النهائي:</span>
              <span className="text-2xl font-black font-mono text-amber-400">{total} ج.م</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[
                { key: "cash", label: "نقدي (كاش)", icon: Banknote },
                { key: "instapay", label: "انستا باي", icon: CreditCard },
                { key: "card", label: "فيزا / ميزة", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key as any)}
                    className={`py-2 px-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                      paymentMethod === m.key
                        ? "bg-amber-500 text-slate-950 font-black border-amber-400"
                        : "bg-slate-900 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Calculator */}
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">المدفوع من العميل:</label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="اكتب المبلغ..."
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">الباقي للعميل:</label>
                  <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 font-bold">
                    {changeDue} ج.م
                  </div>
                </div>
              </div>
            )}

            {/* Complete Order Button */}
            <button
              onClick={handleCompleteOrder}
              disabled={posCart.length === 0 || isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? "جارٍ الحفظ والطباعة..." : "حفظ الفاتورة وطباعة الإيصال 🖨️"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SCALE & WEIGHT SELECTION MODAL */}
      {scaleProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 no-print">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <button
              onClick={() => setScaleProduct(null)}
              className="absolute left-4 top-4 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>حاسبة ميزان الصالة الديجيتال</span>
              </span>
              <h3 className="text-lg font-black text-white">{scaleProduct.nameAr}</h3>
              <p className="text-xs text-slate-400 font-mono">
                سعر الكيلو: <span className="font-bold text-amber-400">{scaleProduct.pricePerKg || scaleProduct.basePrice} ج.م</span>
              </p>
            </div>

            {/* Quick Fraction Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { fraction: 0.125, label: "ثمن كجم (125 جم)" },
                { fraction: 0.25, label: "ربع كجم (250 جم)" },
                { fraction: 0.5, label: "نصف كجم (500 جم)" },
                { fraction: 1.0, label: "1 كجم كامل (1000 جم)" },
              ].map((f) => {
                const rate = scaleProduct.pricePerKg || scaleProduct.basePrice;
                const p = Math.round(rate * f.fraction * 10) / 10;
                return (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => {
                      setScaleFraction(f.fraction);
                      setScaleMode("fraction");
                    }}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                      scaleMode === "fraction" && scaleFraction === f.fraction
                        ? "bg-amber-500 text-slate-950 font-black border-amber-400"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="font-mono">{p} ج</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount / Custom Grams */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScaleMode("amount")}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                    scaleMode === "amount" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  طلب بمبلغ مالي (ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode("grams")}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                    scaleMode === "grams" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  وزن بالجرام (جم)
                </button>
              </div>

              {scaleMode === "amount" && (
                <input
                  type="number"
                  value={scaleAmount}
                  onChange={(e) => setScaleAmount(e.target.value)}
                  placeholder="المبلغ المطلوب بالجنيه..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs"
                />
              )}

              {scaleMode === "grams" && (
                <input
                  type="number"
                  value={scaleGrams}
                  onChange={(e) => setScaleGrams(e.target.value)}
                  placeholder="الوزن بالجرام (مثلاً 350)..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white text-xs"
                />
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setScaleProduct(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmScale}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
              >
                إضافة للفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE THERMAL RECEIPT (80mm width) */}
      {lastOrder && (
        <div id="thermal-receipt" className="hidden print:block p-4 max-w-[80mm] mx-auto text-black font-mono text-xs leading-tight">
          <div className="text-center space-y-1 pb-2 border-b border-black">
            <h2 className="text-base font-black">ألبان فينيسيا</h2>
            <p className="text-[10px]">80 المدينة المنورة — حدائق القبة</p>
            <p className="text-[10px]">هاتف: 01018671000 | 0224382540</p>
            <p className="text-xs font-bold pt-1">فاتورة كاشير صالة #{lastOrder.orderNumber}</p>
            <p className="text-[9px]">{new Date().toLocaleString("ar-EG")}</p>
          </div>

          <div className="py-2 space-y-1 border-b border-black">
            {(() => {
              try {
                const parsed = JSON.parse(lastOrder.items);
                return parsed.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <span>{it.nameAr}</span>
                      <span className="text-[9px] block text-gray-700">({it.unit} × {it.qty})</span>
                    </div>
                    <span className="font-bold">{it.total} ج</span>
                  </div>
                ));
              } catch {
                return <div>{lastOrder.items}</div>;
              }
            })()}
          </div>

          <div className="py-2 space-y-1 border-b border-black text-xs">
            <div className="flex justify-between font-black text-sm">
              <span>الإجمالي المطلوب:</span>
              <span>{lastOrder.totalAmount} ج.م</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>طريقة الدفع:</span>
              <span>{lastOrder.paymentMethod === "cash" ? "نقدي (كاش)" : lastOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>الكاشير:</span>
              <span>{lastOrder.cashierName || "كاشير الصالة"}</span>
            </div>
          </div>

          <div className="text-center pt-2 space-y-1 text-[10px]">
            <p className="font-bold">شكراً لزيارتكم ألبان فينيسيا!</p>
            <p>خير المزارع الطبيعي على أصوله 🥛</p>
          </div>
        </div>
      )}
    </div>
  );
}
