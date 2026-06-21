import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isMockMode } from '../services/supabase';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: any }>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<{ error: any }>;
  logout: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details from DB
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // If not found in DB, let's create a default profile row
        // Usually, in a real Supabase app we do this with a trigger,
        // but adding a client-side fallback ensure total robustness!
        const autoRole: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'customer';
        const newProfile: UserProfile = {
          id: userId,
          email: email,
          role: autoRole,
          full_name: email.split('@')[0]
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .upsert(newProfile);

        if (!insertError) {
          setProfile(newProfile);
          setRole(autoRole);
        } else {
          console.error("Failed to insert default profile:", insertError);
          setProfile(newProfile); // fallback
          setRole(autoRole);
        }
      } else {
        setProfile(data);
        setRole(data.role || 'customer');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // fallback
      const defaultRole = email.toLowerCase().includes('admin') ? 'admin' : 'customer';
      setProfile({ id: userId, email, role: defaultRole, full_name: email.split('@')[0] });
      setRole(defaultRole as UserRole);
    }
  };

  useEffect(() => {
    let authListener: any = null;

    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          await fetchProfile(user.id, user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }

      // Live subscription to auth events
      const { data } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        setLoading(true);
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      });
      authListener = data.subscription;
    };

    initAuth();

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, assignedRole: UserRole = 'customer') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: assignedRole,
          },
        },
      });

      if (error) throw error;

      // In real mode, a record would be inserted globally or through an invite, 
      // but let's manually write to user profile row to be super safe.
      if (data?.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email,
          role: assignedRole,
          full_name: fullName,
        };

        // Attempt insert/upsert to backend 'profiles' table
        await supabase.from('profiles').upsert(newProfile);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setRole(null);
      return { error: null };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not logged in') };
    setLoading(true);
    try {
      const updatedProfile = { ...profile, ...updated } as UserProfile;
      
      // Update in Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updatedProfile });

      if (error) throw error;
      
      // Update locally
      setProfile(updatedProfile);
      if (updated.role) setRole(updated.role);
      
      // If mock mode, let's keep mock_profiles in sync
      if (isMockMode) {
        const savedProfiles = localStorage.getItem('mock_profiles');
        if (savedProfiles) {
          const list = JSON.parse(savedProfiles) as UserProfile[];
          const idx = list.findIndex(p => p.id === user.id);
          if (idx > -1) {
            list[idx] = { ...list[idx], ...updated };
            localStorage.setItem('mock_profiles', JSON.stringify(list));
          }
        }
        localStorage.setItem('mock_active_user', JSON.stringify(updatedProfile));
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Error updating profile in context:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
