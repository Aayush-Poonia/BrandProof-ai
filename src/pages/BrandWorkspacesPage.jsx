import React, { useState } from "react";
import { 
  Building2, 
  Plus, 
  Edit3, 
  Check, 
  Trash2, 
  Sliders, 
  ShieldCheck, 
  Target, 
  Globe 
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

export default function BrandWorkspacesPage() {
  const { brands, activeBrand, setActiveBrand, createBrand, updateBrand } = useBrand();

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [approvedTermsInput, setApprovedTermsInput] = useState("");
  const [prohibitedWordsInput, setProhibitedWordsInput] = useState("");

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName("");
    setTagline("");
    setIndustry("Enterprise Technology & Software");
    setTone("Authoritative, clear, innovative, trustworthy");
    setTargetAudience("Enterprise decision makers and technical architects");
    setApprovedTermsInput("");
    setProhibitedWordsInput("");
    setShowModal(true);
  };

  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);
    setName(brand.name || "");
    setTagline(brand.tagline || "");
    setIndustry(brand.industry || "");
    setTone(brand.tone || "");
    setTargetAudience(brand.targetAudience || "");
    setApprovedTermsInput((brand.approvedTerminology || []).join(", "));
    setProhibitedWordsInput((brand.prohibitedWords || []).join(", "));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const approvedTerminology = approvedTermsInput.split(",").map(s => s.trim()).filter(Boolean);
    const prohibitedWords = prohibitedWordsInput.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      name,
      tagline,
      industry,
      tone,
      targetAudience,
      approvedTerminology,
      prohibitedWords
    };

    if (editingBrand) {
      await updateBrand(editingBrand.id, payload);
    } else {
      await createBrand(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>Brand Workspaces & Profiles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage distinct brand identities, sub-brands, and corporate style guides across your organization.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Brand Profile</span>
        </button>
      </div>

      {/* Grid of Brands */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map((brand) => {
          const isActive = activeBrand?.id === brand.id;
          return (
            <div
              key={brand.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isActive ? "border-cyan-500/50 bg-[#121A30]" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan-400">{brand.industry || "General Industry"}</span>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-white mb-1">{brand.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{brand.tagline}</p>

                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Tone</span>
                    <p className="truncate text-slate-300">{brand.tone}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Approved Terms: <strong className="text-white">{brand.approvedTerminology?.length || 0}</strong></span>
                    <span>Prohibited Words: <strong className="text-rose-400">{brand.prohibitedWords?.length || 0}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-800">
                {!isActive ? (
                  <button
                    onClick={() => setActiveBrand(brand)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    Set as Active
                  </button>
                ) : (
                  <div className="flex-1 text-center py-1.5 text-xs font-semibold text-cyan-400">
                    Currently Selected
                  </div>
                )}

                <button
                  onClick={() => handleOpenEdit(brand)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Edit profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">
              {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Create New Brand Profile"}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ApexCloud Solutions"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Create freely. Publish confidently."
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Fintech, Enterprise SaaS, Healthcare"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Tone of Voice</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. Authoritative, approachable, precise, vision-led"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Approved Terminology (comma separated)
                </label>
                <input
                  type="text"
                  value={approvedTermsInput}
                  onChange={(e) => setApprovedTermsInput(e.target.value)}
                  placeholder="Autonomous Cloud Fabric, Brand Governance Engine, Deterministic Reliability"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prohibited Words & Buzzwords (comma separated)
                </label>
                <input
                  type="text"
                  value={prohibitedWordsInput}
                  onChange={(e) => setProhibitedWordsInput(e.target.value)}
                  placeholder="cheap, magic, unbeatable, 100% bug-free, guaranteed"
                  className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold"
                >
                  {editingBrand ? "Save Changes" : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
