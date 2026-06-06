"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function loginAction(email: string, password: string) {
  try {
    // 1. التحقق من وجود حساب المستخدم في قاعدة البيانات عبر Prisma
    let user = await prisma.user.findUnique({
      where: { email },
      include: { clinic: true }
    });

    // 💡 ميزة التهيئة التلقائية للمشروع التجريبي على Vercel 🚀
    // إذا كانت قاعدة البيانات فارغة تماماً في أول تشغيل، سنصنع عيادة وحسابين تلقائياً لتسهيل التجربة
    if (!user && email === "doctor@aswan.com" && password === "Aswan123*") {
      // إنشاء عيادة تجريبية موحدة
      const defaultClinic = await prisma.clinic.create({
        data: {
          name: "عيادة أسوان التجريبية لطبيب الأسنان",
          plan: "PROFESSIONAL",
        }
      });

      // إنشاء حساب الطبيب (شقيقك العزيز)
      user = await prisma.user.create({
        data: {
          email: "doctor@aswan.com",
          password: "Aswan123*", // في الإنتاج الفعلي سنقوم بعمل hashing بـ bcrypt
          name: "د. طبيب الأسنان المجرّب",
          role: "DOCTOR",
          clinicId: defaultClinic.id
        },
        include: { clinic: true }
      });

      // إنشاء حسابك أنت كـ ADMIN لإدارة البيانات مع شقيقك في نفس العيادة
      await prisma.user.create({
        data: {
          email: "ahmad@aswan.com",
          password: "AdminAswan123*",
          name: "المطور م. أحمد شكري",
          role: "ADMIN",
          clinicId: defaultClinic.id
        }
      });
    }

    // 2. التحقق من صحة كلمة المرور والحساب
    if (!user || user.password !== password) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    if (!user.isActive) {
      return { error: "هذا الحساب تم إيقافه مؤقتاً، يرجى مراجعة الإدارة" };
    }

    // 3. تخزين الـ clinicId وبيانات الجلسة في الكوكيز الآمنة لعزل البيانات (Multi-tenancy)
    const cookieStore = await cookies();
    cookieStore.set("clinicId", user.clinicId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // صالحة لمدة أسبوع كامل
      path: "/",
    });
    
    cookieStore.set("userRole", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Auth Error:", error);
    return { error: "حدث خطأ أثناء الاتصال بالخادم، يرجى التحقق من الاتصال بقاعدة البيانات." };
  }
}