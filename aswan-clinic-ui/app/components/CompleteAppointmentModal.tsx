"use client";
import { useState } from "react";
import { X, CheckCircle2, DollarSign, Stethoscope } from "lucide-react";
// ✅ حل مشكلة المسار في Vercel باستخدام مسار نسبي مضمون
import { updateAppointmentStatus } from "../../lib/actions/appointment";

export function CompleteAppointmentModal({ 
  appointmentId, 
  patientId,
  patientName 
}: { 
  appointmentId: string; 
  patientId: string;
  patientName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
    
      // 1) تحديث حالة الموعد إلى مكتمل
      const result = await updateAppointmentStatus(appointmentId, "COMPLETED");
      
      const totalCost = Number(formData.get("totalCost"));
      const paidAmount = Number(formData.get("paidAmount"));
      
      if (result.success) {
        setIsOpen(false);
        // ✅ تحديث الصفحة برمجياً فوراً لكي تختفي علامة فحص المتابعة ويتحث الجدول حياً
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
      >
        إتمام ومعالجة
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden text-right" dir="rtl">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">إتمام موعد المريض: {patientName}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"> ✕ </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* ✅ تعديل الحقول إلى حقول نصية ذكية عريضة (Textarea) كما اتفقنا */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">التشخيص الحالي / الملاحظات الطبية</label>
                  <textarea 
                    name="diagnosis" 
                    required 
                    rows={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-right" 
                    placeholder="اكتب التشخيص الطبي الدقيق هنا..." 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">نوع الإجراء الحالي المتخذ (إجراءات متعددة حرة)</label>
                  <textarea 
                    name="procedure" 
                    required 
                    rows={2}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-right" 
                    placeholder="مثال: حشو عصب ممتد + تنظيف لثة للفك العلوي..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الأدوية الموصوفة / ملاحظات العيادة</label>
                <textarea name="medications" rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-right" />
              </div>
  
              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-800">التكلفة الإجمالية (EGP)</label>
                  <input type="number" name="totalCost" required className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-800">المبلغ المدفوع</label>
                  <input type="number" name="paidAmount" required className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                {isSubmitting ? "جاري حفظ السجلات الطبية والمالية..." : "حفظ السجل المالي والطبي وإتمام الجلسة"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}