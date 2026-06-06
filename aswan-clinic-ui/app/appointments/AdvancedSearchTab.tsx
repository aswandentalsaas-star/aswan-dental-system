"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Phone, User, Search, SlidersHorizontal, Stethoscope } from "lucide-react";

interface AdvancedSearchTabProps {
  allAppointments: any[];
}

export function AdvancedSearchTab({ allAppointments }: AdvancedSearchTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");

  // 1. دالة ترجمة شارات الحالات عيادياً أصبحت هنا داخلياً لمنع مشاكل السيرفر
  const localRenderStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">في الانتظار</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 animate-pulse hover:bg-purple-100">داخل الكشف 🦷</Badge>;
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">مكتمل</Badge>;
      case "DELAYED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">متأخر</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 2. استخراج أسماء الأطباء ديناميكياً
  const uniqueDoctors = Array.from(
    new Set(allAppointments.map((app) => app.doctorName || app.doctor?.name || "الطبيب الرئيسي"))
  ).filter(Boolean);

  // 3. آلية الفلترة الحية والذكية
  const filteredAppointments = allAppointments.filter((app) => {
    const matchesSearch =
      app.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.patient.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    
    const appDoctor = app.doctorName || app.doctor?.name || "الطبيب الرئيسي";
    const matchesDoctor = doctorFilter === "ALL" || appDoctor === doctorFilter;

    return matchesSearch && matchesStatus && matchesDoctor;
  });

  return (
    <div className="space-y-6 p-4">
      {/* أدوات التحكم والفرز الثلاثية المطورة 🛠️ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        
        {/* أ. صندوق البحث بالاسم أو الهاتف */}
        <div className="relative">
          <Search className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
          <Input
            placeholder="ابحث باسم المريض أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl font-medium text-right"
          />
        </div>

        {/* ب. قائمة التصفية حسب الحالة العيادية */}
        <div className="relative flex items-center gap-2 bg-white border border-slate-200 px-3 rounded-xl">
          <SlidersHorizontal className="text-slate-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 bg-transparent border-none text-slate-700 font-bold outline-none text-right cursor-pointer"
          >
            <option value="ALL">كل الحالات العيادية</option>
            <option value="SCHEDULED">في الانتظار</option>
            <option value="IN_PROGRESS">داخل الكشف 🦷</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="DELAYED">متأخر</option>
          </select>
        </div>

        {/* ج. الفلترة المتقدمة للأطباء 🩺 */}
        <div className="relative flex items-center gap-2 bg-white border border-slate-200 px-3 rounded-xl">
          <Stethoscope className="text-slate-400 w-4 h-4" />
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full py-2 bg-transparent border-none text-slate-700 font-bold outline-none text-right cursor-pointer"
          >
            <option value="ALL">جميع أطباء العيادة</option>
            {uniqueDoctors.map((docName: any, idx) => (
              <option key={idx} value={docName}>
                {docName}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* جدول عرض النتائج المحدث لحظياً كالمسطرة في السنتر */}
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            لا توجد مواعيد تطابق خيارات البحث والفرز الحالية
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-center font-black text-slate-700 w-[20%]">التاريخ واليوم</TableHead>
                <TableHead className="text-center font-black text-slate-700 w-[15%]">الوقت</TableHead>
                <TableHead className="text-center font-black text-slate-700 w-[30%]">المريض</TableHead>
                <TableHead className="text-center font-black text-slate-700 w-[15%]">الطبيب المعالج</TableHead>
                <TableHead className="text-center font-black text-slate-700 w-[20%]">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((app) => (
                <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  <TableCell className="font-semibold text-slate-700 text-center">
                    {new Date(app.startTime).toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </TableCell>
                  
                  <TableCell className="font-bold text-blue-600 text-center">
                    <span className="inline-flex items-center gap-1.5 justify-center">
                      <Clock size={14} />
                      {new Date(app.startTime).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold text-slate-800 flex items-center gap-1 justify-center">
                        <User size={14} className="text-slate-400" /> {app.patient.name}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 justify-center mt-0.5" dir="ltr">
                        {app.patient.phone} <Phone size={10} />
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-semibold text-slate-600">
                    {app.doctorName || app.doctor?.name || "الطبيب الرئيسي"}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      {localRenderStatusBadge(app.status)}
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}