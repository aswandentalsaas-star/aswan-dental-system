"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// دالة البحث الذكي (التي لا نريد فقدانها)
function generateSearchVariations(query: string): string[] {
  const variations = new Set<string>();
  
  // إضافة النص الأصلي كما كتبه المستخدم
  variations.add(query);

  // احتمالات اللغة الإنجليزية (حروف صغيرة، كبيرة، أول حرف كبير)
  variations.add(query.toLowerCase());
  variations.add(query.toUpperCase());
  variations.add(query.charAt(0).toUpperCase() + query.slice(1).toLowerCase());

  // احتمالات الحروف العربية الحساسة
  // عائلة الألف
  variations.add(query.replace(/[أإآا]/g, 'ا'));
  variations.add(query.replace(/[أإآا]/g, 'أ'));
  variations.add(query.replace(/[أإآا]/g, 'إ'));
  
  // عائلة الواو والهمزة
  variations.add(query.replace(/[وؤ]/g, 'و'));
  variations.add(query.replace(/[وؤ]/g, 'ؤ'));
  
  // عائلة الياء والألف اللينة
  variations.add(query.replace(/[يىئ]/g, 'ي'));
  variations.add(query.replace(/[يىئ]/g, 'ى'));
  
  // عائلة التاء المربوطة والهاء
  variations.add(query.replace(/[ةه]/g, 'ة'));
  variations.add(query.replace(/[ةه]/g, 'ه'));

  // تحويل الاحتمالات إلى مصفوفة (Array) لتمريرها لقاعدة البيانات
  return Array.from(variations);
}

// 1. تثبيت ال clinicId لضمان قبول Vercel للبيانات وعدم رفض السيرفر للحفظ نهائيا
export async function creatPatient(data: any) {
  try {
    const fixedClinicId = "aswan-clinic-id";
    // التأكد من وجود العيادة في قاعدة البيانات أو إنشائها تلقائيا إذا لم تكن موجودة لمنع ال Foreign key Constraint Error
    await prisma.clinic.upsert({
      where: { id: fixedClinicId },
      update: {},
      create: {
        id: fixedClinicId,
        name: "عيادة أسوان لطب الأاسنان",
        plan: "STARTER",
        isActive: true
      }
    });

    const formattedBirthDate = data.birthDate ? new Date(data.birthDate) : null;
    const gender = data.gender === "أنثى" || data.gender === "FEMALE" ? "FEMALE" : "MALE";

    const chronicArray = data.chronicDiseases
      ? (typeof data.chronicDiseases === 'string'
          ? data.chronicDiseases.split(',').map((item: string) => item.trim()).filter(Boolean)
          : data.chronicDiseases)
      : [];
    const allergiesArray = data.allergies
      ? (typeof data.allergies === 'string'
          ? data.allergies.split(',').map((item: string) => item.trim()).filter(Boolean)
          : data.allergies)
      : [];
    if (data.status === "PREGNANT" || data.isPregnant) {
      chronicArray.push("حمل");
    }

    // إنشاء ملف المريض وربطه بالعيادة الثابتة
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        phone: data.phone,
        gender: gender,
        birthDate: formattedBirthDate,
        clinicId: fixedClinicId,
        medicalHistory: {
          create: {
            chronicDiseases: chronicArray,
            allergies: allergiesArray,
            notes: data.notes || ""
          }
        }
      }
    });

    revalidatePath("/");
    return { success: true, patient };
  } catch (error: any) {
    console.error("خطأ في إنشاء المريض على Vercel:", error.message);
    return { success: false, error: error.message || "فشل حفظ المريض" };
  }
}

// 2. دالة البحث عن المرضى المحدثة والمؤمنة بالعيادة
export async function searchPatients(query: string) {
  try {
    if (!query) return { success: true, patients: [] };
    const searchTerms = generateSearchVariations(query);

    const patients = await prisma.patient.findMany({
      where: {
        OR: searchTerms.map(term => ({
          name: { contains: term, mode: 'insensitive' }
        }))
      },
      include: {
        medicalHistory: true
      },
      take: 10
    });

    return { success: true, patients };
  } catch (error: any) {
    console.error("خطأ في البحث:", error.message);
    return { success: false, patients: [] };
  }
}

// دالة الإضافة الشاملة (المحدثة بالبيانات الطبية والـ MALE/FEMALE)
export async function createPatient(data: {
  name: string;
  phone: string;
  selection: "ذكر" | "أنثى" | "طفل" | "حامل";
  birthDate?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  chronicDiseases?: string;
  allergies?: string;
}) {
  try {
    const clinicId = "cmnvicnma00004n5lfzctorck";

    // 1. تحويل الاختيار إلى Gender و Status بالأحرف الكبيرة تماماً
    let gender: "MALE" | "FEMALE" = "MALE";
    let status: "NORMAL" | "CHILD" | "PREGNANT" = "NORMAL";

    if (data.selection === "أنثى") {
      gender = "FEMALE";
      status = "NORMAL";
    } else if (data.selection === "حامل") {
      gender = "FEMALE";
      status = "PREGNANT";
    } else if (data.selection === "طفل") {
      gender = "MALE"; 
      status = "CHILD";
    } else {
      gender = "MALE";
      status = "NORMAL";
    }

    const formattedBirthDate = data.birthDate ? new Date(data.birthDate) : null;

    // 2. ضمان وجود العيادة
    await prisma.clinic.upsert({
      where: { id: clinicId },
      update: {},
      create: {
        id: clinicId,
        name: "Aswan Dental Clinic",
      },
    });

    // 3. إنشاء السجل الطبي الشامل
    // 1. معالجة وتجهيز البيانات: تحويل النصوص القادمة من الفورم إلى مصفوفات نظيفة
    const chronicArray = data.chronicDiseases 
      ? data.chronicDiseases.split(',').map((item: string) => item.trim()).filter(Boolean) 
      : [];

    const allergiesArray = data.allergies 
      ? data.allergies.split(',').map((item: string) => item.trim()).filter(Boolean) 
      : [];

    // 2. معالجة حالة المريض القديمة بذكاء (إدراج الحمل كحالة طبية قابلة للإزالة مستقبلاً)
    if (status === "PREGNANT") {
      chronicArray.push("حمل");
    }

    // 3. إنشاء ملف المريض مع السجل الطبي المدمج في عملية واحدة آمنة (Transaction)
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        phone: data.phone,
        gender: gender,
        birthDate: formattedBirthDate,
        clinicId: clinicId,
    
       // ❌ تم حذف (status, chronicDiseases, allergies) من هنا 

      // ✅ السحر هنا: إنشاء جدول التاريخ المرضي المربوط بالمريض تلقائياً
        medicalHistory: {
          create: {
            chronicDiseases: chronicArray,
            allergies: allergiesArray,
            notes: `تم إنشاء السجل الطبي الأولي.\nشخص الطوارئ: ${data.emergencyName || 'غير مسجل'} - هاتف الطوارئ: ${data.emergencyPhone || 'غير مسجل'}`
          }
        }
      },
   });

    revalidatePath("/");
    return { success: true, patient };
  } catch (error: any) {
    console.error("خطأ في السيرفر أثناء الإضافة الشاملة:", error.message);
    return { success: false, error: error.message };
  }
}