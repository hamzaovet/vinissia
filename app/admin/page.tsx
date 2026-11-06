"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CardQRModal from "@/components/CardQRModal";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Users,
  Settings,
  Scale,
  QrCode,
  Truck,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Lock,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Printer,
  Barcode,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "categories" | "users" | "customers" | "settings" | "card"
  >("overview");

  // Data states
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    posSales: 0,
    deliverySales: 0,
    ordersCount: 0,
    pendingDelivery: 0,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Filter & Form States
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [productCatFilter, setProductCatFilter] = useState("ALL");
  const [searchProduct, setSearchProduct] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  // New Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodForm, setProdForm] = useState({
    nameAr: "",
    nameEn: "",
    categoryId: "",
    unit: "1 كجم",
    barcode: "",
    pluCode: "",
    isWeighted: true,
    pricePerKg: 350,
    basePrice: 350,
    costPrice: 280,
    isHouseMade: true,
    inStock: true,
    stockQty: 50,
    badge: "طازج اليوم ⭐",
    description: "",
  });

  // New Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catNameAr, setCatNameAr] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // New User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    pin: "123456",
    role: "cashier",
    phone: "",
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    storeName: "ألبان فينيسيا",
    tagline: "",
    address: "",
    googleMapsUrl: "",
    phone: "",
    hotline: "",
    whatsapp: "",
    minDeliveryOrder: 50,
    announcement: "",
  });

  // Check Auth
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vinissia_staff_user");
      if (!saved) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Load All Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resO, resP, resC, resU, resCust, resCour, resSet] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/users"),
        fetch("/api/customers"),
        fetch("/api/couriers"),
        fetch("/api/settings"),
      ]);

      const [dataO, dataP, dataC, dataU, dataCust, dataCour, dataSet] = await Promise.all([
        resO.json(),
        resP.json(),
        resC.json(),
        resU.json(),
        resCust.json(),
        resCour.json(),
        resSet.json(),
      ]);

      if (dataO.success) {
        setOrders(dataO.orders || []);
        // Calculate metrics
        const ords: any[] = dataO.orders || [];
        const total = ords.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0);
        const pos = ords.filter((o) => o.orderType === "pos" && o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);
        const deliv = ords.filter((o) => o.orderType === "delivery" && o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);
        const pending = ords.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;

        setStats({
          totalSales: total,
          posSales: pos,
          deliverySales: deliv,
          ordersCount: ords.length,
          pendingDelivery: pending,
        });
      }

      if (dataP.success) setProducts(dataP.products || []);
      if (dataC.success) {
        setCategories(dataC.categories || []);
        if (dataC.categories?.length > 0 && !prodForm.categoryId) {
          setProdForm((prev) => ({ ...prev, categoryId: dataC.categories[0].id }));
        }
      }
      if (dataU.success) setUsers(dataU.users || []);
      if (dataCust.success) setCustomers(dataCust.customers || []);
      if (dataCour.success) setCouriers(dataCour.couriers || []);
      if (dataSet.success && dataSet.settings) {
        setSettings(dataSet.settings);
        setSettingsForm({
          storeName: dataSet.settings.storeName || "ألبان فينيسيا",
          tagline: dataSet.settings.tagline || "",
          address: dataSet.settings.address || "",
          googleMapsUrl: dataSet.settings.googleMapsUrl || "",
          phone: dataSet.settings.phone || "",
          hotline: dataSet.settings.hotline || "",
          whatsapp: dataSet.settings.whatsapp || "",
          minDeliveryOrder: dataSet.settings.minDeliveryOrder || 50,
          announcement: dataSet.settings.announcement || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vinissia_staff_user");
    router.push("/login");
  };

  // Toggle User Active Status (Maestro Power)
  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
        );
      } else {
        alert(data.error || "فشل تعديل حالة الحساب");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign Courier to Order
  const handleAssignCourier = async (orderId: string, courierId: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, courierId, status: "OUT_FOR_DELIVERY" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, courierId, status: "OUT_FOR_DELIVERY" } : o))
        );
        alert("تم تسليم الطلب للطيار وخرج للتوصيل الآن 🛵");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ تم حفظ الإعدادات وأرقام الهواتف والواتساب بنجاح وتحديثها في كامل المنظومة!");
        setSettings(data.settings);
      } else {
        alert(data.error || "فشل حفظ الإعدادات");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProduct ? "PUT" : "POST";
      const payload = editingProduct ? { id: editingProduct.id, ...prodForm } : prodForm;

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        setEditingProduct(null);
        loadAllData();
        alert(data.message || "تم حفظ الصنف بنجاح!");
      } else {
        alert(data.error || "فشل حفظ الصنف");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameAr.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameAr: catNameAr, description: catDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCategoryModal(false);
        setCatNameAr("");
        setCatDesc("");
        loadAllData();
        alert("تمت إضافة القسم الجديد بنجاح!");
      } else {
        alert(data.error || "فشل إضافة القسم");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowUserModal(false);
        setUserForm({ name: "", username: "", password: "", pin: "123456", role: "cashier", phone: "" });
        loadAllData();
        alert("تمت إضافة حساب الموظف بنجاح!");
      } else {
        alert(data.error || "فشل إضافة الحساب");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = currentUser?.role === "owner" || currentUser?.username === "maestro";

  return (
    <div className="min-h-screen bg-[#070c17] text-white flex flex-col font-sans">
      {/* Management Top Header (Completely isolated from consumer links) */}
      <header className="bg-slate-950/90 border-b border-amber-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 text-xl font-black">
            🥛
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white text-base sm:text-lg">
                ألبان فينيسيا — لوحة إدارة المنظومة
              </h1>
              {isOwner && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                  👑 المايسترو (صلاحيات كاملة)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              مرحبًا بك، {currentUser?.name || "المدير المسؤول"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
          >
            <span>الموقع العام للجمهور</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/pos"
            className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition flex items-center gap-1.5"
          >
            <span>شاشة كاشير الصالة</span>
          </Link>

          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
          {[
            { key: "overview", label: "نظرة عامة والمبيعات", icon: LayoutDashboard },
            { key: "orders", label: `إدارة الطلبات والدليفري (${orders.length})`, icon: Truck },
            { key: "products", label: `الأصناف والموازين (${products.length})`, icon: Scale },
            { key: "categories", label: `الأقسام الديناميكية (${categories.length})`, icon: Layers },
            { key: "users", label: `الحسابات والصلاحيات (${users.length})`, icon: Users },
            { key: "customers", label: `قاعدة بيانات العملاء (${customers.length})`, icon: ShieldCheck },
            { key: "settings", label: "الإعدادات العامة وهواتف الواتساب", icon: Settings },
            { key: "card", label: "كارت الدعاية (2 QR Codes)", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>إجمالي المبيعات الكلية</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {stats.totalSales} ج.م
                </div>
                <p className="text-[11px] text-slate-500">صالة وكاشير ودليفري</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>مبيعات الدليفري والتوصيل</span>
                  <Truck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  {stats.deliverySales} ج.م
                </div>
                <p className="text-[11px] text-slate-500">طلبات الأونلاين والواتساب</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>مبيعات كاشير الصالة</span>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {stats.posSales} ج.م
                </div>
                <p className="text-[11px] text-slate-500">فواتير ميزان الصالة</p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>طلبات بانتظار التجهيز</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
                  {stats.pendingDelivery}
                </div>
                <p className="text-[11px] text-slate-500">تحتاج خروج مع الطيار</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab("orders")}
                className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 text-right space-y-2 hover:border-cyan-400 transition"
              >
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  🛵
                </div>
                <h4 className="font-bold text-white text-base">متابعة شاشة الدليفري</h4>
                <p className="text-xs text-slate-400">تكليف الطيارين وتتبع خط سير الأوردرات لحظة بلحظة</p>
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 text-right space-y-2 hover:border-amber-400 transition"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ⚖️
                </div>
                <h4 className="font-bold text-white text-base">إدارة الأصناف والموازين</h4>
                <p className="text-xs text-slate-400">تعديل أسعار الكيلو، الأصناف المصنعة، وإضافة منتجات جديدة</p>
              </button>

              <button
                onClick={() => setActiveTab("card")}
                className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-right space-y-2 hover:border-purple-400 transition"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  📱
                </div>
                <h4 className="font-bold text-white text-base">كارت الدعاية (2 QR Codes)</h4>
                <p className="text-xs text-slate-400">طباعة الكارت الفخم للطلب المباشر وتثبيت تطبيق الموبايل</p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & DELIVERY */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {["ALL", "PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                      orderFilter === st
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st === "ALL" && "جميع الطلبات"}
                    {st === "PENDING" && "طلبات جديدة ⏳"}
                    {st === "PREPARING" && "قيد التجهيز 🥣"}
                    {st === "OUT_FOR_DELIVERY" && "في الطريق 🛵"}
                    {st === "DELIVERED" && "تم التسليم ✅"}
                    {st === "CANCELLED" && "ملغي ❌"}
                  </button>
                ))}
              </div>

              <button
                onClick={loadAllData}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>

            {/* Orders Table */}
            <div className="space-y-3">
              {orders
                .filter((o) => orderFilter === "ALL" || o.status === orderFilter)
                .map((order) => {
                  let itemsList: any[] = [];
                  try {
                    itemsList = JSON.parse(order.items);
                  } catch {}

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-amber-400 text-base">
                            #{order.orderNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            {order.orderType === "pos" ? "كاشير صالة" : "دليفري توصيل"}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              order.status === "DELIVERED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : order.status === "OUT_FOR_DELIVERY"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="text-left font-mono text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString("ar-EG")} — {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                        </div>
                      </div>

                      {/* Customer & Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-400">العميل:</span>{" "}
                          <span className="font-bold text-white">{order.customerName}</span> (
                          <a href={`tel:${order.customerPhone}`} className="text-cyan-400 font-mono hover:underline">
                            {order.customerPhone}
                          </a>
                          )
                        </div>

                        <div>
                          <span className="text-slate-400">العنوان:</span>{" "}
                          <span className="text-slate-200">{order.deliveryAddress} ({order.deliveryZone})</span>
                        </div>

                        {order.notes && (
                          <div className="sm:col-span-2 text-amber-300/90 text-[11px] bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                            ملاحظة العميل: {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="text-xs space-y-1">
                        <span className="text-slate-400 font-bold block mb-1">الأصناف:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {itemsList.map((it: any, idx: number) => (
                            <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] flex justify-between">
                              <span className="truncate">{it.nameAr} ({it.unit}) × {it.qty}</span>
                              <span className="font-mono text-amber-400 font-bold">{it.total} ج</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                        <div className="font-mono text-sm">
                          <span className="text-slate-400 text-xs">الإجمالي المطلوب:</span>{" "}
                          <span className="font-black text-amber-400 text-base">{order.totalAmount} ج.م</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Direct WhatsApp chat */}
                          <a
                            href={`https://wa.me/2${order.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `مرحباً أ/ ${order.customerName}، معك ألبان فينيسيا بخصوص أوردر #${order.orderNumber}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب العميل</span>
                          </a>

                          {/* Assign Courier Dropdown */}
                          {order.orderType === "delivery" && order.status !== "DELIVERED" && (
                            <select
                              value={order.courierId || ""}
                              onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="">تكليف طيار للتوصيل...</option>
                              {couriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.vehicleType})
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Mark as Delivered */}
                          {order.status !== "DELIVERED" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                            >
                              تم التسليم
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS & SCALE MENU */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف جديد</span>
                </button>

                <div className="relative w-48 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="بحث بالأصناف..."
                    className="w-full py-1.5 pr-9 pl-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {products.length} صنف مسجل في قائمة فينيسيا
              </span>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">اسم الصنف</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">طبيعة البيع</th>
                    <th className="p-3.5">سعر الكيلو / الوحدة</th>
                    <th className="p-3.5">تكلفة الإنتاج</th>
                    <th className="p-3.5">كود الميزان (PLU)</th>
                    <th className="p-3.5">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {products
                    .filter(
                      (p) =>
                        !searchProduct ||
                        p.nameAr.toLowerCase().includes(searchProduct.toLowerCase()) ||
                        (p.pluCode && p.pluCode.includes(searchProduct))
                    )
                    .map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-900/80 transition">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <span>{prod.nameAr}</span>
                          {prod.isHouseMade && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                              صنع فينيسيا
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300">{prod.categoryName}</td>
                        <td className="p-3.5">
                          {prod.isWeighted ? (
                            <span className="text-cyan-400 font-bold flex items-center gap-1 font-mono">
                              <Scale className="w-3 h-3" />
                              <span>بالميزان والكسور</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">{prod.unit}</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {prod.isWeighted ? prod.pricePerKg : prod.basePrice} ج.م
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{prod.costPrice} ج.م</td>
                        <td className="p-3.5 font-mono text-slate-300">{prod.pluCode || "—"}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setProdForm({
                                nameAr: prod.nameAr,
                                nameEn: prod.nameEn || "",
                                categoryId: prod.categoryId,
                                unit: prod.unit,
                                barcode: prod.barcode || "",
                                pluCode: prod.pluCode || "",
                                isWeighted: prod.isWeighted,
                                pricePerKg: prod.pricePerKg || prod.basePrice,
                                basePrice: prod.basePrice,
                                costPrice: prod.costPrice,
                                isHouseMade: prod.isHouseMade,
                                inStock: prod.inStock,
                                stockQty: prod.stockQty,
                                badge: prod.badge || "",
                                description: prod.description || "",
                              });
                              setShowProductModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 transition"
                            title="تعديل الصنف"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DYNAMIC CATEGORIES */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>

              <span className="text-xs text-slate-400">
                الأقسام تظهر أوتوماتيكياً في شاشات المتجر وشاشة كاشير الصالة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-base">{c.nameAr}</h4>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      {c._count?.products || 0} صنف
                    </span>
                  </div>
                  {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STAFF & USERS (MAESTRO EXCLUSIVE POWERS) */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>إدارة حسابات الطاقم وصلاحيات المايسترو</span>
                </h3>
                <p className="text-xs text-slate-300">
                  المالك (المايسترو) يمتلك صلاحية تفعيل وتعطيل أي حساب فورياً، وتغيير كود الـ PIN وكلمة المرور.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setShowUserModal(true)}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 self-start shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حساب موظف جديد</span>
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الاسم</th>
                    <th className="p-3.5">اسم المستخدم</th>
                    <th className="p-3.5">الدور والوظيفة</th>
                    <th className="p-3.5">كود PIN (مخفي)</th>
                    <th className="p-3.5">حالة الحساب</th>
                    <th className="p-3.5">التحكم والتفعيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/80 transition">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 font-mono text-amber-400">{u.username}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {u.role === "owner" && "👑 المالك العام (Maestro)"}
                          {u.role === "manager" && "💼 مدير الفرع والمعمل"}
                          {u.role === "cashier" && "📟 كاشير صالة POS"}
                          {u.role === "delivery" && "🛵 طيار دليفري"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">••••••</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {u.isActive ? "مفعل نشط 🟢" : "معطل 🔴"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {isOwner && u.username !== "maestro" && (
                          <button
                            onClick={() => handleToggleUserActive(u.id, u.isActive)}
                            className={`py-1 px-3 rounded-lg text-[11px] font-bold transition ${
                              u.isActive
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {u.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                          </button>
                        )}
                        {u.username === "maestro" && (
                          <span className="text-[10px] text-amber-400/80 font-bold">الحساب الأساسي</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMER DATABASE */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">قاعدة بيانات عملاء ألبان فينيسيا الموثقين</h3>
              <span className="text-xs text-slate-400 font-mono">{customers.length} عميل مسجل</span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">اسم العميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">العنوان والحي</th>
                    <th className="p-3.5">حالة التوثيق</th>
                    <th className="p-3.5">إجمالي الطلبات</th>
                    <th className="p-3.5">إجمالي المشتريات</th>
                    <th className="p-3.5">تواصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/80 transition">
                      <td className="p-3.5 font-bold text-white">{c.name}</td>
                      <td className="p-3.5 font-mono text-cyan-400">
                        <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
                      </td>
                      <td className="p-3.5 text-slate-300">{c.address || c.zone || "—"}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {c.isVerified ? `موثق عبر ${c.verificationMethod || "الواتساب"} ✅` : "غير موثق"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{c.totalOrders} أوردر</td>
                      <td className="p-3.5 font-mono font-bold text-amber-400">{c.totalSpent} ج.م</td>
                      <td className="p-3.5">
                        <a
                          href={`https://wa.me/2${c.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1 px-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition text-[11px] font-bold flex items-center gap-1 w-fit"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>واتساب</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: DYNAMIC STORE SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-4 space-y-1">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>إعدادات ألبان فينيسيا الديناميكية</span>
              </h3>
              <p className="text-xs text-slate-400">
                يمكنك هنا تعديل أرقام الهواتف والواتساب والعنوان وأوقات العمل وتسمع فوراً في كامل الموقع وأزرار الطلب.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">اسم المتجر *</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">رقم الواتساب الرئيسي (مربوط بأزرار الطلب) *</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الخط الساخن / هاتف الدليفري *</label>
                  <input
                    type="text"
                    value={settingsForm.hotline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الهاتف الأرضي</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">العنوان بالتفصيل *</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">رابط الموقع على جوجل مابس</label>
                  <input
                    type="text"
                    value={settingsForm.googleMapsUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">شريط الإعلان المتحرك في أعلى الموقع</label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20"
                >
                  حفظ وتطبيق الإعدادات الآن 💾
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 8: DOUBLE QR MARKETING CARD */}
        {activeTab === "card" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span>كارت الدعاية المزدوج الرسمي (2 QR Codes)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  كارت مجهز للطباعة أو المشاركة، يضم QR Code لطلب الأوردر المباشر + QR Code لتثبيت تطبيق الموبايل (PWA).
                </p>
              </div>

              <button
                onClick={() => setShowQrModal(true)}
                className="py-2.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md self-start"
              >
                <Printer className="w-4 h-4" />
                <span>فتح ومعاينة الكارت وطباعته</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Double QR Card Modal */}
      <CardQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        settings={settings}
      />

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl text-white">
            <h3 className="font-black text-lg text-white">
              {editingProduct ? "تعديل بيانات الصنف" : "إضافة صنف جديد لقائمة فينيسيا"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">اسم الصنف بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.nameAr}
                    onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                    placeholder="مثال: جبنة رومي بطارخ قديمة"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">القسم *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">طبيعة البيع *</label>
                  <select
                    value={prodForm.isWeighted ? "true" : "false"}
                    onChange={(e) => setProdForm({ ...prodForm, isWeighted: e.target.value === "true" })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="true">بالميزان والكسور (كجم، ربع، ثمن)</option>
                    <option value="false">بالقطعة أو العلبة أو الطبق</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">سعر البيع (للكيلو أو الوحدة) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodForm.basePrice}
                    onChange={(e) => setProdForm({ ...prodForm, basePrice: Number(e.target.value), pricePerKg: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">تكلفة الإنتاج / الشراء</label>
                  <input
                    type="number"
                    step="0.5"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">كود الميزان الإلكتروني (PLU)</label>
                  <input
                    type="text"
                    value={prodForm.pluCode}
                    onChange={(e) => setProdForm({ ...prodForm, pluCode: e.target.value })}
                    placeholder="مثال: 00101"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الباركود الدولي</label>
                  <input
                    type="text"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    placeholder="تلقائي إن تُرِك فارغاً"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">شارة الصنف (Badge)</label>
                  <input
                    type="text"
                    value={prodForm.badge}
                    onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                    placeholder="مثال: صنع فينيسيا 🥛، تعتيق مزارع ⭐"
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 text-white">
            <h3 className="font-black text-lg text-white">إضافة قسم جديد</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">اسم القسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={catNameAr}
                  onChange={(e) => setCatNameAr(e.target.value)}
                  placeholder="مثال: ألبان وأجبان معتقة"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">وصف مختصر</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="وصف مميزات هذا القسم..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 text-white">
            <h3 className="font-black text-lg text-white">إضافة حساب موظف جديد</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="مثال: كاشير شيفت مسائي"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="cashier2"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">الدور والوظيفة *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="cashier">كاشير صالة POS</option>
                  <option value="manager">مدير فرع</option>
                  <option value="delivery">طيار دليفري</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">كود الـ PIN (مخفي) *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={userForm.pin}
                  onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                  placeholder="123456"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono tracking-widest"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  إضافة الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
