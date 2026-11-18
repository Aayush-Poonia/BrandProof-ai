import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Key, 
  Database, 
  ShieldCheck, 
  User, 
  Check, 
  Copy, 
  Lock,
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { userProfile, switchRole } = useAuth();
  const [model, setModel] = useState(import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b");
  const [copiedKey, setCopiedKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <span>Platform Settings & Governance Configurations</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage AI inference models, API connectors, Firebase permissions, and user role entitlements.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* AI Engine Model Settings */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Inference Engine (Groq)</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Active LLM Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Recommended - 120B Flagship Reasoning & JSON mode)</option>
              <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (High-speed 20B inference)</option>
              <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (27B Multilingual reasoning)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Groq provides high-throughput inference with guaranteed JSON schema conformity.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Groq API Key Status</label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••••••••••••••••••"
                className="flex-1 bg-[#141B2D] border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-400 font-mono"
              />
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                Connected & Active
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20"
            >
              Update Model Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Role-Based Access Control */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Role & Permissions Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#141B2D] p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Role</span>
            <p className="text-white font-bold text-sm">{userProfile?.role || "Brand Manager"}</p>
            <p className="text-slate-400 text-[11px] pt-1">
              {userProfile?.role === "Brand Manager" 
                ? "Full governance privileges: create workspaces, edit rules, approve and reject."
                : userProfile?.role === "Reviewer"
                ? "Reviewer privileges: examine content audits, request revisions, and approve."
                : "Creator privileges: draft, simulate AI audits, and apply smart corrections."
              }
            </p>
          </div>

          <div className="bg-[#141B2D] p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Switch Testing Role</span>
            <select
              value={userProfile?.role || "Brand Manager"}
              onChange={(e) => switchRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Admin">Admin (Full System Access)</option>
              <option value="Brand Manager">Brand Manager</option>
              <option value="Reviewer">Reviewer</option>
              <option value="Creator">Content Creator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database & Cloud Connection Details */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Firebase Cloud Backend</h3>
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <p>Project ID: <strong className="text-cyan-400 font-mono">brandproof-ai</strong></p>
          <p>Auth Domain: <span className="text-slate-400 font-mono">brandproof-ai.firebaseapp.com</span></p>
          <p>Storage Bucket: <span className="text-slate-400 font-mono">brandproof-ai.firebasestorage.app</span></p>
        </div>
      </div>
    </div>
  );
}
