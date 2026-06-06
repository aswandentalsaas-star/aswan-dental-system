"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// استيراد الـ Enum الصارم من بريزما لضمان تطابق الـ status 100%
import { AppointmentStatus } from "@prisma/client";

// الدالة الأولى: لإنشاء الموعد (محدثة بالـ clinicId وتأمين الـ duration)
export async function createAppointment(data: {
  patientId: string;
  clinicId: string;
  startTime: string;
}) {
  try {
    const start = new Date(data.startTime);
    
    // حساب وقت النهاية تلقائياً بإضافة 30 دقيقة مبدئية لضمان مرونة الجدولة
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        clinicId: data.clinicId,
        startTime: start,
        endTime: end, // الحقل الإلزامي أصبح مؤمناً الآن وموجوداً!
        status: "SCHEDULED",
      },
    });

    revalidatePath("/");
    return { success: true, appointment };
  } catch (error: any) {
    console.error("خطأ أثناء إنشاء الموعد:", error.message);
    return { success: false, error: "حدث خطأ أثناء حفظ البيانات" };
  }
}

// الدالة الثانية: جلب مواعيد اليوم (Daily Agenda)
export async function getTodayAppointments() {
  try {
    const CLINIC_ID = "cmnvicnma00004n5lfzctorck";
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: CLINIC_ID,
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
    console.error("خطأ أثناء جلب المواعيد:", error.message);
    return { success: false, error: "فشل جلب مواعيد اليوم" };
  }
}

// الدالة الثالثة: تحديث الحالة وتأمينها بنوع البيانات الخاص ببريزما
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

// الدالة الرابعة: جلب المواعيد المتقدمة بنطاق زمني مخصص
export async function getAppointmentsByRange(startDate: Date, endDate: Date) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
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