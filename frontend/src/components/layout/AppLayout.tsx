import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Recipes', href: '/', icon: BookOpen },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-stone-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-white border-r border-stone-200
        transform transition-transform lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-extrabold text-lg tracking-tight">Savorra</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 text-sm">
          {navItems.map((item) => {
            const active = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
                  active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-stone-600 hover:bg-stone-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">N</div>
          <div className="text-sm leading-tight">
            <div className="font-semibold">Nora Bennett</div>
            <div className="text-stone-400 text-xs">Family plan</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-stone-50/90 backdrop-blur border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-lg">Savorra</span>
        </div>
        <div className="flex-1">{children}</div>
        <footer className="px-8 py-5 border-t border-stone-200 text-xs text-stone-400 flex justify-between">
          <span>© 2024 Savorra. Eat well, plan better.</span>
          <span></span>
        </footer>
      </main>
    </div>
  );
}