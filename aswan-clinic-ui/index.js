const express = require('express');
const Groq = require("groq-sdk");
const { PrismaClient } = require('@prisma/client');
const path = require('path'); // أضف هذا السطر

const app = express();
const prisma = new PrismaClient();
// ⚠️ ضع مفتاحك الحقيقي بين علامات التنصيص أدناه
const apikey = process.env.GROQ_API_KEY;

app.use(express.json());
app.use(express.static('public')); // هذا السطر يسمح للسيرفر بعرض ملفات الواجهة

// --- 1. التأسيس (Clinic & Doctor) ---
async function bootstrapSystem() {
  let clinic = await prisma.clinic.findFirst();
  if (!clinic) clinic = await prisma.clinic.create({ data: { name: "عيادة أسوان التخصصية" } });

  let doctor = await prisma.user.findFirst();
  if (!doctor) {
    doctor = await prisma.user.create({
      data: { 
        name: "Dr. Ahmad Shokry", 
        email: "ahmad@aswandental.com",
        password: "securePassword123",
        nationalId: "29001010000000",
        role: "DOCTOR", 
        clinicId: clinic.id 
      }
    });
  }
  return { clinic, doctor };
}

// --- 2. التسجيل والحجز مع التاريخ الطبي ---
async function registerAndBook(name, clinicId, medicalHistory = "") {
  const mCode = "PN-" + Date.now();
  const patient = await prisma.patient.create({
    data: { 
      name: name, 
      medicalCode: mCode, 
      phone: "01012345678",
      nationalId: "ID-" + mCode,
      isAdult: true, 
      clinicId: clinicId,
      chronicDiseases: medicalHistory 
    }
  });
  const appointment = await prisma.appointment.create({
    data: {
      date: new Date(),
            startTime: new Date(), // 👈 أضف هذا السطر لكي يظهر المريض في الجدول
      status: "SCHEDULED",
      isEmergency: false,
      durationMinutes: 30,
      patientId: patient.id
    }
  });
  return { patient, appointment };
}

// --- 3. السجل الطبي ---
async function processTreatment(patientId, appointmentId, doctorId, procedure, cost) {
  return await prisma.treatmentRecord.create({
    data: { 
      procedure: procedure, 
      cost: cost, 
      toothNumber: 1, 
      patientId: patientId, 
      appointmentId: appointmentId, 
      doctorId: doctorId 
    }
  });
}

// --- 4. محرك الماليات ---
async function generateTransaction(patientId, totalAmount, discount, doctorId) {
  const finalAmount = totalAmount - discount;
  return await prisma.transaction.create({
    data: {
      type: "INCOME",
      category: "TREATMENT",
      amount: finalAmount,
      discount: discount,
      paymentMethod: "CASH",
      description: "Payment for dental treatment",
      creatorId: doctorId,
      referenceId: "REF-" + Date.now()
    }
  });
}

// --- 5. محرك المخازن ---
async function setupInventory(clinicId) {
  const items = [
    { name: "Anesthesia (حقنة بنج)", quantity: 50, minStock: 10, unit: "Unit", costPerUnit: 20 },
    { name: "Composite (حشو)", quantity: 30, minStock: 5, unit: "Tube", costPerUnit: 150 }
  ];

  for (const item of items) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { name: item.name, clinicId: clinicId }
    });

    if (!existing) {
      await prisma.inventoryItem.create({
        data: { ...item, totalCost: item.quantity * item.costPerUnit, clinicId: clinicId }
      });
    }
  }
  console.log("📦 Inventory Setup: Basic items are ready in stock.");
}

async function consumeItem(itemName, amount, clinicId) {
  const item = await prisma.inventoryItem.findFirst({
    where: { name: { contains: itemName }, clinicId: clinicId }
  });

  if (item && item.quantity >= amount) {
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: item.quantity - amount }
    });
    console.log("📉 Stock Update: " + itemName + " reduced to " + updatedItem.quantity);
  }
}

// --- 6. محرك التنبيهات الطبي الذكي (مُعدّل ليرجع النص) ---
async function checkMedicalRisks(patientId) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });

  if (!patient || !patient.chronicDiseases) return "لا يوجد تاريخ مرضي.";

  console.log("⚡ AI (Groq) is analyzing medical history...");
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `You are an expert Dental Consultant. Analyze this patient medical history: "${patient.chronicDiseases}". Provide a brief report in Arabic for the dentist including potential risks, anesthesia precautions (especially Adrenaline), and procedure advice. Keep it professional and very concise.`
      }],
      model: "llama-3.3-70b-versatile",
    });
    
    const report = chatCompletion.choices[0]?.message?.content || "";
    console.log("🩺 AI CLINICAL ADVISOR REPORT READY.");
    return report; // هذا التعديل يسمح بإرسال التقرير للواجهة لاحقاً
  } catch (error) {
    console.error("❌ AI Analysis Failed: " + error.message);
    return "خطأ في تحليل الذكاء الاصطناعي.";
  }
}


// =================================================================
// 🚀 نقطة الاتصال الجديدة (API Endpoint) بدلاً من الدورة التلقائية
// =================================================================
app.post('/api/run-cycle', async (req, res) => {
  // استقبال البيانات من واجهة المستخدم (إن وجدت)، أو استخدام قيم افتراضية للتجربة
  const patientName = req.body.patientName || "Patient-With-Risk";
  const medicalHistory = req.body.medicalHistory || "Heart Disease";
  const procedure = req.body.procedure || "Tooth Extraction (خلع ضرس)";
  const cost = req.body.cost || 1500;

  try {
    console.log("--------------------------------------");
    console.log(`🔄 API Called: Running Smart Cycle for ${patientName}...`);
    
    const { clinic, doctor } = await bootstrapSystem();
    
    // 1. تسجيل مريض مع حالة طبية
    const { patient, appointment } = await registerAndBook(patientName, clinic.id, medicalHistory);
    console.log("✅ Step 1: Medical Record Saved.");
    
    // 2. تشغيل الفحص الذكي قبل العلاج
    const aiReport = await checkMedicalRisks(patient.id);
    
    // 3. المعالجة والمخازن والماليات
    await processTreatment(patient.id, appointment.id, doctor.id, procedure, cost);

    if (procedure.includes("Extraction")) {
      await consumeItem("Anesthesia", 1, clinic.id);
    }

    const financialRecord = await generateTransaction(patient.id, cost, 300, doctor.id);
    
    console.log("✅ Step 2: Financial Transaction & Inventory Adjusted.");
    console.log("🏁 Result: API CYCLE COMPLETED!");
    console.log("--------------------------------------");

    // إرسال النتيجة النهائية كـ JSON للواجهة القادمة
    res.json({
      success: true,
      message: "تم حفظ بيانات المريض وتشغيل الدورة الذكية بنجاح",
      aiReport: aiReport,
      netAmount: financialRecord.amount
    });

  } catch (error) {
    console.error("❌ System Error: " + error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


// =================================================================
// 🌐 تشغيل السيرفر
// =================================================================
const PORT = 3000;
// جلب مواعيد اليوم
app.get('/api/appointments/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { patient: true },
      orderBy: { startTime: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "خطأ في جلب المواعيد" });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Aswan Clinic Server is running on http://localhost:${PORT}`);
  
  // تشغيل إعدادات المخازن الأساسية مرة واحدة عند بدء السيرفر
  const { clinic } = await bootstrapSystem();
  await setupInventory(clinic.id);
});