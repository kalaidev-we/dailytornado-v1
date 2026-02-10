
import React, { useState } from 'react';
import { X, Target, Calendar, ListPlus } from 'lucide-react';
import { Goal, Habit } from '../types';

interface GoalFormProps {
  habits: Habit[];
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ habits, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('100');
  const [targetDate, setTargetDate] = useState('');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate || selectedHabitIds.length === 0) return;

    onSave({
      title,
      description,
      targetValue: parseInt(targetValue) || 100,
      targetDate,
      linkedHabitIds: selectedHabitIds
    });
  };

  const toggleHabitSelection = (id: string) => {
    setSelectedHabitIds(prev => 
      prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Target className="text-accent mr-2" size={24} />
            <h2 className="text-2xl font-bold text-white">Set a Goal</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-obsidian-800 rounded-full text-obsidian-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-obsidian-400 uppercase mb-1">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a Marathon"
              className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-obsidian-400 uppercase mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Finish 50 runs by year end"
              className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-obsidian-400 uppercase mb-1">Total Target</label>
                <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-obsidian-400 uppercase mb-1">Target Date</label>
                <div className="relative">
                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-3 focus:outline-none focus:border-accent [color-scheme:dark]"
                    />
                </div>
              </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-obsidian-400 uppercase mb-2">Link Contributing Habits</label>
             <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {habits.length === 0 ? (
                    <p className="text-sm text-obsidian-500 italic">No habits available. Create a habit first.</p>
                ) : (
                    habits.map(habit => (
                        <div 
                            key={habit.id}
                            onClick={() => toggleHabitSelection(habit.id)}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedHabitIds.includes(habit.id) ? 'bg-accent/10 border-accent' : 'bg-obsidian-800 border-obsidian-700 hover:border-obsidian-500'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${selectedHabitIds.includes(habit.id) ? 'bg-accent border-accent' : 'border-obsidian-500'}`}>
                                {selectedHabitIds.includes(habit.id) && <ListPlus size={12} className="text-white" />}
                            </div>
                            <span className="text-sm text-white">{habit.title}</span>
                        </div>
                    ))
                )}
             </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || selectedHabitIds.length === 0}
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;
