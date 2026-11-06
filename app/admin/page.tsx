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
  Eye,
  EyeOff,
  AlertTriangle,
  PackagePlus,
  Boxes,
  KeyRound,
  Check,
  X,
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
    lowStockCount: 0,
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Filter & Search States
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [productCatFilter, setProductCatFilter] = useState("ALL");
  const [searchProduct, setSearchProduct] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPins, setShowPins] = useState(false);

  // Modals States
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
    minStockQty: 10,
    badge: "طازج اليوم ⭐",
    description: "",
  });

  // Stock Replenishment Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<any>(null);
  const [stockAddAmount, setStockAddAmount] = useState<string>("20");

  // Category Modal (Create & Edit)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({
    nameAr: "",
    nameEn: "",
    description: "",
    sortOrder: 0,
  });

  // User Modal (Create & Edit)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    pin: "123456",
    role: "cashier",
    phone: "",
    isActive: true,
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
      if (parsed.role === "delivery") {
        alert("حساب الدليفري غير مصرح له بدخول لوحة الإدارة العامة");
        router.push("/");
        return;
      }
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
        const ords: any[] = dataO.orders || [];
        const total = ords.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0);
        const pos = ords.filter((o) => o.orderType === "pos" && o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);
        const deliv = ords.filter((o) => o.orderType === "delivery" && o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);
        const pending = ords.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length;

        setStats((prev) => ({
          ...prev,
          totalSales: total,
          posSales: pos,
          deliverySales: deliv,
          ordersCount: ords.length,
          pendingDelivery: pending,
        }));
      }

      if (dataP.success) {
        const prods: any[] = dataP.products || [];
        setProducts(prods);
        const lowStock = prods.filter((p) => p.stockQty <= (p.minStockQty || 15)).length;
        setStats((prev) => ({ ...prev, lowStockCount: lowStock }));
      }

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

  // Save or Update User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Edit User
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            name: userForm.name,
            username: userForm.username,
            phone: userForm.phone,
            role: userForm.role,
            pin: userForm.pin,
            password: userForm.password ? userForm.password : undefined,
            isActive: userForm.isActive,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowUserModal(false);
          setEditingUser(null);
          loadAllData();
          alert("✅ تم تحديث بيانات الحساب والـ PIN بنجاح!");
        } else {
          alert(data.error || "فشل تحديث بيانات الحساب");
        }
      } else {
        // Create User
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (data.success) {
          setShowUserModal(false);
          setUserForm({ name: "", username: "", password: "", pin: "123456", role: "cashier", phone: "", isActive: true });
          loadAllData();
          alert("✅ تمت إضافة حساب الموظف بنجاح!");
        } else {
          alert(data.error || "فشل إضافة الحساب");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: any) => {
    if (user.username === "maestro") {
      alert("حساب المالك العام (المايسترو) محمي بالكامل ولا يمكن حذفه");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف حساب الموظف "${user.name}"؟`)) return;

    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        alert("تم حذف الحساب بنجاح");
      } else {
        alert(data.error || "فشل حذف الحساب");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nameAr.trim()) return;

    try {
      if (editingCategory) {
        // Update Category
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            nameAr: catForm.nameAr,
            nameEn: catForm.nameEn,
            description: catForm.description,
            sortOrder: catForm.sortOrder,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowCategoryModal(false);
          setEditingCategory(null);
          loadAllData();
          alert("✅ تم تعديل بيانات القسم بنجاح!");
        } else {
          alert(data.error || "فشل تعديل القسم");
        }
      } else {
        // Create Category
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (data.success) {
          setShowCategoryModal(false);
          setCatForm({ nameAr: "", nameEn: "", description: "", sortOrder: 0 });
          loadAllData();
          alert("✅ تمت إضافة القسم الجديد بنجاح!");
        } else {
          alert(data.error || "فشل إضافة القسم");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: any) => {
    if (cat._count?.products > 0) {
      if (!confirm(`تنبيه: هذا القسم يحتوي على ${cat._count.products} صنف! هل أنت متأكد من حذفه؟`)) return;
    } else {
      if (!confirm(`هل أنت متأكد من حذف قسم "${cat.nameAr}"؟`)) return;
    }

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        alert("تم حذف القسم بنجاح");
      } else {
        alert(data.error || "فشل حذف القسم");
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

  // Delete Product
  const handleDeleteProduct = async (prod: any) => {
    if (!confirm(`هل أنت متأكد من حذف صنف "${prod.nameAr}" نهائياً من القائمة؟`)) return;

    try {
      const res = await fetch(`/api/products?id=${prod.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        alert("تم حذف الصنف بنجاح");
      } else {
        alert(data.error || "فشل حذف الصنف");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stock Replenishment (توريد بضاعة / زيادة الرصيد)
  const handleReplenishStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockProduct || !stockAddAmount) return;

    try {
      const addQty = Number(stockAddAmount);
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedStockProduct.id,
          adjustQty: addQty,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowStockModal(false);
        setSelectedStockProduct(null);
        setStockAddAmount("20");
        loadAllData();
        alert(`✅ ${data.message}`);
      } else {
        alert(data.error || "فشل تحديث رصيد المخزن");
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
        alert("✅ تم حفظ وتطبيق الإعدادات وأرقام الهواتف والواتساب بنجاح في كامل المنظومة!");
        setSettings(data.settings);
      } else {
        alert(data.error || "فشل حفظ الإعدادات");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = currentUser?.role === "owner" || currentUser?.username === "maestro";

  return (
    <div className="min-h-screen bg-[#070c17] text-white flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="bg-slate-950/95 border-b border-amber-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 text-xl font-black shadow-md">
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
            <Scale className="w-3.5 h-3.5" />
            <span>شاشة كاشير الصالة</span>
          </Link>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300"
            }`}
            title="الإعدادات العامة وأرقام الهواتف"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعدادات المتجر</span>
          </button>

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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-1.5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-inner">
          {[
            { key: "overview", label: "نظرة عامة ومبيعات", icon: LayoutDashboard },
            { key: "orders", label: `الطلبات (${orders.length})`, icon: Truck },
            { key: "products", label: `الأصناف والمخزن (${products.length})`, icon: Scale },
            { key: "categories", label: `الأقسام (${categories.length})`, icon: Layers },
            { key: "users", label: `الطاقم والصلاحيات (${users.length})`, icon: Users },
            { key: "customers", label: `العملاء (${customers.length})`, icon: ShieldCheck },
            { key: "settings", label: "إعدادات المتجر", icon: Settings },
            { key: "card", label: "كارت الدعاية (2 QR)", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Low stock alert banner */}
            {stats.lowStockCount > 0 && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-amber-300">
                      تنبيه مخزون: يوجد {stats.lowStockCount} صنف وصل لرصيد منخفض أو نفد تماماً!
                    </h4>
                    <p className="text-xs text-slate-300">
                      يرجى مراجعة توريد البضاعة وتحديث أرصدة المعمل لضمان استمرار البيع بدون توقف.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("products");
                    setSearchProduct("");
                  }}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition whitespace-nowrap shadow-md"
                >
                  فحص المخزن الآن
                </button>
              </div>
            )}

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
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {stats.pendingDelivery}
                </div>
                <p className="text-[11px] text-slate-500">تحتاج تحضير بالمعمل</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-950/20 to-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-3">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span>موازين وأصناف فينيسيا</span>
                </h3>
                <p className="text-xs text-slate-300">
                  إدارة أسعار الكيلو، أكواد ميزان الباركود (PLU)، وتوريد رصيد بضاعة جديدة للمخزن.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setActiveTab("products")}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                  >
                    إدارة الأصناف والمخزن
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                  >
                    + صنف جديد
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/20 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 space-y-3">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  <span>أسطول طياري الدليفري</span>
                </h3>
                <p className="text-xs text-slate-300">
                  توزيع الأوردرات على الطيارين، تتبع خط سير التوصيل المباشر، وتحصيل النقدية.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition"
                  >
                    شاشة توزيع الأوردرات
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-950/20 to-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-3">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span>كارت الدعاية المزدوج 2 QR</span>
                </h3>
                <p className="text-xs text-slate-300">
                  كارت فينيسيا المطبوع بـ 2 باركود (الطلب المباشر أونلاين + تثبيت تطبيق الموبايل PWA).
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="py-2 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition"
                  >
                    معاينة وطباعة الكارت
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & DELIVERY */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {["ALL", "PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                      orderFilter === st
                        ? "bg-amber-500 text-slate-950 font-black shadow-md"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {st === "ALL" && "جميع الطلبات"}
                    {st === "PENDING" && "انتظار (معمل)"}
                    {st === "PREPARING" && "قيد التجهيز"}
                    {st === "OUT_FOR_DELIVERY" && "مع الطيار 🛵"}
                    {st === "DELIVERED" && "تم التسليم ✅"}
                  </button>
                ))}
              </div>
              <button
                onClick={loadAllData}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث الطلبات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .filter((o) => orderFilter === "ALL" || o.status === orderFilter)
                .map((order) => {
                  let items: any[] = [];
                  try {
                    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
                  } catch {}

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              #{order.orderNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {new Date(order.createdAt).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              order.status === "DELIVERED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : order.status === "OUT_FOR_DELIVERY"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse"
                                : order.status === "PREPARING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {order.status === "DELIVERED" && "تم التسليم ✅"}
                            {order.status === "OUT_FOR_DELIVERY" && "في الطريق 🛵"}
                            {order.status === "PREPARING" && "قيد التجهيز 🥣"}
                            {order.status === "PENDING" && "طلب جديد 📋"}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span className="text-slate-400">العميل:</span>
                            <span>{order.customerName}</span>
                          </p>
                          <p className="font-mono text-cyan-400">{order.customerPhone}</p>
                          <p className="text-slate-300 text-[11px]">{order.deliveryAddress}</p>
                        </div>

                        <div className="bg-slate-950/60 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-800/80">
                          <span className="text-[10px] text-slate-400 font-bold block">محتويات الأوردر:</span>
                          {items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="text-slate-300">
                                {it.nameAr || it.name} ({it.qty || it.quantity} {it.unit})
                              </span>
                              <span className="font-mono text-white">
                                {(it.total || (it.price || it.unitPrice) * (it.qty || it.quantity)).toFixed(1)} ج.م
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-sm font-black">
                          <span className="text-slate-400">الإجمالي:</span>
                          <span className="font-mono text-amber-400 text-base">{order.totalAmount} ج.م</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                            >
                              بدء التجهيز بالمعمل
                            </button>
                          )}

                          {order.orderType === "delivery" && order.status !== "DELIVERED" && (
                            <select
                              value={order.courierId || ""}
                              onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                            >
                              <option value="">-- تسليم لطيار --</option>
                              {couriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.vehicleType})
                                </option>
                              ))}
                            </select>
                          )}

                          {order.status !== "DELIVERED" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                            >
                              تم التسليم
                            </button>
                          )}

                          <Link
                            href={`/track/${order.orderNumber}`}
                            target="_blank"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="صفحة تتبع العميل"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS & SCALE MENU & INVENTORY */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {/* Top Bar with Add & Search & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProdForm({
                      nameAr: "",
                      nameEn: "",
                      categoryId: categories[0]?.id || "",
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
                      minStockQty: 10,
                      badge: "طازج اليوم ⭐",
                      description: "",
                    });
                    setShowProductModal(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
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
                    placeholder="بحث باسم الصنف أو الباركود أو PLU..."
                    className="w-full py-2 pr-9 pl-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>

                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  <option value="ALL">جميع الأقسام ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {products.length} صنف مسجل في قائمة فينيسيا
              </span>
            </div>

            {/* Products Table with Stock & Scale Info */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">اسم الصنف</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">طبيعة البيع</th>
                    <th className="p-3.5">سعر الكيلو / الوحدة</th>
                    <th className="p-3.5">تكلفة الإنتاج</th>
                    <th className="p-3.5">كود الميزان (PLU)</th>
                    <th className="p-3.5">رصيد المخزن الحالي</th>
                    <th className="p-3.5 text-center">إجراءات المخزن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {products
                    .filter((p) => {
                      const matchCat = productCatFilter === "ALL" || p.categoryId === productCatFilter;
                      const q = searchProduct.toLowerCase().trim();
                      const matchSearch =
                        !q ||
                        p.nameAr.toLowerCase().includes(q) ||
                        (p.pluCode && p.pluCode.includes(q)) ||
                        (p.barcode && p.barcode.includes(q));
                      return matchCat && matchSearch;
                    })
                    .map((prod) => {
                      const isLowStock = prod.stockQty <= (prod.minStockQty || 15);
                      const isOutOfStock = prod.stockQty <= 0;

                      return (
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

                          {/* Live Stock Balance */}
                          <td className="p-3.5 font-mono">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                                isOutOfStock
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : isLowStock
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              <span>{prod.stockQty}</span>
                              <span className="text-[10px]">{prod.unit}</span>
                              {isOutOfStock ? "🔴" : isLowStock ? "⚠️" : "🟢"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Replenish Stock Button */}
                              <button
                                onClick={() => {
                                  setSelectedStockProduct(prod);
                                  setStockAddAmount("20");
                                  setShowStockModal(true);
                                }}
                                className="py-1 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition flex items-center gap-1"
                                title="توريد كمية جديدة للمخزن"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>توريد بضاعة</span>
                              </button>

                              {/* Edit Product Button */}
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
                                    minStockQty: prod.minStockQty || 10,
                                    badge: prod.badge || "",
                                    description: prod.description || "",
                                  });
                                  setShowProductModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-400 transition rounded-lg hover:bg-slate-800"
                                title="تعديل بيانات الصنف بالكامل"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Product Button */}
                              <button
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DYNAMIC CATEGORIES */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base">إدارة أقسام المعمل الديناميكية</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعديل وحذف وإضافة الأقسام. تظهر الأقسام تلقائياً في شاشات المتجر وكاشير الصالة.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatForm({ nameAr: "", nameEn: "", description: "", sortOrder: categories.length + 1 });
                  setShowCategoryModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 self-start shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((c) => {
                const catProducts = products.filter((p) => p.categoryId === c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                            📁
                          </div>
                          <div>
                            <h4 className="font-black text-white text-base">{c.nameAr}</h4>
                            {c.nameEn && <span className="text-[11px] text-slate-500 font-mono">{c.nameEn}</span>}
                          </div>
                        </div>

                        <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold px-2.5 py-1 rounded-xl">
                          {catProducts.length} صنف
                        </span>
                      </div>

                      {c.description && <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>}

                      {/* Mini list of sample items in this category */}
                      <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold block">أبرز الأصناف في هذا القسم:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {catProducts.slice(0, 5).map((cp) => (
                            <span
                              key={cp.id}
                              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg"
                            >
                              {cp.nameAr}
                            </span>
                          ))}
                          {catProducts.length > 5 && (
                            <span className="text-[10px] text-amber-400 font-mono self-center">
                              +{catProducts.length - 5} آخرين
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on Category */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCatForm({
                              nameAr: c.nameAr,
                              nameEn: c.nameEn || "",
                              description: c.description || "",
                              sortOrder: c.sortOrder || 0,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setProductCatFilter(c.id);
                          setActiveTab("products");
                        }}
                        className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض الأصناف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  المالك (المايسترو) يمتلك صلاحية تعديل الحسابات، تغيير كود الـ PIN وكلمة المرور، وتفعيل أو تعطيل أي حساب.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => setShowPins(!showPins)}
                  className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {showPins ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                  <span>{showPins ? "إخفاء أكواد الـ PIN" : "إظهار أكواد الـ PIN"}</span>
                </button>

                {isOwner && (
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({
                        name: "",
                        username: "",
                        password: "",
                        pin: "123456",
                        role: "cashier",
                        phone: "",
                        isActive: true,
                      });
                      setShowUserModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة موظف جديد</span>
                  </button>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الاسم</th>
                    <th className="p-3.5">اسم المستخدم</th>
                    <th className="p-3.5">الهاتف</th>
                    <th className="p-3.5">الدور والوظيفة</th>
                    <th className="p-3.5">كود الـ PIN</th>
                    <th className="p-3.5">حالة الحساب</th>
                    <th className="p-3.5 text-center">الإجراءات والتعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/80 transition">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 font-mono text-amber-400">{u.username}</td>
                      <td className="p-3.5 font-mono text-slate-300">{u.phone || "—"}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {u.role === "owner" && "👑 المالك العام (Maestro)"}
                          {u.role === "manager" && "💼 مدير الفرع والمعمل"}
                          {u.role === "cashier" && "📟 كاشير صالة POS"}
                          {u.role === "delivery" && "🛵 طيار دليفري"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {showPins ? (
                          <span className="text-amber-400 font-bold font-mono tracking-widest">{u.pin}</span>
                        ) : (
                          <span className="text-slate-500">••••••</span>
                        )}
                      </td>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit User Button */}
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setUserForm({
                                name: u.name,
                                username: u.username,
                                password: "",
                                pin: u.pin || "123456",
                                role: u.role,
                                phone: u.phone || "",
                                isActive: u.isActive,
                              });
                              setShowUserModal(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                            title="تعديل الحساب والـ PIN وكلمة المرور"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          {/* Toggle Active Button */}
                          {isOwner && u.username !== "maestro" && (
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.isActive)}
                              className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition ${
                                u.isActive
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {u.isActive ? "تعطيل" : "تفعيل"}
                            </button>
                          )}

                          {/* Delete User Button */}
                          {isOwner && u.username !== "maestro" && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {u.username === "maestro" && (
                            <span className="text-[10px] text-amber-400/80 font-bold">الحساب الأساسي</span>
                          )}
                        </div>
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
              <div>
                <h3 className="font-bold text-white text-base">قاعدة بيانات عملاء ألبان فينيسيا</h3>
                <p className="text-xs text-slate-400">سجل طلبات العملاء وتوثيق الهواتف وإجمالي المشتريات</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{customers.length} عميل مسجل</span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-4 space-y-1">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>إعدادات ألبان فينيسيا الديناميكية</span>
              </h3>
              <p className="text-xs text-slate-400">
                يمكنك هنا تعديل أرقام الهواتف والواتساب والعنوان وأوقات العمل وتسمع فوراً في كامل الموقع وأزرار الطلب والدليفري.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">اسم المتجر *</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">شعار المتجر (Tagline)</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    placeholder="خير المزارع الطبيعي على أصوله"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">رقم الواتساب الرئيسي (مربوط بأزرار الطلب الفوري) *</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الخط الساخن / هاتف الدليفري *</label>
                  <input
                    type="text"
                    value={settingsForm.hotline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الهاتف الأرضي</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">الحد الأدنى لطلب الدليفري (ج.م)</label>
                  <input
                    type="number"
                    value={settingsForm.minDeliveryOrder}
                    onChange={(e) => setSettingsForm({ ...settingsForm, minDeliveryOrder: Number(e.target.value) })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">العنوان بالتفصيل *</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-bold block">رابط الموقع على جوجل مابس (Google Maps)</label>
                    {settingsForm.googleMapsUrl && (
                      <a
                        href={settingsForm.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>اختبار فتح الخريطة</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={settingsForm.googleMapsUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">شريط الإعلان المتحرك في أعلى الموقع</label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
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

      {/* QUICK STOCK REPLENISHMENT MODAL (توريد بضاعة / زيادة الرصيد) */}
      {showStockModal && selectedStockProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-emerald-500/40 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base text-white">
                  توريد بضاعة: {selectedStockProduct.nameAr}
                </h3>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>الرصيد المسجل حالياً بالمخزن:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {selectedStockProduct.stockQty} {selectedStockProduct.unit}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>سعر الكيلو / الوحدة:</span>
                <span className="font-mono text-white">
                  {selectedStockProduct.pricePerKg || selectedStockProduct.basePrice} ج.م
                </span>
              </div>
            </div>

            <form onSubmit={handleReplenishStock} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  الكمية الواردة الجديدة المراد إضافتها للمخزن ({selectedStockProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockAddAmount}
                  onChange={(e) => setStockAddAmount(e.target.value)}
                  placeholder="مثال: 25"
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xl text-center"
                />
              </div>

              {/* Quick Add Chips */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStockAddAmount(String(amt))}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition"
                  >
                    +{amt} {selectedStockProduct.unit}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                الرصيد الجديد المتوقع بعد التوريد:{" "}
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {(Number(selectedStockProduct.stockQty) + (Number(stockAddAmount) || 0)).toFixed(2)}{" "}
                  {selectedStockProduct.unit}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                >
                  تأكيد إضافة الرصيد 📦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingProduct ? `تعديل صنف: ${editingProduct.nameAr}` : "إضافة صنف جديد لقائمة فينيسيا"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">اسم الصنف بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.nameAr}
                    onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                    placeholder="مثال: جبنة رومي بطارخ معتقة"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">القسم *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">طبيعة البيع *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, isWeighted: true, unit: "1 كجم" })}
                      className={`py-2 px-3 rounded-xl font-bold transition ${
                        prodForm.isWeighted
                          ? "bg-amber-500 text-slate-950 font-black shadow-md"
                          : "bg-slate-950 border border-slate-800 text-slate-400"
                      }`}
                    >
                      بالميزان والكسور ⚖️
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, isWeighted: false, unit: "قطعة / علبة" })}
                      className={`py-2 px-3 rounded-xl font-bold transition ${
                        !prodForm.isWeighted
                          ? "bg-amber-500 text-slate-950 font-black shadow-md"
                          : "bg-slate-950 border border-slate-800 text-slate-400"
                      }`}
                    >
                      بالقطعة / العلبة 📦
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    {prodForm.isWeighted ? "سعر الكيلو للمستهلك (ج.م) *" : "سعر بيع القطعة (ج.م) *"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodForm.isWeighted ? prodForm.pricePerKg : prodForm.basePrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProdForm({ ...prodForm, pricePerKg: val, basePrice: val });
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">تكلفة الإنتاج / الشراء (ج.م)</label>
                  <input
                    type="number"
                    step="any"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">كود الميزان الديجيتال (PLU Code)</label>
                  <input
                    type="text"
                    value={prodForm.pluCode}
                    onChange={(e) => setProdForm({ ...prodForm, pluCode: e.target.value })}
                    placeholder="مثال: 101"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">رصيد المخزن المتوفر ({prodForm.unit})</label>
                  <input
                    type="number"
                    step="any"
                    value={prodForm.stockQty}
                    onChange={(e) => setProdForm({ ...prodForm, stockQty: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">حد تنبيه انخفاض الرصيد ({prodForm.unit})</label>
                  <input
                    type="number"
                    step="any"
                    value={prodForm.minStockQty}
                    onChange={(e) => setProdForm({ ...prodForm, minStockQty: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">شارة تميز الصنف (Badge)</label>
                  <input
                    type="text"
                    value={prodForm.badge}
                    onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                    placeholder="مثال: صنع فينيسيا 🥛 أو طازج اليوم ⭐"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">وصف الصنف ومكوناته</label>
                  <textarea
                    rows={2}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="طبيعي 100% بدون أي مواد حافظة أو زيوت نباتية..."
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
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  حفظ الصنف 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingCategory ? `تعديل قسم: ${editingCategory.nameAr}` : "إضافة قسم جديد"}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">اسم القسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })}
                  placeholder="مثال: ألبان وأجبان معتقة"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">الاسم بالإنجليزية (اختياري)</label>
                <input
                  type="text"
                  value={catForm.nameEn}
                  onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                  placeholder="Dairy & Aged Cheeses"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">وصف القسم</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="وصف مميزات هذا القسم وما يحتويه..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  {editingCategory ? "حفظ التعديلات" : "إضافة القسم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0a1220] border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingUser ? `تعديل حساب: ${editingUser.name}` : "إضافة حساب موظف جديد"}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="مثال: كاشير شيفت مسائي"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  disabled={editingUser?.username === "maestro"}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="cashier2"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">رقم الهاتف</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="010xxxxxxxx"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">الدور والوظيفة *</label>
                <select
                  disabled={editingUser?.username === "maestro"}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white disabled:opacity-50"
                >
                  <option value="cashier">كاشير صالة POS</option>
                  <option value="manager">مدير الفرع والمعمل</option>
                  <option value="delivery">طيار دليفري</option>
                  {isOwner && <option value="owner">المالك العام (Maestro)</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  كود الـ PIN السريع (6 أرقام) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={userForm.pin}
                  onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                  placeholder="123456"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-center font-bold tracking-widest text-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  {editingUser ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "أدخل كلمة المرور"}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              {editingUser && editingUser.username !== "maestro" && (
                <div className="pt-1 flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-bold">حالة تفعيل الحساب:</span>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                      userForm.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {userForm.isActive ? "نشط ومفعل 🟢" : "معطل 🔴"}
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  {editingUser ? "حفظ التعديلات 💾" : "إضافة الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
