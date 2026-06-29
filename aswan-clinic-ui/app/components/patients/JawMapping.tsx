"use client";
import { useState, useEffect, useCallback } from "react";
import { ClipboardPenLine, Check, X, Loader2, History } from "lucide-react";
import { saveToothTreatment, getPatientTreatments } from "@/lib/actions/tooth";

const topRight = [18, 17, 16, 15, 14, 13, 12, 11];
const topLeft = [21, 22, 23, 24, 25, 26, 27, 28];
const bottomRight = [48, 47, 46, 45, 44, 43, 42, 41];
const bottomLeft = [31, 32, 33, 34, 35, 36, 37, 38];

const procedures = ["حشو عصب", "حشو عادي", "خلع", "تنظيف", "تركيب تاج", "زراعة"];

export function JawMapping({ patientId }: { patientId: string }) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [procedure, setProcedure] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getPatientTreatments(patientId);
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error("فشل جلب سجل الأسنان:", err);
    }
  }, [patientId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getToothStatusColor = (toothNum: number) => {
    if (selectedTooth === toothNum) return "bg-blue-600 text-white scale-110 ring-4 ring-blue-200 z-30";
    
    const toothHistory = history.filter((h) => h.toothNumber === toothNum);
    if (toothHistory.length === 0) return "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50";

    const lastTreatment = toothHistory[0];
    switch (lastTreatment.procedure) {
      case "خلع": return "bg-slate-800 text-white border-slate-900 line-through opacity-40";
      case "حشو عصب": return "bg-rose-500 text-white border-rose-600";
      case "حشو عادي": return "bg-amber-500 text-white border-amber-600";
      default: return "bg-emerald-500 text-white border-emerald-600";
    }
  };

  const handleSave = async () => {
    if (selectedTooth === null || !procedure) return;
    setLoading(true);
    try {
      const combinedNotes = diagnosis ? `التشخيص: ${diagnosis} | ${notes}` : notes;

      const res = await saveToothTreatment({
        patientId,
        toothNumber: selectedTooth,
        procedure,
        notes: combinedNotes,
      });

      if (res.success) {
        setSelectedTooth(null);
        setProcedure("");
        setDiagnosis("");
        setNotes("");
        await loadHistory();
        window.location.reload();
      } else {
        alert("خطأ أثناء الحفظ");
      }
    } catch (err) {
      alert("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  // مصفوفة الإزاحة الرأسية لمحاكاة شكل U الحقيقي (تبدأ من صفر في المنتصف وتزيد بشدة عند الضروس الخلفية)
  const upperOffsets = [24, 16, 10, 5, 2, 0, 0, 0];
  const lowerOffsets = [24, 16, 10, 5, 2, 0, 0, 0];

  const renderTooth = (num: number, index: number, isUpper: boolean, isLeft: boolean) => {
    const toothHistory = history.filter((h) => h.toothNumber === num);
    const hasHistory = toothHistory.length > 0;

    // حساب درجة الانحناء الرأسي بناءً على بُعد السن عن المنتصف
    const arrayIndex = isLeft ? 7 - index : index;
    const offset = isUpper ? upperOffsets[arrayIndex] : lowerOffsets[arrayIndex];
    const translateY = isUpper ? offset : -offset;

    return (
      <button
        key={num}
        onClick={() => {
          setSelectedTooth(num);
          if (hasHistory) {
            setProcedure(toothHistory[0].procedure);
            setNotes(toothHistory[0].notes || "");
          } else {
            setProcedure("");
            setNotes("");
            setDiagnosis("");
          }
        }}
        style={{ transform: `translateY(${translateY}px)` }}
        className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl border-[1.5px] flex flex-col items-center justify-center font-black text-xs transition-all duration-300 shadow-sm relative ${getToothStatusColor(num)}`}
        title={`السن رقم ${num}`}
      >
        <span className="text-[9px] opacity-50 block leading-none">#</span>
        <span className="leading-tight mt-0.5">{num}</span>
        {hasHistory && selectedTooth !== num && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute bottom-1"></span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-8" dir="rtl">
      
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <ClipboardPenLine className="text-blue-600" />
          خريطة الفحص والتشخيص الاحترافية (Anatomical U-Shape Arc)
        </h2>
        <p className="text-xs text-slate-400 mt-1">اختر السن المصاب لتسجيل الإجراء الطبي في سجل المريض</p>
      </div>

      {/* الحاوية المضغوطة أفقياً لتقريب الأسنان ومحاكاة الشكل الدائري المغلق */}
      <div className="flex flex-col items-center justify-center gap-14 py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 overflow-x-auto">
        
        {/* 1️⃣ الفك العلوي */}
        <div className="flex flex-col items-center space-y-3 min-w-[550px]">
          <span className="text-[10px] font-black text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">MAXILLARY (الفك العلوي)</span>
          <div className="flex justify-center items-end gap-1 px-4">
            <div className="flex items-end gap-1">
              {topRight.map((num, i) => renderTooth(num, i, true, false))}
            </div>
            <div className="w-[1.5px] h-14 bg-slate-300 self-end mx-1.5 z-10" />
            <div className="flex items-end gap-1">
              {topLeft.map((num, i) => renderTooth(num, i, true, true))}
            </div>
          </div>
        </div>

        {/* 2️⃣ الفك السفلي */}
        <div className="flex flex-col items-center space-y-3 min-w-[550px]">
          <div className="flex justify-center items-start gap-1 px-4">
            <div className="flex items-start gap-1">
              {bottomRight.map((num, i) => renderTooth(num, i, false, false))}
            </div>
            <div className="w-[1.5px] h-14 bg-slate-300 self-start mx-1.5 z-10" />
            <div className="flex items-start gap-1">
              {bottomLeft.map((num, i) => renderTooth(num, i, false, true))}
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">MANDIBULAR (الفك السفلي)</span>
        </div>

      </div>

      {selectedTooth !== null && (
        <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <h3 className="font-black text-slate-800 text-md flex items-center gap-1">
              🏢 تسجيل إجراء طبي للسن رقم: 
              <span className="bg-blue-600 text-white text-sm px-2.5 py-1 rounded-lg ml-1">{selectedTooth}</span>
            </h3>
            <button onClick={() => setSelectedTooth(null)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={18} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">نوع الإجراء الطبي</label>
              <select 
                value={procedure} 
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر الإجراء...</option>
                {procedures.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">التشخيص الإكلينيكي</label>
              <input 
                type="text" 
                placeholder="مثال: تسوس عميق، كسر في التاج"
                value={diagnosis} 
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">ملاحظات ووصايا الطبيب</label>
              <input 
                type="text" 
                placeholder="ملاحظات إضافية..."
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={loading || !procedure}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              حفظ وتحديث السجل الطبي للسن
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-md font-black text-slate-700 mb-4 flex items-center gap-2">
            <History size={18} className="text-slate-400" /> 
            السجل الزمني لعلاجات الأسنان (Patient Tooth History)
          </h3>
          <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
            {history.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center text-sm">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">#{item.toothNumber}</span>
                  <div>
                    <span className="font-black text-slate-800">{item.procedure}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString("ar-EG")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}