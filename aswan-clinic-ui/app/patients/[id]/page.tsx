import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, Calendar, HeartPulse } from "lucide-react";
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

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  
  const resolvedParams = await params;

  // 2. جلب بيانات المريض + تضمين جدول التاريخ المرضي الجديد والمواعيد
  const patient = await prisma.patient.findUnique({
    where: { id: resolvedParams.id },
    include: {
      medicalHistory: true, // ⚡ جلب التاريخ المرضي الجديد المرتبط بالقاعدة
      appointments: {
        orderBy: { startTime: 'desc' },
        take: 5,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen print:bg-white print:p-0 print:min-h-auto" dir="rtl">
      
      {/* الحاوية الأولى (تختفي عند الطباعة) */}
      <div className="space-y-6 print:hidden">
        
        {/* القسم الأول: الهيدر والبيانات الأساسية */}
        <div className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">{patient.name}</h1>
            <div className="flex gap-4 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1"><Phone size={16} /> {patient.phone}</span>
              {patient.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={16} /> 
                  تاريخ الميلاد: {new Date(patient.birthDate).toLocaleDateString('ar-EG')} 
                  {/* ⚡ عرض السن تلقائياً هنا */}
                  <span className="text-blue-600 font-bold mr-1">({calculateAge(patient.birthDate)} سنة)</span>
                </span>
              )}
            </div>
          </div>
          
          {/* شارة حالة الملف الطبي للمريض - تتغير ديناميكياً فور الحفظ */}
          <Badge variant="outline" className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
            {patient.medicalHistory?.chronicDiseases?.includes("حمل") || patient.medicalHistory?.chronicDiseases?.includes("PREGNANT") 
            ? 'حالة: حامل 🤰🏽' 
            : 'ملف طبي نشط'}
          </Badge>
        </div>

        {/* 🚨 شريط التنبيهات الإكلينيكية الذكي والوميضي (يقرأ من الجدول الجديد) */}
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
          
          {/* كارت الحساسية المربوط بقاعدة البيانات */}
          <Card className="border-rose-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-rose-700 flex items-center gap-2 text-lg">
                <AlertTriangle size={20} />
                سجل الحساسية المسجل
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

          {/* كارت الأمراض المزمنة المربوط بقاعدة البيانات */}
          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-700 flex items-center gap-2 text-lg">
                <HeartPulse size={20} />
                الأمراض المزمنة
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
          patientId={patient.id} 
          clinicId="cmnvicnma00004n5lfzctorck"
        />
      </div>

    </div>
  );
}