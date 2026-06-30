"use server";
import { prisma } from "@/lib/prisma";

export async function getTodayRevenue() {
  try {
    // تحديد بداية ونهاية اليوم الحالي بدقة
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // حساب مجموع المبالغ المدفوعة في العيادة لليوم من جدول المواعيد المكتملة
    const fetchProcedures = await prisma.treatmentProcedure.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        cost: true, // أو الحقل المسؤول عن القيمة المالية للموعد في السكيما لديك
      },
    });

    // جمع الإيرادات الحقيقية لليوم
    const totalRevenue = fetchProcedures.reduce((sum: number, proc: { cost: number }) => {
      return sum + (proc.cost || 0);
    }, 0);

    return { success: true, revenue: totalRevenue };
  } catch (error: any) {
    console.error("خطأ في جلب إيرادات اليوم:", error.message);
    return { success: false, revenue: 0 };
  }
}

// دالة لجلب إجمالي عدد المرضى الفعلي المسجلين في قاعدة البيانات
export async function getTotalPatientsCount() {
  try {
    const count = await prisma.patient.count();
    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0 };
  }
}