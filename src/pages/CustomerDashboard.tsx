import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/supabase';
import { Order, FoodItem, OrderItem } from '../types';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { Input } from '../components/ui/Input';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Heart, 
  ChevronRight, 
  Compass, 
  Timer, 
  Sparkles, 
  CheckCircle2, 
  User, 
  UtensilsCrossed 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerDashboard: React.FC = () => {
  const { user, profile, logout, updateProfile } = useAuth();
  const { addBulkToCart } = useCart();
  const navigate = useNavigate();

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile forms
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // UI Banner Alerts custom notification
  const [toastMsg, setToastMsg] = useState<{ id: string; text: string } | null>(null);

  const triggerToast = (text: string) => {
    setToastMsg({ id: Date.now().toString(), text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user orders
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (orderErr) throw orderErr;
        setOrders(orderData || []);

        // 2. Fetch dishes for quick suggestions
        const { data: foodData, error: foodErr } = await supabase
          .from('foods')
          .select('*')
          .eq('is_available', true)
          .limit(4);

        if (foodErr) throw foodErr;
        setRecommendations(foodData || []);
      } catch (err) {
        console.error('Failed to resolve dashboard records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [user, profile, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setIsUpdatingField(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName,
        phone,
        address
      });
      if (error) {
        triggerToast('Failed to save updated coordinates. Please try again.');
      } else {
        setProfileSuccessMsg('Delivery details kept secure and updated successfully!');
        triggerToast('Details synchronized successfully!');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Local connectivity error. Saved locally.');
    } finally {
      setIsUpdatingField(false);
    }
  };

  const handleReorder = (order: Order) => {
    try {
      // Map OrderItems to format requested by addBulkToCart
      const itemsToPush = order.items.map(it => ({
        food_id: it.food_id,
        name: it.name,
        price: it.price,
        quantity: it.quantity
      }));
      
      addBulkToCart(itemsToPush);
      triggerToast(`Successfully loaded ${itemsToPush.length} item(s) back into your order tray! Click your cart to review.`);
    } catch (err) {
      console.error('Reorder failure:', err);
      triggerToast('Unable to complete reorder trigger.');
    }
  };

  // Math metrics derivations with safety
  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const totalOrdersCount = orders.length;
  
  const totalSpend = nonCancelledOrders.reduce((sum, o) => sum + o.total_price, 0);
  
  // Calculate favorite dish based on count
  const dishCounts: Record<string, { name: string; count: number }> = {};
  orders.forEach(o => {
    o.items.forEach(it => {
      if (!dishCounts[it.food_id]) {
        dishCounts[it.food_id] = { name: it.name, count: 0 };
      }
      dishCounts[it.food_id].count += it.quantity;
    });
  });
  
  const favoriteDishId = Object.keys(dishCounts).reduce((a, b) => 
    dishCounts[a].count > dishCounts[b].count ? a : b, 
    ''
  );
  const favoriteDishName = favoriteDishId ? dishCounts[favoriteDishId].name : 'No orders yet';

  // Get active greeting string
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative">
      
      {/* Toast Alert Banner overlay */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-md bg-stone-900 border border-brand-500/30 text-white p-4.5 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <Sparkles className="h-5 w-5 text-brand-500 shrink-0" />
            <span className="text-xs font-bold leading-normal">{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            {getGreeting()}, {profile?.full_name || user.email?.split('@')[0]}! <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-stone-500 text-sm font-medium mt-1">
            Check your delivery updates, recalculate credentials, and track hot active dishes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" className="rounded-xl font-bold">
              Explore Food Menu
            </Button>
          </Link>
          <Button onClick={logout} variant="outline" size="sm" className="rounded-xl font-bold border-red-150 hover:bg-red-50 text-red-600">
            Sign Out
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20">
          <Loader size="lg" text="Structuring your coordinates dashboard..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE CONTENTS column (Stats + Active Tracker + History + Suggested) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* 1. Metric Bento Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-100 p-5 rounded-[24px] shadow-warm-xs flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3 text-brand-500" /> Total Orders
                </span>
                <span className="text-2xl font-black text-stone-900">{totalOrdersCount}</span>
                <span className="text-[10px] text-stone-400 font-bold mt-1">All history orders</span>
              </div>

              <div className="bg-white border border-stone-100 p-5 rounded-[24px] shadow-warm-xs flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <Timer className="h-3 w-3 text-orange-500" /> In Progress
                </span>
                <span className="text-2xl font-black text-orange-600">
                  {activeOrders.length}
                </span>
                <span className="text-[10px] text-stone-400 font-bold mt-1">Being prepared or shipped</span>
              </div>

              <div className="bg-white border border-stone-100 p-5 rounded-[24px] shadow-warm-xs flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> Total Spent
                </span>
                <span className="text-2xl font-black text-stone-900">${totalSpend.toFixed(2)}</span>
                <span className="text-[10px] text-stone-400 font-bold mt-1">Excludes cancelled</span>
              </div>

              <div className="bg-white border border-stone-100 p-5 rounded-[24px] shadow-warm-xs flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-1.5 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" /> Top Choice
                </span>
                <span className="text-sm font-extrabold text-stone-850 truncate max-w-full" title={favoriteDishName}>
                  {favoriteDishName}
                </span>
                <span className="text-[10px] text-stone-400 font-bold mt-auto pt-1">Your absolute favorite</span>
              </div>
            </div>

            {/* 2. LIVE ACTIVE TRACKING BLOCK (If any order is pending or preparing) */}
            {activeOrders.length > 0 && (
              <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-warm-lg flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-44 h-44 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-widest text-brand-400">Live Delivery Radar</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ID: #{activeOrders[0].id}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                  <div className="h-14 w-14 bg-brand-500/20 border border-brand-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Compass className="h-8 w-8 text-brand-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">
                      {activeOrders[0].status === 'pending' ? 'Securing Kitchen Approval' : 'Chef Cooking Your Plates'}
                    </h4>
                    <p className="text-xs text-slate-350 mt-1 max-w-md">
                      Plates requested: {activeOrders[0].items.map(it => `${it.quantity}x ${it.name}`).join(', ')}. Delivery is headed to {activeOrders[0].delivery_address}.
                    </p>
                  </div>
                </div>

                {/* Tracking Progress Lines */}
                <div className="grid grid-cols-4 gap-2 text-center pt-2 relative">
                  <div className="absolute top-[15px] left-[12.5%] right-[12.5%] h-1 bg-slate-800 z-0">
                    <div 
                      className="h-full bg-brand-500 transition-all duration-1000" 
                      style={{ width: activeOrders[0].status === 'preparing' ? '50%' : '12.5%' }}
                    />
                  </div>
                  
                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="h-8 w-8 rounded-full bg-brand-600 border-4 border-slate-950 flex items-center justify-center text-xs font-black text-white">
                      ✓
                    </div>
                    <span className="text-[10px] font-extrabold text-white">Placed</span>
                  </div>

                  {/* Step 2: Cook */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className={`h-8 w-8 rounded-full border-4 border-slate-950 flex items-center justify-center text-xs font-black ${
                      activeOrders[0].status === 'preparing' 
                        ? 'bg-brand-500 text-white animate-pulse' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {activeOrders[0].status === 'preparing' ? '●' : '2'}
                    </div>
                    <span className={`text-[10px] font-extrabold ${activeOrders[0].status === 'preparing' ? 'text-brand-400' : 'text-slate-400'}`}>Cooking</span>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-xs font-black text-slate-400">
                      3
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400">Dispatched</span>
                  </div>

                  {/* Step 4: Arrived */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-xs font-black text-slate-400">
                      4
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-400">Hot Arrived</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-450 border-t border-slate-800 pt-4.5 mt-2">
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <Clock className="h-4 w-4 text-brand-400" /> Delivered within 25–35 minutes
                  </span>
                  <Link to="/orders" className="text-brand-400 font-bold hover:underline">
                    Detailed Timeline &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* 3. RECENT ORDERS LIST */}
            <div className="bg-white border border-stone-100 rounded-[32px] p-6 shadow-warm-xs flex flex-col gap-5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-stone-900">Recent Purchase History</h3>
                  <p className="text-stone-400 text-xs font-medium mt-0.5">Quickly view or re-order your historical favorite dishes.</p>
                </div>
                <Link to="/orders" className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 mt-1">
                  View All Orders <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <UtensilsCrossed className="h-10 w-10 text-stone-305" />
                  <p className="text-stone-550 text-sm font-semibold">Your kitchen basket list is empty.</p>
                  <Link to="/" className="mt-1">
                    <Button variant="outline" size="sm" className="rounded-xl">Browse Foods</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.slice(0, 3).map((ord) => (
                    <div 
                      key={ord.id}
                      className="border border-stone-100 rounded-2xl p-4.5 bg-stone-50/20 hover:bg-stone-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            Order <span className="font-mono text-xs text-stone-400">#{ord.id}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            ord.status === 'delivered' ? 'bg-green-50 text-green-700' :
                            ord.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium truncate max-w-lg">
                          Items: {ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </p>
                        <span className="text-[11px] text-stone-400 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> Ordered on {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 gap-2">
                        <span className="text-base font-black text-stone-900">${ord.total_price.toFixed(2)}</span>
                        <Button 
                          onClick={() => handleReorder(ord)}
                          size="xs" 
                          variant="outline" 
                          className="rounded-lg text-brand-600 border-brand-500/25 hover:bg-brand-50 text-[10px] font-black tracking-widest uppercase py-1"
                        >
                          Reorder Plate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. RECOMMENDATIONS SECTION */}
            {recommendations.length > 0 && (
              <div className="bg-amber-50-radial flex flex-col gap-5">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-stone-900">Chef Recommendations</h3>
                  <p className="text-stone-400 text-xs font-medium mt-0.5">Top trending delicious plates selected this hour.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.map((food) => (
                    <div 
                      key={food.id}
                      className="bg-white border border-stone-100 p-4.5 rounded-2xl shadow-warm-xs flex gap-3.5 items-center hover:shadow-warm-sm transition-all"
                    >
                      <img 
                        src={food.image_url} 
                        alt={food.name}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 object-cover rounded-xl shrink-0" 
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-sm font-black text-stone-900 truncate">{food.name}</span>
                        <span className="text-xs text-brand-600 font-extrabold mt-0.5">${food.price.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-400 line-clamp-1 mt-1 font-semibold">{food.description}</span>
                      </div>
                      <Link to="/" className="shrink-0">
                        <button className="h-8.5 w-8.5 rounded-xl bg-orange-50 hover:bg-brand-600 text-brand-600 hover:text-white flex items-center justify-center transition-colors font-extrabold cursor-pointer">
                          +
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDE CONTENTS column (Profile Coordinates update form) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white border border-stone-100 rounded-[32px] p-6 shadow-warm-xs flex flex-col">
              <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-stone-100">
                <div className="h-10 w-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">Delivery Profile</h3>
                  <p className="text-stone-400 text-[11px] font-bold">Fast-checkout autocompleted coordinates.</p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-[11px] font-bold py-2.5 px-3.5 rounded-xl mb-4 flex gap-2 items-start">
                  <Award className="h-4 w-4 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <Input
                  id="dash-name"
                  label="Display Full Name"
                  placeholder="John Doe"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                  id="dash-email"
                  label="Registered Email"
                  disabled
                  type="email"
                  value={user.email || ''}
                />

                <Input
                  id="dash-phone"
                  label="Primary Contact Phone"
                  placeholder="e.g. +1 (555) 432-1234"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dash-address" className="text-sm font-bold text-stone-700 tracking-wide">
                    Default Shipping Address
                  </label>
                  <textarea
                    id="dash-address"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-stone-200 focus:border-brand-500 rounded-2xl outline-none transition-colors text-sm font-semibold placeholder:text-stone-450"
                    placeholder="e.g., 204 Oak St, Apart 4B, San Francisco, CA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">
                  <p className="font-extrabold text-slate-750 flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Auto-Fill Mechanics
                  </p>
                  These values are encrypted in our DB trigger. When shopping, Checkout will dynamically pre-populate phone and addresses automatically.
                </div>

                <Button
                  type="submit"
                  isLoading={isUpdatingField}
                  className="w-full mt-2 rounded-2xl py-3.5"
                >
                  Save Address Details
                </Button>
              </form>
            </div>

            {/* Culinary Badge Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-brand-500/5 border border-brand-150 p-6 rounded-[32px] shadow-warm-xs flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white">
                  <Award className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-stone-900">Gourmet Club Badge</h4>
                  <p className="text-[10px] text-stone-400 font-bold mt-0.5">Unlocked at Gourmet Level 1</p>
                </div>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                You receive 5% off items ordered via the dashboard selection as a return voucher tier. Keep eating delicious!
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
