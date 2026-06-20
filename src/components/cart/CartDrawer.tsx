import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { X, ShoppingBag, ArrowRight, CircleCheck, Info } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto fill details from profile if user logged in
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Please enter your beautiful name.';
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required so we can call you.';
    } else if (phoneNumber.length < 6) {
      newErrors.phoneNumber = 'Please enter a valid phone number.';
    }
    if (!address.trim()) newErrors.address = 'We need your delivery address to drop off the warm meal.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 'cart') {
      setStep('checkout');
    }
  };

  const handleBackStep = () => {
    if (step === 'checkout') {
      setStep('cart');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Structure order model
      const totalAmount = getCartTotal();
      const orderPayload = {
        user_id: user?.id || 'anonymous',
        user_email: user?.email || 'anonymous@demo.com',
        customer_name: fullName,
        customer_phone: phoneNumber,
        delivery_address: address,
        delivery_notes: notes,
        total_price: totalAmount,
        status: 'pending',
        items: cartItems.map(item => ({
          food_id: item.food_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderPayload);

      if (error) throw error;

      // Local/mock mode returns database records or similar
      const orderId = data?.[0]?.id || 'ord-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setPlacedOrderId(orderId);
      
      // Success state transitions
      clearCart();
      setStep('success');
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      alert('We had trouble sending your order. Please check internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset steps if exited
    onClose();
    setTimeout(() => {
      setStep('cart');
      setPlacedOrderId(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs"
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-3xl border-l border-stone-100"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 rounded-tl-3xl">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                <h3 className="text-xl font-extrabold text-stone-900">Your Tray</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                title="Hide checkout"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Content scroll window */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === 'cart' && (
                <>
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
                      <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                        <ShoppingBag className="h-10 w-10 text-brand-500" />
                      </div>
                      <h4 className="text-xl font-bold text-stone-800">Your Tray is Empty</h4>
                      <p className="text-stone-500 text-sm max-w-xs font-medium">
                        Browse our delicious selection of freshly made meals and add them to your order.
                      </p>
                      <Button onClick={handleClose} className="mt-2 rounded-xl">
                        Explore Menu
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
                        My Selected Items ({cartItems.length})
                      </p>
                      {cartItems.map((item) => (
                        <CartItem
                          key={item.food_id}
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handlePlaceOrder} className="flex flex-col gap-5">
                  <div className="bg-amber-50 border-2 border-amber-200/50 p-4 rounded-2xl flex gap-3">
                    <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-950 text-sm">Simplifying Your Delivery</h5>
                      <p className="text-amber-800 text-xs font-medium leading-relaxed mt-0.5">
                        Please provide a clear phone number and delivery address so we can bring your warm meals quickly!
                      </p>
                    </div>
                  </div>

                  <Input
                    id="checkout-name"
                    label="Full Name (Your Name)"
                    placeholder="e.g., John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                  />

                  <Input
                    id="checkout-phone"
                    label="Phone Number"
                    placeholder="e.g., 555-0199"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    error={errors.phoneNumber}
                  />

                  <TextArea
                    id="checkout-address"
                    label="Delivery Address"
                    placeholder="e.g., Suite 12B, 345 Golden Valley Road, London"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={errors.address}
                  />

                  <TextArea
                    id="checkout-notes"
                    label="Special Cooking or Delivery Notes (Optional)"
                    placeholder="e.g., extra spicy, ring doorbell or leave at door..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </form>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-5">
                  <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center">
                    <CircleCheck className="h-11 w-11 text-green-500 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-stone-900">Order Swirling!</h4>
                    <p className="text-stone-600 font-medium text-sm mt-1">
                      Your order has been recorded successfully! Our chefs are already cooking up your fresh meal.
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl w-full text-left font-sans text-sm flex flex-col gap-2">
                    <div className="flex justify-between border-b border-stone-100 pb-2">
                      <span className="font-semibold text-stone-500">Order Code:</span>
                      <span className="font-bold text-stone-950">{placedOrderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-stone-500">Delivery Status:</span>
                      <span className="font-bold text-orange-600 uppercase tracking-wider text-xs bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md self-center">
                        Preparing
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 font-medium max-w-xs mt-2">
                    You can view all current active orders by clicking "My Orders" in the main navigation menu.
                  </p>

                  <Button onClick={handleClose} className="w-full mt-4 rounded-xl">
                    Back to Menu
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom pricing / buttons wrapper */}
            {cartItems.length > 0 && step !== 'success' && (
              <div className="px-6 py-6 border-t border-stone-100 bg-stone-50 shadow-inner rounded-bl-3xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-bold text-stone-500">Subtotal Amount</span>
                  <span className="text-2xl font-extrabold text-stone-900">${getCartTotal().toFixed(2)}</span>
                </div>

                {step === 'cart' ? (
                  <Button
                    onClick={handleNextStep}
                    className="w-full rounded-2xl py-3.5 bg-brand-600 hover:bg-brand-700 flex justify-center items-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      form="checkout-form"
                      type="submit"
                      isLoading={isSubmitting}
                      className="w-full bg-brand-600 hover:bg-brand-700 rounded-2xl py-4 flex justify-center items-center gap-1 text-lg font-bold"
                    >
                      Place Order - ${getCartTotal().toFixed(2)}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleBackStep} className="w-full">
                      Back to Selected Items
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
