"use client";
import { completeAppointment } from "@/lib/actions";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

export default function CompleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!confirm("هل تريد تأكيد إتمام الكشف؟")) return;
    setLoading(true);
    await completeAppointment(id);
    setLoading(false);
  };

  return (
    <button 
      onClick={handleComplete}
      disabled={loading}
      className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      <CheckCircle size={18} />
      {loading ? "جاري..." : "إتمام الكشف"}
    </button>
  );
}