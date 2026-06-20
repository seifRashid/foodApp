import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Edit, Trash2, Eye, CircleCheck, CircleAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface FoodCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (id: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onEdit, onDelete }) => {
  const { addToCart } = useCart();
  const { role } = useAuth();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const isAdmin = role === 'admin';

  return (
    <>
      <div 
        id={`food-card-${item.id}`}
        className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-warm-xs hover:shadow-warm-md transition-all duration-300 flex flex-col group h-full"
      >
        {/* Visual Badge for Availability */}
        <div className="relative aspect-square overflow-hidden bg-orange-50/50">
          <img
            src={item.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600'}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          
          {/* Category Tag */}
          <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-brand-600 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
            {item.category}
          </span>

          {/* Availability Status Cover */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs tracking-wider uppercase font-extrabold px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 animate-pulse">
                <CircleAlert className="h-4 w-4" /> Out Of Stock
              </span>
            </div>
          )}
        </div>

        {/* content */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
              <h4 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-brand-600 transition-colors">
                {item.name}
              </h4>
              <span className="text-2xl font-black text-slate-900 whitespace-nowrap leading-none pt-0.5">
                ${item.price.toFixed(2)}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed mb-4">
              {item.description || 'No description provided.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-2">
            {/* User Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailModalOpen(true)}
              className="flex-1 rounded-2xl py-2.5"
            >
              <Eye className="h-4 w-4" /> Details
            </Button>

            {item.is_available ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => addToCart(item)}
                className="flex-1 rounded-2xl py-2.5 gap-1 bg-brand-600 hover:bg-brand-700"
              >
                <ShoppingBag className="h-4 w-4" /> Add
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="flex-1 rounded-2xl py-2.5 bg-slate-100 text-slate-400"
              >
                Unavailable
              </Button>
            )}

            {/* Admin Management Toolbar */}
            {isAdmin && (
              <div className="flex gap-1.5 ml-1 pt-0.5 border-l border-slate-200 pl-2">
                <button
                  onClick={() => onEdit && onEdit(item)}
                  title="Edit food details"
                  className="p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(item.id)}
                  title="Delete food item"
                  className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={item.name}
      >
        <div className="flex flex-col gap-5">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-stone-100 shadow-xs relative">
            <img
              src={item.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600'}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 right-3 bg-brand-600 text-white font-extrabold text-lg px-4 py-2 rounded-2xl shadow-md">
              ${item.price.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold px-3 py-1 rounded-full">
                Category: {item.category}
              </span>
              {item.is_available ? (
                <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CircleCheck className="h-3.5 w-3.5" /> Available Now
                </span>
              ) : (
                <span className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CircleAlert className="h-3.5 w-3.5" /> Temporary Out of Stock
                </span>
              )}
            </div>

            <p className="text-stone-700 mt-2 text-base leading-relaxed font-medium">
              {item.description || 'No description provided.'}
            </p>
          </div>

          <div className="pt-4 border-t border-stone-100 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDetailModalOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
            {item.is_available ? (
              <Button
                variant="primary"
                onClick={() => {
                  addToCart(item);
                  setDetailModalOpen(false);
                }}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                <ShoppingBag className="h-5 w-5" /> Add to Order
              </Button>
            ) : (
              <Button variant="primary" disabled className="flex-1 bg-stone-100 text-stone-400">
                Unavailable
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
