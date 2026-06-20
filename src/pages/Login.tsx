import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShoppingBasket, ShieldCheck, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already logged in, redirect home
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
      const { error } = await register(email, password, fullName);
      if (error) {
        setAuthError(error.message || 'Registration failed. Check password length (min 6 characters).');
      } else {
        navigate('/');
      }
    } else {
      const { error } = await login(email, password);
      if (error) {
        setAuthError(error.message || 'Incorrect email address or password.');
      } else {
        navigate('/');
      }
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
        <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-warm-md mb-4 rotate-6">
          <ShoppingBasket className="h-9 w-9 text-white" />
        </div>

        <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight text-center">
          {isRegister ? 'Create Account' : 'Welcome to FreshMeal'}
        </h2>
        <p className="text-stone-500 font-medium text-sm text-center mt-2 mb-6">
          {isRegister
            ? 'Sign up to place your first food order in seconds!'
            : 'Enter your details below to log in and select meals.'}
        </p>

        {/* Demo profiles help banner */}
        {!isRegister && (
          <div className="bg-amber-50 border border-amber-200/55 rounded-2xl p-4.5 w-full mb-6 text-sm flex gap-2 w-full text-amber-900 leading-relaxed font-medium">
            <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">Demo Credentials Available:</p>
              <ul className="list-disc list-inside mt-1 text-xs text-amber-800 space-y-0.5 font-normal">
                <li>
                  <span className="font-bold">Customer:</span> user@demo.com
                </li>
                <li>
                  <span className="font-bold">Admin Panel:</span> admin@demo.com
                </li>
              </ul>
              <p className="text-[11px] text-amber-700 font-semibold mt-1.5">
                Passwords are local in mock mode - enter any password!
              </p>
            </div>
          </div>
        )}

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
              placeholder="e.g., helper@demo.com"
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
            className="w-full py-4 mt-2 hover:bg-brand-700 bg-brand-600 rounded-2xl"
          >
            {isRegister ? 'Register Account' : 'Log In Now'}
          </Button>
        </form>

        {/* Link navigation */}
        <div className="mt-6 text-sm font-semibold text-stone-600">
          {isRegister ? (
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
          )}
        </div>
      </motion.div>
    </div>
  );
};
