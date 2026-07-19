import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { UserProfile } from '@/src/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      const adminEmails = [
        'jemalfano030@gmail.com', 
        'jemalfan030@gmail.com',
        'jemalict2@gmail.com', 
        'jemalict@school.com', 
        'admint@bbschool.com', 
        'admin@bbschool.com',
        'jemalfano030@bbschool.com',
        'jemalict2@bbschool.com',
        'jemalict@gmail.com'
      ];
      const currentUserEmail = auth.currentUser?.email;
      const isAdminEmail = currentUserEmail && adminEmails.includes(currentUserEmail.toLowerCase());
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        let needsUpdate = false;
        
        // Ensure role sync
        if (isAdminEmail && data.role !== 'admin') {
          data.role = 'admin';
          needsUpdate = true;
        }
        
        // Ensure admin has a clean ADMIN identifier instead of raw UID slices
        if (isAdminEmail && data.sid !== 'ADMIN') {
          data.sid = 'ADMIN';
          needsUpdate = true;
        }

        // Ensure fullName is descriptive, professional, and never empty or "Anonymous User"
        if (isAdminEmail && (!data.fullName || data.fullName === 'Anonymous User' || data.fullName === 'Admin Control')) {
          data.fullName = 'System Admin (Biftu Beri)';
          needsUpdate = true;
        } else if (!data.fullName && !data.name) {
          data.fullName = 'Admin Control';
          needsUpdate = true;
        }

        if (data.email !== currentUserEmail) {
          data.email = currentUserEmail || '';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          const syncKey = `admin_sync_attempted_${uid}`;
          if (!sessionStorage.getItem(syncKey)) {
            setDoc(doc(db, 'users', uid), { 
              role: data.role || 'admin',
              fullName: data.fullName || 'System Admin (Biftu Beri)',
              sid: data.sid || 'ADMIN',
              email: currentUserEmail,
              uid: uid
            }, { merge: true })
              .then(() => {
                console.log("Admin profile synced successfully");
              })
              .catch(err => {
                console.warn("Soft-failed to sync admin profile:", err.message);
                sessionStorage.setItem(syncKey, 'true');
              });
          }
        }
        setProfile({ uid, ...data });
      } else {
        // New user - check if they should be admin
        if (isAdminEmail) {
           const adminData = {
             uid,
             role: 'admin' as const,
             fullName: 'System Admin (Biftu Beri)',
             email: currentUserEmail,
             sid: 'ADMIN',
             createdAt: serverTimestamp()
           };
           // Write directly to Firestore so user lists and monitors register the record instantly
           setDoc(doc(db, 'users', uid), adminData, { merge: true }).catch(err => {
             console.error("Failed to write initial admin profile draft:", err);
           });
           setProfile(adminData as any);
        } else {
           setProfile(null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
