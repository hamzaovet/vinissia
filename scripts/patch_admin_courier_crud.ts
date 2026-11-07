import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/admin/page.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Update courierForm state to include optional id
content = content.replace(
  `const [courierForm, setCourierForm] = useState({ name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });`,
  `const [courierForm, setCourierForm] = useState<{ id?: string; name: string; phone: string; vehicleType: string }>({ name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });`
);

// 2. Update handleAddCourier to support both ADD and EDIT, plus add handleDeleteCourier and handleEditCourier
const crudCourierFuncs = `  // Handle Add or Edit Courier
  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierForm.name || !courierForm.phone) return;
    try {
      setSavingCourier(true);
      const isEditing = !!courierForm.id;
      const res = await fetch("/api/couriers", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courierForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCourierModal(false);
        setCourierForm({ id: undefined, name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" });
        const cres = await fetch("/api/couriers");
        const cdata = await cres.json();
        if (cdata.success) setCouriers(cdata.couriers || []);
        alert(isEditing ? "✅ تم تعديل بيانات الطيار بنجاح" : "✅ تمت إضافة الطيار بنجاح إلى الأسطول");
      } else {
        alert(data.error || "فشل حفظ بيانات الطيار");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setSavingCourier(false);
    }
  };

  // Handle Edit Courier
  const handleEditCourier = (c: any) => {
    setCourierForm({
      id: c.id,
      name: c.name,
      phone: c.phone,
      vehicleType: c.vehicleType || "موتوسيكل سريع 🛵",
    });
    setShowCourierModal(true);
  };

  // Handle Delete Courier
  const handleDeleteCourier = async (id: string, name: string) => {
    if (!confirm(\`هل أنت متأكد من حذف الكابتن "\${name}" من أسطول الطيارين؟\`)) return;
    try {
      const res = await fetch(\`/api/couriers?id=\${id}\`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCouriers((prev) => prev.filter((c) => c.id !== id));
        alert("✅ تم حذف الطيار بنجاح");
      } else {
        alert(data.error || "فشل حذف الطيار");
      }
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };`;

content = content.replace(
  /const handleAddCourier = async[\s\S]*?finally\s*\{\s*setSavingCourier\(false\);\s*\}\s*\};/m,
  crudCourierFuncs
);

// 3. Update the courier card buttons grid in JSX
const oldCardButtons = `<div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
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
                    </div>`;

const newCardButtons = `<div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={\`https://wa.me/2\${c.phone.replace(/[^0-9]/g, "")}\`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        <a
                          href={\`tel:\${c.phone}\`}
                          className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-600" />
                          <span>اتصال</span>
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCourier(c)}
                          className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-amber-200 shadow-xs"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-600" />
                          <span>تعديل ✏️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCourier(c.id, c.name)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-rose-200 shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف 🗑️</span>
                        </button>
                      </div>
                    </div>`;

content = content.replace(oldCardButtons, newCardButtons);

// 4. Update the Modal title and button
content = content.replace(
  `<span>إضافة كابتن / طيار دليفري جديد</span>`,
  `<span>{courierForm.id ? "تعديل بيانات الطيار" : "إضافة كابتن / طيار دليفري جديد"}</span>`
);

content = content.replace(
  `<form onSubmit={handleAddCourier} className="space-y-4 text-xs">`,
  `<form onSubmit={handleSaveCourier} className="space-y-4 text-xs">`
);

content = content.replace(
  `<span>{savingCourier ? "جارٍ الحفظ..." : "حفظ وإضافة الطيار"}</span>`,
  `<span>{savingCourier ? "جارٍ الحفظ..." : courierForm.id ? "حفظ التعديلات ✅" : "حفظ وإضافة الطيار"}</span>`
);

// 5. When opening "+ إضافة طيار جديد", reset form
content = content.replace(
  `onClick={() => setShowCourierModal(true)}`,
  `onClick={() => { setCourierForm({ id: undefined, name: "", phone: "", vehicleType: "موتوسيكل سريع 🛵" }); setShowCourierModal(true); }}`
);

fs.writeFileSync(filePath, content, "utf-8");
console.log("Successfully patched app/admin/page.tsx with Courier Edit and Delete!");
