import React from "react";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  BarChart3, 
  Palette, 
  Bot, 
  History, 
  Settings, 
  Building2,
  LogOut,
  ChevronRight,
  Sparkles,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { userProfile, logout, switchRole } = useAuth();
  const { brands, activeBrand, setActiveBrand } = useBrand();

  const navItems = [
    { id: "dashboard", label: "Executive Dashboard", icon: LayoutDashboard, badge: null },
    { id: "auditor", label: "AI Content Auditor", icon: ShieldCheck, badge: "Core" },
    { id: "corrections", label: "Smart Corrections", icon: Sparkles, badge: null },
    { id: "reviews", label: "Review & Approval", icon: CheckCircle2, badge: "Workflow" },
    { id: "knowledge", label: "Brand Knowledge Base", icon: BookOpen, badge: null },
    { id: "documents", label: "Guideline Documents", icon: FileText, badge: null },
    { id: "workspaces", label: "Brand Workspaces", icon: Building2, badge: null },
    { id: "analytics", label: "Brand Health Analytics", icon: BarChart3, badge: null },
    { id: "assets", label: "Visual Asset Checker", icon: Palette, badge: "Vision" },
    { id: "assistant", label: "AI Brand Assistant", icon: Bot, badge: "Chat" },
    { id: "history", label: "Audit & History", icon: History, badge: null },
    { id: "settings", label: "Settings & Rules", icon: Settings, badge: null },
  ];

  return (
    <aside className="w-72 bg-[#0E1322] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                BrandProof
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Governance</p>
          </div>
        </div>
      </div>

      {/* Brand Workspace Switcher */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5">
          Active Brand Governance Profile
        </label>
        <div className="relative">
          <select 
            value={activeBrand?.id || ""} 
            onChange={(e) => {
              const selected = brands.find(b => b.id === e.target.value);
              if (selected) setActiveBrand(selected);
            }}
            className="w-full bg-[#141B2D] border border-slate-700/80 rounded-lg py-2 px-3 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
          >
            {brands.map(b => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                {b.name} ({b.industry?.split(" ")[0] || "Corp"})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Governance Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  item.badge === "Core" 
                    ? "bg-cyan-500/20 text-cyan-300"
                    : item.badge === "Workflow"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0B0F19]/80">
        <div className="bg-[#141B2D] p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate w-32">
                  {userProfile?.displayName || "Verified User"}
                </p>
                <p className="text-[10px] text-cyan-400 font-medium truncate">
                  {userProfile?.role || "Brand Manager"}
                </p>
              </div>
            </div>
            <button 
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Role Toggle (For Testing Reviewer / Creator / Admin Workflow) */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Active Role:</span>
            <select
              value={userProfile?.role || "Brand Manager"}
              onChange={(e) => switchRole(e.target.value)}
              className="bg-slate-900 text-slate-300 text-[10px] py-1 px-1.5 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="Admin">Admin</option>
              <option value="Brand Manager">Brand Manager</option>
              <option value="Reviewer">Reviewer</option>
              <option value="Creator">Creator</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
