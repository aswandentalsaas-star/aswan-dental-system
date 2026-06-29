import { Users, CalendarClock, Activity } from 'lucide-react';
import { RevenueCard } from './components/RevenueCard';
import { Card } from '@/components/ui/card';
import TodayAppointments from './components/dashboard/TodayAppointments';
import { AddAppointmentModal } from './components/AddAppointmentModal';
import { getTodayAppointments } from "@/lib/actions/appointment"; // استيراد الدالة لجلب الأرقام حية

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // جلب المواعيد حية لحساب أرقام الكروت تلقائياً
  const res = await getTodayAppointments();
  const appointments = res.appointments || [];

  // حساب العدادات بناءً على البيانات الحقيقية لليوم
  const todayCount = appointments.length;
  const waitingCount = appointments.filter((app: any) => app.status === 'SCHEDULED' || app.status === 'PENDING').length;

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen" dir="rtl">
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
        
        {/* كارت المرضى (ثابت مؤقتاً لحين ربط إجمالي المسجلين) */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">إجمالي المرضى</p>
            <h3 className="text-2xl font-black text-slate-800">1,248</h3>
          </div>
        </Card>

        {/* كارت مواعيد اليوم - أصبح ديناميكياً */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">مواعيد اليوم</p>
            <h3 className="text-2xl font-black text-slate-800">{todayCount}</h3>
          </div>
        </Card>

        {/* كارت الحالات في الانتظار - أصبح ديناميكياً يحسب SCHEDULED و PENDING */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">في الانتظار</p>
            <h3 className="text-2xl font-black text-slate-800">{waitingCount}</h3>
          </div>
        </Card>

        {/* كارت الإيرادات الذكي */}
        <RevenueCard amount={4500} />
      </div>

      {/* عرض جدول مواعيد اليوم الحقيقي */}
      <div className="mt-8">
        <TodayAppointments />
      </div>
      
    </div>
  );
}