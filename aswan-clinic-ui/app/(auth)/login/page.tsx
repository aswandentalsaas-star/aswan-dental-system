"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Lock, Mail, Loader2 } from "lucide-react";
import { loginAction } from "@/lib/actions/auth"; // سننشئه في الخطوة القادمة

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAction(email, password);
      if (result?.error) {
        setError(result.error);
      } else {
        // عند نجاح تسجيل الدخول، نتوجه فوراً للوحة التحكم
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md border-slate-100 shadow-xl rounded-2xl overflow-hidden bg-white">
        <CardHeader className="text-center bg-slate-900 text-white p-6 space-y-2">
          <div className="mx-auto bg-blue-500/10 text-blue-400 p-3 rounded-full w-fit">
            <Stethoscope size={32} className="text-blue-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">أسوان ديجيتال</CardTitle>
          <CardDescription className="text-slate-300 font-medium text-xs">
            بوابة تسجيل الدخول الآمنة لإدارة عيادات الأسنان الذكية
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block pr-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                <Input
                  type="email"
                  placeholder="doctor@aswan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pr-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl font-medium text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block pr-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl font-medium text-right"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحقق من الهوية...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}