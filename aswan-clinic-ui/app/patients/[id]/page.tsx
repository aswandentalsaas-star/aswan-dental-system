import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache"; // ⚡ مهم جداً لتحديث الصفحة حياً بعد الحذف
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, Calendar, HeartPulse, XCircle } from "lucide-react";
import { JawMapping } from "@/app/components/patients/JawMapping";
import { PrescriptionForm } from "@/app/components/patients/PrescriptionForm";

// 1. دالة حساب السن الذكية تلقائياً بناءً على تاريخ الميلاد
function calculateAge(birthDateString: string | Date): number {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default async function PatientProfilePage({
   params,
   searchParams 
  }: {
   params: Promise<{ id: string }>;
   searchParams: Promise<{ appointmentId?: string }>;
  }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams; // انتظار searchParams لأنها Promise
  const appointmentId = resolvedSearchParams.appointmentId; // جلب appointmentId من searchParams إذا كان موجوداً

  // 2. جلب بيانات المريض + تضمين جدول التاريخ المرضي الجديد والمواعيد
  const patient = await prisma.patient.findUnique({
    where: { id: resolvedParams.id },
    include: {
      medicalHistory: true, // ⚡ جلب التاريخ المرضي الجديد
      appointments: {
        orderBy: { startTime: 'desc' },
        take: 5,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  // ⚡ منطق حساب السن وتحديد حالة الطفل (أقل من 12 سنة)
  const patientAge = patient.birthDate ? calculateAge(patient.birthDate) : null;
  const isChild = patientAge !== null && patientAge < 12;
  
  // ⚡ منطق تحديد حالة الحمل
  const isPregnant = patient.medicalHistory?.chronicDiseases?.includes("حمل") || 
                     patient.medicalHistory?.chronicDiseases?.includes("PREGNANT");

  // 3. أكشن ذكي (Server Action) لإزالة حالة الحمل بضغطة زر
  const removePregnancyAction = async () => {
    "use server";
    if (patient.medicalHistory) {
      // فلترة المصفوفة لحذف كلمة حمل
      const updatedDiseases = patient.medicalHistory.chronicDiseases.filter(
        (d) => d !== "حمل" && d !== "PREGNANT"
      );
      // تحديث قاعدة البيانات
      await prisma.medicalHistory.update({
        where: { id: patient.medicalHistory.id },
        data: { chronicDiseases: updatedDiseases }
      });
      // تحديث الواجهة فوراً
      revalidatePath(`/patients/${resolvedParams.id}`);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen print:bg-white print:p-0 print:min-h-auto" dir="rtl">
      
      {/* الحاوية الأولى (تختفي عند الطباعة) */}
      <div className="space-y-6 print:hidden">
        
        {/* القسم الأول: الهيدر والبيانات الأساسية */}
        <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
              {patient.name}
              {/* 👶 عرض شارة الطفل ديناميكياً */}
              {isChild && (
                <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200 text-sm px-3 py-1">
                  حالة: طفل 👶
                </Badge>
              )}
            </h1>
            <div className="flex gap-4 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1"><Phone size={16} /> {patient.phone}</span>
              {patient.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} /> 
                  تاريخ الميلاد: {new Date(patient.birthDate).toLocaleDateString('ar-EG')} 
                  <span className="text-blue-600 font-bold mr-1">({patientAge} سنة)</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            {/* شارة حالة الملف الطبي مع زر إلغاء الحمل */}
            {isPregnant ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-4 py-2 text-sm bg-rose-50 text-rose-700 border-rose-200">
                  حالة: حامل 🤰🏽
                </Badge>
                {/* زر الحذف المرتبط بالـ Server Action */}
                <form action={removePregnancyAction}>
                  <button 
                    type="submit" 
                    title="إلغاء حالة الحمل (بعد الولادة)" 
                    className="text-rose-400 hover:text-rose-700 transition-colors bg-rose-50 rounded-full p-1"
                  >
                    <XCircle size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <Badge variant="outline" className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
                ملف طبي نشط
              </Badge>
            )}
          </div>
        </div>

        {/* 🚨 شريط التنبيهات الإكلينيكية الذكي والوميضي */}
        {((patient.medicalHistory?.chronicDiseases && patient.medicalHistory.chronicDiseases.length > 0) || 
          (patient.medicalHistory?.allergies && patient.medicalHistory.allergies.length > 0)) && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-wrap gap-2 items-center animate-pulse">
            <span className="text-sm font-bold text-rose-700 flex items-center gap-1">
               ⚠️ تنبيه طبي حرج للعيادة:
            </span>
            {patient.medicalHistory?.chronicDiseases.map((disease: string) => (
              <Badge key={disease} className="bg-rose-600 text-white hover:bg-rose-700">
                {disease}
              </Badge>
            ))}
            {patient.medicalHistory?.allergies.map((allergy: string) => (
              <Badge key={allergy} className="bg-amber-500 text-white hover:bg-amber-600">
                حساسية: {allergy}
              </Badge>
            ))}
          </div>
        )}

        {/* القسم الثاني: عرض تفاصيل التاريخ المرضي المدون بالتفصيل */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-rose-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-rose-700 flex items-center gap-2 text-lg">
                <AlertTriangle size={20} /> سجل الحساسية المسجل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 font-medium">
                {patient.medicalHistory?.allergies && patient.medicalHistory.allergies.length > 0
                  ? patient.medicalHistory.allergies.join("، ")
                  : "لا توجد حساسية مسجلة حتى الآن"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-700 flex items-center gap-2 text-lg">
                <HeartPulse size={20} /> الأمراض المزمنة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 font-medium">
                {patient.medicalHistory?.chronicDiseases && patient.medicalHistory.chronicDiseases.length > 0
                  ? patient.medicalHistory.chronicDiseases.join("، ")
                  : "لا توجد أمراض مزمنة مسجلة حتى الآن"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* خريطة الأسنان التفاعلية الحية */}
        <JawMapping patientId={resolvedParams.id} />
      </div>

      {/* المكون الثالث (الروشتة الذكية) */}
      <div className="print:m-0 print:p-0">
        <PrescriptionForm 
          patientId={resolvedParams.id} 
          clinicId={patient.clinicId}
          appointmentId={appointmentId} // تمرير appointmentId لتمكين تحديث حالة الموعد بعد الطباعة
        />
      </div>
    </div>
  );
}