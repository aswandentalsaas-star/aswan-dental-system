import { Users, CalendarClock, Activity } from 'lucide-react';
import { RevenueCard } from './components/RevenueCard';
import { Card } from '@/components/ui/card';
import TodayAppointments from './components/dashboard/TodayAppointments'; // تأكد من الاستيراد الصحيح
import { AddAppointmentModal } from './components/AddAppointmentModal';

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">مرحباً بك، د. أيمن 👋</h1>
          <p className="text-slate-500 mt-1 font-medium">نظام أسوان ديجيتال | ملخص اليوم</p>
        </div>
        <AddAppointmentModal />
      </div>

      {/* شبكة الكروت الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* كارت المرضى */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">إجمالي المرضى</p>
            <h3 className="text-2xl font-black text-slate-800">1,248</h3>
          </div>
        </Card>

        {/* كارت مواعيد اليوم */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">مواعيد اليوم</p>
            <h3 className="text-2xl font-black text-slate-800">14</h3>
          </div>
        </Card>

        {/* كارت الحالات النشطة */}
        <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">في الانتظار</p>
            <h3 className="text-2xl font-black text-slate-800">3</h3>
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