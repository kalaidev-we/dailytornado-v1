import React, { useState } from 'react';
import { X, Plus, ChevronDown, Save } from 'lucide-react';
import { Habit, Category } from '../types';
import { CATEGORY_ICONS } from '../constants';

interface HabitFormProps {
  onSave: (habit: Partial<Habit>) => void;
  onCancel: () => void;
  initialData?: Habit | null;
}

const HabitForm: React.FC<HabitFormProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<Category>(initialData?.category || Category.HEALTH);
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      category,
      reminderTime: reminderTime || undefined,
    });
  };

  const SelectedIcon = CATEGORY_ICONS[category];
  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up sm:animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-obsidian-800 rounded-full text-obsidian-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-obsidian-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 10 pages"
              className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-obsidian-600 transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-obsidian-400 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Motivation or details..."
              rows={2}
              className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-obsidian-600 transition-all resize-none"
            />
          </div>

          <div className="flex space-x-4">
            {/* Category */}
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-obsidian-400 mb-1">Category</label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 flex items-center justify-between focus:outline-none focus:border-accent transition-all"
              >
                <div className="flex items-center">
                  <SelectedIcon size={18} className="mr-2 text-accent" />
                  <span className="truncate">{category}</span>
                </div>
                <ChevronDown size={16} className={`text-obsidian-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-obsidian-800 border border-obsidian-700 rounded-xl shadow-xl overflow-hidden z-50">
                  {Object.values(Category).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); setIsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-obsidian-700 text-obsidian-200 flex items-center transition-colors"
                      >
                        <Icon size={16} className="mr-2 text-obsidian-400" />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Time */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-obsidian-400 mb-1">Reminder</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isEditing ? <Save size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
              {isEditing ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitForm;