import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/admin/page.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Update activeTab type
content = content.replace(
  `"overview" | "orders" | "products" | "categories" | "treasury" | "users" | "customers" | "settings" | "card"`,
  `"overview" | "orders" | "products" | "categories" | "treasury" | "couriers" | "users" | "customers" | "settings" | "card"`
);

// 2. Add Courier modal state after couriers state
if (!content.includes("showCourierModal")) {
  content = content.replace(
    `const [couriers, setCouriers] = useState<any[]>([]);`,
    `const [couriers, setCouriers] = useState<any[]>([]);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierForm, setCourierForm] = useState({ name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });
  const [savingCourier, setSavingCourier] = useState(false);`
  );
}

// 3. Add handleAddCourier and handleToggleCourier functions
const courierFuncs = `
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
`;

if (!content.includes("handleAddCourier")) {
  content = content.replace(
    `const handleAssignCourier = async`,
    courierFuncs + `\n  const handleAssignCourier = async`
  );
}

// 4. Update Navigation Tabs to include Couriers
if (!content.includes(`key: "couriers"`)) {
  content = content.replace(
    `{ key: "treasury", label: "الخزينة وجاري المالك", icon: Wallet },`,
    `{ key: "treasury", label: "الخزينة وجاري المالك", icon: Wallet },\n            { key: "couriers", label: \`أسطول الطيارين (\${couriers.length})\`, icon: Truck },`
  );
}

// 5. Add TAB: COURIERS JSX
const couriersTabJSX = `
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
                        className={\`px-2.5 py-1 rounded-full text-[10px] font-black border transition \${
                          c.isAvailable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }\`}
                      >
                        {c.isAvailable ? "متاح للطلبات ✅" : "غير متاح ⏸️"}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>رقم الهاتف:</span>
                        <a href={\`tel:\${c.phone}\`} className="font-mono font-bold text-blue-600 hover:underline">
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
                        href={\`https://wa.me/2\${c.phone.replace(/[^0-9]/g, "")}\`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      <a
                        href={\`tel:\${c.phone}\`}
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
`;

if (!content.includes(`activeTab === "couriers"`)) {
  content = content.replace(
    `{/* TAB 5: STAFF & USERS & BRANCH LINK */}`,
    couriersTabJSX + `\n        {/* TAB 5: STAFF & USERS & BRANCH LINK */}`
  );
}

// 6. Add Courier Modal JSX before end of component
const courierModalJSX = `
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
`;

if (!content.includes("showCourierModal &&")) {
  content = content.replace(
    `{/* TREASURY TRANSACTION MODAL`,
    courierModalJSX + `\n      {/* TREASURY TRANSACTION MODAL`
  );
}

fs.writeFileSync(filePath, content, "utf-8");
console.log("Successfully patched app/admin/page.tsx with Couriers Fleet Management!");
