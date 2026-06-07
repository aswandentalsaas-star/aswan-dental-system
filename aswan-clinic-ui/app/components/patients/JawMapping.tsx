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

  // جلب التاريخ الطبي للأسنان من قاعدة البيانات
  const loadHistory = useCallback(async () => {
    const res = await getPatientTreatments(patientId);
    if (res.success) {
      setHistory(res.data);
    }
  }, [patientId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const calculateCurve = (index: number, isUpper: boolean, isLeft: boolean) => {
    const curveOffsets = [32, 22, 14, 8, 4, 0, 0, 0]; 
    const offset = isLeft ? curveOffsets[7 - index] : curveOffsets[index];
    return isUpper ? offset : -offset; 
  };

  const handleSaveTreatment = async () => {
    if (!selectedTooth || !procedure) return;
    setLoading(true);

    const res = await saveToothTreatment({
      patientId,
      toothNumber: selectedTooth,
      procedure,
      // دمج التشخيص والملاحظات ليتم حفظهما معاً في السجل
      notes: diagnosis ? `التشخيص: ${diagnosis} | ${notes}` : notes 
    });

    setLoading(false);
    
    if (res.success) {
      setSelectedTooth(null); // ✅ هذا السطر هو الذي يغلق النافذة فوراً
      setProcedure("");
      setDiagnosis(""); // تفريغ حقل التشخيص
      setNotes("");
      loadHistory(); 
      window.location.reload(); // ✅ تحديث الصفحة فوراً لإنهاء حالة الجلسة وتحديث الواجهة
    }
  };

  const renderTooth = (num: number, index: number, isUpper: boolean, isLeft: boolean) => {
    const translateY = calculateCurve(index, isUpper, isLeft);
    const isSelected = selectedTooth === num;
    
    // التحقق هل هذا السن يعاني من مشكلة أو تم علاجه سابقاً؟
    const toothHistory = history.filter(h => h.toothNumber === num);
    const hasHistory = toothHistory.length > 0;

    return (
      <button
        key={num}
        onClick={() => {
          setSelectedTooth(num);
          // إذا كان للسن سجل قديم، نقوم بملء الحقول تلقائياً للمراجعة
          if (hasHistory) {
            setProcedure(toothHistory[0].procedure);
            setNotes(toothHistory[0].notes || "");
            setDiagnosis(toothHistory[0].diagnosis || "");
          } else {
            setProcedure("");
            setNotes("");
          }
        }}
        style={{ transform: `translateY(${translateY}px)` }}
        className={`relative w-8 h-12 sm:w-10 sm:h-14 flex flex-col items-center justify-center border-2 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
          ${
            isSelected
              ? "bg-blue-600 text-white border-blue-700 shadow-xl scale-110 z-20"
              : hasHistory
              ? "bg-amber-50 text-amber-800 border-amber-400 hover:bg-amber-100 z-10" // السن المعالج يظهر بلون كهرماني دافئ
              : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-1"
          }`}
      >
        <span>{num}</span>
        {/* نقطة بصرية أسفل رقم السن إذا كان له سجل قديم */}
        {hasHistory && !isSelected && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute bottom-1"></span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100 mt-8 w-full overflow-hidden">
      <h2 className="text-2xl font-black text-slate-800 mb-12 text-center flex items-center justify-center gap-2">
        <span>🦷</span> خريطة الفحص والتشخيص الاحترافية
      </h2>

      {/* حاوية الفكين الدائرية */}
      <div className="flex flex-col items-center gap-16 min-w-[600px] pb-8 border-b border-slate-100">
        {/* الفك العلوي والسفلي يتم رندرتهم هنا بنفس كودك الجميل السابق */}
        <div className="relative flex flex-col items-center">
          <span className="absolute -top-8 text-xs font-black text-slate-300 uppercase tracking-widest">Maxillary (الفك العلوي)</span>
          <div className="flex gap-1 sm:gap-2">
            <div className="flex gap-1 sm:gap-2 border-l-2 border-slate-200 pl-2">
              {topRight.map((num, i) => renderTooth(num, i, true, false))}
            </div>
            <div className="flex gap-1 sm:gap-2 pr-2">
              {topLeft.map((num, i) => renderTooth(num, i, true, true))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="flex gap-1 sm:gap-2">
            <div className="flex gap-1 sm:gap-2 border-l-2 border-slate-200 pl-2">
              {bottomRight.map((num, i) => renderTooth(num, i, false, false))}
            </div>
            <div className="flex gap-1 sm:gap-2 pr-2">
              {bottomLeft.map((num, i) => renderTooth(num, i, false, true))}
            </div>
          </div>
          <span className="absolute -bottom-10 text-xs font-black text-slate-300 uppercase tracking-widest">Mandibular (الفك السفلي)</span>
        </div>
      </div>

      {/* نافذة تسجيل وتعديل الإجراءات */}
      {selectedTooth && (
        <div className="mt-12 p-6 bg-slate-50 border-2 border-blue-100 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardPenLine className="text-blue-600" />
              سجل السن رقم <span className="bg-blue-600 text-white px-3 py-1 rounded-lg">{selectedTooth}</span>
            </h3>
            <button onClick={() => setSelectedTooth(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          {/* قسم التشخيص والإجراء الطبي */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  
          {/* 1. حقل التشخيص */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">التشخيص</label>
            <textarea
              name="diagnosis"
              value={diagnosis || ''} // تأكد من ربطها بـ state التشخيص لديك
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="اكتب التشخيص هنا (مثال: تسوس عميق، التهاب...)"
              className="w-full min-h-[60px] p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right"
              rows={2}
            />
          </div>

          {/* 2. حقل الإجراء الطبي (حقل ذكي مقترح) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">الإجراء الطبي</label>
            <input
              list="procedure-suggestions"
              name="procedure"
              value={procedure || ''} // تأكد من ربطها بـ state الإجراء لديك
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="اكتب الإجراء (سيقترح النظام تلقائياً)"
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right"
            />
          {/* القائمة الذكية المنسدلة التي تحتفظ بالاقتراحات وتظهر فور الكتابة */}
           <datalist id="procedure-suggestions">
             <option value="حشو عصب" />
             <option value="حشو عادي" />
             <option value="خلع بسيط" />
             <option value="خلع جراحي" />
             <option value="تنظيف لثة" />
             <option value="تركيب تاج" />
           </datalist>
         </div>
       </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSaveTreatment}
              disabled={!procedure || loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              حفظ وتحديث السجل الطبي
            </button>
          </div>
        </div>
      )}

      {/* لوحة عرض خط الزمن لكل علاجات المريض (Patient Tooth Timeline) */}
      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-md font-black text-slate-700 mb-4 flex items-center gap-2">
            <History size={18} className="text-slate-400" /> الجدول الزمني لعلاجات المريض (History Log)
          </h3>
          <div className="grid gap-3 max-h-60 overflow-y-auto pr-2">
            {history.map((h) => (
              <div key={h.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-lg ml-3">سن {h.toothNumber}</span>
                  <span className="font-black text-slate-800">{h.procedure}</span>
                  {h.notes && <p className="text-xs text-slate-500 mt-1 mr-14">📝 {h.notes}</p>}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(h.createdAt).toLocaleDateString("ar-EG")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}