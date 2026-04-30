"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  Cpu, 
  Zap, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { StudioProvider } from "./StudioContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/studio" },
  { label: "Clean Data", icon: Database, href: "/studio/clean" },
  { label: "Train Model", icon: Cpu, href: "/studio/train" },
  { label: "Inference", icon: Zap, href: "/studio/inference" },
  { label: "Visualize", icon: BarChart3, href: "/studio/visualize" },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <StudioProvider>
      <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "relative border-r border-white/5 bg-[#0d0d0d] transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="AutoStack Logo" 
              className="w-8 h-8 object-contain" 
            />
            {!collapsed && <span className="font-black italic tracking-tight text-lg">AutoStack</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 h-11 rounded-xl transition-all group relative",
                  active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", active ? "text-white" : "group-hover:text-white")} />
                {!collapsed && <span className="text-sm font-bold">{item.label}</span>}
                {active && !collapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button className="flex items-center gap-3 px-3 w-full h-11 rounded-xl text-zinc-500 hover:bg-white/[0.03] hover:text-white transition-all group">
            <Settings className="w-5 h-5 group-hover:text-white" />
            {!collapsed && <span className="text-sm font-bold">Settings</span>}
          </button>
          <Link href="/" className="flex items-center gap-3 px-3 w-full h-11 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-bold">Sign Out</span>}
          </Link>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center hover:bg-zinc-700 transition-colors shadow-xl"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Global Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">ML Studio</span>
            <span className="text-zinc-800">/</span>
            <span className="text-xs font-bold text-zinc-400">
              {NAV_ITEMS.find(i => i.href === pathname)?.label || "Dashboard"}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">System Ready</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold">
               VJ
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
    </StudioProvider>
  );
}
