import React, { useState } from "react";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  FileBadge
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

export default function KnowledgeBasePage() {
  const { activeBrand, knowledgeBase, addKnowledgeItem, deleteKnowledgeItem } = useBrand();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form state
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("fact");
  const [newCategory, setNewCategory] = useState("Official Fact");
  const [newSource, setNewSource] = useState("");

  const filteredItems = knowledgeBase.filter(item => {
    const matchesSearch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.text || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.verifiedSource || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    await addKnowledgeItem({
      title: newTitle || "Verified Ground Truth",
      text: newText,
      type: newType,
      category: newCategory,
      verifiedSource: newSource || "Internal Brand Compliance Review"
    });

    setNewTitle("");
    setNewText("");
    setNewSource("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Brand Knowledge Base & Ground Truth Grounding</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official facts, certified claims, and verified citations used by the AI to audit content without hallucinating.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Approved Fact / Claim</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified facts, SLA numbers, citations..."
            className="w-full bg-[#141B2D] border border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Type:</span>
          {["ALL", "fact", "claim", "prohibitedClaim"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCategory(type)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                selectedCategory === type
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {type === "ALL" ? "All" : type === "fact" ? "Approved Facts" : type === "claim" ? "Approved Claims" : "Prohibited Claims"}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Base Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, idx) => (
          <div key={item.id || idx} className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.type === "prohibitedClaim" 
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                }`}>
                  {item.type === "prohibitedClaim" ? "Prohibited Claim" : "Verified Brand Truth"}
                </span>

                <button
                  onClick={() => deleteKnowledgeItem(item.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">{item.text}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="truncate">Source: <strong className="text-cyan-400">{item.verifiedSource || "Official Governance Manual"}</strong></span>
              <FileBadge className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Knowledge Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Add Verified Fact to Knowledge Base</h3>
            
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fact Title / Concept</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SOC 2 Type II Certification & Audit Scope"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Classification Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="fact">Approved Fact (Verifiable statistics, certifications)</option>
                  <option value="claim">Approved Promotional Claim</option>
                  <option value="prohibitedClaim">Prohibited Claim (Strictly illegal or unsupported guarantee)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Exact Verified Statement</label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. ApexCloud maintains 99.995% SLA availability backed by continuous active-active multi-region replication."
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Verification Source</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. Master SLA Contract Sec 4.2 / SOC2 Report 2024"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
