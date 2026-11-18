import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  onSnapshot
} from "../firebase/config";
import { useAuth } from "./AuthContext";

const BrandContext = createContext({});

export const useBrand = () => useContext(BrandContext);

const SEED_BRAND = {
  name: "ApexCloud Enterprise",
  tagline: "Unify Intelligence. Scale Without Limits.",
  industry: "Enterprise AI & Cloud Infrastructure",
  description: "Next-generation distributed computing architecture for high-velocity software engineering teams.",
  tone: "Authoritative, forward-looking, precise, humble yet visionary. Never hyperbolic or spammy.",
  targetAudience: "Chief Information Officers, VP of Engineering, Solutions Architects, Tech Leads",
  approvedTerminology: [
    "Autonomous Cloud Fabric",
    "Sub-millisecond State Replication",
    "Brand Governance Engine",
    "Deterministic Reliability",
    "Continuous Compliance Guardrails",
    "Unified Control Plane"
  ],
  prohibitedWords: [
    "cheap",
    "dirt cheap",
    "magic",
    "hack",
    "unbeatable",
    "100% bug-free",
    "disruptive miracle",
    "world-beater",
    "guaranteed overnight riches",
    "flawless"
  ],
  brandMessaging: [
    "ApexCloud turns multi-cloud complexity into predictable engineering velocity.",
    "Engineered with strict zero-trust boundaries and verified audit trails.",
    "Empowering enterprises to ship resilient software faster."
  ],
  writingRules: [
    "Always spell 'ApexCloud' as one word with camel caps.",
    "Do not capitalize 'cloud fabric' unless referring directly to the Autonomous Cloud Fabric trademark.",
    "Never guarantee zero outages; state '99.995% SLA backed by multi-region failover'.",
    "State concrete benchmark numbers rather than using vague buzzwords like 'fastest' or 'best'."
  ],
  approvedFacts: [
    "ApexCloud is certified ISO/IEC 27001, SOC 2 Type II, and HIPAA compliant.",
    "Supports active-active multi-region deployment across AWS, Azure, and Google Cloud.",
    "Processes over 4.8 billion telemetry events daily with 99.995% historical uptime.",
    "Founded in 2021 with headquarters in San Francisco, CA.",
    "Customer support provides guaranteed 15-minute response time for Tier-1 Enterprise plans."
  ],
  brandColors: {
    primary: "#0EA5E9",
    secondary: "#6366F1",
    accent: "#10B981",
    dark: "#0B0F19"
  },
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
};

export const BrandProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time synchronization for brand profiles from Firestore
  useEffect(() => {
    if (!currentUser) {
      setBrands([]);
      setActiveBrand(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "brandProfiles"), async (snapshot) => {
      const brandList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (brandList.length > 0) {
        setBrands(brandList);
        setActiveBrand(prev => {
          if (!prev) return brandList[0];
          const matched = brandList.find(b => b.id === prev.id);
          return matched || brandList[0];
        });
      } else {
        // Automatically write seed brand to Firestore if empty collection
        try {
          const docRef = await addDoc(collection(db, "brandProfiles"), {
            ...SEED_BRAND,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: currentUser?.uid || "system"
          });
          const created = { id: docRef.id, ...SEED_BRAND };
          setBrands([created]);
          setActiveBrand(created);

          // Seed starter approved facts into Firestore
          for (const fact of SEED_BRAND.approvedFacts) {
            await addDoc(collection(db, "approvedFacts"), {
              brandId: docRef.id,
              title: "Certified Architecture & SLA",
              text: fact,
              category: "Compliance & SLA",
              type: "fact",
              verifiedSource: "SOC 2 Type II Audit Report & Official SLA Policy",
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.warn("Could not seed brand in Firestore, using memory state:", err);
          const local = { id: "brand-seed-1", ...SEED_BRAND };
          setBrands([local]);
          setActiveBrand(local);
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore brandProfiles listener error:", error);
      const local = { id: "brand-seed-1", ...SEED_BRAND };
      setBrands([local]);
      setActiveBrand(local);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time synchronization for Knowledge Base items
  useEffect(() => {
    if (!currentUser || !activeBrand?.id) {
      setKnowledgeBase([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "approvedFacts"), (snapshot) => {
      const items = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => !item.brandId || item.brandId === activeBrand.id);

      if (items.length > 0) {
        setKnowledgeBase(items);
      } else {
        // Fallback default KB items
        const defaultKB = (activeBrand.approvedFacts || SEED_BRAND.approvedFacts).map((f, i) => ({
          id: `kb-seed-${i}`,
          brandId: activeBrand.id,
          title: `Verified Brand Truth #${i + 1}`,
          text: f,
          category: "Official Fact",
          type: "fact",
          verifiedSource: "Brand Standards Manual v3.2"
        }));
        setKnowledgeBase(defaultKB);
      }
    }, (err) => {
      console.warn("Firestore approvedFacts listener error:", err);
    });

    return () => unsubscribe();
  }, [currentUser, activeBrand?.id]);

  // Create brand in Firestore
  const createBrand = async (brandData) => {
    try {
      const docRef = await addDoc(collection(db, "brandProfiles"), {
        ...brandData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || "anon"
      });
      const newBrand = { id: docRef.id, ...brandData };
      setActiveBrand(newBrand);
      return newBrand;
    } catch (e) {
      console.error("Firestore createBrand error:", e);
      const localBrand = { id: `brand-${Date.now()}`, ...brandData };
      setBrands(prev => [...prev, localBrand]);
      setActiveBrand(localBrand);
      return localBrand;
    }
  };

  // Update brand in Firestore
  const updateBrand = async (brandId, brandData) => {
    try {
      await updateDoc(doc(db, "brandProfiles", brandId), {
        ...brandData,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firestore updateBrand error:", e);
      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ...brandData } : b));
      if (activeBrand?.id === brandId) {
        setActiveBrand(prev => ({ ...prev, ...brandData }));
      }
    }
  };

  // Delete brand
  const deleteBrand = async (brandId) => {
    try {
      await deleteDoc(doc(db, "brandProfiles", brandId));
    } catch (e) {
      console.warn("Delete brand error:", e);
      setBrands(prev => prev.filter(b => b.id !== brandId));
    }
  };

  // Add knowledge base item directly to Firestore
  const addKnowledgeItem = async (item) => {
    try {
      const docRef = await addDoc(collection(db, "approvedFacts"), {
        ...item,
        brandId: activeBrand?.id || "default",
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || "user"
      });
      return { id: docRef.id, ...item, brandId: activeBrand?.id };
    } catch (e) {
      console.error("Firestore addKnowledgeItem error:", e);
      const local = { id: `kb-${Date.now()}`, ...item, brandId: activeBrand?.id };
      setKnowledgeBase(prev => [local, ...prev]);
      return local;
    }
  };

  // Delete knowledge base item directly from Firestore
  const deleteKnowledgeItem = async (id) => {
    try {
      await deleteDoc(doc(db, "approvedFacts", id));
    } catch (e) {
      console.warn("Firestore deleteKnowledgeItem error:", e);
      setKnowledgeBase(prev => prev.filter(k => k.id !== id));
    }
  };

  return (
    <BrandContext.Provider value={{
      brands,
      activeBrand,
      setActiveBrand,
      knowledgeBase,
      loading,
      createBrand,
      updateBrand,
      deleteBrand,
      addKnowledgeItem,
      deleteKnowledgeItem
    }}>
      {children}
    </BrandContext.Provider>
  );
};
