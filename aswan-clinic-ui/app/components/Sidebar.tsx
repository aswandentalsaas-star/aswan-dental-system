"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Package, 
  Stethoscope, 
  Microscope, 
  Wallet,
  Settings
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'لوحة التحكم', icon: LayoutDashboard, href: '/' },
    { name: 'المواعيد', icon: Calendar, href: '/appointments' },
    { name: 'المرضى', icon: Users, href: '/patients' },
    { name: 'المخزون', icon: Package, href: '/inventory' },
    { name: 'السجل الطبي', icon: Stethoscope, href: '/clinical' },
    { name: 'المختبر والأشعة', icon: Microscope, href: '/labs' },
    { name: 'المالية والديون', icon: Wallet, href: '/finance' },
  ];

  return (
    <div className="w-64 bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-black text-blue-600 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">A</div>
          أسوان ديجيتال
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 text-slate-500 font-bold w-full hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
          <Settings size={20} />
          <span>الإعدادات</span>
        </button>
      </div>
    </div>
  );
}