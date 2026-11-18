import React, { useState, useCallback } from "react";
import { 
  Sparkles, 
  Check, 
  X, 
  ArrowLeftRight, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Send,
  FileEdit,
  RefreshCw,
  AlertTriangle,
  Zap
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { auditContentWithAI } from "../services/groq";

export default function SmartCorrectionEditor({ submission, onSaveUpdatedSubmission, onSendToReview }) {
  if (!submission) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <FileEdit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white">No Content Loaded for Correction</h3>
        <p className="text-xs text-slate-400 mt-1">Please audit content first.</p>
      </div>
    );
  }

  const { activeBrand, approvedFacts } = useBrand();

  const [currentText, setCurrentText] = useState(submission.originalContent || "");
  const [decisions, setDecisions] = useState({}); // { [issueId]: "accepted" | "rejected" }
  const [savedNotification, setSavedNotification] = useState("");
  const [isReauditing, setIsReauditing] = useState(false);

  // Live issues — start with submission issues, updated after re-audit
  const [liveIssues, setLiveIssues] = useState(submission.issues || []);
  const [liveComplianceScore, setLiveComplianceScore] = useState(submission.complianceScore || null);
  const [liveFullRewrite, setLiveFullRewrite] = useState(submission.fullRewrittenVersion || "");
  const [liveSummary, setLiveSummary] = useState(submission.summary || "");
  const [auditCount, setAuditCount] = useState(0);

  const handleApplySingleSuggestion = (issue) => {
    if (!issue.problematicText || !issue.suggestedCorrection) return;
    
    // Replace first occurrence of problematic text
    if (currentText.includes(issue.problematicText)) {
      const updated = currentText.replace(issue.problematicText, issue.suggestedCorrection);
      setCurrentText(updated);
      setDecisions(prev => ({ ...prev, [issue.id || issue.problematicText]: "accepted" }));
    }
  };

  const handleRejectSuggestion = (issue) => {
    setDecisions(prev => ({ ...prev, [issue.id || issue.problematicText]: "rejected" }));
  };

  const handleApplyAllSuggestions = () => {
    // Apply each suggestion sequentially instead of using fullRewrittenVersion
    let updatedText = currentText;
    const allAccepted = {};
    
    liveIssues.forEach(issue => {
      if (issue.problematicText && issue.suggestedCorrection && updatedText.includes(issue.problematicText)) {
        updatedText = updatedText.replace(issue.problematicText, issue.suggestedCorrection);
        allAccepted[issue.id || issue.problematicText] = "accepted";
      }
    });

    if (Object.keys(allAccepted).length > 0) {
      setCurrentText(updatedText);
      setDecisions(prev => ({ ...prev, ...allAccepted }));
      setSavedNotification(`Applied ${Object.keys(allAccepted).length} correction(s) to your document.`);
      setTimeout(() => setSavedNotification(""), 3000);
    } else if (liveFullRewrite && liveFullRewrite !== currentText) {
      // Fallback: use the AI full-rewrite if individual replacements don't match
      setCurrentText(liveFullRewrite);
      liveIssues.forEach(i => {
        allAccepted[i.id || i.problematicText] = "accepted";
      });
      setDecisions(allAccepted);
      setSavedNotification("Applied AI full-rewrite version.");
      setTimeout(() => setSavedNotification(""), 3000);
    }
  };

  const handleReset = () => {
    setCurrentText(submission.originalContent || "");
    setDecisions({});
    setLiveIssues(submission.issues || []);
    setLiveComplianceScore(submission.complianceScore || null);
    setLiveFullRewrite(submission.fullRewrittenVersion || "");
    setLiveSummary(submission.summary || "");
    setAuditCount(0);
  };

  /**
   * Re-audit the current working text with AI
   */
  const handleReaudit = useCallback(async () => {
    if (!currentText.trim()) {
      setSavedNotification("Cannot audit empty content.");
      setTimeout(() => setSavedNotification(""), 3000);
      return;
    }

    setIsReauditing(true);
    setSavedNotification("");

    try {
      const knowledgeBase = (approvedFacts || []).map(f => ({
        type: f.type || "fact",
        text: f.text || f.title || "",
        title: f.title || ""
      }));

      const result = await auditContentWithAI({
        title: submission.title || "Re-audit",
        contentType: submission.contentType || "General",
        content: currentText,
        brandProfile: activeBrand,
        knowledgeBaseItems: knowledgeBase
      });

      setLiveIssues(result.issues || []);
      setLiveComplianceScore(result.complianceScore);
      setLiveFullRewrite(result.fullRewrittenVersion || "");
      setLiveSummary(result.summary || "");
      setDecisions({}); // Reset decisions for new issues
      setAuditCount(prev => prev + 1);

      if ((result.issues || []).length === 0) {
        setSavedNotification("🎉 Perfect compliance! No issues found.");
      } else {
        setSavedNotification(`Re-audit complete: ${result.issues.length} issue(s) found. Score: ${result.complianceScore}%`);
      }
      setTimeout(() => setSavedNotification(""), 5000);
    } catch (err) {
      console.error("Re-audit error:", err);
      setSavedNotification("Re-audit failed: " + err.message);
      setTimeout(() => setSavedNotification(""), 5000);
    } finally {
      setIsReauditing(false);
    }
  }, [currentText, activeBrand, approvedFacts, submission]);

  const handleSaveDraft = () => {
    const updated = {
      ...submission,
      originalContent: currentText,
      status: "Draft",
      issues: liveIssues,
      complianceScore: liveComplianceScore || submission.complianceScore,
      fullRewrittenVersion: liveFullRewrite,
      summary: liveSummary,
      revisionsCount: (submission.revisionsCount || 0) + 1
    };
    onSaveUpdatedSubmission(updated);
    setSavedNotification("Revision saved as Draft successfully!");
    setTimeout(() => setSavedNotification(""), 3000);
  };

  const handleReadyForReview = () => {
    const updated = {
      ...submission,
      originalContent: currentText,
      status: "Under Review",
      issues: liveIssues,
      complianceScore: liveComplianceScore || submission.complianceScore,
      fullRewrittenVersion: liveFullRewrite,
      summary: liveSummary,
      revisionsCount: (submission.revisionsCount || 0) + 1
    };
    onSendToReview(updated);
  };

  const hasChanges = currentText !== (submission.originalContent || "");
  const acceptedCount = Object.values(decisions).filter(d => d === "accepted").length;
  const rejectedCount = Object.values(decisions).filter(d => d === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Smart Correction Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accept, reject, or fine-tune AI recommendations. Click "Re-Audit" after editing to get fresh AI analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Re-Audit Button — prominent */}
          <button
            onClick={handleReaudit}
            disabled={isReauditing}
            className="py-2 px-3 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            {isReauditing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Re-Auditing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Re-Audit Current Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleApplyAllSuggestions}
            disabled={liveIssues.length === 0}
            className="py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accept All Suggestions</span>
          </button>
          <button
            onClick={handleReset}
            className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Status bar */}
      {(savedNotification || liveComplianceScore !== null) && (
        <div className="flex items-center gap-3 flex-wrap">
          {savedNotification && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 flex-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{savedNotification}</span>
            </div>
          )}
          {liveComplianceScore !== null && (
            <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border ${
              liveComplianceScore >= 85 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : liveComplianceScore >= 60 ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <span>Compliance: {liveComplianceScore}%</span>
              {auditCount > 0 && <span className="text-[10px] opacity-70">(re-audit #{auditCount})</span>}
            </div>
          )}
          {hasChanges && (
            <span className="text-[10px] text-amber-400 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Content modified — re-audit recommended</span>
            </span>
          )}
        </div>
      )}

      {/* Editor & Side-by-side Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Working Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Working Document
              </span>
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentText.split(/\s+/).filter(Boolean).length} words
                </span>
                {acceptedCount > 0 && (
                  <span className="text-[10px] text-emerald-400">✓ {acceptedCount} applied</span>
                )}
                {rejectedCount > 0 && (
                  <span className="text-[10px] text-slate-500">✕ {rejectedCount} dismissed</span>
                )}
              </div>
            </div>

            <textarea
              rows={16}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              className="w-full bg-[#141B2D] border border-slate-700/80 rounded-xl p-4 text-xs font-sans text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={handleSaveDraft}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Save Working Draft</span>
              </button>

              <button
                onClick={handleReadyForReview}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Final to Reviewers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Suggestion Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Issue Cards ({liveIssues.length})
            </span>
            <span className="text-[11px] text-slate-400">Click to apply or dismiss</span>
          </div>

          {isReauditing && (
            <div className="glass-panel rounded-xl p-6 border border-cyan-500/30 text-center">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-cyan-300 font-semibold">AI is re-analyzing your content...</p>
              <p className="text-[10px] text-slate-500 mt-1">Checking tone, terminology, claims, and grammar</p>
            </div>
          )}

          {!isReauditing && liveIssues.length === 0 && (
            <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-emerald-300 font-semibold">No issues detected!</p>
              <p className="text-[10px] text-slate-500 mt-1">Your content appears to be brand-compliant.</p>
            </div>
          )}

          {!isReauditing && liveIssues.map((issue, idx) => {
            const key = issue.id || issue.problematicText;
            const decision = decisions[key];

            return (
              <div 
                key={idx} 
                className={`glass-panel rounded-xl p-4 border transition-all ${
                  decision === "accepted" 
                    ? "border-emerald-500/40 bg-emerald-500/5" 
                    : decision === "rejected"
                    ? "border-slate-800 opacity-50"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {issue.category?.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      issue.severity === "HIGH" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : issue.severity === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-700/50 text-slate-400 border border-slate-600"
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  
                  {decision && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      decision === "accepted" ? "text-emerald-400" : "text-slate-500"
                    }`}>
                      {decision}
                    </span>
                  )}
                </div>

                {/* Original problematic phrase */}
                <div className="text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 mb-2 font-mono">
                  <del>{issue.problematicText}</del>
                </div>

                {/* Suggested replacement */}
                {issue.suggestedCorrection && (
                  <div className="text-xs text-cyan-200 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 mb-3 font-medium">
                    → {issue.suggestedCorrection}
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                  {issue.explanation}
                </p>

                {issue.relevantRuleOrFact && (
                  <p className="text-[10px] text-violet-400/70 mb-2 italic">
                    Rule: {issue.relevantRuleOrFact}
                  </p>
                )}

                {/* Accept / Reject controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApplySingleSuggestion(issue)}
                    disabled={decision === "accepted"}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(issue)}
                    disabled={decision === "rejected"}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
