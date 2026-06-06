"use server";

import { prisma } from "@/lib/prisma"; // تأكد من مسار استيراد بريزما الصحيح عندك
import { revalidatePath } from "next/cache";

interface PrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// 1. دالة حفظ الروشتة الطبية بالكامل مع أدويتها في عملية واحدة (Transaction)
export async function createPrescription(
  patientId: string,
  clinicId: string,
  notes: string,
  items: PrescriptionItemInput[]
) {
  try {
    // نستخدم $transaction لضمان حفظ الروشتة والأدوية معاً بنجاح أو إلغاء العملية كاملة في حال حدوث خطأ
    const newPrescription = await prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          patientId,
          clinicId,
          notes,
          items: {
            create: items.map((item) => ({
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
            })),
          },
        },
        include: {
          items: true,
        },
      });
      return prescription;
    });

    revalidatePath(`/patients/${patientId}`);
    return { success: true, data: newPrescription };
  } catch (error) {
    console.error("Error creating prescription:", error);
    return { success: false, error: "حدث خطأ أثناء حفظ الروشتة الطبية" };
  }
}

// 2. دالة جلب الأدوية المكتوبة سابقاً في العيادة (للتنبؤ والإكمال التلقائي الذكي Autocomplete)
export async function getRecentMedicines() {
  try {
    // جلب أسماء الأدوية الفريدة (المميزة) التي تم استخدامها مسبقاً في جدول الأدوية
    const items = await prisma.prescriptionItem.findMany({
      select: {
        medicineName: true,
      },
      distinct: ["medicineName"],
      take: 20, // جلب أشهر 20 دواء مكرر لتسريع الاقتراحات
    });

    return items.map((item) => item.medicineName);
  } catch (error) {
    console.error("Error fetching recent medicines:", error);
    return [];
  }
}

// 3. دالة فحص التعارض الدوائي الذكي عبر Groq AI 🧠⚠️
export async function checkDrugConflicts(patientId: string, selectedMedicines: string[]) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        name: true,
        chronicDiseases: true,
        allergies: true,
      },
    });

    if (!patient) return { hasConflict: false, message: "لم يتم العثور على المريض" };

    if (!patient.chronicDiseases && !patient.allergies) {
      return { hasConflict: false, message: "" };
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return { hasConflict: true, message: "⚠️ مفتاح الذكاء الاصطناعي (Groq API Key) مفقود. الرجاء إضافته في ملف .env" };
    }

    const prompt = `
      بصفتك طبيباً صيدلانياً استشارياً صارماً جداً في عيادة أسنان.
      راجع هذه الأدوية للمريض وتحقق من أي تعارضات مع حالته الصحية الحالية.

      بيانات المريض الحالية:
      - الأمراض المزمنة: ${patient.chronicDiseases || "لا يوجد"}
      - الحساسية: ${patient.allergies || "لا يوجد"}

      الأدوية المراد كتابتها:
      ${selectedMedicines.join(", ")}

      قواعد صارمة جداً لا تقبل النقاش:
      1. إذا كان هناك حساسية لأي عائلة دوائية (مثل حساسية البنسلين مع دواء Amoxicillin أو Augmentin أو Clamoxin)، أطلق تحذير حرج فوراً.
      2. إذا كان المريض يعاني من (قرحة معدة) وتم كتابة مسكنات مثل (Ibuprofen أو Brufen)، يجب فوراً إطلاق تحذير حرج.
      3. إذا وجدت تعارضاً، اكتب "تحذير طبي:" ثم اشرح الخطورة والبديل المتاح باختصار شديد.
      4. إذا كانت الأدوية آمنة 100% ولا يوجد أي تعارض، اكتب كلمة واحدة فقط: "SAFE".
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // موديل قوي جداً ومستقر للغاية
        messages: [
          { role: "system", content: "أنت طبيب صيدلي استشاري دقيق وموجز." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1, // درجة حرارة شبه منعدمة لضمان الدقة
      }),
    });

    const result = await response.json();

    // السحر هنا: فحص آمن لنتيجة الـ API لمنع انهيار الكود
    if (!response.ok || !result.choices) {
      console.error("Groq API Error Response:", result);
      return { 
        hasConflict: true, 
        message: `⚠️ خطأ في الاتصال بمحرك الذكاء الاصطناعي: ${result.error?.message || "استجابة غير متوقعة من السيرفر"}` 
      };
    }

    // استخراج الرد بأمان تام باستخدام علامة الاستفهامات (?)
    const aiResponse = result.choices[0]?.message?.content?.trim() || "";

    if (aiResponse.includes("SAFE")) {
      return { hasConflict: false, message: "" };
    } else {
      return { hasConflict: true, message: aiResponse };
    }
  } catch (error) {
    console.error("Groq Check Error:", error);
    // إرجاع hasConflict: true لكي تظهر كرسالة حمراء ثابتة ولا تُعتبر "نجاحاً"
    return { hasConflict: true, message: "⚠️ تعذر الاتصال بمحرك الذكاء الاصطناعي. يرجى مراجعة اتصال الإنترنت الخاص بك." };
  }
}