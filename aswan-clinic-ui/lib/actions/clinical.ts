"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ========================================================
// 1. أكشن حفظ أو تحديث التاريخ المرضي والحساسيات للمريض
// ========================================================
export async function saveMedicalHistory(data: {
  patientId: string;
  allergies: string[];
  chronicDiseases: string[];
  notes?: string;
}) {
  try {
    // نستخدم upsert: إذا كان للمريض سجل طبي سابق يقوم بتحديثه، وإذا لم يكن له ينشئ سجلاً جديداً
    const history = await prisma.medicalHistory.upsert({
      where: { patientId: data.patientId },
      update: {
        allergies: data.allergies,
        chronicDiseases: data.chronicDiseases,
        notes: data.notes,
      },
      create: {
        patientId: data.patientId,
        allergies: data.allergies,
        chronicDiseases: data.chronicDiseases,
        notes: data.notes,
      },
    });

    revalidatePath(`/dashboard/patients/${data.patientId}`);
    return { success: true, history };
  } catch (error: any) {
    console.error("خطأ في حفظ التاريخ المرضي:", error.message);
    return { success: false, error: "فشل حفظ التاريخ الطبي للمريض" };
  }
}

// ========================================================
// 2. أكشن حفظ الروشتة الطبية مع تفاصيل الأدوية (Transaction)
// ========================================================
export async function createPrescription(data: {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  items: {
    medicineName: string;
    type: string; // اقتراحك الذكي: علبة، شريط، كبسولة...
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
}) {
  try {
    // نستخدم Prisma Transaction لضمان حفظ الروشتة وأدويتها معاً بنجاح أو إلغاء العملية كاملة عند حدوث خطأ
    const prescription = await prisma.$transaction(async (tx) => {
      return await tx.prescription.create({
        data: {
          patientId: data.patientId,
          clinicId: data.clinicId,
          appointmentId: data.appointmentId || null,
          items: {
            create: data.items.map((item) => ({
              medicineName: item.medicineName,
              type: item.type,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: true, // جلب الأدوية المرافقة للروشتة للتأكيد
        },
      });
    });

    if (data.appointmentId) {
      revalidatePath(`/dashboard/appointments`);
    }
    revalidatePath(`/dashboard/patients/${data.patientId}`);
    
    return { success: true, prescription };
  } catch (error: any) {
    console.error("خطأ أثناء حفظ الروشتة:", error.message);
    return { success: false, error: "فشل تسجيل الروشتة الطبية في قاعدة البيانات" };
  }
}