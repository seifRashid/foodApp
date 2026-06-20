import { createClient } from '@supabase/supabase-js';
import { FoodItem, Order, UserProfile } from '../types';

// Read values from env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we are in mock mode
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

// Real supabase instance (can be null if missing key)
let realSupabase: any = null;
if (!isMockMode) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Ensure mock tables have initial seeded food items in LocalStorage
const DEFAULT_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Gourmet Cheese Burger',
    price: 12.99,
    description: 'Juicy Angus beef patty with cheddar cheese, crisp lettuce, fresh tomato, and house special burger sauce on a toasted brioche bun.',
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    is_available: true
  },
  {
    id: 'f2',
    name: 'Double Pepperoni Pizza',
    price: 15.99,
    description: 'Freshly baked hand-tossed dough topped with rustic marinara, premium double pepperoni slices, mozzarella, and dynamic Italian herbs.',
    category: 'Pizza',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600',
    is_available: true
  },
  {
    id: 'f3',
    name: 'Golden Crispy Fries',
    price: 4.99,
    description: 'Premium potatoes cut into classic thin fries, fried to perfect crispy light bronze, finished with a dash of fine sea salt.',
    category: 'Sides',
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
    is_available: true
  },
  {
    id: 'f4',
    name: 'Strawberry Milkshake',
    price: 5.49,
    description: 'Smooth, creamy vanilla milk combined with organic sweet strawberries, blended to cold perfection, topped with delicious whipped cream.',
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600',
    is_available: true
  },
  {
    id: 'f5',
    name: 'Crispy Caesar Salad',
    price: 9.99,
    description: 'Fresh crisp romaine lettuce leaves, baked garlic croutons, shredded parmesan cheese served with classic creamy Caesar dressing.',
    category: 'Salads',
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600',
    is_available: true
  },
  {
    id: 'f6',
    name: 'Warm Fudge Brownie',
    price: 6.49,
    description: 'Rich, soft, and chocolatey fudge brownie baked fresh, served warm, garnished with premium dark chocolate swirls.',
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600',
    is_available: true
  }
];

// LocalStorage helpers for mock mode
const initMockDB = () => {
  if (!localStorage.getItem('mock_foods')) {
    localStorage.setItem('mock_foods', JSON.stringify(DEFAULT_FOOD_ITEMS));
  }
  if (!localStorage.getItem('mock_orders')) {
    localStorage.setItem('mock_orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('mock_profiles')) {
    // We can pre-register two users for demo purposes: an internal admin and a regular user
    const defaultProfiles: UserProfile[] = [
      { id: 'usr-admin', email: 'admin@demo.com', role: 'admin', full_name: 'System Admin' },
      { id: 'usr-customer', email: 'user@demo.com', role: 'user', full_name: 'John Customer' }
    ];
    localStorage.setItem('mock_profiles', JSON.stringify(defaultProfiles));
  }
};

if (isMockMode) {
  initMockDB();
}

// Implement mock client interface
const mockSupabaseClient = {
  auth: {
    getUser: async () => {
      const activeUserStr = localStorage.getItem('mock_active_user');
      if (!activeUserStr) return { data: { user: null }, error: null };
      const profile: UserProfile = JSON.parse(activeUserStr);
      return {
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { full_name: profile.full_name }
          }
        },
        error: null
      };
    },
    signUp: async ({ email, password, options }: any) => {
      initMockDB();
      const profiles: UserProfile[] = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        return { data: null, error: { message: 'User already exists with this email address.' } };
      }
      
      const newId = 'usr-' + Math.random().toString(36).substr(2, 9);
      const fullName = options?.data?.full_name || email.split('@')[0];
      // Automatically assign role:
      // If email has 'admin' in it, make it admin, otherwise user
      const role: 'admin' | 'user' = email.toLowerCase().includes('admin') ? 'admin' : 'user';

      const newProfile: UserProfile = {
        id: newId,
        email,
        role,
        full_name: fullName
      };

      profiles.push(newProfile);
      localStorage.setItem('mock_profiles', JSON.stringify(profiles));
      
      // Auto log in newly registered user
      localStorage.setItem('mock_active_user', JSON.stringify(newProfile));

      return {
        data: {
          user: {
            id: newProfile.id,
            email: newProfile.email,
            user_metadata: { full_name: newProfile.full_name }
          }
        },
        error: null
      };
    },
    signInWithPassword: async ({ email, password }: any) => {
      initMockDB();
      const profiles: UserProfile[] = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
      const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      if (!found) {
        // If it is our pre-registered user, automatically add them
        if (email === 'admin@demo.com' || email === 'user@demo.com') {
          const defaultProfiles: UserProfile[] = [
            { id: 'usr-admin', email: 'admin@demo.com', role: 'admin', full_name: 'System Admin' },
            { id: 'usr-customer', email: 'user@demo.com', role: 'user', full_name: 'John Customer' }
          ];
          const prof = defaultProfiles.find(p => p.email === email)!;
          localStorage.setItem('mock_active_user', JSON.stringify(prof));
          return {
            data: {
              user: {
                id: prof.id,
                email: prof.email,
                user_metadata: { full_name: prof.full_name }
              }
            },
            error: null
          };
        }
        return { data: null, error: { message: 'Invalid credentials. User does not exist, try creating a new account.' } };
      }

      localStorage.setItem('mock_active_user', JSON.stringify(found));
      return {
        data: {
          user: {
            id: found.id,
            email: found.email,
            user_metadata: { full_name: found.full_name }
          }
        },
        error: null
      };
    },
    signOut: async () => {
      localStorage.removeItem('mock_active_user');
      return { error: null };
    }
  },

  // Database simulator
  from: (table: string) => {
    initMockDB();
    const getStoreKey = () => `mock_${table}`;

    return {
      select: (columns = '*') => {
        const storeKey = getStoreKey();
        let data = JSON.parse(localStorage.getItem(storeKey) || '[]');
        
        // Return standard result promise builder
        const builder = {
          order: (col: string, { ascending = true } = {}) => {
            data.sort((a: any, b: any) => {
              const valA = a[col];
              const valB = b[col];
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
            return builder;
          },
          eq: (col: string, val: any) => {
            data = data.filter((item: any) => item[col] === val);
            return builder;
          },
          single: () => {
            return { data: data[0] || null, error: data.length === 0 ? { message: 'Not found' } : null };
          },
          then: (callback: any) => {
            // Sort foods by updated/ordering optionally
            return Promise.resolve(callback({ data, error: null }));
          }
        };
        return builder;
      },

      insert: (records: any) => {
        const storeKey = getStoreKey();
        const data = JSON.parse(localStorage.getItem(storeKey) || '[]');
        const toInsert = Array.isArray(records) ? records : [records];
        
        const processed = toInsert.map(record => ({
          id: record.id || Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...record
        }));

        data.push(...processed);
        localStorage.setItem(storeKey, JSON.stringify(data));

        return {
          then: (callback: any) => {
            return Promise.resolve(callback({ data: processed, error: null }));
          }
        };
      },

      update: (record: any) => {
        return {
          eq: (col: string, val: any) => {
            const storeKey = getStoreKey();
            const data = JSON.parse(localStorage.getItem(storeKey) || '[]');
            
            let updatedRecords: any[] = [];
            const result = data.map((item: any) => {
              if (item[col] === val) {
                const updated = { ...item, ...record };
                updatedRecords.push(updated);
                return updated;
              }
              return item;
            });

            localStorage.setItem(storeKey, JSON.stringify(result));
            return {
              then: (callback: any) => {
                return Promise.resolve(callback({ data: updatedRecords, error: null }));
              }
            };
          }
        };
      },

      delete: () => {
        return {
          eq: (col: string, val: any) => {
            const storeKey = getStoreKey();
            const data = JSON.parse(localStorage.getItem(storeKey) || '[]');
            const filtered = data.filter((item: any) => item[col] !== val);
            
            localStorage.setItem(storeKey, JSON.stringify(filtered));
            return {
              then: (callback: any) => {
                return Promise.resolve(callback({ data: [], error: null }));
              }
            };
          }
        };
      }
    };
  },

  storage: {
    from: (bucket: string) => {
      return {
        upload: async (pathName: string, file: File) => {
          // In mock mode, we can read the file as base64 or URL and return a fake path
          const urlPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          try {
            const base64 = await urlPromise;
            // Save base64 key in mock uploads store
            const mockUploads = JSON.parse(localStorage.getItem('mock_uploads') || '{}');
            const fileKey = `${bucket}_${pathName}`;
            mockUploads[fileKey] = base64;
            localStorage.setItem('mock_uploads', JSON.stringify(mockUploads));
            
            return { data: { path: pathName }, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
        getPublicUrl: (pathName: string) => {
          const fileKey = `${bucket}_${pathName}`;
          const mockUploads = JSON.parse(localStorage.getItem('mock_uploads') || '{}');
          const dataUrl = mockUploads[fileKey];
          
          // Return either the base64 or a clean default unsplash food picker url depending on pathName
          if (dataUrl) {
            return { data: { publicUrl: dataUrl } };
          }

          // Fallback if missing
          return { data: { publicUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600' } };
        }
      };
    }
  }
};

// Export active supabase client (either real or mock helper)
export const supabase = isMockMode ? (mockSupabaseClient as any) : realSupabase;
