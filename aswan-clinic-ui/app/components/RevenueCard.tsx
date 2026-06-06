"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card"; // استخدمنا الكارد الأساسي لتوحيد التنسيق
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Wallet } from "lucide-react"; // أضفنا Wallet ليتناسب مع أيقونات الكروت الأخرى

export function RevenueCard({ amount = 4500 }: { amount?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Card className="p-6 border-none shadow-sm flex flex-col justify-between bg-white relative overflow-hidden">
      {/* زر الإخفاء في زاوية الكارت بشكل هادئ */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsVisible(!isVisible)}
        className="absolute left-2 top-2 h-8 w-8 text-slate-400 hover:text-blue-600 z-10"
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </Button>

      <div className="flex items-center gap-4">
        {/* توحيد شكل الأيقونة والخلفية مع الكروت الأخرى */}
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
          <Wallet size={24} />
        </div>
        
        <div>
          {/* توحيد وزن الخط وحجمه (text-sm text-slate-500 font-bold) */}
          <p className="text-sm text-slate-500 font-bold">إيرادات اليوم</p>
          {/* توحيد وزن وحجم الرقم الكبير (text-2xl font-black text-slate-800) */}
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {isVisible ? `EGP ${amount.toLocaleString()}` : "••••••"}
          </h3>
        </div>
      </div>

      {/* مؤشر النسبة المئوية بشكل بسيط بالأسفل */}
      {isVisible && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
            +12% عن أمس
          </span>
        </div>
      )}
    </Card>
  );
}