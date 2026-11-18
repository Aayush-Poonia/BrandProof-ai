import React, { useState } from "react";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  ArrowRight,
  Download,
  FileWarning
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { extractGuidelinesFromDoc } from "../services/groq";
import mammoth from "mammoth";

// PDF.js — use the pre-built worker from CDN
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF file using pdfjs-dist
 */
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

/**
 * Extract text from a DOCX file using mammoth
 */
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export default function DocumentManagerPage({ onExtractedRulesToBrand }) {
  const { activeBrand, updateBrand } = useBrand();

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("info"); // "info" | "error" | "success"

  const sampleDocPresets = [
    {
      title: "ApexCloud Brand Voice & Editorial Guidelines v3.4",
      text: `ApexCloud Enterprise Brand Guidelines 2024
Tone of Voice:
Our brand voice is authoritative, forward-looking, precise, humble yet visionary. We never use hyperbole, ungrounded clickbait, or derogatory comparisons.

Approved Terminology:
- Autonomous Cloud Fabric
- Sub-millisecond State Replication
- Brand Governance Engine
- Deterministic Reliability
- Continuous Compliance Guardrails

Prohibited Words & Claims:
Do not use: cheap, magic, hack, unbeatable, 100% bug-free, disruptive miracle, world-beater, guaranteed overnight riches.
Never claim zero downtime without explicitly phrasing it as '99.995% SLA backed by multi-region failover'.

Core Verified Facts:
- ApexCloud is certified ISO/IEC 27001, SOC 2 Type II, and HIPAA compliant.
- Supports active-active multi-region deployment across AWS, Azure, and Google Cloud.
- Processes over 4.8 billion telemetry events daily.
- Headquartered in San Francisco, CA; founded in 2021.`
    }
  ];

  const setStatus = (message, type = "info") => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setStatus("File is too large. Maximum size is 10 MB.", "error");
      return;
    }

    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsUploading(true);
    setStatus(`Extracting text from ${file.name}...`, "info");

    try {
      let text = "";
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        text = await extractTextFromPDF(file);
      } else if (fileName.endsWith(".docx")) {
        text = await extractTextFromDOCX(file);
      } else if (fileName.endsWith(".txt") || file.type === "text/plain") {
        text = await file.text();
      } else {
        // Attempt plain text read as last resort
        text = await file.text();
      }

      if (!text || text.trim().length < 10) {
        setStatus("Could not extract meaningful text from this file. The file may be image-based or empty.", "error");
        setDocumentText("");
      } else {
        setDocumentText(text.trim());
        setStatus(`Successfully extracted ${text.trim().split(/\s+/).length} words from ${file.name}`, "success");
      }
    } catch (err) {
      console.error("File extraction error:", err);
      setStatus(`Failed to extract text: ${err.message}`, "error");
      setDocumentText("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunExtraction = async () => {
    if (!documentText.trim()) {
      setStatus("Please paste or upload document content first.", "error");
      return;
    }

    setIsExtracting(true);
    setStatus("AI is parsing brand rules from document text...", "info");

    try {
      const extracted = await extractGuidelinesFromDoc({
        documentTitle: documentTitle || "Brand Guidelines Document",
        documentText
      });

      setExtractionResult(extracted);
      setStatus("Structured brand rules extracted successfully!", "success");
    } catch (err) {
      console.error(err);
      setStatus("Extraction failed: " + err.message, "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSyncToBrandProfile = async () => {
    if (!extractionResult || !activeBrand) return;

    try {
      const updatedData = {
        ...activeBrand,
        approvedTerminology: Array.from(new Set([...(activeBrand.approvedTerminology || []), ...(extractionResult.approvedTerminology || [])])),
        prohibitedWords: Array.from(new Set([...(activeBrand.prohibitedWords || []), ...(extractionResult.prohibitedWords || [])])),
        writingRules: Array.from(new Set([...(activeBrand.writingRules || []), ...(extractionResult.writingRules || [])])),
        approvedFacts: Array.from(new Set([...(activeBrand.approvedFacts || []), ...(extractionResult.approvedFacts || [])]))
      };

      if (extractionResult.tone && !activeBrand.tone) {
        updatedData.tone = extractionResult.tone;
      }

      await updateBrand(activeBrand.id, updatedData);
      setStatus("Active Brand Profile synced with extracted rules!", "success");
    } catch (err) {
      console.error(err);
      setStatus("Failed to sync to brand profile: " + err.message, "error");
    }
  };

  const statusColors = {
    info: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    error: "bg-rose-500/10 border-rose-500/20 text-rose-300"
  };

  const StatusIcon = statusType === "error" ? FileWarning : statusType === "success" ? CheckCircle2 : RefreshCw;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <span>Guideline Document Manager & AI Rule Ingestion</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload brand guideline PDFs, Word DOCXs, or manuals. The AI parses and converts unstructured policy text into structured, queryable rule engines.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${statusColors[statusType]}`}>
          <StatusIcon className={`w-4 h-4 ${statusType === "info" ? "animate-spin" : ""}`} />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Document Input Area */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Document Input
            </h3>
            <button
              onClick={() => {
                setDocumentTitle(sampleDocPresets[0].title);
                setDocumentText(sampleDocPresets[0].text);
                setStatus("Sample document loaded.", "success");
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              Load Sample Manual
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title</label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. ApexCloud Global Brand Playbook 2025.pdf"
              className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Content / Extracted Raw Text</label>
            <textarea
              rows={12}
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste raw guidelines or upload PDF/DOCX below..."
              className="w-full bg-[#141B2D] border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {documentText && (
              <p className="text-[10px] text-slate-500 mt-1">
                {documentText.trim().split(/\s+/).length} words • {documentText.length} characters
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <label className={`cursor-pointer text-xs font-medium flex items-center space-x-2 ${isUploading ? "text-cyan-400 animate-pulse" : "text-slate-400 hover:text-cyan-400"}`}>
              <Upload className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
              <span>{isUploading ? "Extracting..." : "Upload PDF / DOCX / TXT"}</span>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={isUploading}
              />
            </label>

            <button
              onClick={handleRunExtraction}
              disabled={isExtracting || isUploading}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-2 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing Rules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Structured Rules</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured Output & Ingestion Area */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Extracted Brand Rules
            </h3>
            {extractionResult && (
              <button
                onClick={handleSyncToBrandProfile}
                className="py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sync to Active Brand</span>
              </button>
            )}
          </div>

          {extractionResult ? (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 text-xs">
              {extractionResult.tone && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Tone & Voice</span>
                  <p className="text-slate-200">{extractionResult.tone}</p>
                </div>
              )}

              {extractionResult.approvedTerminology && extractionResult.approvedTerminology.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">
                    Approved Terminology ({extractionResult.approvedTerminology.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {extractionResult.approvedTerminology.map((t, idx) => (
                      <span key={idx} className="bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20 text-[11px]">
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractionResult.prohibitedWords && extractionResult.prohibitedWords.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                    Prohibited Words ({extractionResult.prohibitedWords.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {extractionResult.prohibitedWords.map((pw, idx) => (
                      <span key={idx} className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
                        ✕ {pw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractionResult.writingRules && extractionResult.writingRules.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-violet-400 block mb-1">
                    Writing Rules ({extractionResult.writingRules.length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    {extractionResult.writingRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {extractionResult.brandMessaging && extractionResult.brandMessaging.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">
                    Brand Messaging ({extractionResult.brandMessaging.length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    {extractionResult.brandMessaging.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {extractionResult.approvedFacts && extractionResult.approvedFacts.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                    Certified Facts ({extractionResult.approvedFacts.length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    {extractionResult.approvedFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {extractionResult.prohibitedClaims && extractionResult.prohibitedClaims.length > 0 && (
                <div className="bg-[#141B2D] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                    Prohibited Claims ({extractionResult.prohibitedClaims.length})
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                    {extractionResult.prohibitedClaims.map((claim, idx) => (
                      <li key={idx}>{claim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Upload a brand guideline file or paste text and click "Extract Structured Rules" to see parsed brand parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
