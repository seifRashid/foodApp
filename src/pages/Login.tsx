import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShoppingBasket, ShieldCheck, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  isAdmin?: boolean;
  isRegisterInitial?: boolean;
}

export const Login: React.FC<LoginProps> = ({ isAdmin = false, isRegisterInitial = false }) => {
  const { login, register, user, role } = useAuth();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(isRegisterInitial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  React.useEffect(() => {
    setIsRegister(isRegisterInitial);
  }, [isRegisterInitial]);

  // If already logged in, redirect depending on credentials and user profiles
  React.useEffect(() => {
    if (user) {
      const activeRole = role || (user.email?.toLowerCase().includes('admin') ? 'admin' : 'customer');
      if (activeRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    if (isRegister) {
      if (!fullName.trim()) {
        setAuthError('Please enter your full name.');
        setIsSubmitting(false);
        return;
      }
      const assignedRole = isAdmin ? 'admin' : 'customer';
      const { error } = await register(email, password, fullName, assignedRole);
      if (error) {
        setAuthError(error.message || 'Registration failed. Check password length (min 6 characters).');
      }
    } else {
      // For Admin, verify role is indeed admin if logging in through admin portal or alert them if it's restricted
      const { error } = await login(email, password);
      if (error) {
        setAuthError(error.message || 'Incorrect email address or password.');
      }
    }
    setIsSubmitting(false);
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setAuthError(null);
    setIsSubmitting(true);
    setEmail(demoEmail);
    setPassword('demopass123');
    
    const { error } = await login(demoEmail, 'demopass123');
    if (error) {
      setAuthError(error.message || 'Incorrect email address or password.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-slate-100 rounded-[32px] p-8 shadow-warm-lg flex flex-col items-center"
      >
        {/* Core branding symbol */}
        {isAdmin ? (
          <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-warm-md mb-4 -rotate-3">
            <ShieldCheck className="h-9 w-9 text-brand-500" />
          </div>
        ) : (
          <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-warm-md mb-4 rotate-6">
            <ShoppingBasket className="h-9 w-9 text-white" />
          </div>
        )}

        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight text-center">
          {isAdmin 
            ? (isRegister ? 'Admin Portal Register' : 'Admin Portal Sign In') 
            : (isRegister ? 'Create Account' : 'Welcome to FreshMeal')}
        </h2>
        <p className="text-stone-500 font-medium text-sm text-center mt-2 mb-6">
          {isAdmin 
            ? (isRegister ? 'Create an administrator account to manage food menus.' : 'Access transactions control dashboard and manage food menus.')
            : isRegister
              ? 'Sign up to place your first food order in seconds!'
              : 'Enter your details below to log in and select meals.'}
        </p>

        {/* Demo profiles help banner - filter based on route */}
        <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-5 w-full mb-6 text-sm flex flex-col gap-3.5 text-slate-800 leading-relaxed font-medium">
          <div className="flex gap-2.5">
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-extrabold text-slate-900">
                {isAdmin ? 'Instant Administrator Access:' : 'One-Click Customer Access:'}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isAdmin 
                  ? 'Click key below to log in with pre-seeded Admin credentials:'
                  : 'Click key below to instantly log into standard Guest view:'}
              </p>
            </div>
          </div>
          
          <div className="w-full mt-1">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@demo.com')}
                className="w-full flex flex-col items-center justify-center p-3.5 bg-slate-900 hover:bg-slate-800 border border-transparent rounded-2xl shadow-warm-xs text-center transition-all cursor-pointer text-white"
              >
                <span className="text-xs font-black uppercase tracking-widest text-brand-400">Launch Admin Console</span>
                <span className="text-[10px] text-slate-350 mt-1 font-mono">admin@demo.com</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleQuickLogin('user@demo.com')}
                className="w-full flex flex-col items-center justify-center p-3.5 bg-white hover:bg-orange-50 border border-slate-100 hover:border-brand-500/30 rounded-2xl shadow-warm-xs text-center transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-slate-700 hover:text-brand-600 uppercase tracking-widest">Sign In as Guest</span>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">user@demo.com</span>
              </button>
            )}
          </div>
        </div>

        {/* Error alert frame banner */}
        {authError && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4.5 py-3.5 rounded-2xl text-xs font-bold flex gap-2.5 items-start mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {isRegister && (
            <div className="relative">
              <Input
                id="login-name"
                label="Full Name"
                placeholder="e.g., John Doe"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <User className="absolute right-4.5 top-11.5 h-4.5 w-4.5 text-stone-400" />
            </div>
          )}

          <div className="relative">
            <Input
              id="login-email"
              label="Email Address"
              placeholder={isAdmin ? "admin@demo.com" : "e.g., helper@demo.com"}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute right-4.5 top-11.5 h-4.5 w-4.5 text-stone-400" />
          </div>

          <div className="relative">
            <Input
              id="login-password"
              label="Password"
              placeholder="Min. 6 characters"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute right-4.5 top-11.5 h-4.5 w-4.5 text-stone-400" />
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className={`w-full py-4 mt-2 rounded-2xl ${
              isAdmin 
                ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                : 'hover:bg-brand-700 bg-brand-600'
            }`}
          >
            {isAdmin 
              ? (isRegister ? 'Register Administrator Account' : 'Administrator Login') 
              : isRegister ? 'Register Account' : 'Log In Now'}
          </Button>
        </form>

        {/* Link navigation */}
        <div className="mt-6 text-sm font-semibold text-stone-600 w-full text-center">
          {isAdmin ? (
            <div className="flex flex-col items-center gap-3">
              {isRegister ? (
                <span>
                  Already joined admin pool?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(false);
                      setAuthError(null);
                    }}
                    className="text-stone-900 hover:text-black font-extrabold focus:outline-none cursor-pointer"
                  >
                    Log In
                  </button>
                </span>
              ) : (
                <span>
                  Need admin access?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setAuthError(null);
                    }}
                    className="text-stone-900 hover:text-black font-extrabold focus:outline-none cursor-pointer"
                  >
                    Register Admin
                  </button>
                </span>
              )}
              <div className="w-full border-t border-slate-100 pt-3.5 mt-1">
                <span className="text-xs text-slate-400 font-medium">Looking for customer portal? </span>
                <a
                  href="/login"
                  className="text-brand-600 hover:text-brand-700 font-bold block mt-1 text-xs"
                >
                  Go to Guest Login
                </a>
              </div>
            </div>
          ) : isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setAuthError(null);
                }}
                className="text-brand-600 hover:text-brand-700 font-bold focus:outline-none cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span>
                New to FreshMeal?{' '}
                <button
                  onClick={() => {
                    setIsRegister(true);
                    setAuthError(null);
                  }}
                  className="text-brand-600 hover:text-brand-700 font-bold focus:outline-none cursor-pointer"
                >
                  Create Account
                </button>
              </span>
              <div className="w-full border-t border-slate-100 pt-4 text-center">
                <span className="text-xs text-slate-400 font-medium">Are you an administrator? </span>
                <a
                  href="/admin/login"
                  className="text-slate-700 hover:text-slate-950 font-bold block mt-1 text-xs"
                >
                  Access Administration Portal &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
