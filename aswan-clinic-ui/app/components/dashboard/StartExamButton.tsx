"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateAppointmentStatus } from "@/lib/actions/appointment";
import { Loader2, Play, CheckCircle } from "lucide-react";

interface StartExamButtonProps {
  id: string;
  patientId: string;
  currentStatus: string;
}

export function StartExamButton({ id, patientId, currentStatus }: StartExamButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusTransition = async () => {
    setLoading(true);
    
    if (currentStatus === "SCHEDULED" || currentStatus === "DELAYED") {
      // 1. تحويل الحالة إلى "داخل الكشف الآن" في قاعدة البيانات
      const result = await updateAppointmentStatus(id, "IN_PROGRESS");
      if (result.success) {
        // ⚡ 2. الانتقال لملف المريض مع تمرير معرف الموعد في الرابط
        router.push(`/patients/${patientId}?appointmentId=${id}`);
      }
    } else if (currentStatus === "IN_PROGRESS") {
      // ⚡ إذا كان المريض في الكشف بالفعل، نوجهه مع معرف الموعد
      router.push(`/patients/${patientId}?appointmentId=${id}`);
    }
    
    setLoading(false);
  };

  if (currentStatus === "COMPLETED") {
    return (
      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
        <CheckCircle size={14} /> زيارة منتهية
      </span>
    );
  }

  return (
    <button
      onClick={handleStatusTransition}
      disabled={loading}
      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto ${
        currentStatus === "IN_PROGRESS"
          ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
          : "bg-slate-950 text-white hover:bg-slate-800"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : currentStatus === "IN_PROGRESS" ? (
        <>
          <span>متابعة الفحص 🔎</span>
        </>
      ) : (
        <>
          <Play size={12} fill="currentColor" />
          <span>بدء الكشف</span>
        </>
      )}
    </button>
  );
}