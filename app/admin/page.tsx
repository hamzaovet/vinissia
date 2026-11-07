"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Store,
  FileSpreadsheet,
  History,
  ClipboardList,
  Wallet,
  Banknote,
  Coins,
  BellRing,
  Send,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

const formatUnit = (unit?: string | null) => {
  if (!unit) return "";
  const cleaned = unit.trim();
  if (cleaned === "1 كجم" || cleaned === "كجم") return "كجم";
  return cleaned;
};

export default function AdminPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "categories" | "treasury" | "couriers" | "users" | "customers" | "settings" | "card"
  >("overview");

  // Branches & Active Branch Filter
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");

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
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierForm, setCourierForm] = useState({ name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });
  const [savingCourier, setSavingCourier] = useState(false);
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
    image: "",
    description: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Stock Replenishment Modal (توريد بضاعة)
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<any>(null);
  const [stockReplenishBranchId, setStockReplenishBranchId] = useState<string>("");
  const [stockAddAmount, setStockAddAmount] = useState<string>("20");
  const [stockSupplyNotes, setStockSupplyNotes] = useState<string>("");

  // Item Stock Card Modal (كارت الصنف والجرد الفعلي)
  const [showStockCardModal, setShowStockCardModal] = useState(false);
  const [stockCardProduct, setStockCardProduct] = useState<any>(null);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [auditBranchId, setAuditBranchId] = useState<string>("");
  const [auditCountedQty, setAuditCountedQty] = useState<string>("");
  const [auditNotes, setAuditNotes] = useState<string>("");
  // Item Stock Card Opening Stock Edit
  const [openingBranchId, setOpeningBranchId] = useState<string>("");
  const [newOpeningStockQty, setNewOpeningStockQty] = useState<string>("");
  const [openingNotes, setOpeningNotes] = useState<string>("");
  const [isUpdatingOpening, setIsUpdatingOpening] = useState(false);

  // Treasury State
  const [treasuryData, setTreasuryData] = useState<any>(null);
  const [loadingTreasury, setLoadingTreasury] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  const [treasuryForm, setTreasuryForm] = useState({
    branchId: "",
    type: "OUT",
    category: "OWNER_WITHDRAWAL",
    amount: "",
    description: "",
  });

  // Delivery Alarm State
  const [alarmOrder, setAlarmOrder] = useState<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);
  const lastAcknowledgedOrderId = useRef<string>("");


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
    branchId: "",
    phone: "",
    isActive: true,
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    storeName: "ألبان فينيسيا",
    tagline: "مش بس لبن وزبادي — خير المزارع الطبيعي على أصوله",
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
      // If user is a branch-restricted manager/cashier, lock to their branch
      if (parsed.branchId) {
        setSelectedBranchId(parsed.branchId);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Load All Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resO, resP, resC, resU, resCust, resCour, resSet, resB] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/users"),
        fetch("/api/customers"),
        fetch("/api/couriers"),
        fetch("/api/settings"),
        fetch("/api/branches"),
      ]);

      const [dataO, dataP, dataC, dataU, dataCust, dataCour, dataSet, dataB] = await Promise.all([
        resO.json(),
        resP.json(),
        resC.json(),
        resU.json(),
        resCust.json(),
        resCour.json(),
        resSet.json(),
        resB.json(),
      ]);

      if (dataB.success) {
        setBranches(dataB.branches || []);
        if (dataB.branches?.length > 0 && !stockReplenishBranchId) {
          setStockReplenishBranchId(dataB.branches[0].id);
        }
      }

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

        const pendingDelivs = ords.filter((o: any) => o.orderType === "delivery" && o.status === "PENDING");
        if (pendingDelivs.length > 0) {
          const newest = pendingDelivs[0];
          if (newest.id !== lastAcknowledgedOrderId.current && !alarmOrder) {
            setAlarmOrder(newest);
            startAlarmSound();
          }
        }
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
          tagline: dataSet.settings.tagline || "مش بس لبن وزبادي — خير المزارع الطبيعي على أصوله",
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

  // Open Stock Card for Product
  const handleOpenStockCard = async (prod: any) => {
    setStockCardProduct(prod);
    setShowStockCardModal(true);
    setAuditBranchId(branches[0]?.id || "");
    try {
      setLoadingMovements(true);
      const res = await fetch(`/api/stock-movements?productId=${prod.id}`);
      const data = await res.json();
      if (data.success) {
        setStockMovements(data.movements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Submit Physical Audit Adjustment (تسوية الجرد الفعلي)
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockCardProduct || !auditBranchId || auditCountedQty === "") return;

    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: stockCardProduct.id,
          branchId: auditBranchId,
          type: "AUDIT_ADJUST",
          actualCountedQty: Number(auditCountedQty),
          notes: auditNotes || "مطابقة وتسوية جرد فعلي بالمخزن",
          recordedBy: currentUser?.name || "المايسترو",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setAuditCountedQty("");
        setAuditNotes("");
        handleOpenStockCard(stockCardProduct);
        loadAllData();
      } else {
        alert(data.error || "فشل تسجيل تسوية الجرد");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Supply / Replenishment (توريد بضاعة جديدة)
  const handleReplenishStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockProduct || !stockReplenishBranchId || !stockAddAmount) return;

    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedStockProduct.id,
          branchId: stockReplenishBranchId,
          type: "SUPPLY",
          qty: Number(stockAddAmount),
          notes: stockSupplyNotes || "إذن توريد واستلام بضاعة للمخزن",
          recordedBy: currentUser?.name || "المايسترو",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowStockModal(false);
        setSelectedStockProduct(null);
        setStockAddAmount("20");
        setStockSupplyNotes("");
        loadAllData();
        alert(`✅ ${data.message}`);
      } else {
        alert(data.error || "فشل توريد البضاعة");
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  // Submit Opening Stock Update (تعديل رصيد أول المدة الافتتاحي)
  const handleUpdateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockCardProduct || !openingBranchId || newOpeningStockQty === "") return;

    try {
      setIsUpdatingOpening(true);
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: stockCardProduct.id,
          branchId: openingBranchId,
          type: "UPDATE_OPENING",
          qty: Number(newOpeningStockQty),
          notes: openingNotes || "تعديل واعتماد رصيد أول المدة (الجرد الافتتاحي)",
          recordedBy: currentUser?.name || "المايسترو",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ " + data.message);
        setNewOpeningStockQty("");
        setOpeningNotes("");
        handleOpenStockCard(stockCardProduct);
        loadAllData();
      } else {
        alert(data.error || "فشل تعديل رصيد أول المدة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء تعديل رصيد أول المدة");
    } finally {
      setIsUpdatingOpening(false);
    }
  };

  // Treasury Data Fetcher
  const fetchTreasury = async () => {
    try {
      setLoadingTreasury(true);
      const res = await fetch(`/api/treasury?branchId=${selectedBranchId}`);
      const data = await res.json();
      if (data.success) {
        setTreasuryData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTreasury(false);
    }
  };

  useEffect(() => {
    if (activeTab === "treasury") {
      fetchTreasury();
    }
  }, [activeTab, selectedBranchId]);

  // Handle Save Treasury Movement
  const handleSaveTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasuryForm.amount || !treasuryForm.description) return;

    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: treasuryForm.branchId || (selectedBranchId !== "ALL" ? selectedBranchId : (branches[0]?.id || null)),
          type: treasuryForm.category === "OWNER_DEPOSIT" ? "IN" : "OUT",
          category: treasuryForm.category,
          amount: Number(treasuryForm.amount),
          description: treasuryForm.description,
          recordedBy: currentUser?.name || "المايسترو",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ تم تسجيل حركة الخزينة بنجاح");
        setShowTreasuryModal(false);
        setTreasuryForm({
          branchId: "",
          type: "OUT",
          category: "OWNER_WITHDRAWAL",
          amount: "",
          description: "",
        });
        fetchTreasury();
      } else {
        alert(data.error || "فشل تسجيل حركة الخزينة");
      }
    } catch {
      alert("تعذر الاتصال بالسيرفر");
    }
  };

  // Delivery Alarm Sound Loop
  const startAlarmSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

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
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            name: userForm.name,
            username: userForm.username,
            phone: userForm.phone,
            role: userForm.role,
            branchId: userForm.branchId || null,
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
          alert("✅ تم تحديث بيانات الحساب بنجاح!");
        } else {
          alert(data.error || "فشل تحديث الحساب");
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (data.success) {
          setShowUserModal(false);
          setUserForm({
            name: "",
            username: "",
            password: "",
            pin: "123456",
            role: "cashier",
            branchId: "",
            phone: "",
            isActive: true,
          });
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
          alert("✅ تم تعديل القسم بنجاح!");
        }
      } else {
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
          alert("✅ تمت إضافة القسم بنجاح!");
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign Courier to Order
  
  // Handle Add Courier
  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierForm.name || !courierForm.phone) return;
    try {
      setSavingCourier(true);
      const res = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courierForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCourierModal(false);
        setCourierForm({ name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });
        // Refresh couriers
        const cres = await fetch("/api/couriers");
        const cdata = await cres.json();
        if (cdata.success) setCouriers(cdata.couriers || []);
        alert("✅ تمت إضافة الطيار بنجاح إلى الأسطول");
      } else {
        alert(data.error || "فشل إضافة الطيار");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setSavingCourier(false);
    }
  };

  // Handle Toggle Courier Availability
  const handleToggleCourier = async (courierId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/couriers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courierId, isAvailable: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCouriers((prev) =>
          prev.map((c) => (c.id === courierId ? { ...c, isAvailable: !currentStatus } : c))
        );
      }
    } catch {
      alert("فشل تحديث حالة الطيار");
    }
  };

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
        alert("✅ تم حفظ وتطبيق الإعدادات بنجاح!");
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOwner = currentUser?.role === "owner" || currentUser?.username === "maestro";

  // Filter Orders by Branch if selected
  const branchFilteredOrders = orders.filter((o) => {
    if (selectedBranchId !== "ALL" && o.branchId && o.branchId !== selectedBranchId) {
      return false;
    }
    return orderFilter === "ALL" || o.status === orderFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans" dir="rtl">
      {/* Top Header (Fresh Milk White Theme) */}
      
      {/* DELIVERY AUDIO ALARM BANNER */}
      {alarmOrder && (
        <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between animate-pulse shadow-lg z-50" dir="rtl">
          <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>
              🚨 جرس تنبيه عاجل: أوردر دليفري جديد وارد الآن! رقم #{alarmOrder.orderNumber} للعميل ({alarmOrder.customerName}) بمبلغ {alarmOrder.totalAmount} ج.م
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopAlarmSound();
                setActiveTab("orders");
              }}
              className="px-3 py-1 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-slate-100 transition shadow-sm"
            >
              عرض وقبول الأوردر 👁️
            </button>
            <button
              onClick={stopAlarmSound}
              className="px-3 py-1 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition border border-white/20"
            >
              كتم التنبيه 🔇
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 no-print sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Real Official Venice Logo Image */}
          <div className="p-1 rounded-2xl bg-white border border-slate-200 shadow-sm ring-2 ring-amber-400/30 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="ألبان فينيسيا"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-sm sm:text-base">
                لوحة إدارة المنظومة والفروع
              </h1>
              {isOwner && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                  👑 المايسترو
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              مرحبًا بك، {currentUser?.name || "المدير العام"}
            </p>
          </div>
        </div>

        {/* Branch Selector Dropdown (Multi-Branch Core) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isOwner || !currentUser?.branchId ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
              <Store className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-600">الفرع النشط:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🏢 إجمالي كل الفروع (مجمع)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600" />
              <span>{currentUser?.branch?.name || "فرعك المخصص"}</span>
            </div>
          )}

          <Link
            href="/"
            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
          >
            <span>المتجر العام</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/pos"
            className="py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-bold text-sky-800 transition flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            <span>الكاشير</span>
          </Link>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">إعدادات المتجر</span>
          </button>

          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-1.5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          {[
            { key: "overview", label: "نظرة عامة ومبيعات", icon: LayoutDashboard },
            { key: "orders", label: `الطلبات (${branchFilteredOrders.length})`, icon: Truck },
            { key: "products", label: `الأصناف والمخزن (${products.length})`, icon: Scale },
            { key: "categories", label: `الأقسام (${categories.length})`, icon: Layers },
            { key: "treasury", label: "الخزينة وجاري المالك", icon: Wallet },
            { key: "couriers", label: `أسطول الطيارين (${couriers.length})`, icon: Truck },
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
                    ? "bg-slate-900 text-white font-black shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & MULTI-BRANCH ANALYTICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Low Stock Banner */}
            {stats.lowStockCount > 0 && (
              <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-amber-900">
                      تنبيه مخزون: يوجد {stats.lowStockCount} صنف وصل لرصيد منخفض في المخازن!
                    </h4>
                    <p className="text-xs text-slate-600">
                      يرجى مراجعة توريد البضاعة وتحديث أرصدة المعمل لضمان استمرار تلبية طلبات الكاشير والدليفري.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("products")}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm whitespace-nowrap"
                >
                  فحص المخزن الآن
                </button>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>إجمالي المبيعات المحققة</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  {stats.totalSales} <span className="text-xs text-slate-500 font-sans font-bold">ج.م</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedBranchId === "ALL" ? "إجمالي كل الفروع" : "مبيعات الفرع المحدد"}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>مبيعات الدليفري والتوصيل</span>
                  <Truck className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-sky-700">
                  {stats.deliverySales} <span className="text-xs text-slate-500 font-sans font-bold">ج.م</span>
                </div>
                <p className="text-[11px] text-slate-400">طلبات الأونلاين والواتساب</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>مبيعات كاشير الصالة</span>
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
                  {stats.posSales} <span className="text-xs text-slate-500 font-sans font-bold">ج.م</span>
                </div>
                <p className="text-[11px] text-slate-400">فواتير ميزان الصالة والبيع المباشر</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>أوردرات قيد التجهيز</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  {stats.pendingDelivery}
                </div>
                <p className="text-[11px] text-slate-400">في انتظار تجهيز المعمل</p>
              </div>
            </div>

            {/* Branches Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black">
                        🏪
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{b.name}</h3>
                        <p className="text-xs text-slate-500">{b.address}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      كود: {b.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">الهاتف:</span>
                      <span className="font-mono font-bold text-slate-800">{b.phone}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">الموظفين:</span>
                      <span className="font-mono font-bold text-slate-800">{b._count?.users || 0} موظف</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">الأوردرات:</span>
                      <span className="font-mono font-bold text-slate-800">{b._count?.orders || 0} طلب</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setActiveTab("products");
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                    >
                      فحص مخزن هذا الفرع
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setActiveTab("orders");
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                    >
                      مبيعات وطلبات الفرع
                    </button>
                  </div>
                </div>
              ))}
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
                        ? "bg-slate-900 text-white font-black shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {st === "ALL" && "جميع الطلبات"}
                    {st === "PENDING" && "انتظار المعمل"}
                    {st === "PREPARING" && "قيد التجهيز"}
                    {st === "OUT_FOR_DELIVERY" && "مع الطيار 🛵"}
                    {st === "DELIVERED" && "تم التسليم ✅"}
                  </button>
                ))}
              </div>
              <button
                onClick={loadAllData}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث الطلبات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchFilteredOrders.map((order) => {
                let items: any[] = [];
                try {
                  items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
                } catch {}

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-900">
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
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.status === "OUT_FOR_DELIVERY"
                              ? "bg-sky-50 text-sky-700 border border-sky-200 animate-pulse"
                              : order.status === "PREPARING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {order.status === "DELIVERED" && "تم التسليم ✅"}
                          {order.status === "OUT_FOR_DELIVERY" && "في الطريق 🛵"}
                          {order.status === "PREPARING" && "قيد التجهيز 🥣"}
                          {order.status === "PENDING" && "طلب جديد 📋"}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-slate-400">العميل:</span>
                          <span>{order.customerName}</span>
                        </p>
                        <p className="font-mono text-sky-600">{order.customerPhone}</p>
                        <p className="text-slate-600 text-[11px]">{order.deliveryAddress}</p>
                        {order.branch && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {order.branch.name}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">محتويات الأوردر:</span>
                        {items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-700">
                              {it.nameAr || it.name} ({it.qty || it.quantity} {it.unit})
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {(it.total || (it.price || it.unitPrice) * (it.qty || it.quantity)).toFixed(1)} ج.م
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-sm font-black">
                        <span className="text-slate-500">الإجمالي:</span>
                        <span className="font-mono text-slate-950 text-base">{order.totalAmount} ج.م</span>
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
                            className="flex-1 py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
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
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition"
                          >
                            تم التسليم
                          </button>
                        )}

                        <Link
                          href={`/track/${order.orderNumber}`}
                          target="_blank"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="تتبع مباشر"
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

        {/* TAB 3: PRODUCTS & SEPARATE INVENTORY (مخزن كل فرع وكارت الصنف) */}
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
                      image: "",
                      description: "",
                    });
                    setShowProductModal(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>إضافة صنف جديد</span>
                </button>

                <div className="relative w-48 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="بحث بالأصناف أو كود PLU..."
                    className="w-full py-2 pr-9 pl-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 shadow-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-sm cursor-pointer"
                >
                  <option value="ALL">جميع الأقسام ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>{products.length} صنف مسجل بالمنيو</span>
              </div>
            </div>

            {/* Products Table with Branch Stock Columns & Item Card Trigger */}
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">اسم الصنف بالمنيو</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">البيع والتسعير</th>
                    <th className="p-3.5">سعر المستهلك</th>
                    <th className="p-3.5">كود الميزان (PLU)</th>
                    {branches.map((b) => (
                      <th key={b.id} className="p-3.5 text-center">
                        مخزن: {b.name.replace("فرع ", "")}
                      </th>
                    ))}
                    <th className="p-3.5 text-center">إجمالي المخزون</th>
                    <th className="p-3.5 text-center">كارت الصنف والإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner">
                                <img
                                  src={prod.image || "/logo.png"}
                                  alt={prod.nameAr}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <span className="block leading-tight">{prod.nameAr}</span>
                                {prod.badge && (
                                  <span className="inline-block text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded-full mt-0.5">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-600">{prod.categoryName}</td>
                          <td className="p-3.5">
                            {prod.isWeighted ? (
                              <span className="text-sky-700 font-bold flex items-center gap-1 font-mono">
                                <Scale className="w-3 h-3" />
                                <span>ميزان وكسور</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">{prod.unit}</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-950">
                            {prod.isWeighted ? prod.pricePerKg : prod.basePrice} ج.م
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">{prod.pluCode || "—"}</td>

                          {/* Branch Stocks Columns */}
                          {branches.map((b) => {
                            const bStock = prod.branchStocks?.find((bs: any) => bs.branchId === b.id);
                            const stockVal = bStock ? bStock.stockQty : 0;
                            const isLow = stockVal <= 10;
                            return (
                              <td key={b.id} className="p-3.5 text-center font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                    stockVal <= 0
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : isLow
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {stockVal} {formatUnit(prod.unit)}
                                </span>
                              </td>
                            );
                          })}

                          {/* Total Global Stock */}
                          <td className="p-3.5 text-center font-mono font-black text-slate-950">
                            {prod.stockQty} {formatUnit(prod.unit)}
                          </td>

                          {/* Actions: Stock Card, Replenish, Edit, Delete */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Stock Card Button */}
                              <button
                                onClick={() => handleOpenStockCard(prod)}
                                className="py-1 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                title="كارت الصنف وسجل الحركات والجرد"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                                <span>كارت الصنف</span>
                              </button>

                              {/* Quick Replenish Button */}
                              <button
                                onClick={() => {
                                  setSelectedStockProduct(prod);
                                  setShowStockModal(true);
                                }}
                                className="py-1 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition flex items-center gap-1"
                                title="توريد بضاعة جديدة للفرع"
                              >
                                <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>توريد</span>
                              </button>

                              {/* Edit Product */}
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
                                    image: prod.image || "",
                                    description: prod.description || "",
                                  });
                                  setShowProductModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 transition rounded-lg hover:bg-slate-100"
                                title="تعديل بيانات الصنف"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Product */}
                              <button
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
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
                <h3 className="font-bold text-slate-900 text-base">إدارة أقسام منيو فينيسيا</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أقسام المنيو الديناميكية تظهر تلقائياً في شاشات المتجر وشاشة كاشير الصالة.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatForm({ nameAr: "", nameEn: "", description: "", sortOrder: categories.length + 1 });
                  setShowCategoryModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 self-start shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((c) => {
                const catProducts = products.filter((p) => p.categoryId === c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                            📁
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-base">{c.nameAr}</h4>
                            {c.nameEn && <span className="text-[11px] text-slate-400 font-mono">{c.nameEn}</span>}
                          </div>
                        </div>

                        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold px-2.5 py-1 rounded-xl">
                          {catProducts.length} صنف
                        </span>
                      </div>

                      {c.description && <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>}

                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold block">نماذج أصناف هذا القسم:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {catProducts.slice(0, 5).map((cp) => (
                            <span
                              key={cp.id}
                              className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg"
                            >
                              {cp.nameAr}
                            </span>
                          ))}
                          {catProducts.length > 5 && (
                            <span className="text-[10px] text-amber-600 font-mono self-center">
                              +{catProducts.length - 5} آخرين
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
                          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1"
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
                        className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>عرض الأصناف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: TREASURY & OWNER ACCOUNT (الخزينة وجاري المالك) */}
        {activeTab === "treasury" && (
          <div className="space-y-6">
            {/* Header & Quick Action Buttons */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  <span>الخزينة وحسابات الفروع وجاري المالك</span>
                </h3>
                <p className="text-xs text-slate-500">
                  متابعة النقدية المتوفرة بالدرج، مسحوبات وإيداعات المالك (جاري المالك)، المصروفات النثرية، وصافي الأرباح.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setTreasuryForm({
                      branchId: selectedBranchId !== "ALL" ? selectedBranchId : (branches[0]?.id || ""),
                      type: "OUT",
                      category: "OWNER_WITHDRAWAL",
                      amount: "",
                      description: "مسحوبات نقدية - جاري المالك",
                    });
                    setShowTreasuryModal(true);
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Coins className="w-4 h-4" />
                  <span>سحب نقدي (جاري المالك) 💸</span>
                </button>

                <button
                  onClick={() => {
                    setTreasuryForm({
                      branchId: selectedBranchId !== "ALL" ? selectedBranchId : (branches[0]?.id || ""),
                      type: "IN",
                      category: "OWNER_DEPOSIT",
                      amount: "",
                      description: "إيداع وتغذية الخزينة - جاري المالك",
                    });
                    setShowTreasuryModal(true);
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إيداع وتغذية (جاري المالك) 📥</span>
                </button>

                <button
                  onClick={() => {
                    setTreasuryForm({
                      branchId: selectedBranchId !== "ALL" ? selectedBranchId : (branches[0]?.id || ""),
                      type: "OUT",
                      category: "EXPENSE",
                      amount: "",
                      description: "مصروفات نثرية / تشغيلية",
                    });
                    setShowTreasuryModal(true);
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200"
                >
                  <Banknote className="w-4 h-4 text-rose-600" />
                  <span>تسجيل مصروفات 🧾</span>
                </button>
              </div>
            </div>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
                <span className="text-xs font-bold text-slate-500 block">رصيد الخزينة الحالي (نقدية بالدرج)</span>
                <div className="font-mono text-2xl font-black text-emerald-700">
                  {treasuryData?.metrics?.currentCashBalance ?? 0} ج.م
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {selectedBranchId === "ALL" ? "إجمالي كل الفروع" : "رصيد الفرع المحدد"}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
                <span className="text-xs font-bold text-slate-500 block">صافي حساب جاري المالك</span>
                <div className="font-mono text-2xl font-black text-amber-700">
                  {treasuryData?.metrics?.netOwnerAccount ?? 0} ج.م
                </div>
                <span className="text-[10px] text-slate-400 block">
                  مسحوبات: {treasuryData?.metrics?.ownerWithdrawals ?? 0} | إيداعات: {treasuryData?.metrics?.ownerDeposits ?? 0}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
                <span className="text-xs font-bold text-slate-500 block">إجمالي مبيعات الفواتير</span>
                <div className="font-mono text-2xl font-black text-slate-900">
                  {treasuryData?.metrics?.totalSalesRevenue ?? 0} ج.م
                </div>
                <span className="text-[10px] text-slate-400 block">
                  كاشير: {treasuryData?.metrics?.posSales ?? 0} | دليفري: {treasuryData?.metrics?.deliverySales ?? 0}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-1 shadow-sm">
                <span className="text-xs font-bold text-slate-500 block">صافي الأرباح التقديرية</span>
                <div className="font-mono text-2xl font-black text-sky-700">
                  {treasuryData?.metrics?.netProfit ?? 0} ج.م
                </div>
                <span className="text-[10px] text-slate-400 block">
                  المصروفات: {treasuryData?.metrics?.totalExpenses ?? 0} ج.م
                </span>
              </div>
            </div>

            {/* Treasury Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>دفتر حركات الخزينة والحسابات (وارد / منصرف / جاري المالك):</span>
                </h4>
                <button
                  onClick={fetchTreasury}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">الفرع</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">التبويب</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">الرصيد بعد الحركة</th>
                      <th className="p-3">البيان والتفاصيل</th>
                      <th className="p-3">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {loadingTreasury ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          جارٍ تحميل دفتر الخزينة...
                        </td>
                      </tr>
                    ) : !treasuryData?.transactions || treasuryData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 font-sans">
                          لا توجد حركات مسجلة بالخزينة بعد (بداية نظيفة 100%)
                        </td>
                      </tr>
                    ) : (
                      treasuryData.transactions.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-600 font-sans text-[11px]">
                            {new Date(t.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="p-3 font-sans font-bold text-slate-800">
                            {t.branch?.name || "الخزينة العامة"}
                          </td>
                          <td className="p-3 font-sans">
                            {t.type === "IN" ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black border border-emerald-200 text-[11px]">
                                وارد (إيداع) +
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black border border-rose-200 text-[11px]">
                                منصرف (سحب) -
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-slate-700 font-bold">
                            {t.category === "OWNER_WITHDRAWAL" && "مسحوبات جاري المالك"}
                            {t.category === "OWNER_DEPOSIT" && "إيداعات جاري المالك"}
                            {t.category === "POS_SALE" && "مبيعات كاشير"}
                            {t.category === "DELIVERY_COLLECTION" && "تحصيل دليفري"}
                            {t.category === "EXPENSE" && "مصروفات نثرية"}
                            {!["OWNER_WITHDRAWAL", "OWNER_DEPOSIT", "POS_SALE", "DELIVERY_COLLECTION", "EXPENSE"].includes(t.category) && t.category}
                          </td>
                          <td className={`p-3 font-black text-sm ${t.type === "IN" ? "text-emerald-700" : "text-rose-700"}`}>
                            {t.type === "IN" ? `+${t.amount}` : `-${t.amount}`} ج.م
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {t.balanceAfter} ج.م
                          </td>
                          <td className="p-3 font-sans text-slate-700 max-w-xs truncate">
                            {t.description}
                          </td>
                          <td className="p-3 font-sans text-slate-600 text-[11px]">
                            {t.recordedBy || "المايسترو"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {/* TAB: COURIERS & FLEET (أسطول طياري الدليفري) */}
        {activeTab === "couriers" && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>إدارة أسطول طياري الدليفري والتوصيل السريع</span>
                </h3>
                <p className="text-xs text-slate-500">
                  متابعة حالة الطيارين الميدانيين، تفعيل الـ GPS المباشر، وتوزيع طلبات الفروع.
                </p>
              </div>

              <button
                onClick={() => setShowCourierModal(true)}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طيار جديد للأسطول 🛵</span>
              </button>
            </div>

            {/* Couriers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {couriers.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                  لا يوجد طيارين مسجلين بعد. اضغط على "إضافة طيار جديد" لبدء تسجيل الأسطول.
                </div>
              ) : (
                couriers.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm hover:border-amber-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-lg">
                          🛵
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{c.name}</h4>
                          <span className="text-[11px] text-slate-500 block">{c.vehicleType || "موتوسيكل سريع"}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleCourier(c.id, c.isAvailable)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition ${
                          c.isAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {c.isAvailable ? "متاح للطلبات ✅" : "غير متاح ⏸️"}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>رقم الهاتف:</span>
                        <a href={`tel:${c.phone}`} className="font-mono font-bold text-blue-600 hover:underline">
                          {c.phone}
                        </a>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>الطلبات النشطة حالياً:</span>
                        <span className="font-mono font-bold text-amber-700">{c._count?.orders || 0} أوردر</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <a
                        href={`https://wa.me/2${c.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      <a
                        href={`tel:${c.phone}`}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>اتصال</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STAFF & USERS & BRANCH LINK */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>إدارة حسابات الطاقم والفروع وصلاحيات المايسترو</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ربط كل موظف بالفرع التابع له، تعديل الحسابات، تغيير كود الـ PIN السري، وتفعيل أو تعطيل أي حساب فورياً.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => setShowPins(!showPins)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {showPins ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
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
                        branchId: branches[0]?.id || "",
                        phone: "",
                        isActive: true,
                      });
                      setShowUserModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>إضافة موظف جديد</span>
                  </button>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الاسم</th>
                    <th className="p-3.5">اسم المستخدم</th>
                    <th className="p-3.5">الفرع المخصص</th>
                    <th className="p-3.5">الدور والوظيفة</th>
                    <th className="p-3.5">كود الـ PIN</th>
                    <th className="p-3.5">حالة الحساب</th>
                    <th className="p-3.5 text-center">الإجراءات والتعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3.5 font-mono text-amber-700 font-bold">{u.username}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-800">
                          {u.branch ? u.branch.name : "🏢 جميع الفروع (إشراف عام)"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {u.role === "owner" && "👑 المالك العام (Maestro)"}
                          {u.role === "manager" && "💼 مدير الفرع والمعمل"}
                          {u.role === "cashier" && "📟 كاشير صالة POS"}
                          {u.role === "delivery" && "🛵 طيار دليفري"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {showPins ? (
                          <span className="text-amber-600 font-black font-mono tracking-widest text-sm">{u.pin}</span>
                        ) : (
                          <span className="text-slate-400">••••••</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
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
                                branchId: u.branchId || "",
                                phone: u.phone || "",
                                isActive: u.isActive,
                              });
                              setShowUserModal(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1"
                            title="تعديل الحساب وتعيين الفرع"
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
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {u.isActive ? "تعطيل" : "تفعيل"}
                            </button>
                          )}

                          {/* Delete User Button */}
                          {isOwner && u.username !== "maestro" && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {u.username === "maestro" && (
                            <span className="text-[10px] text-amber-700 font-bold">الحساب الأساسي</span>
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
                <h3 className="font-bold text-slate-900 text-base">قاعدة بيانات عملاء ألبان فينيسيا</h3>
                <p className="text-xs text-slate-500">سجل طلبات العملاء وتوثيق الهواتف وإجمالي المشتريات</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{customers.length} عميل مسجل</span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3.5 font-mono text-sky-700">
                        <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
                      </td>
                      <td className="p-3.5 text-slate-600">{c.address || c.zone || "—"}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isVerified ? `موثق عبر ${c.verificationMethod || "الواتساب"} ✅` : "غير موثق"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{c.totalOrders} أوردر</td>
                      <td className="p-3.5 font-mono font-bold text-amber-700">{c.totalSpent} ج.م</td>
                      <td className="p-3.5">
                        <a
                          href={`https://wa.me/2${c.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition text-[11px] font-bold flex items-center gap-1 w-fit border border-emerald-200"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <span>إعدادات ألبان فينيسيا وهوية المحل</span>
              </h3>
              <p className="text-xs text-slate-500">
                تعديل أرقام الهواتف والواتساب والعنوان وأوقات العمل وتسمع فوراً في كامل الموقع وأزرار الطلب والدليفري.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">اسم المتجر *</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">شعار المتجر (Slogan) *</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">رقم الواتساب الرئيسي (مربوط بالطلب المباشر) *</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">الخط الساخن / هاتف الدليفري *</label>
                  <input
                    type="text"
                    value={settingsForm.hotline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 font-bold block">العنوان بالتفصيل *</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 font-bold block">رابط جوجل مابس (Google Maps)</label>
                    {settingsForm.googleMapsUrl && (
                      <a
                        href={settingsForm.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-sky-600 hover:underline flex items-center gap-1"
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
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 font-bold block">شريط الإعلان المتحرك في أعلى المتجر</label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              
            {/* Branches Dynamic Configuration */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>بيانات وهواتف الفروع الرسمية (ديناميكية 100%)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  تعديل عناوين وأرقام هواتف وواتساب كل فرع لربطها بالدليفري والواتساب.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{b.name}</span>
                      <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                        {b.code}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block">العنوان بالتفصيل:</label>
                        <input
                          type="text"
                          defaultValue={b.address}
                          onBlur={async (e) => {
                            await fetch("/api/branches", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: b.id, address: e.target.value }),
                            });
                          }}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">التليفون الأرضي:</label>
                          <input
                            type="text"
                            defaultValue={b.phone}
                            onBlur={async (e) => {
                              await fetch("/api/branches", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: b.id, phone: e.target.value }),
                              });
                            }}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">رقم الواتساب:</label>
                          <input
                            type="text"
                            defaultValue={b.whatsapp || ""}
                            onBlur={async (e) => {
                              await fetch("/api/branches", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: b.id, whatsapp: e.target.value }),
                              });
                            }}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="py-3 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
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
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <span>كارت الدعاية المزدوج الرسمي لـ ألبان فينيسيا (2 QR Codes)</span>
                </h3>
                <p className="text-xs text-slate-500">
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

      
      
      {/* ADD COURIER MODAL */}
      {showCourierModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                <span>إضافة كابتن / طيار دليفري جديد</span>
              </h3>
              <button
                onClick={() => setShowCourierModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourier} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">اسم الكابتن / الطيار *</label>
                <input
                  type="text"
                  required
                  value={courierForm.name}
                  onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                  placeholder="مثال: كابتن أحمد فينيسيا"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">رقم الهاتف / الواتساب *</label>
                <input
                  type="tel"
                  required
                  value={courierForm.phone}
                  onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                  placeholder="01018671000"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">نوع وسيلة التوصيل</label>
                <select
                  value={courierForm.vehicleType}
                  onChange={(e) => setCourierForm({ ...courierForm, vehicleType: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  <option value="موتوسيكل سريع 🛵">موتوسيكل سريع 🛵</option>
                  <option value="سكوتر دليفري 🛵">سكوتر دليفري 🛵</option>
                  <option value="سيارة مجهزة ومبردة 🚐">سيارة مجهزة ومبردة 🚐</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourierModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingCourier}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingCourier ? "جارٍ الحفظ..." : "حفظ وإضافة الطيار"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TREASURY TRANSACTION MODAL (تسجيل حركة خزينة / جاري المالك) */}
      {showTreasuryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  💰
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">تسجيل حركة نقدية في الخزينة</h3>
                  <p className="text-xs text-slate-500">حسابات الفروع وحساب جاري المالك</p>
                </div>
              </div>
              <button
                onClick={() => setShowTreasuryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTreasury} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">الفرع المسؤول *</label>
                <select
                  value={treasuryForm.branchId}
                  onChange={(e) => setTreasuryForm({ ...treasuryForm, branchId: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">نوع التبويب *</label>
                <select
                  value={treasuryForm.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setTreasuryForm({
                      ...treasuryForm,
                      category: cat,
                      type: cat === "OWNER_DEPOSIT" ? "IN" : "OUT",
                      description:
                        cat === "OWNER_WITHDRAWAL"
                          ? "مسحوبات نقدية - جاري المالك"
                          : cat === "OWNER_DEPOSIT"
                          ? "إيداع وتغذية الخزينة - جاري المالك"
                          : "مصروفات نثرية / تشغيلية",
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  <option value="OWNER_WITHDRAWAL">سحب نقدي من الدرج (جاري المالك) 💸</option>
                  <option value="OWNER_DEPOSIT">إيداع وتغذية نقدية (جاري المالك) 📥</option>
                  <option value="EXPENSE">مصروفات نثرية / تشغيلية 🧾</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">المبلغ بالجنيه (ج.م) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={treasuryForm.amount}
                  onChange={(e) => setTreasuryForm({ ...treasuryForm, amount: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-black text-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">البيان والتفاصيل *</label>
                <input
                  type="text"
                  required
                  placeholder="سبب السحب أو الإيداع..."
                  value={treasuryForm.description}
                  onChange={(e) => setTreasuryForm({ ...treasuryForm, description: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTreasuryModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
                >
                  تأكيد وحفظ الحركة 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ITEM STOCK CARD MODAL (كارت الصنف والمطابقة والجرد الفعلي) */}
      {showStockCardModal && stockCardProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                  📋
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-950">
                    كارت الصنف والمطابقة: {stockCardProduct.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    القسم: {stockCardProduct.categoryName} • كود PLU: {stockCardProduct.pluCode || "—"} • وحدة القياس: {stockCardProduct.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStockCardModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Branch Balances Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((b) => {
                const bStock = stockCardProduct.branchStocks?.find((bs: any) => bs.branchId === b.id);
                const currentQty = bStock ? bStock.stockQty : 0;
                const openQty = bStock ? bStock.openingStock : 0;
                const inQty = bStock ? bStock.totalIn : 0;
                const outQty = bStock ? bStock.totalOut : 0;

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-bold text-xs text-slate-800">{b.name}</span>
                      <span className="font-mono font-black text-sm text-amber-700">
                        {currentQty} {formatUnit(stockCardProduct.unit)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">أول المدة (افتتاحي):</span>
                        <span className="font-mono font-bold text-slate-800">{openQty}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">إجمالي الوارد:</span>
                        <span className="font-mono font-bold text-emerald-700">+{inQty}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">إجمالي المنصرف:</span>
                        <span className="font-mono font-bold text-rose-700">-{outQty}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Physical Inventory Reconciliation Form (محضر تسوية الجرد الفعلي) */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-xs text-amber-900">
                  تسوية الجرد الفعلي على الأرض (مطابقة المخزون بالمحل)
                </h4>
              </div>

              <form onSubmit={handleSubmitAudit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <select
                  value={auditBranchId}
                  onChange={(e) => setAuditBranchId(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`الرصيد الفعلي المعدود (${stockCardProduct.unit})`}
                  value={auditCountedQty}
                  onChange={(e) => setAuditCountedQty(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono font-bold"
                />

                <input
                  type="text"
                  placeholder="ملاحظات الجرد (عجز / زيادة / تالف)..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-900"
                />

                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition shadow-sm"
                >
                  تأكيد تسوية الجرد ⚖️
                </button>
              </form>
            </div>

            {/* Movement Logs Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>سجل الحركات التاريخية لكارت الصنف (وارد ومنصرف وجرد):</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-60 overflow-y-auto">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">التاريخ والوقت</th>
                      <th className="p-2.5">نوع الحركة</th>
                      <th className="p-2.5">الكمية</th>
                      <th className="p-2.5">الرصيد بعد الحركة</th>
                      <th className="p-2.5">البيان / المرجع</th>
                      <th className="p-2.5">المسؤول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {loadingMovements ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          جارٍ تحميل الحركات...
                        </td>
                      </tr>
                    ) : stockMovements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          لا توجد حركات مسجلة بعد لهذا الصنف
                        </td>
                      </tr>
                    ) : (
                      stockMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-600">
                            {new Date(m.createdAt).toLocaleString("ar-EG", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="p-2 font-sans font-bold">
                            {m.type === "OPENING" && <span className="text-sky-700">مخزون أول المدة</span>}
                            {m.type === "SUPPLY" && <span className="text-emerald-700">إذن توريد 📦</span>}
                            {m.type === "SALE" && <span className="text-rose-700">مبيعات فاتورة 🛒</span>}
                            {m.type === "AUDIT_ADJUST" && <span className="text-amber-700">تسوية جرد ⚖️</span>}
                          </td>
                          <td
                            className={`p-2 font-bold ${
                              m.qty > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {m.qty > 0 ? `+${m.qty}` : m.qty} {formatUnit(stockCardProduct.unit)}
                          </td>
                          <td className="p-2 font-black text-slate-900">
                            {m.balanceAfter} {formatUnit(stockCardProduct.unit)}
                          </td>
                          <td className="p-2 text-slate-600 font-sans">{m.reference || m.notes || "—"}</td>
                          <td className="p-2 text-slate-500 font-sans">{m.recordedBy || "المايسترو"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STOCK REPLENISHMENT MODAL (توريد بضاعة جديدة مع اختيار الفرع) */}
      {showStockModal && selectedStockProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-950">
                  إذن توريد بضاعة: {selectedStockProduct.nameAr}
                </h3>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplenishStock} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  الفرع المستلم للبضاعة *
                </label>
                <select
                  required
                  value={stockReplenishBranchId}
                  onChange={(e) => setStockReplenishBranchId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  الكمية الواردة الجديدة ({selectedStockProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockAddAmount}
                  onChange={(e) => setStockAddAmount(e.target.value)}
                  placeholder="مثال: 25"
                  className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-emerald-300 text-emerald-800 font-mono font-black text-xl text-center"
                />
              </div>

              {/* Quick Add Chips */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStockAddAmount(String(amt))}
                    className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-bold transition"
                  >
                    +{amt} {selectedStockProduct.unit}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">ملاحظات التوريد أو اسم المورد</label>
                <input
                  type="text"
                  value={stockSupplyNotes}
                  onChange={(e) => setStockSupplyNotes(e.target.value)}
                  placeholder="وارد معمل فينيسيا فجر اليوم..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-md flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <span>تأكيد إذن التوريد والمخزن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-950">
                {editingProduct ? `تعديل صنف: ${editingProduct.nameAr}` : "إضافة صنف جديد لقائمة فينيسيا"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">اسم الصنف بالمنيو *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.nameAr}
                    onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                    placeholder="مثال: أرز بلبن فخار"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">القسم *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">طبيعة البيع *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, isWeighted: true, unit: "1 كجم" })}
                      className={`py-2 px-3 rounded-xl font-bold transition ${
                        prodForm.isWeighted
                          ? "bg-slate-900 text-white font-black shadow-sm"
                          : "bg-slate-50 border border-slate-200 text-slate-600"
                      }`}
                    >
                      بالميزان والكسور ⚖️
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, isWeighted: false, unit: "علبة" })}
                      className={`py-2 px-3 rounded-xl font-bold transition ${
                        !prodForm.isWeighted
                          ? "bg-slate-900 text-white font-black shadow-sm"
                          : "bg-slate-50 border border-slate-200 text-slate-600"
                      }`}
                    >
                      بالقطعة / العلبة 📦
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">
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
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">تكلفة الإنتاج / الشراء (ج.م)</label>
                  <input
                    type="number"
                    step="any"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">كود ميزان الباركود (PLU Code)</label>
                  <input
                    type="text"
                    value={prodForm.pluCode}
                    onChange={(e) => setProdForm({ ...prodForm, pluCode: e.target.value })}
                    placeholder="مثال: 104"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">إجمالي رصيد المخزن الافتتاحي ({prodForm.unit})</label>
                  <input
                    type="number"
                    step="any"
                    value={prodForm.stockQty}
                    onChange={(e) => setProdForm({ ...prodForm, stockQty: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">شارة تميز الصنف (Badge)</label>
                  <input
                    type="text"
                    value={prodForm.badge}
                    onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                    placeholder="مثال: صنع فينيسيا 🥛 أو طازج اليوم ⭐"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                                {/* Product Image & ImgBB Upload */}
                <div className="space-y-2 sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold block flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                      <span>صورة الصنف (رابط مباشر أو رفع فوري عبر ImgBB) 📸</span>
                    </label>
                    {uploadingImage && (
                      <span className="text-[10px] text-amber-600 font-bold animate-pulse">
                        جارٍ الرفع إلى ImgBB...
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                      {prodForm.image ? (
                        <img src={prodForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-slate-300">🥛</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="url"
                        value={prodForm.image}
                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                        placeholder="رابط مباشر للصورة (https://...)"
                        className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-[11px]"
                      />

                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="cursor-pointer py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع صورة من جهازك (ImgBB) 📤</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploadingImage(true);
                                const fd = new FormData();
                                fd.append("file", file);
                                const res = await fetch("/api/upload", { method: "POST", body: fd });
                                const data = await res.json();
                                if (data.success && data.url) {
                                  setProdForm((prev) => ({ ...prev, image: data.url }));
                                } else {
                                  alert(data.error || "فشل رفع الصورة");
                                }
                              } catch {
                                alert("حدث خطأ أثناء رفع الصورة");
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                        </label>
                        {prodForm.image && (
                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, image: "" })}
                            className="text-slate-400 hover:text-rose-600 text-xs"
                          >
                            حذف الصورة ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 font-bold block">الوصف ومكونات الصنف</label>
                  <textarea
                    rows={2}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="طبيعي 100% بدون أي إضافات..."
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-sm"
                >
                  حفظ الصنف بالمنيو 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-950">
                {editingCategory ? `تعديل قسم: ${editingCategory.nameAr}` : "إضافة قسم جديد للمنيو"}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">اسم القسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm({ ...catForm, nameAr: e.target.value })}
                  placeholder="مثال: الحلو باللبن"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={catForm.nameEn}
                  onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                  placeholder="Desserts with Milk"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">وصف القسم</label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black"
                >
                  {editingCategory ? "حفظ التعديلات" : "إضافة القسم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL (With Branch Linkage) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-950">
                {editingUser ? `تعديل حساب: ${editingUser.name}` : "إضافة حساب موظف جديد"}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="مثال: كاشير فرع حدائق القبة"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  disabled={editingUser?.username === "maestro"}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="cashier_qobba"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">الفرع المخصص للموظف *</label>
                <select
                  value={userForm.branchId}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                >
                  <option value="">🏢 جميع الفروع (إشراف عام / مايسترو)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      📍 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">الدور والوظيفة *</label>
                <select
                  disabled={editingUser?.username === "maestro"}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 disabled:opacity-50 font-bold"
                >
                  <option value="cashier">📟 كاشير صالة POS</option>
                  <option value="manager">💼 مدير فرع ومعمل</option>
                  <option value="delivery">🛵 طيار دليفري</option>
                  {isOwner && <option value="owner">👑 المالك العام (Maestro)</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  كود الـ PIN السريع (6 أرقام) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={userForm.pin}
                  onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                  placeholder="123456"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-amber-300 text-slate-900 font-mono text-center font-bold tracking-widest text-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {editingUser ? "كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "أدخل كلمة المرور"}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>

              {editingUser && editingUser.username !== "maestro" && (
                <div className="pt-1 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-bold">حالة تفعيل الحساب:</span>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition ${
                      userForm.isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {userForm.isActive ? "نشط ومفعل 🟢" : "معطل 🔴"}
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-sm"
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
