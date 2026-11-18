import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ContentAuditorPage from "./pages/ContentAuditorPage";
import AnalysisResultsPage from "./pages/AnalysisResultsPage";
import SmartCorrectionEditor from "./pages/SmartCorrectionEditor";
import ReviewApprovalCenter from "./pages/ReviewApprovalCenter";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import DocumentManagerPage from "./pages/DocumentManagerPage";
import BrandWorkspacesPage from "./pages/BrandWorkspacesPage";
import VisualAssetCheckerPage from "./pages/VisualAssetCheckerPage";
import BrandAssistantPage from "./pages/BrandAssistantPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";

import { useAuth } from "./context/AuthContext";
import { useBrand } from "./context/BrandContext";
import { 
  db, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "./firebase/config";

const SEED_SUBMISSIONS = [
  {
    title: "Q3 Multi-Cloud Velocity Announcement",
    contentType: "Social Media",
    author: "Alex Morgan",
    authorRole: "Creator",
    originalContent: "ApexCloud is dirt cheap compared to AWS and guarantees 100% zero downtime forever with our unbeatable magic cloud fabric!",
    complianceScore: 68,
    status: "Changes Requested",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    summary: "Contains multiple prohibited buzzwords ('dirt cheap', 'magic', 'unbeatable') and an unsupported absolute zero-downtime claim.",
    fullRewrittenVersion: "ApexCloud delivers cost-effective enterprise cloud agility with a certified 99.995% SLA backed by multi-region failover across our Autonomous Cloud Fabric.",
    issues: [
      {
        id: "iss-1",
        category: "PROHIBITED_WORD",
        severity: "HIGH",
        problematicText: "dirt cheap",
        explanation: "'cheap' or 'dirt cheap' is strictly forbidden by ApexCloud brand guidelines.",
        relevantRuleOrFact: "Prohibited Words Rule #1",
        suggestedCorrection: "cost-effective",
        confidence: 99,
        needsHumanVerification: false,
        verificationStatus: "Confirmed Violation"
      },
      {
        id: "iss-2",
        category: "UNSUPPORTED_CLAIM",
        severity: "HIGH",
        problematicText: "guarantees 100% zero downtime forever",
        explanation: "Brand guidelines forbid claiming zero outages; must cite official SLA of 99.995%.",
        relevantRuleOrFact: "Writing Rule #3: Never guarantee zero outages; state '99.995% SLA backed by multi-region failover'.",
        suggestedCorrection: "provides 99.995% SLA availability backed by multi-region failover",
        confidence: 98,
        needsHumanVerification: true,
        verificationStatus: "Unsupported Claim"
      },
      {
        id: "iss-3",
        category: "TERMINOLOGY",
        severity: "MEDIUM",
        problematicText: "cloud fabric",
        explanation: "Brand requires approved trademarked terminology 'Autonomous Cloud Fabric'.",
        relevantRuleOrFact: "Approved Terminology Rule #1",
        suggestedCorrection: "Autonomous Cloud Fabric",
        confidence: 95,
        needsHumanVerification: false,
        verificationStatus: "Confirmed Violation"
      }
    ],
    comments: [
      {
        author: "Sarah Jenkins",
        role: "Brand Manager",
        text: "Please replace 'dirt cheap' and reference our verified 99.995% SLA before resubmitting.",
        timestamp: "10:30 AM"
      }
    ]
  },
  {
    title: "SOC 2 Type II Security Milestone Press Release",
    contentType: "Press Release",
    author: "Elena Vance",
    authorRole: "Brand Manager",
    originalContent: "ApexCloud today announced verified ISO/IEC 27001 and SOC 2 Type II compliance, reinforcing enterprise zero-trust cloud fabric security across distributed teams.",
    complianceScore: 97,
    status: "Approved",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    summary: "Exemplary compliance. Follows all brand voice conventions, uses certified terminology, and cites official audit facts.",
    fullRewrittenVersion: "ApexCloud today announced verified ISO/IEC 27001 and SOC 2 Type II compliance, reinforcing enterprise zero-trust cloud fabric security across distributed teams.",
    issues: [],
    comments: [
      {
        author: "David Chen",
        role: "Reviewer",
        text: "Approved for publication across PR Newswire.",
        timestamp: "Yesterday"
      }
    ]
  }
];

export default function App() {
  const { currentUser, loading } = useAuth();
  const { activeBrand } = useBrand();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Database-synced submissions
  const [submissions, setSubmissions] = useState([]);
  const [activeSubmission, setActiveSubmission] = useState(null);

  // Real-time Firestore sync for content submissions
  useEffect(() => {
    if (!currentUser) {
      setSubmissions([]);
      setActiveSubmission(null);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "contentSubmissions"), async (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (items.length > 0) {
        // Sort newest first
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setSubmissions(items);
        setActiveSubmission(prev => {
          if (!prev) return items[0];
          const found = items.find(i => i.id === prev.id);
          return found || items[0];
        });
      } else {
        // Seed default submissions to Firestore so database has live audit trails
        try {
          for (const seed of SEED_SUBMISSIONS) {
            await addDoc(collection(db, "contentSubmissions"), {
              ...seed,
              brandId: activeBrand?.id || "brand-default",
              createdAt: serverTimestamp(),
              createdBy: currentUser.uid
            });
          }
        } catch (e) {
          console.warn("Could not seed submissions to Firestore:", e);
          setSubmissions(SEED_SUBMISSIONS.map((s, idx) => ({ id: `sub-seed-${idx}`, ...s })));
          setActiveSubmission(SEED_SUBMISSIONS[0]);
        }
      }
    }, (err) => {
      console.warn("Firestore submissions listener error, falling back to local memory:", err);
      setSubmissions(SEED_SUBMISSIONS.map((s, idx) => ({ id: `sub-seed-${idx}`, ...s })));
      setActiveSubmission(SEED_SUBMISSIONS[0]);
    });

    return () => unsubscribe();
  }, [currentUser, activeBrand?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  // Workflows directly persisting to Firestore
  const handleAnalysisComplete = async (newSubmission) => {
    try {
      const docRef = await addDoc(collection(db, "contentSubmissions"), {
        ...newSubmission,
        brandId: activeBrand?.id || "default",
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      const created = { id: docRef.id, ...newSubmission };
      setActiveSubmission(created);
      setActiveTab("results");
    } catch (err) {
      console.error("Firestore submission write error:", err);
      const local = { id: `sub-${Date.now()}`, ...newSubmission };
      setSubmissions(prev => [local, ...prev]);
      setActiveSubmission(local);
      setActiveTab("results");
    }
  };

  const handleSendToReview = async (submission) => {
    try {
      if (submission.id && !submission.id.startsWith("sub-seed")) {
        await updateDoc(doc(db, "contentSubmissions", submission.id), {
          status: "Under Review",
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Update status error:", e);
    }
    setActiveTab("reviews");
  };

  const handleEditCorrections = (submission) => {
    setActiveSubmission(submission);
    setActiveTab("corrections");
  };

  const handleSaveUpdatedSubmission = async (updatedSubmission) => {
    try {
      if (updatedSubmission.id && !updatedSubmission.id.startsWith("sub-seed")) {
        await updateDoc(doc(db, "contentSubmissions", updatedSubmission.id), {
          originalContent: updatedSubmission.originalContent,
          status: updatedSubmission.status || "Draft",
          revisionsCount: (updatedSubmission.revisionsCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Save updated submission error:", e);
    }
    setActiveSubmission(updatedSubmission);
  };

  const handleUpdateStatus = async (submissionId, newStatus, reviewerName) => {
    const current = submissions.find(s => s.id === submissionId);
    const newComment = {
      author: reviewerName,
      role: "Reviewer",
      text: `Status officially updated to: ${newStatus}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedComments = [...(current?.comments || []), newComment];

    try {
      if (submissionId && !submissionId.startsWith("sub-seed")) {
        await updateDoc(doc(db, "contentSubmissions", submissionId), {
          status: newStatus,
          comments: updatedComments,
          updatedAt: serverTimestamp()
        });
      } else if (current) {
        // Promote local seed item to a real Firestore document
        const ref = await addDoc(collection(db, "contentSubmissions"), {
          ...current,
          status: newStatus,
          comments: updatedComments,
          brandId: activeBrand?.id || "brand-default",
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || "system"
        });
        submissionId = ref.id;
      }
    } catch (e) {
      console.warn("Update status error:", e);
    }

    setSubmissions(prev => prev.map(s => s.id === submissionId ? {
      ...s,
      status: newStatus,
      comments: updatedComments
    } : s));
  };

  const handleAddComment = async (submissionId, comment) => {
    const current = submissions.find(s => s.id === submissionId);
    const updatedComments = [...(current?.comments || []), comment];

    try {
      if (submissionId && !submissionId.startsWith("sub-seed")) {
        await updateDoc(doc(db, "contentSubmissions", submissionId), {
          comments: updatedComments,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Add comment error:", e);
    }

    setSubmissions(prev => prev.map(s => s.id === submissionId ? {
      ...s,
      comments: updatedComments
    } : s));
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <DashboardPage 
              setActiveTab={setActiveTab} 
              submissions={submissions} 
            />
          )}

          {activeTab === "auditor" && (
            <ContentAuditorPage 
              onAnalysisComplete={handleAnalysisComplete} 
            />
          )}

          {activeTab === "results" && (
            <AnalysisResultsPage 
              submission={activeSubmission} 
              onSendToReview={handleSendToReview}
              onEditCorrections={handleEditCorrections}
            />
          )}

          {activeTab === "corrections" && (
            <SmartCorrectionEditor 
              submission={activeSubmission}
              onSaveUpdatedSubmission={handleSaveUpdatedSubmission}
              onSendToReview={handleSendToReview}
            />
          )}

          {activeTab === "reviews" && (
            <ReviewApprovalCenter 
              submissions={submissions}
              onUpdateStatus={handleUpdateStatus}
              onAddComment={handleAddComment}
              onOpenCorrections={(sub) => {
                setActiveSubmission(sub);
                setActiveTab("corrections");
              }}
            />
          )}

          {activeTab === "knowledge" && (
            <KnowledgeBasePage />
          )}

          {activeTab === "documents" && (
            <DocumentManagerPage />
          )}

          {activeTab === "workspaces" && (
            <BrandWorkspacesPage />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPage submissions={submissions} />
          )}

          {activeTab === "assets" && (
            <VisualAssetCheckerPage />
          )}

          {activeTab === "assistant" && (
            <BrandAssistantPage />
          )}

          {activeTab === "history" && (
            <HistoryPage 
              submissions={submissions}
              onSelectSubmission={(sub) => {
                setActiveSubmission(sub);
                setActiveTab("results");
              }}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage />
          )}
        </div>
      </main>
    </div>
  );
}
