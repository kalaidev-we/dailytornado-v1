
import React from 'react';
import { Target, Calendar, Trash2 } from 'lucide-react';
import { Goal, Habit } from '../types';
import { CATEGORY_ICONS } from '../constants';

interface GoalCardProps {
  goal: Goal;
  linkedHabits: Habit[];
  onDelete: (id: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, linkedHabits, onDelete }) => {
  const calculateProgress = () => {
    const totalCompletions = linkedHabits.reduce((acc, habit) => {
      return acc + Object.keys(habit.completedDates).length;
    }, 0);
    return Math.min(totalCompletions, goal.targetValue);
  };

  const progress = calculateProgress();
  const percentage = Math.round((progress / goal.targetValue) * 100);
  const remainingDays = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = remainingDays < 0;

  return (
    <div className="bg-obsidian-800 rounded-2xl p-4 border border-obsidian-700 relative group overflow-hidden min-w-[280px] snap-center">
        {/* Background Accent */}
        <div 
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-accent to-blue-500 transition-all duration-1000" 
            style={{ width: `${percentage}%` }}
        />

        <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="font-bold text-white text-lg leading-tight truncate pr-4">{goal.title}</h3>
                <p className="text-xs text-obsidian-400 mt-1">{goal.description}</p>
            </div>
            <div className="p-2 bg-obsidian-900 rounded-lg text-accent">
                <Target size={20} />
            </div>
        </div>

        {/* Linked Habits Icons */}
        <div className="flex -space-x-2 mb-4 overflow-hidden">
            {linkedHabits.map((habit, i) => {
                const Icon = CATEGORY_ICONS[habit.category];
                return (
                    <div key={habit.id} className="w-6 h-6 rounded-full bg-obsidian-700 border border-obsidian-800 flex items-center justify-center text-obsidian-300 z-10" title={habit.title}>
                        <Icon size={12} />
                    </div>
                );
            })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
                <span className="text-obsidian-200">{progress} / {goal.targetValue} done</span>
                <span className="text-accent">{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-obsidian-900 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-obsidian-700/50">
            <div className={`text-xs font-medium flex items-center ${isExpired ? 'text-danger' : 'text-obsidian-400'}`}>
                <Calendar size={12} className="mr-1.5" />
                {isExpired ? 'Ended' : `${remainingDays} days left`}
            </div>
            <button 
                onClick={() => onDelete(goal.id)}
                className="text-obsidian-600 hover:text-danger p-1 rounded transition-colors"
                title="Delete Goal"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
  );
};

export default GoalCard;
