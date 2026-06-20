import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { LogOut, User, ClipboardList, ShoppingBasket, Menu, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { profile, logout, role } = useAuth();
  const { getCartItemsCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-11 w-11 bg-brand-600 rounded-2xl flex items-center justify-center shadow-warm-xs group-hover:bg-brand-700 transition-all duration-300 transform group-hover:rotate-6">
              <ShoppingBasket className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-stone-900 tracking-tight text-xl leading-none">
                FreshMeal
              </span>
              <span className="text-[10px] uppercase font-black text-brand-600 tracking-widest mt-0.5">
                Simple Ordering
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className={`font-semibold text-base transition-colors py-2 px-1 relative ${
                isActive('/') || isActive('/menu')
                  ? 'text-brand-600'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Order Meals
              {(isActive('/') || isActive('/menu')) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-600 rounded-full" />
              )}
            </Link>

            {profile && role === 'admin' ? (
              <Link
                to="/admin"
                className={`font-semibold text-base transition-colors py-2 px-1 relative flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'text-brand-600'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ClipboardList className="h-4.5 w-4.5" />
                Admin Dashboard
                {isActive('/admin') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-600 rounded-full" />
                )}
              </Link>
            ) : profile && (
              <>
                <Link
                  to="/dashboard"
                  className={`font-semibold text-base transition-colors py-2 px-1 relative flex items-center gap-1.5 ${
                    isActive('/dashboard')
                      ? 'text-brand-600'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <User className="h-4.5 w-4.5" />
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-600 rounded-full" />
                  )}
                </Link>

                <Link
                  to="/orders"
                  className={`font-semibold text-base transition-colors py-2 px-1 relative flex items-center gap-1.5 ${
                    isActive('/orders')
                      ? 'text-brand-600'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ClipboardList className="h-4.5 w-4.5" />
                  My Orders
                  {isActive('/orders') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-600 rounded-full" />
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* Tool actions toolbar */}
          <div className="flex items-center gap-3">
            
            {/* View Cart / Plate Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-brand-50 border border-brand-100 hover:bg-brand-100 text-brand-700 hover:text-brand-800 rounded-2xl transition-all duration-155 active:scale-[0.96] flex items-center gap-1.5 cursor-pointer"
              title="Open your selection tray"
            >
              <ShoppingBasket className="h-5.5 w-5.5" />
              <span className="font-extrabold text-sm hidden sm:inline">Tray</span>
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-black ring-3 ring-white animate-scale">
                  {getCartItemsCount()}
                </span>
              )}
            </button>

            {/* User session button profile */}
            {profile ? (
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                
                {/* Admin Identifier Badge */}
                {role === 'admin' && (
                  <span className="hidden lg:flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[10px] uppercase font-black px-2 py-1 rounded-lg">
                    <ShieldAlert className="h-3.5 w-3.5" /> Admin Portal
                  </span>
                )}

                <Link
                  to={role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex flex-col text-right hidden sm:flex hover:text-brand-600 transition-colors"
                >
                  <span className="font-bold text-stone-900 hover:text-brand-600 text-sm leading-none">
                    {profile.full_name || 'My Account'}
                  </span>
                  <span className="text-xs text-stone-500 font-medium leading-none mt-1">
                    {profile.email}
                  </span>
                </Link>

                {/* Sign out key */}
                <button
                  onClick={logout}
                  className="p-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200/50 hover:border-stone-300 transition-colors"
                  title="Logout from account"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="border-l border-stone-200 pl-3">
                <Button size="sm" variant="outline" className="rounded-2xl border-stone-300 font-semibold text-sm">
                  <User className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
