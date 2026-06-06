import { getAppointmentsByRange } from "@/lib/actions/appointment";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Clock, Phone, User, Filter } from "lucide-react";
import { AdvancedSearchTab } from "./AdvancedSearchTab"; // استيراد المكون الجديد

export default async function AppointmentsPage() {
  // حساب نطاقات التواريخ بدقة لدعم الجدولة
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const endOfCurrentWeek = new Date();
  endOfCurrentWeek.setDate(today.getDate() + 7);
  endOfCurrentWeek.setHours(23, 59, 59, 999); 
  
  const startOfNextWeek = new Date();
  startOfNextWeek.setDate(today.getDate() + 8);
  startOfNextWeek.setHours(0, 0, 0, 0);

  const endOfNextWeek = new Date();
  endOfNextWeek.setDate(today.getDate() + 15);
  endOfNextWeek.setHours(23, 59, 59, 999);

  // جلب البيانات لكل نطاق
  const currentWeekData = await getAppointmentsByRange(today, endOfCurrentWeek);
  const nextWeekData = await getAppointmentsByRange(startOfNextWeek, endOfNextWeek);

  const currentWeekAppointments = currentWeekData.appointments || [];
  const nextWeekAppointments = nextWeekData.appointments || [];

  // دمج كل مواعيد الأسبوعين معاً لتغذية لوحة البحث الشاملة
  const allFetchedAppointments = [...currentWeekAppointments, ...nextWeekAppointments];

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-3">
            <CalendarIcon className="text-blue-600" size={28} />
            الجدولة المركزية للمواعيد
          </h1>
          <p className="text-slate-500 text-sm font-medium">إدارة، تنظيم، وتتبع المواعيد المستقبلية لعيادة أسوان ديجيتال</p>
        </div>
      </div>

      <Tabs defaultValue="current-week" className="w-full space-y-4">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl gap-2">
          <TabsTrigger value="current-week" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900">
            الأسبوع الحالي ({currentWeekAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="next-week" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900">
            الأسبوع القادم ({nextWeekAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 flex items-center gap-1">
            <Filter size={14} /> الفلترة المتقدمة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current-week">
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-800">أجندة السبعة أيام الحالية</CardTitle>
              <CardDescription>عرض شامل للمواعيد المحجوزة من اليوم وحتى الأسبوع الحالي.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AppointmentTable appointments={currentWeekAppointments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next-week">
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-800">تخطيط الأسبوع المقبل</CardTitle>
              <CardDescription>مراجعة وتأكيد الحجوزات المستقبلية المجدولة مسبقاً.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AppointmentTable appointments={nextWeekAppointments} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. دمج لوحة الفرز والبحث المتقدم التفاعلية */}
        <TabsContent value="search">
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                لوحة الفرز والبحث الديناميكي
              </CardTitle>
              <CardDescription>ابحث فورياً باسم المريض أو قم بتصفية المواعيد حسب حالتها العيادية الحالية.</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <AdvancedSearchTab allAppointments={allFetchedAppointments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// مكون فرعي داخلي ومستقر لعرض الجدول بتموضع ممركز بالكامل 📐✨
function AppointmentTable({ appointments }: { appointments: any[] }) {
  if (appointments.length === 0) {
    return <div className="p-12 text-center text-slate-400 font-medium">لا توجد مواعيد مسجلة في هذا النطاق الزمني</div>;
  }

  // دالة الشارات الداخلية لمنع أي تضارب مع السيرفر
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

  return (
    <Table>
      <TableHeader className="bg-slate-50/30">
        <TableRow>
          <TableHead className="text-center font-black text-slate-700 w-[25%]">التاريخ واليوم</TableHead>
          <TableHead className="text-center font-black text-slate-700 w-[20%]">الوقت</TableHead>
          <TableHead className="text-center font-black text-slate-700 w-[35%]">المريض</TableHead>
          <TableHead className="text-center font-black text-slate-700 w-[20%]">الحالة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((app) => (
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
            
            <TableCell className="text-center">
              <div className="flex justify-center items-center">
                {localRenderStatusBadge(app.status)}
              </div>
            </TableCell>

          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}