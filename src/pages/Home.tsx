import React, { useState, useEffect } from 'react';
import { supabase, isMockMode } from '../services/supabase';
import { FoodItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { FoodCard } from '../components/food/FoodCard';
import { CategoryFilter } from '../components/food/CategoryFilter';
import { Loader, CardSkeleton } from '../components/ui/Loader';
import { Input, TextArea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlusCircle, Search, Sparkles, Filter, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORIES = ['All', 'Burgers', 'Pizza', 'Sides', 'Salads', 'Desserts', 'Drinks'];

// Preselected gorgeous stock photos for rapid admin entry
const STOCK_PHOTO_PRESETS = [
  { name: 'Classic Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600' },
  { name: 'Pepperoni Pizza', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Crispy Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600' },
  { name: 'Caesar Salad', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600' },
  { name: 'Creamy Gelato', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600' },
  { name: 'Warm Waffle', url: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&q=80&w=600' },
  { name: 'Choco Cake', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600' },
  { name: 'Iced Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Vanilla Shake', url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=600' }
];

export const Home: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin Modal trigger states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Form Field states
  const [foodName, setFoodName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Burgers');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFoods(data || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFoodName('');
    setPrice('');
    setDescription('');
    setCategory('Burgers');
    setImageUrl(STOCK_PHOTO_PRESETS[0].url); // select first default photo
    setIsAvailable(true);
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setFoodName(item.name);
    setPrice(item.price.toString());
    setDescription(item.description);
    setCategory(item.category);
    setImageUrl(item.image_url || '');
    setIsAvailable(item.is_available);
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    const isConfirmed = window.confirm('Are you absolutely sure you want to delete this food item?');
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from('foods').delete().eq('id', id);
      if (error) throw error;
      setFoods(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete food item. Try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!foodName.trim()) errors.foodName = 'Food name is required';
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      errors.price = 'Please enter a valid price code (e.g., 9.99)';
    }
    if (!description.trim()) errors.description = 'Please describe the meal contents';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    try {
      const itemData = {
        name: foodName,
        price: parseFloat(price),
        description,
        category,
        image_url: imageUrl,
        is_available: isAvailable
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('foods')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('foods')
          .insert(itemData);

        if (error) throw error;
      }

      await fetchFoods();
      setFormModalOpen(false);
    } catch (err: any) {
      console.error('Form saving error:', err);
      const isRls = err?.message?.toLowerCase().includes('row-level security') || err?.code === '42501';
      if (isRls) {
        alert('Unable to save food item: Live database Row-Level Security (RLS) policy failed. Please ensure your account role is set to "Admin" in the navbar/dashboard before submitting!');
      } else {
        alert('Unable to save food item. Please confirm server details: ' + (err?.message || err));
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Image upload triggers
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct mock storage upload handler
    try {
      const fileName = `meal_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setImageUrl(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Upload failed, converting to local image:', err);
      // Fallback base64 conversion for total browser preview safety
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter application calculation logic
  const filteredFoods = foods.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Visual Hero Billboard Banner */}
      <div className="bg-radial from-amber-500/10 to-transparent bg-brand-50 border border-brand-100/70 p-6 sm:p-10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-xl text-center sm:text-left z-10 flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 self-center sm:self-start bg-brand-100 border border-brand-200/50 text-brand-800 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Eat Deliciously
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Order Warm Restaurants Handcrafted to Your Door
          </h1>
          <p className="text-stone-500 text-sm font-medium leading-relaxed max-w-md mt-1">
            Choose what you want, provide your details, and wait for the warm chime at your doorbell! Simply tasty, zero tech-stress.
          </p>
        </div>
        <div className="hidden lg:flex shrink-0 transform translate-x-4 translate-y-4 scale-110 pointer-events-none">
          <div className="h-44 w-44 bg-brand-200/20 rounded-full flex items-center justify-center filter blur-3xl absolute inset-0" />
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
            alt="Delicious burger showcase"
            className="h-36 w-36 object-cover rounded-3xl shadow-warm-lg rotate-12 relative z-10 border-4 border-white"
          />
        </div>
      </div>

      {/* Control panel & filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-stone-200/50">
        
        {/* Category select tools */}
        <div className="flex-1 min-w-0">
          <CategoryFilter
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Action controls (Search + Create Button for Admin) */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="relative flex-1 sm:w-64">
            <input
              id="menu-search-input"
              type="text"
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-stone-200 rounded-2xl outline-none transition-colors text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
          </div>

          {isAdmin && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl py-2.5 px-4.5 gap-1.5 shadow-sm text-sm"
              title="Add a new dish to the store"
            >
              <PlusCircle className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Add Dish</span>
            </Button>
          )}

        </div>
      </div>

      {/* Meals food grid list */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
            <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mb-1 text-stone-400">
              <Layers className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-stone-800">No Meals Found</h4>
            <p className="text-stone-500 text-sm font-medium max-w-sm">
              We couldn't find items fitting "{searchQuery || selectedCategory}". Try adjusting filters or searching another keyword.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl mt-1"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <FoodCard
                  item={item}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteItem}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Creative Management Modal (Add/Edit Form) */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingItem ? 'Edit Food Details' : 'Add New Food Item'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            id="food-entry-name"
            label="Dish Name"
            placeholder="e.g., Crispy Pepperoni Slice"
            required
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            error={formErrors.foodName}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="food-entry-price"
              label="Price ($)"
              placeholder="e.g., 9.99"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={formErrors.price}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="food-entry-category" className="text-sm font-bold text-stone-700 tracking-wide">
                Category Group
              </label>
              <select
                id="food-entry-category"
                className="w-full px-4 py-3 bg-white border-2 border-stone-200 focus:border-brand-500 rounded-2xl outline-none transition-colors text-stone-950 font-semibold"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TextArea
            id="food-entry-desc"
            label="Recipe Contents & Description"
            placeholder="e.g., double baked dough with our natural tomato sauce..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={formErrors.description}
          />

          {/* Quick stock photos presets selection for high fidelity design */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-stone-700 tracking-wide">
              Quick Illustration Photo (Click to Choose)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-stone-50 rounded-2xl border-2 border-stone-100">
              {STOCK_PHOTO_PRESETS.map((pst, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(pst.url)}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer relative ring-2 ${
                    imageUrl === pst.url ? 'ring-brand-600 scale-[0.93]' : 'ring-transparent opacity-65 hover:opacity-100'
                  }`}
                  title={pst.name}
                >
                  <img src={pst.url} alt={pst.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual image URL input */}
          <Input
            id="food-entry-url"
            label="Or enter custom image URL"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          {/* Local image file upload field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="food-entry-image-file" className="text-sm font-bold text-stone-750">
              Or Upload Image File from Local Computer
            </label>
            <input
              id="food-entry-image-file"
              type="file"
              accept="image/*"
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-brand-700 hover:file:bg-amber-100 cursor-pointer"
              onChange={handleImageFileChange}
            />
          </div>

          {/* Availability checkbox */}
          <div className="flex items-center gap-3.5 py-2">
            <input
              id="food-entry-is-available"
              type="checkbox"
              className="h-5 w-5 rounded-md border-stone-300 text-brand-600 focus:ring-brand-500 scale-110"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <label htmlFor="food-entry-is-available" className="text-sm font-bold text-stone-700 tracking-wide select-none">
              This meal is currently of active availability (In Stock)
            </label>
          </div>

          <div className="pt-4 border-t border-stone-100 flex gap-3 mt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={formSubmitting}
              className="flex-1"
            >
              {editingItem ? 'Save Updates' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
