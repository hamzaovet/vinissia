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
  ShieldCheck,
  User,
  ShoppingBag,
  CreditCard,
  Banknote,
  RotateCcw,
  X,
  Check,
  Lock,
  LogOut,
  MapPin,
  Building2,
  BellRing,
  Send,
  Save,
  Sparkles,
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

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  whatsapp?: string;
}

const formatUnit = (unit?: string | null) => {
  if (!unit) return "";
  const cleaned = unit.trim();
  if (cleaned === "1 كجم" || cleaned === "كجم") return "كجم";
  return cleaned;
};

export default function PosPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
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
  const [customerName, setCustomerName] = useState("عميل كاشير");
  const [customerPhone, setCustomerPhone] = useState("");

  // Weighted Selection Modal
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [scaleMode, setScaleMode] = useState<"fraction" | "amount" | "grams">("fraction");
  const [scaleFraction, setScaleFraction] = useState<number>(0.25);
  const [scaleAmount, setScaleAmount] = useState<string>("30");
  const [scaleGrams, setScaleGrams] = useState<string>("250");

  // Post Checkout & Receipt State
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery Alarm State
  const [alarmOrder, setAlarmOrder] = useState<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);
  const lastAcknowledgedOrderId = useRef<string>("");

  const barcodeRef = useRef<HTMLInputElement>(null);

  const [isLocked, setIsLocked] = useState(true);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  // Check Staff session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vinissia_staff_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === "owner" || u.role === "manager" || u.role === "branch_manager" || u.role === "cashier") {
          setStaff(u);
          if (u.branchId) {
            setSelectedBranchId(u.branchId);
          }
          setIsLocked(false);
          return;
        }
      }
      setIsLocked(true);
    } catch {
      setIsLocked(true);
    }
  }, []);

  const handleQuickUnlock = async () => {
    if (!unlockPin) return;
    try {
      setUnlocking(true);
      setUnlockError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickPin: unlockPin }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role === "delivery") {
          setUnlockError("حساب كابتن التوصيل غير مصرح له بفتح شاشة الكاشير");
          return;
        }
        localStorage.setItem("vinissia_staff_user", JSON.stringify(data.user));
        setStaff(data.user);
        if (data.user.branchId) {
          setSelectedBranchId(data.user.branchId);
        }
        setIsLocked(false);
        setUnlockPin("");
      } else {
        setUnlockError(data.error || "كود PIN غير صحيح");
      }
    } catch (err) {
      setUnlockError("تعذر الاتصال بالسيرفر");
    } finally {
      setUnlocking(false);
    }
  };

  // Delivery Order Ringing Audio Alert
  const startAlarmSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

      const playChime = () => {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(587, now + 0.35);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        } catch {}
      };

      playChime();
      alarmIntervalRef.current = setInterval(playChime, 1400);
    } catch {}
  };

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmOrder) {
      lastAcknowledgedOrderId.current = alarmOrder.id;
    }
    setAlarmOrder(null);
  };

  // Polling for incoming delivery orders
  useEffect(() => {
    const pollPendingOrders = async () => {
      try {
        const res = await fetch("/api/orders?status=PENDING&orderType=delivery");
        const data = await res.json();
        if (data.success && data.orders && data.orders.length > 0) {
          const newest = data.orders[0];
          // Check if this is for the current branch (or if all branches)
          const isTargetBranch =
            !selectedBranchId ||
            selectedBranchId === "ALL" ||
            !newest.branchId ||
            newest.branchId === selectedBranchId;

          if (isTargetBranch && newest.id !== lastAcknowledgedOrderId.current && !alarmOrder) {
            setAlarmOrder(newest);
            startAlarmSound();
          }
        }
      } catch {}
    };

    pollPendingOrders();
    const interval = setInterval(pollPendingOrders, 6000);
    return () => {
      clearInterval(interval);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [selectedBranchId, alarmOrder]);

  // Load Branches, Categories, and Products
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [resB, resC, resP] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        const dataB = await resB.json();
        const dataC = await resC.json();
        const dataP = await resP.json();
        if (dataB.success && dataB.branches) {
          setBranches(dataB.branches);
          if (!selectedBranchId && dataB.branches.length > 0) {
            setSelectedBranchId(dataB.branches[0].id);
          }
        }
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
    const unitLabel = variation?.unit || formatUnit(product.unit) || "قطعة";
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

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Start a new clean transaction for next customer
  const startNewTransaction = () => {
    setPosCart([]);
    setCashGiven("");
    setCustomerName("عميل كاشير");
    setCustomerPhone("");
    setShowCompletedModal(false);
    setTimeout(() => {
      barcodeRef.current?.focus();
    }, 100);
  };

  // Complete Order
  const handleCompleteOrder = async (shouldPrintReceipt: boolean) => {
    if (posCart.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranchId || staff?.branchId || null,
          orderType: "pos",
          customerName: customerName.trim() || "عميل كاشير",
          customerPhone: customerPhone.trim() || "01000000000",
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
          cashierName: staff?.name || "الكاشير",
          notes: `فاتورة بيع مباشر - ${currentBranch?.name || "الفرع الرئيسي"}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        const orderData = {
          ...data.order,
          branchName: currentBranch?.name || "فرع حدائق القبة (الرئيسي)",
          branchAddress: currentBranch?.address || "80 شارع المدينة المنورة، حدائق القبة",
          branchPhone: currentBranch?.phone || "0224382540",
          savedCart: [...posCart],
        };
        setLastOrder(orderData);
        setShowCompletedModal(true);

        if (shouldPrintReceipt) {
          setTimeout(() => {
            window.print();
          }, 300);
        }
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

  // Open WhatsApp with Itemized Invoice
  const handleSendWhatsAppInvoice = () => {
    if (!lastOrder) return;
    const phone = lastOrder.customerPhone || customerPhone;
    if (!phone || phone === "01000000000") {
      const promptPhone = prompt("أدخل رقم هاتف أو واتساب العميل:");
      if (!promptPhone) return;
      openWhatsApp(promptPhone);
    } else {
      openWhatsApp(phone);
    }
  };

  const openWhatsApp = (phoneStr: string) => {
    const cleanPhone = phoneStr.replace(/\D/g, "");
    let itemsText = "";
    try {
      const items = lastOrder.savedCart || JSON.parse(lastOrder.items || "[]");
      itemsText = items.map((it: any) => `• ${it.nameAr} (${it.unit} × ${it.qty}) = ${it.price * it.qty} ج.م`).join("\n");
    } catch {
      itemsText = "تفاصيل المشتريات";
    }

    const message = `🥛 *فاتورة مشتريات من ألبان فينيسيا*
رقم الفاتورة: #${lastOrder.orderNumber}
الفرع: ${lastOrder.branchName}
التاريخ: ${new Date().toLocaleString("ar-EG")}
-----------------------------
${itemsText}
-----------------------------
💰 *الإجمالي النهائي: ${lastOrder.totalAmount} ج.م*
طريقة الدفع: ${lastOrder.paymentMethod === "cash" ? "نقدي" : lastOrder.paymentMethod}
الكاشير: ${lastOrder.cashierName}

شكراً لزيارتكم ألبان فينيسيا — خير المزارع الطبيعي على أصوله! ✨`;

    const encoded = encodeURIComponent(message);
    const fullPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, "_blank");
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 font-sans select-none" dir="rtl">
        <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Brand Emblem */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-amber-400 bg-amber-50/50 shadow-sm">
              <span className="text-amber-500 text-lg">🥛</span>
              <div className="text-right">
                <span className="font-black text-slate-900 text-base tracking-wide block leading-none">فِـيـنِـيـسِـيـا</span>
                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">مش بس لبن وزبادي</span>
              </div>
              <span className="text-[11px] font-serif italic text-blue-900 font-bold ml-1">Venice</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 pt-1">نقطة بيع الكاشير السريعة</h2>
            <p className="text-xs text-slate-500">
              الشاشة محمية. أدخل كود الـ PIN لفتح درج الكاشير
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                readOnly
                value={unlockPin}
                placeholder="••••••"
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center font-mono text-2xl font-black text-amber-600 tracking-widest focus:outline-none"
              />
            </div>

            {unlockError && (
              <p className="text-xs text-rose-600 text-center font-bold bg-rose-50 py-1.5 rounded-xl border border-rose-200">{unlockError}</p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (unlockPin.length < 6) {
                      setUnlockPin((prev) => prev + num);
                      setUnlockError("");
                    }
                  }}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-500 active:text-slate-950 text-slate-800 font-mono font-black text-lg transition shadow-sm border border-slate-200/60"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUnlockPin("")}
                className="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition border border-rose-200"
              >
                مسح C
              </button>
              <button
                type="button"
                onClick={() => {
                  if (unlockPin.length < 6) {
                    setUnlockPin((prev) => prev + "0");
                    setUnlockError("");
                  }
                }}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-500 active:text-slate-950 text-slate-800 font-mono font-black text-lg transition shadow-sm border border-slate-200/60"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setUnlockPin((prev) => prev.slice(0, -1))}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition border border-slate-200"
              >
                ⌫
              </button>
            </div>

            <button
              type="button"
              disabled={unlocking || unlockPin.length === 0}
              onClick={handleQuickUnlock}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{unlocking ? "جارٍ التحقق..." : "فتح الكاشير 🔓"}</span>
            </button>
          </div>

          <div className="pt-2 text-center border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition">
              المتجر الرئيسي
            </Link>
            <Link href="/login" className="text-amber-600 font-bold hover:underline">
              تسجيل بالاسم والباسورد ⬅
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none">
      {/* DELIVERY AUDIO ALARM BANNER */}
      {alarmOrder && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg z-50 animate-pulse no-print" dir="rtl">
          <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>
              🚨 جرس تنبيه: أوردر دليفري جديد وارد الآن! رقم #{alarmOrder.orderNumber} للعميل ({alarmOrder.customerName}) بمبلغ {alarmOrder.totalAmount} ج.م
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin?tab=orders"
              onClick={stopAlarmSound}
              className="px-3 py-1 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-slate-100 transition shadow-sm"
            >
              عرض في الإدارة
            </Link>
            <button
              onClick={stopAlarmSound}
              className="px-3 py-1 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition border border-white/20"
            >
              كتم التنبيه 🔇
            </button>
          </div>
        </div>
      )}

      {/* POS Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🥛</span>
            <div className="text-right">
              <span className="font-black text-slate-900 text-base block leading-none">ألبان فينيسيا</span>
              <span className="text-[10px] text-amber-700 font-bold block">الكاشير ونقاط البيع</span>
            </div>
          </Link>

          {/* Branch Pill or Switcher */}
          {staff?.role === "owner" || staff?.role === "manager" ? (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-900">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-900 focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentBranch?.name || "فرع الكاشير"}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {staff && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>{staff.name}</span>
            </div>
          )}

          <button
            onClick={() => setIsLocked(true)}
            className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 transition flex items-center gap-1"
            title="قفل الكاشير فورياً لحماية الدرج"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">قفل الدرج</span>
          </button>

          {(staff?.role === "owner" || staff?.role === "manager") && (
            <Link
              href="/admin"
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>لوحة الإدارة</span>
            </Link>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("vinissia_staff_user");
              setStaff(null);
              setIsLocked(true);
            }}
            className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1"
            title="تسجيل خروج"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
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
              <Barcode className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود أو كود الميزان (PLU)..."
                className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 font-mono shadow-sm focus:outline-none focus:border-amber-400 transition"
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
                className="w-full py-2.5 pr-10 pl-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 shadow-sm focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCat === "ALL"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
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
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
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
                  className="bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-400 rounded-2xl p-3 text-right flex flex-col justify-between h-28 transition group shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 truncate max-w-[100px]">{p.categoryName}</span>
                      {p.isWeighted && (
                        <span className="text-blue-600 font-bold flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded-md">
                          <Scale className="w-3 h-3" />
                          <span>وزني</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-2 group-hover:text-amber-700 transition leading-snug">
                      {p.nameAr}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
                    <span className="text-sm font-black text-amber-600">{rate} ج.م</span>
                    <span className="text-[10px] text-slate-500">{formatUnit(p.unit)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LEFT SIDE: POS Cart & Checkout Ticket (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border-r border-slate-200 p-4 flex flex-col justify-between h-[calc(100vh-60px)] shadow-sm">
          {/* Customer Quick Inputs */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100 text-xs">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="اسم العميل (اختياري)..."
              className="py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="تليفون / واتساب العميل..."
              className="py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>الفاتورة الحالية ({posCart.length} صنف)</span>
              </span>
              {posCart.length > 0 && (
                <button
                  onClick={() => setPosCart([])}
                  className="text-rose-600 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تصفير</span>
                </button>
              )}
            </div>

            {posCart.length === 0 ? (
              <div className="text-center py-20 text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs">اضغط على الأصناف أو امسح الباركود للبدء</p>
              </div>
            ) : (
              posCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{item.nameAr}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="text-amber-700 font-bold">{item.unit}</span>
                      <span>({item.price} ج.م)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
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
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => {
                          setPosCart((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
                          );
                        }}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-xs text-amber-700 w-14 text-left">
                      {item.price * item.qty} ج
                    </span>

                    <button
                      onClick={() => setPosCart((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Payment Section */}
          <div className="pt-3 border-t border-slate-200 space-y-3 bg-white">
            {/* Total Display */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">الإجمالي النهائي المطلوب:</span>
              <span className="text-2xl font-black font-mono text-amber-700">{total} ج.م</span>
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
                        ? "bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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
                  <label className="text-[10px] text-slate-500 block mb-1">المدفوع من العميل:</label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="اكتب المبلغ..."
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">الباقي للعميل:</label>
                  <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-emerald-700 font-bold">
                    {changeDue} ج.م
                  </div>
                </div>
              </div>
            )}

            {/* Complete Order Buttons: Print vs Direct Save */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCompleteOrder(true)}
                disabled={posCart.length === 0 || isSubmitting}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>حفظ وطباعة 🖨️</span>
              </button>

              <button
                onClick={() => handleCompleteOrder(false)}
                disabled={posCart.length === 0 || isSubmitting}
                className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بدون طباعة 💾</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POST-CHECKOUT SUCCESS MODAL */}
      {showCompletedModal && lastOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans no-print" dir="rtl">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">تم تسجيل الفاتورة بنجاح!</h3>
              <p className="text-xs text-slate-500 font-mono font-bold">
                فاتورة رقم #{lastOrder.orderNumber} • {lastOrder.branchName}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-right space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-800">{lastOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإجمالي النهائي:</span>
                <span className="font-mono font-black text-amber-700 text-sm">{lastOrder.totalAmount} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-slate-800">{lastOrder.paymentMethod === "cash" ? "نقدي (كاش)" : lastOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Actions: Send WhatsApp, Re-print, New Customer */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleSendWhatsAppInvoice}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الفاتورة للعميل على واتساب 📲</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-200"
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span>إعادة طباعة الإيصال الحراري</span>
              </button>

              <button
                onClick={startNewTransaction}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>معاملة جديدة (عميل جديد) ✨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCALE & WEIGHT SELECTION MODAL */}
      {scaleProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print" dir="rtl">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <button
              onClick={() => setScaleProduct(null)}
              className="absolute left-4 top-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>حاسبة ميزان الكاشير الديجيتال</span>
              </span>
              <h3 className="text-lg font-black text-slate-900">{scaleProduct.nameAr}</h3>
              <p className="text-xs text-slate-500 font-mono">
                سعر الكيلو: <span className="font-bold text-amber-700">{scaleProduct.pricePerKg || scaleProduct.basePrice} ج.م</span>
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
                        ? "bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="font-mono font-bold">{p} ج</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount / Custom Grams */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScaleMode("amount")}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                    scaleMode === "amount" ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  طلب بمبلغ مالي (ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode("grams")}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                    scaleMode === "grams" ? "bg-amber-500 text-slate-950 shadow-sm" : "bg-slate-100 text-slate-700"
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
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:border-amber-400"
                />
              )}

              {scaleMode === "grams" && (
                <input
                  type="number"
                  value={scaleGrams}
                  onChange={(e) => setScaleGrams(e.target.value)}
                  placeholder="الوزن بالجرام (مثلاً 350)..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 text-xs focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setScaleProduct(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmScale}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm"
              >
                إضافة للفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE THERMAL RECEIPT (80mm width) */}
      {lastOrder && (
        <div id="thermal-receipt" className="hidden print:block p-4 max-w-[80mm] mx-auto text-black font-mono text-xs leading-tight" dir="rtl">
          <div className="text-center space-y-1 pb-2 border-b border-black">
            <h2 className="text-base font-black">ألبان فينيسيا</h2>
            <p className="text-[10px] font-bold">مش بس لبن وزبادي</p>
            <p className="text-[10px]">{lastOrder.branchName || "فرع حدائق القبة (الرئيسي)"}</p>
            <p className="text-[9px]">{lastOrder.branchAddress || "80 المدينة المنورة — حدائق القبة"}</p>
            <p className="text-[9px]">هاتف: {lastOrder.branchPhone || "0224382540"}</p>
            <p className="text-xs font-bold pt-1">فاتورة مبيعات #{lastOrder.orderNumber}</p>
            <p className="text-[9px]">{new Date().toLocaleString("ar-EG")}</p>
          </div>

          <div className="py-2 space-y-1 border-b border-black">
            {(() => {
              try {
                const parsed = lastOrder.savedCart || JSON.parse(lastOrder.items || "[]");
                return parsed.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <span>{it.nameAr}</span>
                      <span className="text-[9px] block text-gray-700">({it.unit} × {it.qty})</span>
                    </div>
                    <span className="font-bold">{it.total || it.price * it.qty} ج</span>
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
              <span>{lastOrder.cashierName || "الكاشير"}</span>
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
