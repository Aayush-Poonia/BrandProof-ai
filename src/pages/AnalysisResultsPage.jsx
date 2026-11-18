import React, { useState } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  Send, 
  FileText, 
  ThumbsUp,
  MessageSquare,
  Copy,
  CheckCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AnalysisResultsPage({ submission, onSendToReview, onEditCorrections }) {
  const { userProfile } = useAuth();
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [copied, setCopied] = useState(false);

  if (!submission) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">No Analysis Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Submit content in the AI Content Auditor to review findings.</p>
      </div>
    );
  }

  const {
    title,
    contentType,
    complianceScore = 85,
    summary,
    issues = [],
    fullRewrittenVersion,
    originalContent,
    status = "Under Review"
  } = submission;

  const filteredIssues = filterCategory === "ALL" 
    ? issues 
    : issues.filter(i => i.category === filterCategory);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "HIGH":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "LOW":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const handleCopyRewrite = () => {
    navigator.clipboard.writeText(fullRewrittenVersion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Compliance Score Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(complianceScore)}`}>
              <span className="text-2xl font-black">{complianceScore}%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Score</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {contentType}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  status === "Approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}>
                  {status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1.5">{title}</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{summary}</p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onEditCorrections(submission)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Smart Correction Assistant</span>
            </button>
            <button
              onClick={() => onSendToReview(submission)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center space-x-2"
            >
              <Send className="w-4 h-4 text-slate-400" />
              <span>Submit to Human Review Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 mr-2">Filter Findings:</span>
        {["ALL", "UNSUPPORTED_CLAIM", "TERMINOLOGY", "PROHIBITED_WORD", "TONE", "FACTUAL_MISMATCH", "ACCESSIBILITY"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`text-xs px-3 py-1 rounded-lg transition-all ${
              filterCategory === cat
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Issues List & AI Fact-Checked Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issue Cards with Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Detected Brand Governance Findings ({filteredIssues.length})
            </h3>
            <span className="text-[11px] text-slate-400">Strictly grounded against knowledge base</span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No violations in this category</p>
              <p className="text-xs text-slate-400 mt-1">The audited content perfectly adheres to all brand guidelines.</p>
            </div>
          ) : (
            filteredIssues.map((issue, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity} RISK
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {issue.category?.replace("_", " ")}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                    issue.verificationStatus === "Confirmed Violation" 
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/20" 
                      : issue.verificationStatus === "Unsupported Claim"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                  }`}>
                    {issue.verificationStatus || "Needs Review"}
                  </span>
                </div>

                {/* Problematic Excerpt */}
                <div className="bg-[#0B0F19] p-3 rounded-xl border border-rose-500/20">
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                    Problematic Excerpt:
                  </span>
                  <p className="text-xs font-mono text-rose-200">
                    "{issue.problematicText}"
                  </p>
                </div>

                {/* AI Rationale & Knowledge Source */}
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="leading-relaxed"><strong className="text-slate-100">Governance Rationale:</strong> {issue.explanation}</p>
                  {issue.relevantRuleOrFact && (
                    <p className="text-slate-400 text-[11px]">
                      <strong className="text-cyan-400">Cited Brand Ground Truth:</strong> {issue.relevantRuleOrFact}
                    </p>
                  )}
                </div>

                {/* Suggested Correction */}
                <div className="bg-[#141B2D] p-3 rounded-xl border border-cyan-500/20 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                      Recommended On-Brand Revision:
                    </span>
                    <p className="text-xs text-cyan-100 font-medium">
                      "{issue.suggestedCorrection}"
                    </p>
                  </div>
                  <span className="text-[10px] text-cyan-300 shrink-0 font-bold bg-cyan-500/10 px-2 py-1 rounded">
                    {issue.confidence || 95}% Match
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right 1 Col: Full Rewritten Content Preview */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Full Rewritten Version</span>
              </h3>
              <button
                onClick={handleCopyRewrite}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              The AI preserved the original intent while aligning tone, approved terms, and validated claims.
            </p>

            <div className="bg-[#0B0F19] rounded-xl p-4 border border-slate-800 max-h-96 overflow-y-auto">
              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {fullRewrittenVersion || originalContent}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
