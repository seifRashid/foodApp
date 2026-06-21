import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isMockMode } from '../services/supabase';
import { FoodItem, Order, OrderStatus, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui/Loader';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Trash2, 
  Edit, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  UtensilsCrossed, 
  DollarSign, 
  BarChart3, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Loader2,
  PackageCheck,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['Burgers', 'Pizza', 'Sides', 'Salads', 'Desserts', 'Drinks'];

const STOCK_PHOTO_PRESETS = [
  { name: 'Classic Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600' },
  { name: 'Pepperoni Pizza', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Crispy Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600' },
  { name: 'Caesar Salad', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600' },
  { name: 'Creamy Gelato', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600' },
  { name: 'Warm Waffle', url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&q=80&w=600' },
  { name: 'Choco Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600' },
  { name: 'Iced Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Vanilla Shake', url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600' }
];

type TabType = 'overview' | 'orders' | 'menu';

export const AdminDashboard: React.FC = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Route security guard
  useEffect(() => {
    if (!authLoading && (!user || role !== 'admin')) {
      navigate('/');
    }
  }, [user, role, authLoading, navigate]);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Search/Filters
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [foodQuery, setFoodQuery] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>('all');

  // Add/Edit Food Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [formFields, setFormFields] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Burgers',
    image_url: STOCK_PHOTO_PRESETS[0].url,
    is_available: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Data
  const loadDashboardData = async () => {
    try {
      setDbLoading(true);
      
      // 1. Pre-seed Categories on live database if empty
      if (!isMockMode) {
        try {
          const { data: catData } = await supabase.from('categories').select('name');
          if (!catData || catData.length === 0) {
            const defaultCats = [
              { name: 'Burgers', slug: 'burgers' },
              { name: 'Pizza', slug: 'pizza' },
              { name: 'Sides', slug: 'sides' },
              { name: 'Salads', slug: 'salads' },
              { name: 'Desserts', slug: 'desserts' },
              { name: 'Drinks', slug: 'drinks' }
            ];
            await supabase.from('categories').insert(defaultCats);
            console.log('Seeded database categories via admin loader.');
          }
        } catch (catErr) {
          console.error('Non-blocking dashboard categories check:', catErr);
        }
      }

      const ordersPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const foodsPromise = supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });

      const [ordersRes, foodsRes] = await Promise.all([ordersPromise, foodsPromise]);

      if (ordersRes.error) throw ordersRes.error;
      if (foodsRes.error) throw foodsRes.error;

      let foodsList = foodsRes.data || [];

      // 2. Pre-seed Foods if empty in live database and admin is logged in
      if (!isMockMode && foodsList.length === 0) {
        try {
          const seedDishes = [
            {
              name: 'Gourmet Cheese Burger',
              price: 12.99,
              description: 'Juicy Angus beef patty with cheddar cheese, crisp lettuce, fresh tomato, and house special burger sauce on a toasted brioche bun.',
              category: 'Burgers',
              image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
              is_available: true
            },
            {
              name: 'Double Pepperoni Pizza',
              price: 15.99,
              description: 'Freshly baked hand-tossed dough topped with rustic marinara, premium double pepperoni slices, mozzarella, and dynamic Italian herbs.',
              category: 'Pizza',
              image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600',
              is_available: true
            },
            {
              name: 'Golden Crispy Fries',
              price: 4.99,
              description: 'Premium potatoes cut into classic thin fries, fried to perfect crispy light bronze, finished with a dash of fine sea salt.',
              category: 'Sides',
              image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600',
              is_available: true
            },
            {
              name: 'Strawberry Milkshake',
              price: 5.49,
              description: 'Smooth, creamy vanilla milk combined with organic sweet strawberries, blended to cold perfection, topped with delicious whipped cream.',
              category: 'Drinks',
              image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600',
              is_available: true
            },
            {
              name: 'Crispy Caesar Salad',
              price: 9.99,
              description: 'Fresh crisp romaine lettuce leaves, baked garlic croutons, shredded parmesan cheese served with classic creamy Caesar dressing.',
              category: 'Salads',
              image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600',
              is_available: true
            },
            {
              name: 'Warm Fudge Brownie',
              price: 6.49,
              description: 'Rich, soft, and chocolatey fudge brownie baked fresh, served warm, garnished with premium dark chocolate swirls.',
              category: 'Desserts',
              image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600',
              is_available: true
            }
          ];
          const { data: insertedData, error: insertError } = await supabase.from('foods').insert(seedDishes).select('*');
          if (!insertError && insertedData) {
            foodsList = insertedData;
          }
        } catch (seedErr) {
          console.error('Non-blocking live foods pre-seed failed:', seedErr);
        }
      }

      setOrders(ordersRes.data || []);
      setFoods(foodsList);
    } catch (err) {
      console.error('Error loading dashboard datasets:', err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === 'admin') {
      loadDashboardData();
    }
  }, [user, role]);

  // Order Operations
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update status. Try reloading.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Food Operations
  const handleOpenAddFood = () => {
    setEditingFood(null);
    setFormFields({
      name: '',
      price: '',
      description: '',
      category: 'Burgers',
      image_url: STOCK_PHOTO_PRESETS[0].url,
      is_available: true
    });
    setFormErrors({});
    setFoodModalOpen(true);
  };

  const handleOpenEditFood = (item: FoodItem) => {
    setEditingFood(item);
    setFormFields({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      category: item.category,
      image_url: item.image_url,
      is_available: item.is_available
    });
    setFormErrors({});
    setFoodModalOpen(true);
  };

  const handleDeleteFood = async (id: string) => {
    const isConfirmed = window.confirm('Are you absolutely sure you want to delete this menu items?');
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from('foods').delete().eq('id', id);
      if (error) throw error;
      setFoods(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed to delete food:', err);
      alert('Could not delete menu item.');
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formFields.name.trim()) errors.name = 'Please provide a plate name';
    if (!formFields.price.trim() || isNaN(Number(formFields.price)) || Number(formFields.price) <= 0) {
      errors.price = 'Please enter a valid active price (e.g., 12.99)';
    }
    if (!formFields.description.trim()) errors.description = 'Provide detailed culinary descriptions.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    try {
      const dbPayload = {
        name: formFields.name,
        price: parseFloat(formFields.price),
        description: formFields.description,
        category: formFields.category,
        image_url: formFields.image_url,
        is_available: formFields.is_available
      };

      if (editingFood) {
        // Update
        const { error } = await supabase
          .from('foods')
          .update(dbPayload)
          .eq('id', editingFood.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('foods')
          .insert(dbPayload);
        if (error) throw error;
      }

      await loadDashboardData();
      setFoodCategoryFilter('all');
      setFoodQuery('');
      setFoodModalOpen(false);
    } catch (err: any) {
      console.error('Error logging food save states:', err);
      const isRls = err?.message?.toLowerCase().includes('row-level security') || err?.code === '42501';
      if (isRls) {
        alert('Failed saving menu item: Live database Row-Level Security (RLS) check failed. Please ensure your account role is set to "Admin" in the navbar/dashboard before adding dishes!');
      } else {
        alert('Failed saving menu item. Please check configurations: ' + (err?.message || err));
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Metrics Calculations
  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total_price, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  
  // Calculate category metrics for visual bar graph
  const categorySalesMap = nonCancelledOrders.reduce((acc: Record<string, number>, order) => {
    order.items.forEach(item => {
      // Find food to pull its category, fallback or check item names
      const match = foods.find(f => f.id === item.food_id || f.name === item.name);
      const cat = match?.category || 'Burgers'; 
      acc[cat] = (acc[cat] || 0) + (item.price * item.quantity);
    });
    return acc;
  }, {});

  // Convert map to list and sort
  const categorySales = CATEGORIES.map(cat => ({
    name: cat,
    value: categorySalesMap[cat] || 0
  }));

  const maxSaleValue = Math.max(...categorySales.map(c => c.value), 10);

  // Sorting and filters for orders tabular list
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(orderQuery.toLowerCase()) ||
      o.user_email.toLowerCase().includes(orderQuery.toLowerCase());
    
    const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Sorting and filters for foods inventory list
  const filteredFoods = foods.filter(f => {
    const matchesSearch = 
      f.name.toLowerCase().includes(foodQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(foodQuery.toLowerCase());
    
    const matchesFilter = foodCategoryFilter === 'all' || f.category === foodCategoryFilter;

    return matchesSearch && matchesFilter;
  });

  if (authLoading || !user || role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader size="lg" text="Authenticating administrator access keys..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white rounded-lg p-1.5 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin System Dashboard</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Live culinary transactions oversight, custom menu configurations, and revenue diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={loadDashboardData} 
              className="rounded-2xl border-slate-200"
              disabled={dbLoading}
            >
              {dbLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Refresh Assets
            </Button>
            <Button 
              onClick={handleOpenAddFood} 
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl flex items-center gap-1.5 shadow-warm-xs"
            >
              <PlusCircle className="h-4.5 w-4.5" /> Add New Plate
            </Button>
          </div>
        </div>

        {/* Dynamic Metric Counter Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales System</span>
              <h3 className="text-2xl font-black text-slate-955">${totalRevenue.toFixed(2)}</h3>
              <p className="text-[11px] text-orange-600 font-extrabold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Excludes cancelled order receipts
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-brand-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </motion.div>

          {/* Pending / Active */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
              <h3 className="text-2xl font-black text-slate-950">{pendingOrders.length}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Waiting for manual execution</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </motion.div>

          {/* Preparing */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kitchen Preparing</span>
              <h3 className="text-2xl font-black text-slate-950">{preparingOrders.length}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Culinary cooks active</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
          </motion.div>

          {/* Delivered */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfilled Deliveries</span>
              <h3 className="text-2xl font-black text-slate-950">{deliveredOrders.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">Delivered secure & hot</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PackageCheck className="h-6 w-6" />
            </div>
          </motion.div>
        </div>

        {/* Tab Controls Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 font-extrabold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics & Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-4 px-6 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Manage Orders
            {pendingOrders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-black">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-4 px-6 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Kitchen Menu Board
          </button>
        </div>

        {/* Main Segment Switcher Box */}
        <AnimatePresence mode="wait">
          {dbLoading ? (
            <div className="py-24">
              <Loader size="lg" text="Syncing real-time records from secure database servers..." />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              {/* ------------ OVERVIEW TAB ------------ */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Category Revenue Chart Block */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs space-y-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        Culinary Sales Revenue by Food Category
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Visual metrics computed from active (non-cancelled) user receipts.</p>
                    </div>

                    {/* Custom high-fidelity bar metrics bar-chart */}
                    <div className="space-y-4">
                      {categorySales.map((cat, idx) => {
                        const pct = (cat.value / maxSaleValue) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-700 font-bold">{cat.name}</span>
                              <span className="text-slate-900 font-black">${cat.value.toFixed(2)}</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: idx * 0.05, duration: 0.6 }}
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operation Insights Columns */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-warm-xs space-y-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">System Statistics</h3>
                      <p className="text-xs text-slate-400 font-medium">Important system indicators</p>
                    </div>

                    <div className="divide-y divide-slate-100 text-sm">
                      <div className="py-3 flex justify-between font-medium">
                        <span className="text-slate-500">Gross System Orders</span>
                        <span className="text-slate-900 font-bold">{orders.length}</span>
                      </div>
                      <div className="py-3 flex justify-between font-medium">
                        <span className="text-slate-500">Active Plate Count</span>
                        <span className="text-slate-900 font-bold">{foods.length}</span>
                      </div>
                      <div className="py-3 flex justify-between font-medium">
                        <span className="text-slate-500">Fulfilled orders</span>
                        <span className="text-slate-900 font-bold text-emerald-600">{deliveredOrders.length}</span>
                      </div>
                      <div className="py-3 flex justify-between font-medium">
                        <span className="text-slate-500">Cancelled orders</span>
                        <span className="text-slate-900 font-bold text-red-500">{cancelledOrders.length}</span>
                      </div>
                    </div>

                    <div className="bg-orange-50/50 rounded-2xl p-4.5 border border-orange-100 text-xs font-medium text-orange-900 leading-relaxed">
                      <p className="font-extrabold text-orange-950 mb-1">Administrative Pro-Tip:</p>
                      Keep the kitchen operations smooth by declaring pending tickets as <b>"Preparing Food"</b> as soon as local chefs accept them!
                    </div>
                  </div>

                </div>
              )}

              {/* ------------ ORDERS TAB ------------ */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Filter / Search Tool Bar */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-warm-xs flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Input
                        id="order-search"
                        placeholder="Search customer name, order #id, or account email..."
                        value={orderQuery}
                        onChange={(e) => setOrderQuery(e.target.value)}
                        className="pl-11 rounded-xl"
                      />
                      <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                      <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="py-2.5 px-4 bg-slate-50 border border-slate-200 text-xs font-extrabold rounded-xl text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500 cursor-pointer"
                      >
                        <option value="all">Check All Orders</option>
                        <option value="pending">Pending Approval</option>
                        <option value="preparing">Active Preparing</option>
                        <option value="delivered">Delivered Successfully</option>
                        <option value="cancelled">Cancelled List</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders Content Scroll-list */}
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white py-16 text-center border border-slate-100 rounded-3xl flex flex-col items-center gap-3">
                      <ClipboardList className="h-12 w-12 text-slate-300 animate-bounce" />
                      <h4 className="text-lg font-bold text-slate-800">No Orders Match These Constraints</h4>
                      <p className="text-slate-400 text-xs font-medium">Try clearing your select filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredOrders.map((order) => {
                        const isPending = order.status === 'pending';
                        const isPreparing = order.status === 'preparing';
                        const isDelivered = order.status === 'delivered';
                        const isCancelled = order.status === 'cancelled';

                        return (
                          <motion.div
                            key={order.id}
                            layout
                            className="bg-white rounded-3xl border border-slate-100 shadow-warm-xs overflow-hidden flex flex-col"
                          >
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                              <div>
                                <span className="font-extrabold text-slate-900 block sm:inline">
                                  Ticket: <span className="font-mono text-brand-700">#{order.id}</span>
                                </span>
                                <span className="text-xs text-slate-400 font-bold ml-0.5 sm:ml-2">
                                  {new Date(order.created_at).toLocaleString()}
                                </span>
                              </div>

                              {/* Status Action Buttons */}
                              <div className="flex items-center gap-2">
                                {/* Current status display badge */}
                                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                                  isPending ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  isPreparing ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                  isDelivered ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                  {isPending ? 'Pending Approval' :
                                   isPreparing ? 'Preparing Meals' :
                                   isDelivered ? 'Delivered Hot' : 'Cancelled'}
                                </span>

                                <div className="border-l border-slate-200 pl-2 flex gap-1.5">
                                  {isPending && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                      disabled={updatingOrderId === order.id}
                                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                      Accept & Prepare
                                    </button>
                                  )}

                                  {isPreparing && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                      disabled={updatingOrderId === order.id}
                                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                      Mark Delivered
                                    </button>
                                  )}

                                  {!isCancelled && !isDelivered && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                      disabled={updatingOrderId === order.id}
                                      className="p-1 px-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Main Bodies Columns Grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-sm">
                              <div className="md:col-span-7 space-y-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Ordered Meals ({order.items.length})</span>
                                <div className="divide-y divide-slate-100 bg-slate-50/30 p-4 rounded-2xl border border-slate-100">
                                  {order.items.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center py-2">
                                      <span className="text-slate-800 font-medium">
                                        <span className="text-brand-600 font-black block sm:inline-block sm:w-7">{it.quantity}x</span>
                                        {it.name}
                                      </span>
                                      <span className="font-extrabold text-slate-900">${(it.price * it.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="md:col-span-5 flex flex-col gap-3 md:border-l md:border-slate-100 md:pl-6">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Coordinates</span>
                                <div className="space-y-3 font-medium text-slate-700">
                                  <div className="flex items-start gap-2">
                                    <Users className="h-4.5 w-4.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span className="text-slate-900 font-bold">
                                      {order.customer_name}
                                      <span className="block text-xs font-medium text-slate-400 mt-0.5">{order.user_email}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4.5 w-4.5 text-slate-450 shrink-0" />
                                    <span>{order.customer_phone}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4.5 w-4.5 text-slate-450 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed text-xs">{order.delivery_address}</span>
                                  </div>
                                  {order.delivery_notes && (
                                    <div className="bg-amber-50/50 p-2.5 rounded-xl text-xs font-medium text-amber-900 border border-amber-100 leading-relaxed mt-1">
                                      <span className="font-bold text-amber-955 block">Notes:</span> {order.delivery_notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Settlement Footer banner bar */}
                            <div className="bg-slate-50/20 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
                              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Aggregate Bill</span>
                              <span className="text-xl font-black text-slate-900">${order.total_price.toFixed(2)}</span>
                            </div>

                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------ KITCHEN MENU TAB ------------ */}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  {/* Search and filters board */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-warm-xs flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Input
                        id="food-search"
                        placeholder="Search culinary plate titles, descriptions, etc..."
                        value={foodQuery}
                        onChange={(e) => setFoodQuery(e.target.value)}
                        className="pl-11 rounded-xl"
                      />
                      <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                      <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
                      <select
                        value={foodCategoryFilter}
                        onChange={(e) => setFoodCategoryFilter(e.target.value)}
                        className="py-2.5 px-4 bg-slate-50 border border-slate-200 text-xs font-extrabold rounded-xl text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500 cursor-pointer"
                      >
                        <option value="all">All Food Categories</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Menu listings grid */}
                  {filteredFoods.length === 0 ? (
                    <div className="bg-white py-16 text-center border border-slate-100 rounded-3xl flex flex-col items-center gap-3">
                      <UtensilsCrossed className="h-12 w-12 text-slate-300 animate-bounce" />
                      <h4 className="text-lg font-bold text-slate-800">No Kitchen Plate Matches These Filters</h4>
                      <p className="text-slate-400 text-xs font-medium">Try adding a new culinary plate setting.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-warm-xs overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-55/40 text-slate-400 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                            <th className="py-4.5 px-6">Plate Detail</th>
                            <th className="py-4.5 px-4">Category</th>
                            <th className="py-4.5 px-4">Price Base</th>
                            <th className="py-4.5 px-4 text-center">Status</th>
                            <th className="py-4.5 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredFoods.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-700">
                              
                              {/* Plate core */}
                              <td className="py-4.5 px-6 flex items-center gap-3.5">
                                <img
                                  src={item.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600'}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-xl object-cover border border-slate-100 shrink-0"
                                />
                                <div className="flex flex-col">
                                  <span className="text-slate-900 font-extrabold text-base leading-tight">{item.name}</span>
                                  <span className="text-xs text-slate-400 line-clamp-1 max-w-[280px] mt-1 font-normal">{item.description}</span>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-4.5 px-4 text-slate-600 font-bold">
                                {item.category}
                              </td>

                              {/* Price */}
                              <td className="py-4.5 px-4 text-slate-900 font-black text-base">
                                ${item.price.toFixed(2)}
                              </td>

                              {/* Status badge */}
                              <td className="py-4.5 px-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  item.is_available 
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                                    : 'bg-red-50 border border-red-100 text-red-700'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${item.is_available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  {item.is_available ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </td>

                              {/* Actions triggers */}
                              <td className="py-4.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditFood(item)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                    title="Edit Culinary details"
                                  >
                                    <Edit className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFood(item.id)}
                                    className="p-2 text-slate-400 hover:text-red-750 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                    title="Delete menu item"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal for Add / Edit Plates details */}
        <Modal
          isOpen={foodModalOpen}
          onClose={() => setFoodModalOpen(false)}
          title={editingFood ? 'Modify Menu Plate details' : 'Draft New Culinary entry'}
        >
          <form onSubmit={handleSaveFood} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="food-form-name"
                label="Food Item Name"
                value={formFields.name}
                onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                placeholder="e.g., Spicy Double Cheeseburger"
                error={formErrors.name}
                required
              />
              <Input
                id="food-form-price"
                label="Price Dollars ($)"
                value={formFields.price}
                onChange={(e) => setFormFields({ ...formFields, price: e.target.value })}
                placeholder="e.g., 14.99"
                error={formErrors.price}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plate Category</label>
                <select
                  value={formFields.category}
                  onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                  className="py-3 px-4.5 bg-slate-50 border border-slate-200 text-sm font-semibold rounded-2xl text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500 cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Item Availability</label>
                <select
                  value={formFields.is_available ? 'true' : 'false'}
                  onChange={(e) => setFormFields({ ...formFields, is_available: e.target.value === 'true' })}
                  className="py-3 px-4.5 bg-slate-50 border border-slate-200 text-sm font-semibold rounded-2xl text-slate-700 outline-none hover:border-slate-300 focus:border-brand-500 cursor-pointer"
                >
                  <option value="true">In Stock & Deliverable</option>
                  <option value="false">Out of Stock (Hidden alert shown)</option>
                </select>
              </div>
            </div>

            <TextArea
              id="food-form-desc"
              label="Culinary Description & Ingredients"
              value={formFields.description}
              onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
              placeholder="Freshly grilled beef patty topped with cheddar cheese, caramelised onions, pickles, and our signature burger sauce..."
              error={formErrors.description}
              rows={3}
              required
            />

            {/* Custom stock photographic presets list */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Photo Selection Presets</label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                {STOCK_PHOTO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormFields({ ...formFields, image_url: p.url })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      formFields.image_url === p.url
                        ? 'bg-brand-600 text-white border-transparent'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Url Field */}
            <Input
              id="food-form-image"
              label="Selected Product Image URL"
              value={formFields.image_url}
              onChange={(e) => setFormFields({ ...formFields, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              required
            />

            {/* Save Buttons panel */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFoodModalOpen(false)}
                className="rounded-2xl"
              >
                Reset & Close
              </Button>
              <Button
                type="submit"
                isLoading={formSubmitting}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl"
              >
                Log culinary Entry
              </Button>
            </div>

          </form>
        </Modal>

      </div>
    </div>
  );
};
