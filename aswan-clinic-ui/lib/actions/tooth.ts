"use server";

import { prisma } from "@/lib/prisma"; // تأكد من مسار استيراد بريزما الصحيح عندك
import { revalidatePath } from "next/cache";

// 1. دالة حفظ إجراء طبي جديد لسن معين
export async function saveToothTreatment(data: {
  patientId: string;
  toothNumber: number;
  procedure: string;
  notes: string;
}) {
  try {
    const record = await prisma.toothTreatment.create({
      data: {
        patientId: data.patientId,
        toothNumber: data.toothNumber,
        procedure: data.procedure,
        notes: data.notes,
      },
    });
    revalidatePath(`/patients/${data.patientId}`);
    return { success: true, data: record };
  } catch (error) {
    console.error("Failed to save tooth treatment:", error);
    return { success: false, error: "حدث خطأ أثناء حفظ البيانات" };
  }
}

// 2. دالة جلب كل الإجراءات التاريخية لأسنان هذا المريض
export async function getPatientTreatments(patientId: string) {
  try {
    const treatments = await prisma.toothTreatment.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: treatments };
  } catch (error) {
    console.error("Failed to fetch tooth treatments:", error);
    return { success: false, data: [] };
  }
}