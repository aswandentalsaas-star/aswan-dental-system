import { getTodayAppointments } from "@/lib/actions/appointment";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StartExamButton } from "./StartExamButton";

// دالة مساعدة لحساب العمر بدقة من تاريخ الميلاد لتمييز شارة الأطفال
function calculateAge(birthDateString: string) {
  if (!birthDateString) return 100;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default async function TodayAppointments() {
  const res = await getTodayAppointments();
  const appointments = res.appointments || [];

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h2 className="font-black text-slate-800 flex items-center gap-2">
          <Clock className="text-blue-600" size={20} />
          أجندة مواعيد اليوم
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
          {appointments.length} مواعيد
        </Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="text-center font-black text-slate-700 w-[20%]">الوقت</TableHead>
            <TableHead className="text-center font-black text-slate-700 w-[40%]">المريض</TableHead>
            <TableHead className="text-center font-black text-slate-700 w-[20%]">الحالة العيادية</TableHead>
            <TableHead className="text-center font-black text-slate-700 w-[20%]">الإجراء الحركي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="p-10 text-center text-slate-400">
                لا توجد مواعيد مسجلة لليوم
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((app: any) => {
              // حساب عمر المريض لفحص شارة الطفل
              const patientAge = calculateAge(app.patient.birthDate);
              // فحص إذا كانت المريضة حاملاً من خلال سجل الأمراض المزمنة أو حقل مخصص
              const isPregnant = app.patient.gender === 'FEMALE' && 
                   app.patient.chronicDiseases?.some((disease: string) => /حمل|حامل/.test(disease));

              return (
                <TableRow key={app.id} className="hover:bg-blue-50/30 transition-colors">
                  
                  {/* 1. الوقت في المنتصف */}
                  <TableCell className="font-bold text-slate-700 text-center">
                    {new Date(app.startTime).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  
                  {/* 2. اسم المريض مع الشارات الذكية المحقونة */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 justify-center flex-wrap max-w-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1 justify-center">
                          <User size={14} /> {app.patient.name}
                        </span>
                        
                        {/* شارة الطوارئ */}
                        {app.isEmergency && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-full animate-pulse border border-rose-200">
                            🚨 طوارئ
                          </span>
                        )}

                        {/* شارة الحوامل المحقونة ذكياً */}
                        {isPregnant && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                            🤰 حامل
                          </span>
                        )}

                        {/* شارة الأطفال المحقونة ذكياً */}
                        {patientAge < 12 && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-cyan-100 text-cyan-700 rounded-full border border-cyan-200">
                            👶 طفل
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1 justify-center mt-0.5" dir="ltr">
                        {app.patient.phone} <Phone size={10} />
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* 3. شارة الحالة ممركزة ودعم الحالات القديمة والجديدة للـ Enum */}
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      {(app.status === 'SCHEDULED' || app.status === 'PENDING') && (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">في الانتظار</Badge>
                      )}
                      {app.status === 'IN_PROGRESS' && (
                        <Badge className="bg-purple-100 text-purple-800 border border-purple-200 animate-pulse hover:bg-purple-100">داخل الكشف 🦷</Badge>
                      )}
                      {app.status === 'COMPLETED' && (
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-100">مكتمل</Badge>
                      )}
                      {(app.status === 'DELAYED' || app.status === 'CANCELLED') && (
                        <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
                          {app.status === 'DELAYED' ? 'متأخر' : 'ملغي'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* 4. زر الفحص ممركز */}
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center">
                      <StartExamButton id={app.id} patientId={app.patient.id} currentStatus={app.status} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}