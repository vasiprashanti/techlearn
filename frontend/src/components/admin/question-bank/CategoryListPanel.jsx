import React from 'react';
import CategoryCard from './CategoryCard';
import QuestionBankState from '../../AdminDashbaord/QuestionBankState';

export const CategoryListPanel = ({ categories = [], selectedCategoryIds = [], onSelectToggle, onEditCategory, onDeleteCategory, onViewCategory, onAddCategory }) => {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id || category._id}
            category={category}
            selected={selectedCategoryIds.includes(category.id || category._id)}
            onSelectToggle={onSelectToggle}
            onEdit={onEditCategory}
            onDelete={onDeleteCategory}
            onView={onViewCategory}
          />
        ))}

        {categories.length === 0 && (
          <div className="xl:col-span-3">
            <QuestionBankState
              title="No categories yet"
              message="Create a category to start organizing questions by Coding, MCQ, or Notes."
              actionLabel="Add Category"
              onAction={onAddCategory}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryListPanel;
