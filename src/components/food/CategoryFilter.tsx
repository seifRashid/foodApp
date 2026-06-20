import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div id="category-filter" className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-150 active:scale-[0.97] border-2 cursor-pointer ${
              isSelected
                ? 'bg-brand-600 border-brand-600 text-white shadow-warm-xs'
                : 'bg-white border-stone-200 hover:border-brand-500 hover:bg-amber-50/10 text-stone-700'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};
