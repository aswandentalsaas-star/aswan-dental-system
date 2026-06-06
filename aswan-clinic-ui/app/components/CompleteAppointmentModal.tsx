"use client";

import { useState } from "react";
import { X, CheckCircle2, DollarSign, Stethoscope } from "lucide-react";
import { updateAppointmentStatus } from "@/lib/actions/appointment";

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

      // نترك هذه المتغيرات المالية معرفة حتى لا يشتكي التايب سكريبت من عدم استخدامها
      const totalCost = Number(formData.get("totalCost"));
      const paidAmount = Number(formData.get("paidAmount"));

      // هنا يمكنك لاحقاً تمرير totalCost و paidAmount لأكشن المالية الخاص بك

      if (result.success) {
        setIsOpen(false);
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
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden text-right" dir="rtl">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">إتمام موعد: {patientName}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">التشخيص</label>
                  <input name="diagnosis" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="مثلاً: التهاب عصب" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">الإجراء المتخذ</label>
                  <input name="procedure" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="مثلاً: حشو تجميلي" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الأدوية / ملاحظات</label>
                <textarea name="medications" rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-800">التكلفة الإجمالية</label>
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
                {isSubmitting ? "جاري الحفظ..." : "حفظ السجل المالي والطبي"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}