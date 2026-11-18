import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  MessageSquare, 
  Clock, 
  Send, 
  User, 
  ShieldCheck, 
  AlertTriangle,
  History,
  FileText,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ReviewApprovalCenter({ 
  submissions = [], 
  onUpdateStatus, 
  onAddComment,
  onOpenCorrections
}) {
  const { userProfile } = useAuth();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const effectiveId = selectedSubmissionId || submissions[0]?.id;
  const currentSubmission = submissions.find(s => s.id === effectiveId) || submissions[0];

  const handleStatusChange = (status) => {
    if (!currentSubmission) return;
    onUpdateStatus(currentSubmission.id, status, userProfile?.displayName || "Brand Lead");
    setActionNotice(`Governance decision recorded: Status changed to "${status}"`);
    setTimeout(() => setActionNotice(""), 4000);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentSubmission) return;

    onAddComment(currentSubmission.id, {
      author: userProfile?.displayName || "Brand Reviewer",
      role: userProfile?.role || "Reviewer",
      text: newComment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setNewComment("");
    setActionNotice("Review comment recorded in audit trail.");
    setTimeout(() => setActionNotice(""), 3000);
  };

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>Review & Approval Governance Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Formal brand steward sign-off queue. Maintain audit trails and protect brand reputation before publishing.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Submissions Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Submitted Queue ({submissions.length})
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="glass-panel rounded-xl p-6 text-center border border-slate-800">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Queue is empty</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const isSelected = currentSubmission?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmissionId(sub.id)}
                  className={`glass-panel rounded-xl p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? "border-cyan-500/50 bg-[#162038]"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(sub.status)}`}>
                      {sub.status}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {sub.complianceScore}% Score
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{sub.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>By {sub.author || "Elena Vance"}</span>
                    <span>{sub.contentType}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Review Workspace & Audit Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentSubmission ? (
            <>
              {/* Submission Header & Approval Actions */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {currentSubmission.contentType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getStatusBadge(currentSubmission.status)}`}>
                        {currentSubmission.status}
                      </span>
                      {currentSubmission.revisionsCount > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Rev #{currentSubmission.revisionsCount}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1.5">{currentSubmission.title}</h2>
                    <p className="text-xs text-slate-400">
                      Author: <strong className="text-slate-200">{currentSubmission.author}</strong> ({currentSubmission.authorRole || "Creator"})
                    </p>
                  </div>

                  {/* Formal Decision Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusChange("Approved")}
                      className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("Changes Requested")}
                      className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Revisions</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange("Rejected")}
                      className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Content Body Viewer */}
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Content Draft</span>
                    {onOpenCorrections && (
                      <button
                        onClick={() => onOpenCorrections(currentSubmission)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Open in Smart Correction Editor</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentSubmission.originalContent}
                  </p>
                </div>
              </div>

              {/* Review Audit Comments & Feedback */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Governance Review Comments & Audit Thread
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(currentSubmission.comments && currentSubmission.comments.length > 0) ? (
                    currentSubmission.comments.map((comm, idx) => (
                      <div key={idx} className="bg-[#141B2D] p-3 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">
                            {comm.author} <span className="text-[10px] text-cyan-400 font-normal">({comm.role})</span>
                          </span>
                          <span className="text-[10px] text-slate-500">{comm.timestamp}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{comm.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No reviewer comments recorded yet.</p>
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handlePostComment} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave governance guidance or explain required edits..."
                    className="flex-1 bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-400">Select a content item from the queue to start review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
