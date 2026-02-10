
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Flame, Clock, MoreVertical, X, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Habit, Category } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  isCompletedToday: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onComplete, onEdit, onDelete, isCompletedToday }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const Icon = CATEGORY_ICONS[habit.category] || CATEGORY_ICONS[Category.GROWTH];
  const colorClass = CATEGORY_COLORS[habit.category] || 'text-white';
  
  // Check for milestone streak
  const isMilestoneStreak = [7, 14, 21, 30, 50, 60, 90, 100, 365].includes(habit.streak);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const history = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []); // Re-calc on mount (or roughly daily if app stays open)

  return (
    <div className={`
      relative overflow-visible rounded-2xl p-5 mb-4 border transition-all duration-300 group
      ${isCompletedToday 
        ? 'bg-obsidian-900/50 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
        : isMilestoneStreak 
            ? 'bg-gradient-to-br from-obsidian-800 to-yellow-900/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
            : 'bg-obsidian-800 border-obsidian-700 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]'}
    `}>
      {isMilestoneStreak && !isCompletedToday && (
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0 mr-2">
          <div className={`
            p-3 rounded-xl bg-obsidian-900 flex-shrink-0 transition-transform duration-300 group-hover:scale-110
            ${isMilestoneStreak ? 'text-yellow-400 bg-yellow-400/10' : colorClass} shadow-lg shadow-black/20
          `}>
            {isMilestoneStreak ? <Sparkles size={24} className="animate-pulse" /> : <Icon size={24} />}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className={`font-bold text-lg leading-tight truncate ${isCompletedToday ? 'text-obsidian-500 line-through decoration-obsidian-700' : 'text-white'}`}>
              {habit.title}
            </h3>
            {habit.description && (
              <p className="text-xs text-obsidian-400 truncate max-w-full mt-1">{habit.description}</p>
            )}
            
            <div className="flex items-center flex-wrap gap-y-2 mt-3">
               <div className="flex items-center mr-4">
                  <span className={`text-xs font-bold flex items-center ${habit.streak > 0 ? (isMilestoneStreak ? 'text-yellow-400' : 'text-orange-400') : 'text-obsidian-500'}`}>
                    <Flame size={14} className={`mr-1 ${habit.streak > 0 ? (isMilestoneStreak ? 'fill-yellow-400 animate-bounce' : 'fill-orange-400 animate-pulse') : ''}`} /> 
                    {habit.streak}
                  </span>
               </div>
               {habit.reminderTime && (
                <div className="flex items-center mr-4">
                  <span className="text-xs text-obsidian-500 flex items-center font-medium">
                    <Clock size={14} className="mr-1" /> {habit.reminderTime}
                  </span>
                </div>
               )}
            </div>

            {/* History Dots - Replaced with Fire for completed */}
            <div className="flex items-center gap-1.5 mt-3 h-5">
                {history.map((date, idx) => {
                    const isDone = !!habit.completedDates[date];
                    const isToday = idx === 6;
                    
                    if (isDone) {
                        return (
                             <div key={date} title={isToday ? "Today" : date} className="animate-scale-in">
                                <Flame 
                                    size={16} 
                                    className={`${isMilestoneStreak ? 'text-yellow-400' : colorClass} fill-current drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]`} 
                                />
                             </div>
                        );
                    }

                    return (
                        <div 
                            key={date}
                            className={`
                                h-1.5 rounded-full transition-all duration-500
                                bg-obsidian-700
                                ${isToday ? 'w-6' : 'w-1.5'}
                                ${isToday ? 'animate-pulse bg-obsidian-600' : ''}
                            `}
                            title={isToday ? "Today" : date}
                        />
                    );
                })}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onComplete(habit.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90
              ${isCompletedToday 
                ? 'bg-success text-obsidian-950 hover:bg-danger hover:text-white rotate-0 animate-pop' 
                : 'bg-obsidian-700 text-obsidian-400 hover:bg-accent hover:text-white hover:-translate-y-1 hover:shadow-accent/30'}
            `}
            title={isCompletedToday ? "Undo completion" : "Complete habit"}
          >
            {isCompletedToday ? (
               <div className="animate-scale-in">
                  {isHovered ? <X size={24} strokeWidth={3} /> : <Check size={24} strokeWidth={3} />}
               </div>
            ) : (
                <Check size={24} strokeWidth={3} />
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-obsidian-500 hover:bg-obsidian-700 hover:text-white transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-0 w-32 bg-obsidian-900 border border-obsidian-700 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in origin-top-right">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(habit); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-obsidian-200 hover:bg-obsidian-800 hover:text-white flex items-center transition-colors"
                >
                  <Edit2 size={14} className="mr-2" /> Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(habit.id); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 flex items-center transition-colors"
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitCard;
