import React, { useMemo } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight,
  ExternalLink,
  Target
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { useBrand } from "../context/BrandContext";

export default function DashboardPage({ setActiveTab, submissions = [] }) {
  const { activeBrand } = useBrand();

  // Dynamic calculations from Firestore submissions
  const totalAudited = submissions.length;
  const approvedCount = submissions.filter(s => s.status === "Approved").length;
  const pendingCount = submissions.filter(s => s.status === "Under Review" || s.status === "Draft").length;
  const changesRequested = submissions.filter(s => s.status === "Changes Requested" || s.status === "Rejected").length;
  
  const avgCompliance = submissions.length > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.complianceScore || 0), 0) / submissions.length)
    : 100;

  // Dynamic Category Distribution computed from actual issues
  const categoryDistribution = useMemo(() => {
    const categoryTotals = {
      "Unsupported Claims": { count: 0, color: "#F43F5E" },
      "Terminology Violation": { count: 0, color: "#FB923C" },
      "Tone & Voice": { count: 0, color: "#38BDF8" },
      "Prohibited Words": { count: 0, color: "#E11D48" },
      "Outdated Facts": { count: 0, color: "#A855F7" },
      "Accessibility": { count: 0, color: "#34D399" }
    };

    let totalIssues = 0;
    submissions.forEach(sub => {
      (sub.issues || []).forEach(issue => {
        totalIssues++;
        const cat = issue.category;
        if (cat === "UNSUPPORTED_CLAIM") categoryTotals["Unsupported Claims"].count++;
        else if (cat === "TERMINOLOGY") categoryTotals["Terminology Violation"].count++;
        else if (cat === "TONE") categoryTotals["Tone & Voice"].count++;
        else if (cat === "PROHIBITED_WORD") categoryTotals["Prohibited Words"].count++;
        else if (cat === "FACTUAL_MISMATCH") categoryTotals["Outdated Facts"].count++;
        else if (cat === "ACCESSIBILITY") categoryTotals["Accessibility"].count++;
        else categoryTotals["Unsupported Claims"].count++;
      });
    });

    if (totalIssues === 0) {
      return [
        { name: "Compliant Claims", value: 100, color: "#10B981" }
      ];
    }

    return Object.entries(categoryTotals)
      .filter(([_, item]) => item.count > 0)
      .map(([name, item]) => ({
        name,
        value: Math.round((item.count / totalIssues) * 100),
        color: item.color
      }));
  }, [submissions]);

  // Dynamic Audit Velocity Trend
  const trendData = useMemo(() => {
    if (submissions.length === 0) {
      return [
        { date: "Day 1", compliance: 90 },
        { date: "Day 2", compliance: 95 }
      ];
    }
    const sorted = [...submissions].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    return sorted.map((s, idx) => ({
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString([], { month: "numeric", day: "numeric" }) : `Audit ${idx + 1}`,
      compliance: s.complianceScore || 85,
      title: s.title || `Audit ${idx + 1}`
    }));
  }, [submissions]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121A30] via-[#10192E] to-[#0D1424] border border-cyan-500/20 p-6 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ACTIVE WORKSPACE
              </span>
              <span className="text-slate-400 text-xs font-medium">Enterprise Governance Engine v2.4</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {activeBrand?.name || "ApexCloud Enterprise"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {activeBrand?.tagline || "Real-time AI brand guardrails detecting tone, terminology, prohibited claims, and unverified facts."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab("auditor")}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Audit New Content</span>
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center space-x-2"
            >
              <span>Knowledge Base</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Average */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Compliance Score</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{avgCompliance}%</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              Target: 85%+
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${avgCompliance}%` }}
            ></div>
          </div>
        </div>

        {/* Total Content Audited */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Audited Items</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{totalAudited}</span>
            <span className="text-xs text-slate-400">In database</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Across campaigns & collateral</p>
        </div>

        {/* Pending Human Reviews */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Under Review</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
            <span className="text-xs text-slate-400">Awaiting sign-off</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Human governance queue</p>
        </div>

        {/* Approved Content */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Approved for Publishing</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">{approvedCount}</span>
            <span className="text-xs text-slate-400">{totalAudited > 0 ? `${Math.round((approvedCount / totalAudited) * 100)}% approved` : "Ready"}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Verified brand certified</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Brand Compliance Health Trend</h2>
              <p className="text-[11px] text-slate-400">Live compliance velocity from audited content</p>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20 font-medium">
              Live Audits
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0E1322", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  itemStyle={{ color: "#38BDF8" }}
                />
                <Area type="monotone" dataKey="compliance" name="Compliance %" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompliance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations Category Breakdown */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Issue Distribution</h2>
            <p className="text-[11px] text-slate-400 mb-4">Most frequent brand risk triggers</p>
            
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0E1322", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {categoryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-400">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Rules & Terminology Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approved Terminology Watchlist */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Mandatory Brand Terminology</span>
            </h3>
            <span className="text-[10px] text-cyan-400">Enforced by AI</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeBrand?.approvedTerminology || ["Autonomous Cloud Fabric", "Brand Governance Engine", "Deterministic Reliability"]).map((term, i) => (
              <span key={i} className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-medium">
                ✓ {term}
              </span>
            ))}
          </div>
        </div>

        {/* Prohibited Words Watchlist */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Prohibited Words & Claims</span>
            </h3>
            <span className="text-[10px] text-rose-400">Zero Tolerance</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeBrand?.prohibitedWords || ["cheap", "magic", "100% bug-free", "world-beater"]).map((term, i) => (
              <span key={i} className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium">
                ✕ {term}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
