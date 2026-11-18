import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  db,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "../firebase/config";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up
  const signup = async (email, password, displayName, role = "Brand Manager") => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split("@")[0],
      role: role,
      organizationId: "org-default-brandproof",
      workspaceId: "ws-primary",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, "users", user.uid), profile);
    } catch (e) {
      console.warn("Could not save profile doc in Firestore:", e);
    }
    setUserProfile(profile);
    return user;
  };

  // Login
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  // Real Firebase demo authentication for evaluators
  const demoLogin = async (role = "Brand Manager") => {
    const demoEmail = role === "Reviewer" ? "reviewer@acmecorp.com" : "brandlead@acmecorp.com";
    const demoPass = "BrandProof2026!";
    const demoDisplayName = role === "Reviewer" ? "David Chen (Lead Reviewer)" : "Elena Vance (Brand Lead)";

    let user;
    try {
      const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      user = cred.user;
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          user = cred.user;
        } catch (createErr) {
          throw createErr;
        }
      } else {
        throw err;
      }
    }

    // Persist real user profile into Firestore
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: demoDisplayName,
      role: role,
      organizationId: "org-default-brandproof",
      workspaceId: "ws-primary",
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    } catch (e) {
      console.warn("Error updating demo user profile in Firestore:", e);
    }

    setUserProfile(profile);
    return user;
  };

  // Logout
  const logout = async () => {
    setUserProfile(null);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Signout error:", e);
    }
  };

  // Switch role dynamically
  const switchRole = async (newRole) => {
    if (userProfile && currentUser) {
      const updated = { ...userProfile, role: newRole };
      setUserProfile(updated);
      try {
        await setDoc(doc(db, "users", currentUser.uid), { role: newRole }, { merge: true });
      } catch (e) {
        console.warn("Error updating user role in Firestore:", e);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const fallbackProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split("@")[0],
              role: "Brand Manager",
              organizationId: "org-default-brandproof",
              workspaceId: "ws-primary"
            };
            await setDoc(doc(db, "users", user.uid), fallbackProfile, { merge: true });
            setUserProfile(fallbackProfile);
          }
        } catch (e) {
          console.warn("Could not fetch user profile from Firestore, using memory state:", e);
          setUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.email ? user.email.split("@")[0] : "Elena Vance",
            role: "Brand Manager",
            organizationId: "org-default-brandproof",
            workspaceId: "ws-primary"
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    demoLogin,
    logout,
    switchRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
