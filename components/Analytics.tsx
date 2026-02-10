
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie 
} from 'recharts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, BookOpen, Activity, PieChart as PieChartIcon, IndianRupee, TrendingUp, Wallet, Trophy, Star, Lock } from 'lucide-react';
import { Habit, Category, JournalEntry, Transaction, Account, UnlockedAchievement, Achievement } from '../types';
import { getJournalEntries, getTransactions, getAccounts, getCategoryColors, getUnlockedAchievements } from '../services/storageService';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLORS, ACHIEVEMENTS, ACHIEVEMENT_ICONS } from '../constants';

interface AnalyticsProps {
  habits: Habit[];
}

const Analytics: React.FC<AnalyticsProps> = ({ habits }) => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setJournalEntries(getJournalEntries());
    setTransactions(getTransactions());
    setAccounts(getAccounts());
    setCategoryColors(getCategoryColors());
    setUnlockedAchievements(getUnlockedAchievements());
  }, []);

  // --- Financial Stats ---
  const financeStats = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const d = new Date(t.timestamp);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
      }
    });

    return { totalBalance, income, expense };
  }, [accounts, transactions]);

  // --- Habit Stats ---
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      let count = 0;
      habits.forEach(h => {
        if (h.completedDates[dateStr]) count++;
      });
      days.push({ name: dayName, completed: count });
    }
    return days;
  }, [habits]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(Category).forEach(c => counts[c] = 0);
    habits.forEach(h => {
        const completedCount = Object.keys(h.completedDates).length;
        if (completedCount > 0) {
            counts[h.category] = (counts[h.category] || 0) + completedCount;
        }
    });
    return Object.entries(counts).map(([subject, A]) => ({ subject, A }));
  }, [habits]);

  const achievementStats = useMemo(() => {
    const totalCount = ACHIEVEMENTS.length;
    const unlockedCount = unlockedAchievements.length;
    const percentage = Math.round((unlockedCount / totalCount) * 100);
    return { totalCount, unlockedCount, percentage };
  }, [unlockedAchievements]);

  // Helper to calc streak for a specific past date
  const getHistoricalStreak = (habit: Habit, dateStr: string) => {
    if (!habit.completedDates[dateStr]) return 0;
    let streak = 0;
    const current = new Date(dateStr);
    
    // Check backwards from the date. Limit loop to prevent issues.
    for(let i=0; i<3650; i++) { 
        const iso = current.toISOString().split('T')[0];
        if (habit.completedDates[iso]) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    
    // Milestones to check against
    const MILESTONES = [7, 14, 30, 50, 100, 365];

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, key: `pad-${i}`, milestone: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      // Check if any habit hit a milestone on this date
      let milestoneReached = null;
      for (const h of habits) {
          const s = getHistoricalStreak(h, dateKey);
          if (MILESTONES.includes(s)) {
              milestoneReached = s;
              break; 
          }
      }

      days.push({ day: i, key: dateKey, milestone: milestoneReached });
    }
    return days;
  }, [viewDate, habits]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const hasData = (dateKey: string) => {
    const hasHabit = habits.some(h => h.completedDates[dateKey]);
    const hasJournal = journalEntries.some(j => j.date === dateKey);
    const hasTransaction = transactions.some(t => t.date.split('T')[0] === dateKey);
    return { hasHabit, hasJournal, hasTransaction };
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-4">Analytics & Awards</h2>

      {/* Achievement Progress Card */}
      <div className="bg-obsidian-800 p-5 rounded-2xl border border-obsidian-700 relative overflow-hidden group hover:border-yellow-500/50 transition-colors shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy size={80} className="text-yellow-500" />
          </div>
          <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                  <p className="text-obsidian-400 text-xs uppercase tracking-wider font-semibold">Trophy Collection</p>
                  <span className="text-sm font-bold text-yellow-500">{achievementStats.unlockedCount} / {achievementStats.totalCount}</span>
              </div>
              <div className="w-full h-3 bg-obsidian-900 rounded-full overflow-hidden border border-obsidian-700">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 ease-out"
                    style={{ width: `${achievementStats.percentage}%` }}
                  ></div>
              </div>
              <p className="text-[10px] text-obsidian-500 mt-2">Unlock more milestones to complete your gallery!</p>
          </div>
      </div>

      {/* Habits & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Chart */}
        <div className="bg-obsidian-800 p-5 rounded-2xl border border-obsidian-700 h-64">
           <h3 className="text-sm font-bold text-obsidian-300 mb-4 flex items-center">
             <Activity size={16} className="mr-2 text-accent" /> Weekly Activity
           </h3>
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={weeklyData}>
               <defs>
                 <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Tooltip 
                 contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                 itemStyle={{ color: '#8b5cf6' }}
               />
               <Area type="monotone" dataKey="completed" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
             </AreaChart>
           </ResponsiveContainer>
        </div>

        {/* Category Radar */}
        <div className="bg-obsidian-800 p-5 rounded-2xl border border-obsidian-700 h-64">
           <h3 className="text-sm font-bold text-obsidian-300 mb-4 flex items-center">
             <PieChartIcon size={16} className="mr-2 text-blue-400" /> Focus Distribution
           </h3>
           <ResponsiveContainer width="100%" height="100%">
             <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
               <PolarGrid stroke="#334155" />
               <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
               <Radar name="Completions" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
             </RadarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-obsidian-800 p-5 rounded-2xl border border-obsidian-700">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-obsidian-300 flex items-center">
               <CalendarIcon size={16} className="mr-2 text-orange-400" /> Activity Heatmap
            </h3>
            <div className="flex items-center gap-4">
               <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-obsidian-700 rounded-lg text-obsidian-400 transition-colors">
                  <ChevronLeft size={20} />
               </button>
               <span className="text-sm font-bold text-white min-w-[120px] text-center">
                  {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-obsidian-700 rounded-lg text-obsidian-400 transition-colors">
                  <ChevronRight size={20} />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-7 gap-1.5 mb-2">
            {['S','M','T','W','T','F','S'].map(d => (
              <div key={d} className="text-[10px] text-center font-bold text-obsidian-500">{d}</div>
            ))}
         </div>

         <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell) => {
               if (!cell.day) return <div key={cell.key} className="h-9"></div>;
               
               const { hasHabit, hasJournal, hasTransaction } = hasData(cell.key);
               const isSelected = selectedDateStr === cell.key;
               const isToday = new Date().toISOString().split('T')[0] === cell.key;
               const isMilestone = !!cell.milestone;

               let intensityClass = 'bg-obsidian-900';
               if (hasHabit) intensityClass = 'bg-accent/40 text-white';
               if (hasHabit && hasJournal) intensityClass = 'bg-accent/70 text-white';
               if (hasHabit && hasJournal && hasTransaction) intensityClass = 'bg-accent text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]';
               
               // Override with gold for milestone days
               if (isMilestone) intensityClass = 'bg-yellow-500 text-obsidian-900 font-bold shadow-[0_0_15px_rgba(234,179,8,0.5)]';

               return (
                  <button
                    key={cell.key}
                    onClick={() => setSelectedDateStr(cell.key)}
                    className={`
                       h-9 rounded-lg flex flex-col items-center justify-center transition-all duration-300 relative overflow-visible
                       ${intensityClass}
                       ${isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-105'}
                       ${isToday ? 'border border-orange-500/50' : ''}
                    `}
                  >
                     <span className="text-xs font-semibold">{cell.day}</span>
                     <div className="flex gap-0.5 mt-0.5">
                        {isMilestone ? (
                            <div className="absolute -top-1 -right-1">
                                <Star size={10} className="fill-white text-white drop-shadow-md" />
                            </div>
                        ) : (
                            <>
                                {hasJournal && <div className="w-1 h-1 rounded-full bg-blue-400"></div>}
                                {hasTransaction && <div className="w-1 h-1 rounded-full bg-success"></div>}
                            </>
                        )}
                     </div>
                  </button>
               );
            })}
         </div>
      </div>

      {/* Achievements Gallery */}
      <div>
         <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Trophy size={20} className="mr-2 text-yellow-500" /> Achievement Gallery
         </h3>
         <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
            {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAchievements.some(u => u.id === ach.id);
                const Icon = ACHIEVEMENT_ICONS[ach.iconName] || Trophy;
                const rarityColors = {
                    common: 'border-obsidian-700 text-obsidian-400',
                    rare: 'border-blue-500/30 text-blue-400',
                    epic: 'border-purple-500/30 text-purple-400',
                    legendary: 'border-yellow-500/30 text-yellow-400'
                };

                return (
                    <div 
                        key={ach.id}
                        className={`
                            relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all group cursor-help
                            ${isUnlocked ? 'bg-obsidian-800' : 'bg-obsidian-900 grayscale opacity-40'}
                            ${isUnlocked ? rarityColors[ach.rarity] : 'border-obsidian-800'}
                        `}
                        title={`${ach.title}: ${ach.description}`}
                    >
                        <div className={`
                            p-2 rounded-xl transition-transform group-hover:scale-110
                            ${isUnlocked ? (ach.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-obsidian-900') : 'bg-obsidian-950'}
                        `}>
                            {isUnlocked ? <Icon size={20} /> : <Lock size={20} />}
                        </div>
                        <span className="text-[8px] font-bold uppercase mt-2 text-center truncate w-full px-1">
                            {ach.title}
                        </span>
                        
                        {isUnlocked && ach.rarity === 'legendary' && (
                            <div className="absolute inset-0 rounded-2xl animate-pulse ring-2 ring-yellow-500/20 pointer-events-none"></div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};

export default Analytics;
