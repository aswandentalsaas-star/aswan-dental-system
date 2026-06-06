import type { Metadata } from 'next';
// استخدمنا خط Cairo لدعم اللغة العربية بشكل احترافي
import { Cairo, Inter } from 'next/font/google'; 
import './globals.css';

// تأكد أن اسم ملف القائمة الجانبية هو Sidebar.tsx وموجود داخل components
import { Sidebar } from './components/Sidebar';
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'Aswan Dental System',
  description: 'نظام الإدارة الذكي لعيادات أسوان',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cn("font-sans", inter.variable)}>
      <body className={`${cairo.className} bg-slate-50 text-slate-900`}>
        
        {/* 🛠️ الحاوية الرئيسية: أضفنا print:h-auto و print:overflow-visible لمنع الطابعة من قص الصفحات الطويلة */}
        <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
          
          {/* 1. القائمة الجانبية الثابتة على اليمين - قمنا بتغليفها هنا لكي تختفي تماماً فور ضغط زر الطباعة 🖨️ */}
          <div className="print:hidden">
            <Sidebar />
          </div>
          
          {/* 2. المحتوى المتغير (الداشبورد أو المواعيد) على اليسار - أضفنا له print:overflow-visible */}
          <main className="flex-1 overflow-y-auto print:overflow-visible">
            {children}
          </main>
          
        </div>

      </body>
    </html>
  );
}