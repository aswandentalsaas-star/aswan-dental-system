"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Plus, UserPlus, Search, Calendar, Loader2, User, X, AlertCircle, PhoneCall } from "lucide-react";
import { createPatient, searchPatients } from "@/lib/actions/patient";
import { createAppointment } from "@/lib/actions/appointment";

export function AddAppointmentModal() {
  const [open, setOpen] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState(false);

  const [patientData, setPatientData] = useState({
    name: "",
    phone: "",
    selection: "ذكر" as "ذكر" | "أنثى" | "طفل" | "حامل",
    birthDate: "",
    emergencyName: "",
    emergencyPhone: "",
    chronicDiseases: "",
    allergies: "",
  });

  useEffect(() => {
    if (!open) {
      setSelectedPatient(null);
      setIsAddingPatient(false);
      searchQuery && setSearchQuery("");
      searchResults.length && setSearchResults([]);
      setIsEmergency(false);
      setPatientData({
        name: "",
        phone: "",
        selection: "ذكر",
        birthDate: "",
        emergencyName: "",
        emergencyPhone: "",
        chronicDiseases: "",
        allergies: "",
      });
    }
  }, [open]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchPatients(searchQuery);
        if (results.success && results.patients) {
          setSearchResults(results.patients);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleQuickAddPatient = async () => {
    // حل مشكلة المصفوفة: تقسيم النصوص بالفاصلة وتطهير الفراغات لتطابق الـ Schema
    const formattedData = {
      ...patientData,
      gender: patientData.selection === "ذكر" ? "MALE" : "FEMALE",
      chronicDiseases: patientData.chronicDiseases ? patientData.chronicDiseases.split(/[،,]/).map(s => s.trim()).filter(Boolean) : [],
      allergies: patientData.allergies ? patientData.allergies.split(/[،,]/).map(s => s.trim()).filter(Boolean) : []
    };

    const res = await createPatient(formattedData as any);
    if (res.success) {
      setSelectedPatient(res.patient);
      setIsAddingPatient(false);
    } else {
      alert("حدث خطأ أثناء حفظ المريض: " + res.error);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedPatient || !selectedDate || !selectedTime) return;

    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

    // إدارة وقت الكشف ديناميكياً: 10 دقائق للطوارئ و 30 دقيقة للمواعيد العادية
    const calculatedDuration = isEmergency ? 10 : 30;

    const res = await createAppointment({
      patientId: selectedPatient.id,
      clinicId: "cmnvicnma00004n5lfzctorck",
      startTime: appointmentDateTime.toISOString(),
      duration: calculatedDuration,
      isEmergency: isEmergency,
      doctorName: "د. أيمن",
    });

    if (res.success) {
      setOpen(false); 
      setSelectedPatient(null);
      setSelectedDate("");
      setSelectedTime("");
      setSearchQuery("");
      setTimeout(() => {
        alert("تم حجز الموعد بنجاح! 🎉");
      }, 100);
    } else {
      alert("فشل الحجز: " + res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-xl">
          <Plus size={18} />
          موعد جديد
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            حجز موعد عيادة أسوان
          </DialogTitle>
          {/* التطهير النهائي لجذر المشكلة: إدراج وصف المودال المخفي لقارئات الشاشة */}
          <DialogDescription className="sr-only">
            نافذة حجز وإدارة مواعيد العيادة الرقمية
          </DialogDescription>
        </DialogHeader>

        {!selectedPatient && !isAddingPatient && (
          <div className="space-y-4 py-4">
            <div className="grid gap-2 relative">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-700">ابحث عن المريض (الاسم أو الهاتف)</Label>
                <Button variant="link" className="text-blue-600 text-xs gap-1 h-auto p-0 font-bold" onClick={() => setIsAddingPatient(true)}>
                  <UserPlus size={14} /> تسجيل مريض جديد
                </Button>
              </div>
              <div className="relative">
                {isSearching ? <Loader2 className="absolute right-3 top-3 text-blue-600 animate-spin" size={18} /> : <Search className="absolute right-3 top-3 text-slate-400" size={18} />}
                <Input placeholder="أدخل اسم المريض..." className="pr-10 text-right bg-slate-50 border-slate-200 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-[75px] w-full bg-white border border-slate-100 shadow-xl rounded-lg z-20">
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center" onClick={() => setSelectedPatient(patient)}>
                      <div>
                        <p className="font-bold text-slate-800">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isAddingPatient && (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
               <UserPlus className="text-blue-600" size={20} />
               <span className="font-bold text-blue-800 text-sm">إضافة مريض جديد للسجل الرقمي</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">الاسم الكامل</Label>
                <Input placeholder="اسم المريض" onChange={(e) => setPatientData({...patientData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">رقم الهاتف</Label>
                <Input placeholder="01xxxxxxxxx" onChange={(e) => setPatientData({...patientData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-blue-600 underline">تصنيف المريض (الحالة)</Label>
                <select 
                  className="w-full p-2 rounded-md border border-slate-200 bg-white text-sm font-bold"
                  value={patientData.selection}
                  onChange={(e) => setPatientData({...patientData, selection: e.target.value as any})}
                >
                  <option value="ذكر"> 👨  ذكر</option>
                  <option value="أنثى"> 👩  أنثى</option>
                  <option value="طفل"> 👶  طفل</option>
                  <option value="حامل"> 🤰  حامل</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">تاريخ الميلاد</Label>
                <Input type="date" onChange={(e) => setPatientData({...patientData, birthDate: e.target.value})} />
              </div>
            </div>
            <hr className="border-slate-100" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1"><PhoneCall size={14}/> هاتف الطوارئ</Label>
                <Input placeholder="رقم شخص مقرب" onChange={(e) => setPatientData({...patientData, emergencyPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">اسم شخص للطوارئ</Label>
                <Input placeholder="صلة القرابة / الاسم" onChange={(e) => setPatientData({...patientData, emergencyName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={14}/> الأمراض المزمنة والحساسية</Label>
              <div className="grid grid-cols-2 gap-2">
                <Textarea placeholder="أمراض مزمنة (سكر، ضغط..)" className="text-xs" onChange={(e) => setPatientData({...patientData, chronicDiseases: e.target.value})} />
                <Textarea placeholder="حساسية (بنج، أدوية..)" className="text-xs" onChange={(e) => setPatientData({...patientData, allergies: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleQuickAddPatient} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 font-bold">حفظ واختيار المريض</Button>
              <Button onClick={() => setIsAddingPatient(false)} variant="ghost" className="text-slate-400">إلغاء</Button>
            </div>
          </div>
        )}

        {selectedPatient && (
          <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white p-2 rounded-full"><User size={20} /></div>
                <div>
                  <p className="text-xs text-emerald-600 font-bold">المريض المختار:</p>
                  <p className="text-lg font-black text-emerald-900">{selectedPatient.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="hover:bg-rose-50 text-rose-500" onClick={() => setSelectedPatient(null)}><X size={20} /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">تاريخ الموعد</Label>
                <Input type="date" className="bg-slate-50 border-slate-200" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-slate-600">توقيت الحضور</Label>
                <Input type="time" className="bg-slate-50 border-slate-200" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
              </div>
            </div>
            <div onClick={() => setIsEmergency(!isEmergency)} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 transition-all duration-200 ${isEmergency ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <AlertCircle size={24} className={isEmergency ? "text-rose-600 animate-pulse" : "text-slate-400"} />
              <div className="flex-1">
                <p className="font-bold text-sm">تحديد كحالة طوارئ</p>
                <p className="text-xs opacity-80">سيتم جدولة الكشف تلقائياً لمدة 10 دقائق بلون تنبيهي</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEmergency ? 'border-rose-600 bg-rose-600' : 'border-slate-300'}`}>
                {isEmergency && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 text-lg rounded-xl shadow-lg shadow-blue-100" onClick={handleConfirmAppointment} disabled={!selectedDate || !selectedTime}>
              تأكيد حجز الموعد
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}