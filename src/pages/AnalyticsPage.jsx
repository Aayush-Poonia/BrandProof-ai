import React, { useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileCheck,
  AlertOctagon,
  ShieldCheck,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useBrand } from "../context/BrandContext";

export default function AnalyticsPage({ submissions = [] }) {
  const { activeBrand } = useBrand();

  // Compute live analytics from Firestore submissions
  const stats = useMemo(() => {
    const total = submissions.length;
    if (total === 0) {
      return {
        totalAudits: 0,
        avgCompliance: 0,
        unverifiedClaims: 0,
        approvedCount: 0,
        approvalRate: "0%",
        totalIssues: 0,
        categoryBreakdown: [],
        typeBreakdown: [],
        timelineTrend: []
      };
    }

    const totalScore = submissions.reduce((sum, s) => sum + (s.complianceScore || 0), 0);
    const avgCompliance = Math.round(totalScore / total);

    let unverifiedClaims = 0;
    let totalIssues = 0;
    const categoryCounts = {};
    const typeViolationCounts = {};

    submissions.forEach(sub => {
      const type = sub.contentType || "General";
      if (!typeViolationCounts[type]) {
        typeViolationCounts[type] = { type, unsupportedClaims: 0, toneMismatch: 0, terminology: 0, prohibitedWords: 0 };
      }

      (sub.issues || []).forEach(issue => {
        totalIssues++;
        const cat = issue.category || "OTHER";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        if (
          cat === "UNSUPPORTED_CLAIM" || 
          issue.verificationStatus === "Unsupported Claim" || 
          issue.verificationStatus === "Unverified"
        ) {
          unverifiedClaims++;
          typeViolationCounts[type].unsupportedClaims++;
        } else if (cat === "TONE") {
          typeViolationCounts[type].toneMismatch++;
        } else if (cat === "TERMINOLOGY") {
          typeViolationCounts[type].terminology++;
        } else if (cat === "PROHIBITED_WORD") {
          typeViolationCounts[type].prohibitedWords++;
        }
      });
    });

    const approvedCount = submissions.filter(s => s.status === "Approved").length;
    const approvalRate = `${Math.round((approvedCount / total) * 100)}%`;

    // Category breakdown data
    const categoryBreakdown = Object.entries(categoryCounts).map(([cat, count]) => ({
      name: cat.replace(/_/g, " "),
      count
    }));

    // Type breakdown data
    const typeBreakdown = Object.values(typeViolationCounts);

    // Timeline trend from submissions (chronological)
    const sortedSubs = [...submissions].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const timelineTrend = sortedSubs.map((sub, i) => {
      const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : `Audit #${i + 1}`;
      return {
        item: sub.title ? (sub.title.length > 15 ? sub.title.substring(0, 15) + "..." : sub.title) : dateStr,
        actual: sub.complianceScore || 80,
        benchmark: 85,
        issues: sub.issues?.length || 0
      };
    });

    return {
      totalAudits: total,
      avgCompliance,
      unverifiedClaims,
      approvedCount,
      approvalRate,
      totalIssues,
      categoryBreakdown,
      typeBreakdown,
      timelineTrend
    };
  }, [submissions]);

  const COLORS = ["#06B6D4", "#6366F1", "#F43F5E", "#FB923C", "#A855F7", "#34D399"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span>Brand Health & Governance Analytics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Dynamic audit metrics, live risk distribution, and compliance velocity for <strong className="text-slate-200">{activeBrand?.name}</strong>.
        </p>
      </div>

      {/* KPI Highlights from Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400">Total Audits Indexed</span>
          <p className="text-2xl font-black text-white mt-2">{stats.totalAudits}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Live in Firestore</span>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400">Claims Flagged Unverified</span>
          <p className="text-2xl font-black text-amber-400 mt-2">{stats.unverifiedClaims}</p>
          <span className="text-[11px] text-slate-400">Prevented brand liability</span>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400">Average Compliance Score</span>
          <p className="text-2xl font-black text-cyan-400 mt-2">{stats.avgCompliance}%</p>
          <span className="text-[11px] text-cyan-300">Across all content types</span>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400">Publication Approval Rate</span>
          <p className="text-2xl font-black text-emerald-400 mt-2">{stats.approvalRate}</p>
          <span className="text-[11px] text-slate-400">{stats.approvedCount} approved submissions</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Timeline Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Velocity (Live Audits)</h3>
              <p className="text-[11px] text-slate-400">Audit compliance score vs 85% governance benchmark</p>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {stats.timelineTrend.length} Items Indexed
            </span>
          </div>

          <div className="h-64 w-full">
            {stats.timelineTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timelineTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="item" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#0E1322", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="actual" name="Audit Score" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="benchmark" name="Target (85%)" stroke="#64748B" strokeDasharray="5 5" strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No submissions audited yet. Audit content to view trend chart.
              </div>
            )}
          </div>
        </div>

        {/* Violations by Content Type */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Brand Violations by Content Format</h3>
              <p className="text-[11px] text-slate-400">Categorical breakdown across social media, blogs, press releases</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats.typeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="type" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0E1322", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="unsupportedClaims" name="Unsupported Claims" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prohibitedWords" name="Prohibited Words" fill="#FB923C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terminology" name="Terminology" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="toneMismatch" name="Tone Mismatch" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No violation data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Detected Issue Distribution Summary ({stats.totalIssues} Total Issues)
        </h3>
        {stats.categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.categoryBreakdown.map((cat, i) => (
              <div key={i} className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{cat.name}</span>
                <span className="text-lg font-black text-cyan-400 mt-1 block">{cat.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">All content is currently compliant with zero recorded issues.</p>
        )}
      </div>
    </div>
  );
}
