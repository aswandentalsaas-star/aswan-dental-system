"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// دالة البحث الذكي للاحتمالات العربية والإنجليزية
function generateSearchVariations(query: string): string[] {
  const variations = new Set<string>();
  
  variations.add(query);
  variations.add(query.toLowerCase());
  variations.add(query.toUpperCase());
  variations.add(query.charAt(0).toUpperCase() + query.slice(1).toLowerCase());
  
  variations.add(query.replace(/[أإآا]/g, 'ا'));
  variations.add(query.replace(/[أإآا]/g, 'أ'));
  variations.add(query.replace(/[أإآا]/g, 'إ'));
  
  variations.add(query.replace(/[وؤ]/g, 'و'));
  variations.add(query.replace(/[وؤ]/g, 'ؤ'));
  
  variations.add(query.replace(/[يىئ]/g, 'ي'));
  variations.add(query.replace(/[يىئ]/g, 'ى'));
  
  variations.add(query.replace(/[ةه]/g, 'ة'));
  variations.add(query.replace(/[ةه]/g, 'ه'));
  
  return Array.from(variations);
}

// 1. الدالة الموحدة والمؤمنة لحفظ المريض (createPatient)
export async function createPatient(data: {
  name: string;
  phone: string;
  selection: "ذكر" | "أنثى" | "طفل" | "حامل";
  birthDate?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  chronicDiseases?: string;
  allergies?: string;
  notes?: string;
}) {
  try {
    const fixedClinicId = "aswan-clinic-id";

    // ضمان وجود العيادة الثابتة لمنع Foreign key constraint error
    await prisma.clinic.upsert({
      where: { id: fixedClinicId },
      update: {},
      create: {
        id: fixedClinicId,
        name: "عيادة أسوان لطب الأسنان",
        plan: "STARTER",
        isActive: true
      }
    });

    // تجهيز نوع الجنس والحالة الطبية
    let gender: "MALE" | "FEMALE" = "MALE";
    let status = "NORMAL";

    if (data.selection === "أنثى") {
      gender = "FEMALE";
    } else if (data.selection === "حامل") {
      gender = "FEMALE";
      status = "PREGNANT";
    } else if (data.selection === "طفل") {
      gender = "MALE"; 
      status = "CHILD";
    }

    const formattedBirthDate = data.birthDate ? new Date(data.birthDate) : null;

    // تأمين معالجة النصوص والمصفوفات منعاً لخطأ split is not a function
    let chronicArray: string[] = [];
    if (data.chronicDiseases) {
      chronicArray = typeof data.chronicDiseases === 'string'
        ? data.chronicDiseases.split(',').map((item: string) => item.trim()).filter(Boolean)
        : data.chronicDiseases;
    }

    let allergiesArray: string[] = [];
    if (data.allergies) {
      allergiesArray = typeof data.allergies === 'string'
        ? data.allergies.split(',').map((item: string) => item.trim()).filter(Boolean)
        : data.allergies;
    }

    if (status === "PREGNANT") {
      chronicArray.push("حمل");
    }

    // إنشاء ملف المريض مع السجل المرضي وربطه بالعيادة الموحدة
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
            notes: data.notes || `تم إنشاء السجل الطبي الأولي.\nشخص الطوارئ: ${data.emergencyName || 'غير مسجل'} - هاتف الطوارئ: ${data.emergencyPhone || 'غير مسجل'}`
          }
        }
      }
    });

    revalidatePath("/");
    return { success: true, patient };
  } catch (error: any) {
    console.error("خطأ في السيرفر أثناء إضافة المريض:", error.message);
    return { success: false, error: error.message || "فشل حفظ المريض" };
  }
}

// 2. دالة البحث المؤمنة والمقيدة بمعرف العيادة الثابتة
export async function searchPatients(query: string) {
  try {
    if (!query) return { success: true, patients: [] };
    
    const fixedClinicId = "aswan-clinic-id";
    const searchTerms = generateSearchVariations(query);

    const patients = await prisma.patient.findMany({
      where: {
        clinicId: fixedClinicId, // التأكد من البحث فقط داخل مرضى عيادة أسوان
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