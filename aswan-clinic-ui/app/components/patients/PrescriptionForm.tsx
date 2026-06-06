"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldAlert, CheckCircle, Loader2, Printer, HeartPulse, Sparkles } from "lucide-react";
import { checkDrugConflicts, getRecentMedicines } from "@/lib/actions/prescription";
import { createPrescription, saveMedicalHistory } from "@/lib/actions/clinical"; // استيراد الأكشنز الجديدة والمحمية
import { Badge } from "@/components/ui/badge";

interface PrescriptionFormProps {
  patientId: string;
  clinicId: string;
}

interface MedicineItem {
  medicineName: string;
  type: string; // ⚡ الحقل الجديد العبقري لتحديد شكل العلاج
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export function PrescriptionForm({ patientId, clinicId }: PrescriptionFormProps) {
  // 1. حالات الروشتة الطبية
  const [items, setItems] = useState<MedicineItem[]>([
    { medicineName: "", type: "علبة", dosage: "", frequency: "", duration: "", notes: "" }
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [recentMedicines, setRecentMedicines] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // 2. ⚡ حالات إدارة التاريخ المرضي المرنة والحية
  const [allergyInput, setAllergyInput] = useState("");
  const [allergiesList, setAllergiesList] = useState<string[]>([]);
  const [chronicInput, setChronicInput] = useState("");
  const [chronicList, setChronicList] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadSuggestions() {
      const medicines = await getRecentMedicines();
      setRecentMedicines(medicines);
    }
    loadSuggestions();
  }, []);

  // دالة إضافة دواء للروشتة
  const addMedicineRow = () => {
    setItems([...items, { medicineName: "", type: "علبة", dosage: "", frequency: "", duration: "", notes: "" }]);
    setIsSaved(false);
  };

  const removeMedicineRow = (index: number) => {
    if (items.length > 1) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      setIsSaved(false);
    }
  };

  const handleItemChange = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
    setAiWarning(null);
    setIsSaved(false);
  };

  // ⚡ إدارة إضافة/حذف الحساسيات محلياً قبل الحفظ بقاعدة البيانات
  const addAllergyTag = () => {
    if (allergyInput.trim() && !allergiesList.includes(allergyInput.trim())) {
      setAllergiesList([...allergiesList, allergyInput.trim()]);
      setAllergyInput("");
    }
  };

  const removeAllergyTag = (tag: string) => {
    setAllergiesList(allergiesList.filter(t => t !== tag));
  };

  // ⚡ إدارة إضافة/حذف الأمراض المزمنة أو "الحمل" محلياً
  const addChronicTag = () => {
    if (chronicInput.trim() && !chronicList.includes(chronicInput.trim())) {
      setChronicList([...chronicList, chronicInput.trim()]);
      setChronicInput("");
    }
  };

  const removeChronicTag = (tag: string) => {
    setChronicList(chronicList.filter(t => t !== tag));
  };

  // ⚡ دالة حفظ التاريخ الطبي بالكامل (تغيير الحالة، إزالة الحمل أو الأمراض)
  const handleSaveMedicalHistory = async () => {
    setHistoryLoading(true);
    const result = await saveMedicalHistory({
      patientId,
      allergies: allergiesList,
      chronicDiseases: chronicList,
      notes: "تم التحديث من شاشة الطبيب"
    });
    setHistoryLoading(false);

    if (result.success) {
      setSuccessMessage("تم تحديث التاريخ المرضي وحالة المريض بنجاح! 🩺✨");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleAiCheck = async () => {
    const medicineNames = items.map(i => i.medicineName).filter(name => name.trim() !== "");
    if (medicineNames.length === 0) return;

    setAiChecking(true);
    setAiWarning(null);
    setSuccessMessage(null);

    const result = await checkDrugConflicts(patientId, medicineNames);
    setAiChecking(false);

    if (result.hasConflict) {
      setAiWarning(result.message);
    } else {
      setSuccessMessage("تم الفحص بالذكاء الاصطناعي بنجاح: الأدوية متطابقة تماماً ومتوافقة وآمنة!");
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // ⚡ حفظ الروشتة عبر الأكشن المطور المشترك (Transaction Secure)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.medicineName.trim() !== "");
    if (validItems.length === 0) return;

    setLoading(true);
    const result = await createPrescription({
      patientId,
      clinicId,
      items: validItems
    });
    setLoading(false);

    if (result.success) {
      setSuccessMessage("تم تسجيل وحفظ الروشتة بنجاح! قالب الطباعة جاهز الآن. 🎉");
      setIsSaved(true);
      setAiWarning(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto my-6 print:m-0 print:p-0">
      
      {/* ----------------- واجهة الشاشة (تختفي تماماً عند الطباعة) ----------------- */}
      <div className="print:hidden space-y-6">
        
        {/* الموديول الجديد: تحديث السجل الطبي والأمراض (مرونة حالة الحمل وغيرها) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <HeartPulse className="text-rose-600 w-5 h-5" /> تحديث السجل الطبي الفوري للمريض
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* قسم إدارة الحساسية */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">إضافة حساسية جديدة:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="مثال: بنسلين، أسبرين..."
                  className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white text-slate-800"
                />
                <button type="button" onClick={addAllergyTag} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">إضافة</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allergiesList.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-rose-50 text-rose-700 gap-1 text-xs">
                    {tag} <span onClick={() => removeAllergyTag(tag)} className="cursor-pointer font-bold text-red-500 hover:text-red-700">×</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* قسم إدارة الأمراض المزمنة / الحمل القابل للإزالة مستقبلاً */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">الأمراض المزمنة أو الحالات (مثل: حمل، سكري):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chronicInput}
                  onChange={(e) => setChronicInput(e.target.value)}
                  placeholder="مثال: سكري، ضغط، حمل..."
                  className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white text-slate-800"
                />
                <button type="button" onClick={addChronicTag} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">إضافة</button>
              </div>
              {/* 💡 هنا يظهر الحل السحري: بالضغط على علامة × المرافقة لكلمة حمل يتم تنظيف حالة المريضة آلياً بعد عام */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {chronicList.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-amber-50 text-amber-700 gap-1 text-xs">
                    {tag} <span onClick={() => removeChronicTag(tag)} className="cursor-pointer font-bold text-amber-600 hover:text-amber-800">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 border-t pt-3">
            <button
              type="button"
              onClick={handleSaveMedicalHistory}
              disabled={historyLoading}
              className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1"
            >
              {historyLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              مزامنة وتحديث السجل الطبي والحالة 🔁
            </button>
          </div>
        </div>

        {/* نموذج إنشاء الروشتة */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📝</span> إنشاء روشتة طبية ذكية
            </h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
              SaaS Dynamic Layout
            </span>
          </div>

          {aiWarning && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-900">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-base">تنبيه تعارض دوائي حرج!</h4>
                <p className="text-sm mt-1 whitespace-pre-line leading-relaxed">{aiWarning}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-emerald-900 items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">الأدوية الموصوفة:</label>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-xl relative border border-slate-100">
                  <div className="md:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">اسم الدواء</label>
                    <input
                      type="text"
                      list={`medicines-suggestions-${index}`}
                      value={item.medicineName}
                      onChange={(e) => handleItemChange(index, "medicineName", e.target.value)}
                      placeholder="مثال: Augmentin 1g"
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                    <datalist id={`medicines-suggestions-${index}`}>
                      {recentMedicines.map((med, i) => (
                        <option key={i} value={med} />
                      ))}
                    </datalist>
                  </div>
                  
                  {/* ⚡ التعديل العبقري: إضافة حقل نوع شكل العلاج ذكياً ومدمجاً */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">النوع</label>
                    <input
                      type="text"
                      value={item.type}
                      onChange={(e) => handleItemChange(index, "type", e.target.value)}
                      placeholder="علبة / شريط / أمبول"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">الجرعة</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(index, "dosage", e.target.value)}
                      placeholder="قرص / كبسولة"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">التكرار</label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => handleItemChange(index, "frequency", e.target.value)}
                      placeholder="كل ٨ ساعات"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">المدة</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleItemChange(index, "duration", e.target.value)}
                      placeholder="لمدة ٥ أيام"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(index)}
                      disabled={items.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 p-2 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMedicineRow}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> إضافة دواء آخر للروشتة
            </button>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">تعليمات وإرشادات عامة للمريض:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: الراحة التامة وتجنب المشروبات الساخنة والباردة جداً..."
                rows={3}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between border-t pt-4">
              <button
                type="button"
                onClick={handleAiCheck}
                disabled={aiChecking || items[0].medicineName === ""}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold hover:bg-purple-100 disabled:opacity-50 transition-all"
              >
                {aiChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> فحص التعارضات الطبية (Groq AI)</span>}
              </button>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ الروشتة
                </button>
                
                {isSaved && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> طباعة الروشتة
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ----------------- قالب الطباعة الاحترافي المحدث (يظهر فقط على الورق) ----------------- */}
      <div className="hidden print:block w-full text-black bg-white min-h-screen font-sans">
        {/* ترويسة العيادة */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-8" style={{ marginTop: "10mm" }}>
          <div>
            <h1 className="text-3xl font-black text-slate-900">أسوان ديجيتال لطب الأسنان</h1>
            <p className="text-lg text-slate-600 mt-1">د. أيمن شكري - استشاري طب وجراحة الفم والأسنان</p>
          </div>
          <div className="text-left">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-800">
              <span className="text-2xl">🦷</span>
            </div>
          </div>
        </div>

        {/* علامة Rx الطبية التاريخية للمهنة */}
        <div className="text-5xl font-black text-slate-300 mb-8 font-serif">Rx</div>

        {/* قائمة الأدوية المتضمنة حقل النوع المضاف */}
        <div className="space-y-6 min-h-[400px]">
          {items.map((item, index) => {
            if (!item.medicineName.trim()) return null;
            return (
              <div key={index} className="pl-4 border-l-4 border-slate-400">
                <h3 className="text-xl font-bold text-slate-900 font-sans">{item.medicineName}</h3>
                <p className="text-slate-700 mt-1 text-lg font-medium">
                  العدد/الشكل: {item.type} — الجرعة: {item.dosage} — التكرار: {item.frequency} {item.duration && `— المدة: (${item.duration})`}
                </p>
              </div>
            );
          })}
        </div>

        {/* التعليمات العامة */}
        {notes && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 underline">تعليمات وإرشادات طبية:</h4>
            <p className="text-slate-700 whitespace-pre-line text-lg leading-relaxed">{notes}</p>
          </div>
        )}

        {/* تذيل الروشتة (العنوان والتواصل) القابل للتخصيص من الإعدادات لاحقاً */}
        <div className="mt-16 pt-4 border-t-2 border-slate-800 text-center text-sm text-slate-600" style={{ marginBottom: "10mm" }}>
          <p className="font-bold">العنوان: أسوان - شارع كورنيش النيل | تليفون العيادة: 01000000000</p>
          <p className="mt-1 text-xs">مع تمنياتنا القلبية بالشفاء العاجل والابتسامة المشرقة</p>
        </div>
      </div>
    </div>
  );
}