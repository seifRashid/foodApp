import React from 'react';
import { ShoppingBasket } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-stone-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Branding branding */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-stone-900 tracking-tight text-base leading-none">
              FreshMeal
            </span>
            <span className="text-[9px] uppercase font-bold text-brand-600 tracking-wider">
              Deliciously Easy
            </span>
          </div>
        </div>

        {/* Legal and informational credits */}
        <p className="text-sm font-medium text-stone-500 text-center md:text-right">
          &copy; {new Date().getFullYear()} FreshMeal. All meal ingredients are locally and ethically sourced. Made with care for our beautiful customers.
        </p>

      </div>
    </footer>
  );
};
