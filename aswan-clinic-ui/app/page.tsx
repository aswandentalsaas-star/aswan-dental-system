import { Users, CalendarClock, Activity, ShieldAlert } from 'lucide-react';
import { RevenueCard } from './components/RevenueCard';
import { Card } from '@/components/ui/card';
import TodayAppointments from './components/dashboard/TodayAppointments';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { getTodayAppointments } from "@/lib/actions/appointment"; 
import { getTodayRevenue, getTotalPatientsCount } from "@/lib/actions/finance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. جلب المواعيد حية لحساب أرقام الكروت تلقائياً
  const res = await getTodayAppointments();
  const appointments = res.appointments || [];

  // 2. جلب إجمالي المرضى الفعلي وإيرادات اليوم الحقيقية
  const patientsData = await getTotalPatientsCount();
  const revenueData = await getTodayRevenue();

  const totalPatients = patientsData.count || 0;
  const todayRevenue = revenueData.revenue || 0;

  // 3. حساب العدادات بناءً على البيانات الحقيقية لليوم
  const todayCount = appointments.length;
  const waitingCount = appointments.filter((app: any) => app.status === 'SCHEDULED' || app.status === 'PENDING').length;

  // 4. حساب الفئات الخاصة بمواعيد اليوم (طفل / حامل / طوارئ)
  // الحساب يعتمد على شارات الموعد أو سجل المريض المتاح في الـ Object
  const emergencyCount = appointments.filter((app: any) => app.isEmergency || app.patient?.isEmergency).length;
  const pregnantCount = appointments.filter((app: any) => app.patient?.medicalHistory?.chronicDiseases?.includes("حمل")).length;
  const childrenCount = appointments.filter((app: any) => app.patient?.gender === "MALE" && app.patient?.medicalHistory?.notes?.includes("CHILD")).length; 

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">مرحباً بك، د. أيمن 👋</h1>
          <p className="text-slate-500 mt-1 font-medium">نظام أسوان ديجيتال | لوحة التحكم</p>
        </div>
        <AddAppointmentModal />
      </div>

      {/* شبكة الكروت الإحصائية الذكية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* كارت المرضى - أصبح يقرأ العدد الفعلي الحقيقي الحقيقي */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">إجمالي المرضى</p>
            <h3 className="text-2xl font-black text-slate-800">{totalPatients.toLocaleString()}</h3>
          </div>
        </Card>

        {/* كارت مواعيد اليوم */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">مواعيد اليوم</p>
            <h3 className="text-2xl font-black text-slate-800">{todayCount}</h3>
          </div>
        </Card>

        {/* كارت الحالات في الانتظار */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">في الانتظار</p>
            <h3 className="text-2xl font-black text-slate-800">{waitingCount}</h3>
          </div>
        </Card>

        {/* كارت الإيرادات الذكي - أصبح يقرأ القيمة الحقيقية الحية من السيرفر */}
        <RevenueCard amount={todayRevenue} />
      </div>

      {/* 🌟 الكارت الموحد الجديد: الحالات الحرجة والخاصة لليوم */}
      <Card className="p-6 border-none shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h4 className="text-md font-black text-slate-800">الحالات الخاصة المنظرة اليوم</h4>
            <p className="text-xs text-slate-400 mt-0.5">تصنيف تلقائي للمرضى المجدولين في أجندة اليوم لتنبيه الطاقم الطبي</p>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto justify-around md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 block mb-1">🚨 طوارئ</span>
            <span className="text-xl font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">{emergencyCount}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-100 hidden md:block" />
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 block mb-1">🤰 مريضات حوامل</span>
            <span className="text-xl font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">{pregnantCount}</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-100 hidden md:block" />
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 block mb-1">👶 أطفال</span>
            <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">{childrenCount}</span>
          </div>
        </div>
      </Card>

      {/* عرض جدول مواعيد اليوم الحقيقي */}
      <div className="mt-8">
        <TodayAppointments />
      </div>
      
    </div>
  );
}