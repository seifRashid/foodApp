import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShoppingBasket } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-md">
        <ShoppingBasket className="h-9 w-9" />
      </div>
      <h2 className="text-3xl font-extrabold text-stone-950">404 - Page Missing</h2>
      <p className="text-stone-500 font-medium text-sm max-w-sm leading-relaxed">
        We couldn't serve that page plate. It might have been devoured or updated.
      </p>
      <Link to="/" className="mt-2 text-decoration-none">
        <Button className="rounded-xl">Back to Warm Menu</Button>
      </Link>
    </div>
  );
};
