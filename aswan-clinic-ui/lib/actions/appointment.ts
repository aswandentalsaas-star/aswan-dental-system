"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// استيراد الـ Enum الصارم من بريزما لضمان تطابق الـ status 100%
import { AppointmentStatus } from "@prisma/client";

// المعرف الموحد والثابت للعيادة ليتطابق 100% مع ملف المرضى وقاعدة البيانات
const fixedClinicId = "aswan-clinic-id";

// 1. تعريف الـ Interface لضمان التعرف على الخصائص ومنع أخطاء الـ TypeScript
interface CreateAppointmentInput {
  patientId: string;
  clinicId?: string;
  startTime: string;
  duration: number;       // استقبال مدة الجلسة ديناميكياً (30 أو 10 دقائق)
  isEmergency: boolean;   // استقبال علم حالة الطوارئ
  doctorName?: string;
}

// 2. الدالة المحدثة لحجز وإنشاء المواعيد بأمان
export async function createAppointment(data: CreateAppointmentInput) {
  try {
    const start = new Date(data.startTime);
    
    // حساب وقت النهاية (endTime) هندسياً بناءً على المدة الممررة ديناميكياً
    const end = new Date(start.getTime() + data.duration * 60000);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        clinicId: fixedClinicId, // استخدام المعرف الصحيح والموحد
        startTime: start,
        endTime: end,              // الحفظ الإجباري المتوافق مع الـ Schema
        isEmergency: data.isEmergency, // ربط حالة الطوارئ بقاعدة البيانات
        status: AppointmentStatus.SCHEDULED,
        doctorName: data.doctorName || "د. أيمن",
      },
    });
    
    // تحديث مسارات الصفحة فوراً لتعكس الموعد الجديد في جدول اليوم والعدادات
    revalidatePath("/"); 
    
    return { success: true, appointment };
  } catch (error: any) {
    console.error("خطأ أثناء إنشاء الموعد على السيرفر البنائي:", error.message);
    return { success: false, error: "حدث خطأ أثناء حفظ البيانات الطبية وتحديث الموعد" };
  }
}

// 3. دالة جلب مواعيد اليوم (Daily Agenda) الموحدة
export async function getTodayAppointments() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: fixedClinicId, // القراءة من نفس العيادة الموحدة
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { success: true, appointments };
  } catch (error: any) {
    console.error("خطأ أثناء جلب المواعيد اليومية:", error.message);
    return { success: false, error: "فشل جلب مواعيد اليوم" };
  }
}

// 4. دالة تحديث حالة الموعد وتأمينها
export async function updateAppointmentStatus(
  id: string, 
  status: AppointmentStatus
) {
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    
    revalidatePath("/"); 
    return { success: true };
  } catch (error: any) {
    console.error("خطأ في تحديث الحالة:", error.message);
    return { success: false, error: "فشل تحديث حالة الموعد" };
  }
}

// 5. دالة جلب المواعيد المتقدمة بنطاق زمني مخصص للتقارير والداشبورد
export async function getAppointmentsByRange(startDate: Date, endDate: Date) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: fixedClinicId, // حصر النطاق في عيادتنا الموحدة
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { success: true, appointments };
  } catch (error: any) {
    console.error("خطأ في جلب المواعيد الممتدة:", error.message);
    return { success: false, appointments: [], error: "فشل جلب سجل المواعيد" };
  }
}