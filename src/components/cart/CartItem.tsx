import React from 'react';
import { OrderItem } from '../../types';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: OrderItem;
  onUpdateQuantity: (foodId: string, qty: number) => void;
  onRemove: (foodId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-3.5 py-4 border-b border-stone-100">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-stone-900 truncate text-base leading-tight">
          {item.name}
        </h5>
        <span className="text-sm font-semibold text-brand-600 block mt-0.5">
          ${item.price.toFixed(2)} each
        </span>
      </div>

      {/* Incrementor/Decrementor */}
      <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 shrink-0">
        <button
          onClick={() => onUpdateQuantity(item.food_id, item.quantity - 1)}
          className="p-1 rounded-lg hover:bg-white text-stone-600 hover:text-stone-900 transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-stone-800">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.food_id, item.quantity + 1)}
          className="p-1 rounded-lg hover:bg-white text-stone-600 hover:text-stone-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Subtotal & trash */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-stone-950 font-bold text-base leading-none w-16 text-right">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        <button
          onClick={() => onRemove(item.food_id)}
          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
