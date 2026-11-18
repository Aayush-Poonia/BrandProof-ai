import React, { useState } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw,
  Send,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { useAuth } from "../context/AuthContext";
import { auditContentWithAI } from "../services/groq";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    pages.push(strings.join(" "));
  }
  return pages.join("\n\n");
}

async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export default function ContentAuditorPage({ onAnalysisComplete }) {
  const { activeBrand, knowledgeBase } = useBrand();
  const { userProfile } = useAuth();

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("Social Media");
  const [content, setContent] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  // Sample quick test presets
  const sampleViolations = [
    {
      label: "Social Post (Contains Claims & Prohibited Buzzwords)",
      title: "Launch Announcement — ApexCloud 2.0",
      type: "Social Media",
      text: "We are thrilled to launch the world's most unbeatable and 100% bug-free multi cloud system! ApexCloud is dirt cheap compared to AWS and guarantees zero downtime forever. Our magic distributed cloud fabric eliminates all engineer latency overnight."
    },
    {
      label: "Enterprise Blog Draft (Factual Mismatches)",
      title: "Migrating to High-Velocity Cloud Architecture",
      type: "Blog Post",
      text: "At ApexCloud, we were founded way back in 2012 in New York. We support over 20 billion events an hour and our Tier-1 customer support provides a 2-minute instant SLA response on all plans."
    },
    {
      label: "Compliant Press Release (High Score Test)",
      title: "ApexCloud Achieves Continuous Compliance Milestone",
      type: "Press Release",
      text: "ApexCloud today announced enhancements to its Autonomous Cloud Fabric, providing deterministic reliability for global enterprise workloads. With certified SOC 2 Type II compliance and verified sub-millisecond state replication across multi-region infrastructure, organizations maintain full governance while accelerating software delivery."
    }
  ];

  const handleSelectSample = (sample) => {
    setTitle(sample.title);
    setContentType(sample.type);
    setContent(sample.text);
    setAuditError("");
    setUploadStatus("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtractingFile(true);
    setUploadStatus(`Extracting text from ${file.name}...`);
    setAuditError("");

    try {
      let extractedText = "";
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(file);
      } else if (fileName.endsWith(".docx")) {
        extractedText = await extractTextFromDOCX(file);
      } else {
        extractedText = await file.text();
      }

      if (extractedText && extractedText.trim().length > 0) {
        setContent(extractedText.trim());
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setUploadStatus(`Extracted ${extractedText.trim().split(/\s+/).length} words from ${file.name}`);
      } else {
        setAuditError("Could not extract readable text from this file.");
      }
    } catch (err) {
      console.error("Content auditor file extraction error:", err);
      setAuditError(`File extraction failed: ${err.message}`);
    } finally {
      setIsExtractingFile(false);
    }
  };

  const handleRunAudit = async () => {
    if (!content.trim()) {
      setAuditError("Please enter or paste content to audit.");
      return;
    }

    setAuditError("");
    setIsAuditing(true);

    try {
      const auditResult = await auditContentWithAI({
        title,
        contentType,
        content,
        brandProfile: activeBrand,
        knowledgeBaseItems: knowledgeBase
      });

      const submissionData = {
        title: title || "Untitled Content",
        contentType,
        originalContent: content,
        author: userProfile?.displayName || "Elena Vance",
        authorRole: userProfile?.role || "Creator",
        complianceScore: auditResult.complianceScore || 75,
        summary: auditResult.summary || "Content evaluated against brand guidelines.",
        issues: auditResult.issues || [],
        fullRewrittenVersion: auditResult.fullRewrittenVersion || content,
        status: (auditResult.complianceScore >= 90 && auditResult.issues?.length === 0) ? "Approved" : "Under Review",
        createdAt: new Date().toISOString(),
        brandId: activeBrand?.id,
        brandName: activeBrand?.name
      };

      if (onAnalysisComplete) {
        onAnalysisComplete(submissionData);
      }
    } catch (err) {
      console.error("Audit failure:", err);
      setAuditError(`Analysis failed: ${err.message || "Could not reach Groq AI API."}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>AI Content Auditor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit copy, press releases, social posts, and collateral against <strong className="text-slate-200">{activeBrand?.name}</strong> guidelines.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium">Load Preset:</span>
          <select
            onChange={(e) => {
              const idx = e.target.value;
              if (idx !== "") handleSelectSample(sampleViolations[idx]);
            }}
            defaultValue=""
            className="bg-[#141B2D] border border-slate-700 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-cyan-500"
          >
            <option value="" disabled>Choose test case...</option>
            {sampleViolations.map((sample, idx) => (
              <option key={idx} value={idx}>{sample.label}</option>
            ))}
          </select>
        </div>
      </div>

      {auditError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {uploadStatus && !auditError && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Input Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document / Content Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Launch Announcement Campaign Copy"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Content Format
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="Social Media">Social Media Post</option>
                  <option value="Advertisement">Ad Copy / PPC</option>
                  <option value="Blog Post">Blog / Long-form Article</option>
                  <option value="Email Newsletter">Marketing Email</option>
                  <option value="Website Copy">Landing Page Copy</option>
                  <option value="Press Release">Official Press Release</option>
                </select>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Content Body
                </label>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                  <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{content.length} characters</span>
                </div>
              </div>

              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your drafted text here, or load a test case from the preset dropdown above..."
                className="w-full bg-[#141B2D] border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Document Upload Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <label className={`cursor-pointer text-xs font-medium flex items-center space-x-2 transition-colors ${
                isExtractingFile ? "text-cyan-400 animate-pulse" : "text-slate-400 hover:text-cyan-400"
              }`}>
                <Upload className={`w-4 h-4 ${isExtractingFile ? "animate-spin" : ""}`} />
                <span>{isExtractingFile ? "Parsing PDF/DOCX..." : "Upload Document (.pdf, .docx, .txt)"}</span>
                <input 
                  type="file" 
                  accept=".txt,.docx,.pdf" 
                  onChange={handleFileUpload} 
                  disabled={isExtractingFile}
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing || isExtractingFile}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing with Groq AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Audit Content Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Active Brand Guardrails Context (1 Col) */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Active Brand Guardrails</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Brand Tone</span>
                <p className="text-slate-300 font-medium">{activeBrand?.tone}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prohibited Words ({activeBrand?.prohibitedWords?.length || 0})</span>
                <div className="flex flex-wrap gap-1">
                  {(activeBrand?.prohibitedWords || []).slice(0, 6).map((pw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {pw}
                    </span>
                  ))}
                  {(activeBrand?.prohibitedWords?.length || 0) > 6 && (
                    <span className="text-[10px] px-1 text-slate-400">+{activeBrand.prohibitedWords.length - 6} more</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Approved Terminology ({activeBrand?.approvedTerminology?.length || 0})</span>
                <div className="flex flex-wrap gap-1">
                  {(activeBrand?.approvedTerminology || []).slice(0, 4).map((term, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Verified Knowledge Facts</span>
                <p className="text-slate-300">{knowledgeBase?.length || 5} indexed factual claims</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Claims lacking knowledge-base citation are classified as <em>Unverified</em> rather than false.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
