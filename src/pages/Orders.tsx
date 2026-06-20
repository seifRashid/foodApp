import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ui/Loader';
import { Button } from '../components/ui/Button';
import { ClipboardList, Clock, Truck, CheckCircle, XCircle, ChevronDown, User, Phone, MapPin, Mail, ScrollText } from 'lucide-react';
import { motion } from 'motion/react';

export const Orders: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase.from('orders').select('*');
      
      // If client (non-admin), pull only their user ID records
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }
      
      // Order by created_at desc
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, role]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update state locally
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('We could not update the status. Try reloading the page.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Pending Approval',
          icon: Clock
        };
      case 'preparing':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          dot: 'bg-orange-500',
          label: 'Preparing Food',
          icon: ScrollText
        };
      case 'delivered':
        return {
          bg: 'bg-green-50 border-green-200 text-green-800',
          dot: 'bg-green-500',
          label: 'Delivered Hot',
          icon: CheckCircle
        };
      case 'cancelled':
        return {
          bg: 'bg-red-50 border-red-200 text-red-800',
          dot: 'bg-red-500',
          label: 'Cancelled',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-stone-50 border-stone-200 text-stone-850',
          dot: 'bg-stone-500',
          label: 'Unknown',
          icon: Clock
        };
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center flex flex-col items-center gap-4">
        <ClipboardList className="h-16 w-16 text-stone-300" />
        <h3 className="text-xl font-bold text-stone-800">Sign In to View Orders</h3>
        <p className="text-stone-500 text-sm font-medium">
          Whether you are an admin or a regular customer, logging in is required to track meal recipes and deliver logs.
        </p>
        <Button to="/login" variant="primary" className="rounded-xl mt-1">
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Title heading controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/50">
        <div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {isAdmin ? 'System Orders Dashboard' : 'My Order History'}
          </h2>
          <p className="text-stone-500 text-sm font-medium mt-1">
            {isAdmin 
              ? 'View and manage all customer culinary deliveries globally.' 
              : 'Track active meal preparations and view physical receipts historical orders.'}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="rounded-xl self-start sm:self-center"
        >
          Refresh Orders
        </Button>
      </div>

      {loading ? (
        <Loader size="lg" text="Retrieving orders database..." />
      ) : orders.length === 0 ? (
        <div className="bg-white border border-stone-250/50 py-16 px-6 text-center rounded-3xl flex flex-col items-center gap-4.5 max-w-lg mx-auto">
          <ClipboardList className="h-14 w-14 text-stone-300" />
          <h4 className="text-xl font-bold text-stone-800">No Orders Created Yet</h4>
          <p className="text-stone-500 text-sm font-medium leading-relaxed max-w-sm">
            {isAdmin 
              ? 'Customers will trigger listings as soon as they select and buy food items.' 
              : 'When you place a meal from the selection list, details will pop up instantly here!'}
          </p>
          {!isAdmin && (
            <Button to="/" variant="primary" className="rounded-xl mt-1">
              Browse Fresh Menu
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const statusConfig = getStatusStyle(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-stone-150 shadow-warm-xs hover:shadow-warm-md overflow-hidden flex flex-col"
              >
                {/* Header detail band bar */}
                <div className="bg-stone-50/50 px-6 py-4.5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-stone-900 text-base">
                      Order: <span className="font-mono text-brand-700">#{order.id}</span>
                    </span>
                    <span className="text-xs text-stone-400 font-bold">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-extrabold shadow-2xs whitespace-nowrap ${statusConfig.bg}`}>
                      <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                      <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                      {statusConfig.label}
                    </span>

                    {/* Admin Status Incrementor trigger */}
                    {isAdmin && (
                      <div className="relative inline-block text-left">
                        <select
                          disabled={updatingId === order.id}
                          className="pl-3.5 pr-8 py-1.5 bg-white border border-stone-300 text-xs font-bold rounded-xl text-stone-700 outline-none hover:border-stone-400 focus:border-brand-500 cursor-pointer disabled:opacity-50 appearance-none"
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="preparing">Start Preparing</option>
                          <option value="delivered">Declare Delivered</option>
                          <option value="cancelled">Cancel Order</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-stone-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Main coordinates segment body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Itemized contents List */}
                  <div className="md:col-span-7 flex flex-col gap-3">
                    <span className="text-xs font-extrabold text-stone-400 uppercase tracking-widest leading-none">
                      Requested Plates ({order.items.length})
                    </span>
                    <div className="divide-y divide-stone-100 bg-stone-50/20 p-2.5 rounded-2xl border border-stone-100">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center py-2 text-sm font-medium">
                          <span className="text-stone-800">
                            <span className="font-extrabold text-orange-600 block sm:inline-block sm:w-7">{it.quantity}x</span>
                            {it.name}
                          </span>
                          <span className="font-extrabold text-stone-900">
                            ${(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Coordinates */}
                  <div className="md:col-span-5 flex flex-col gap-3.5 md:border-l md:border-stone-100 md:pl-6">
                    <span className="text-xs font-extrabold text-stone-400 uppercase tracking-widest leading-none">
                      Delivery Details
                    </span>

                    <div className="flex flex-col gap-2.5 font-sans text-sm">
                      <div className="flex items-start gap-2.5 font-medium">
                        <User className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-stone-900 font-bold">{order.customer_name}</span>
                          {isAdmin && (
                            <span className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" /> {order.user_email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 font-medium">
                        <Phone className="h-4.5 w-4.5 text-stone-400 shrink-0" />
                        <span className="text-stone-800 font-semibold">{order.customer_phone}</span>
                      </div>

                      <div className="flex items-start gap-2.5 font-medium">
                        <MapPin className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="text-stone-700 leading-relaxed font-semibold">{order.delivery_address}</span>
                      </div>

                      {order.delivery_notes && (
                        <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl text-xs font-medium text-amber-900 mt-1 leading-relaxed">
                          <span className="font-bold text-amber-950 block mb-0.5">Kitchen/Rider Note:</span>
                          {order.delivery_notes}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Balance Summary Footer Bar */}
                <div className="bg-stone-50/30 border-t border-stone-100 px-6 py-4.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-stone-500">Order Settled Total</span>
                  <span className="text-xl font-extrabold text-brand-600">${order.total_price.toFixed(2)}</span>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
