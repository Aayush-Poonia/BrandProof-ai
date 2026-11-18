import React from "react";
import { 
  History as HistoryIcon, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function HistoryPage({ submissions = [], onSelectSubmission }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Rejected":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "Changes Requested":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <HistoryIcon className="w-5 h-5 text-cyan-400" />
          <span>Audit Log & Governance History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete compliance trail of all evaluated documents, revision events, and reviewer decisions.
        </p>
      </div>

      {/* Submissions Table / List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            All Content Submissions ({submissions.length})
          </h3>
          <span className="text-[11px] text-slate-400">Chronological audit ledger</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {submissions.map((sub, idx) => (
            <div 
              key={sub.id || idx}
              onClick={() => onSelectSubmission(sub)}
              className="p-4 hover:bg-[#141B2D]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white hover:text-cyan-400 transition-colors">{sub.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      {sub.contentType}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                    <span>By {sub.author || "Elena Vance"}</span>
                    <span>•</span>
                    <span>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Today"}</span>
                    <span>•</span>
                    <span>{sub.issues?.length || 0} Issues Flagged</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-400 block font-mono">
                    {sub.complianceScore}% Score
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getStatusBadge(sub.status)}`}>
                    {sub.status}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
