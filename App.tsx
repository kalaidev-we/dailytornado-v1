
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Home, BarChart2, Bell, Book, Wallet, PenLine, Settings, AlertTriangle, Trash2, Target } from 'lucide-react';
import { Habit, Category, Notification, Goal } from './types';
import { getHabits, saveHabits, addHabit as addHabitService, updateHabit, deleteHabit, resetApp, getNotifications, addNotification, markNotificationRead, getAppSettings, saveAppSettings, unlockAchievement, getUnlockedAchievements, getGoals, addGoal, deleteGoal } from './services/storageService';
import { getMotivationalMessage } from './services/aiService';
import { ACHIEVEMENTS } from './constants';
import HabitCard from './components/HabitCard';
import HabitForm from './components/HabitForm';
import GoalCard from './components/GoalCard';
import GoalForm from './components/GoalForm';
import Analytics from './components/Analytics';
import Journal from './components/Journal';
import Expenses from './components/Expenses';
import MotivationalPopup from './components/MotivationalPopup';
import SimulatedNotifications from './components/SimulatedNotifications';

// Utility for streak calculation
const calculateHabitStats = (completedDates: Record<string, boolean>) => {
    const dates = Object.keys(completedDates).sort();
    
    // Best Streak
    let best = 0;
    let curr = 0;
    let prev: Date | null = null;
    
    for (const dateStr of dates) {
        const parts = dateStr.split('-').map(Number);
        // UTC Date to ensure correct diff calc across DST
        const d = new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
        
        if (prev) {
            const diff = (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) {
                curr++;
            } else {
                curr = 1;
            }
        } else {
            curr = 1;
        }
        if (curr > best) best = curr;
        prev = d;
    }

    // Current Streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastCompleted = dates.length > 0 ? dates[dates.length - 1] : null;
    
    let streak = 0;
    if (lastCompleted === today || lastCompleted === yesterday) {
        let expectedDateStr = lastCompleted;
        for (let i = dates.length - 1; i >= 0; i--) {
            if (dates[i] === expectedDateStr) {
                streak++;
                const parts = expectedDateStr.split('-').map(Number);
                const d = new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
                d.setUTCDate(d.getUTCDate() - 1);
                expectedDateStr = d.toISOString().split('T')[0];
            } else {
                break;
            }
        }
    } else {
        // Break streak if not completed today or yesterday
        streak = 0;
    }

    return { streak, bestStreak: best, lastCompletedDate: lastCompleted };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'journal' | 'expenses' | 'analytics'>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');

  // Form States
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isJournalFormOpen, setIsJournalFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  
  // Settings/Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Edit State
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Load persistence data on mount
  useEffect(() => {
    // Settings
    const settings = getAppSettings();
    if (settings.activeTab) setActiveTab(settings.activeTab);
    if (settings.filterCategory) setFilterCategory(settings.filterCategory as Category | 'All');

    // Notifications
    setNotifications(getNotifications());
    
    // Goals
    setGoals(getGoals());

    // Habits & Integrity Check
    const loadedHabits = getHabits();
    let updated = false;
    const syncedHabits = loadedHabits.map(h => {
        const stats = calculateHabitStats(h.completedDates);
        if (stats.streak !== h.streak || stats.bestStreak !== h.bestStreak) {
            updated = true;
            return { ...h, streak: stats.streak, bestStreak: stats.bestStreak, lastCompletedDate: stats.lastCompletedDate };
        }
        return h;
    });

    if (updated) {
        saveHabits(syncedHabits);
    }
    setHabits(syncedHabits);
  }, []);

  // Save Settings when changed
  useEffect(() => {
    saveAppSettings({ activeTab });
  }, [activeTab]);

  useEffect(() => {
    saveAppSettings({ filterCategory: filterCategory as string });
  }, [filterCategory]);

  // Check for Reminders Simulation
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      habits.forEach(async (h) => {
        if (h.reminderTime === timeString && !h.completedDates[now.toISOString().split('T')[0]]) {
           const currentNotifs = getNotifications();
           const alreadyNotified = currentNotifs.some(n => n.relatedHabitId === h.id && n.type === 'reminder' && (Date.now() - n.timestamp) < 60000);
           
           if (!alreadyNotified) {
             const motivation = await getMotivationalMessage(h, 'reminder');
             const newNotif: Notification = {
               id: Date.now().toString(),
               title: `Time to ${h.title}`,
               message: motivation,
               timestamp: Date.now(),
               type: 'reminder',
               read: false,
               relatedHabitId: h.id
             };
             
             addNotification(newNotif);
             setNotifications(prev => [...prev, newNotif]);
           }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [habits]);

  const handleSaveHabit = (data: Partial<Habit>) => {
    if (editingHabit) {
        const updatedHabit: Habit = {
            ...editingHabit,
            title: data.title!,
            description: data.description,
            category: data.category!,
            reminderTime: data.reminderTime
        };
        updateHabit(updatedHabit);
    } else {
        const newHabit: Habit = {
            id: Date.now().toString(),
            title: data.title!,
            description: data.description,
            category: data.category || Category.HEALTH,
            createdAt: Date.now(),
            streak: 0,
            bestStreak: 0,
            lastCompletedDate: null,
            reminderTime: data.reminderTime,
            completedDates: {},
        };
        addHabitService(newHabit);
    }
    
    setHabits(getHabits());
    setIsHabitFormOpen(false);
    setEditingHabit(null);
  };

  const handleSaveGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
      const newGoal: Goal = {
          ...data,
          id: Date.now().toString(),
          createdAt: Date.now()
      };
      addGoal(newGoal);
      setGoals(getGoals());
      setIsGoalFormOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
      deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleEditHabit = (habit: Habit) => {
      setEditingHabit(habit);
      setIsHabitFormOpen(true);
  };

  const onRequestDeleteHabit = (id: string) => {
      setHabitToDelete(id);
  };

  const confirmDeleteHabit = () => {
      if (habitToDelete) {
          deleteHabit(habitToDelete);
          setHabits(prev => prev.filter(h => h.id !== habitToDelete));
          setHabitToDelete(null);
      }
  };

  const handleToggleHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const isCompletedToday = !!habit.completedDates[today];
    const newCompletedDates = { ...habit.completedDates };

    if (isCompletedToday) {
        delete newCompletedDates[today];
    } else {
        newCompletedDates[today] = true;
    }

    const stats = calculateHabitStats(newCompletedDates);

    const updatedHabit: Habit = {
      ...habit,
      completedDates: newCompletedDates,
      streak: stats.streak,
      bestStreak: stats.bestStreak,
      lastCompletedDate: stats.lastCompletedDate
    };

    updateHabit(updatedHabit);
    const allHabits = getHabits();
    setHabits(allHabits);

    if (!isCompletedToday) {
        // Gamification: Check for Achievements
        const totalLogs = allHabits.reduce((acc, curr) => acc + Object.keys(curr.completedDates).length, 0);
        
        ACHIEVEMENTS.forEach(ach => {
            let triggered = false;
            if (ach.type === 'streak' && stats.streak >= ach.milestoneValue) triggered = true;
            if (ach.type === 'total' && totalLogs >= ach.milestoneValue) triggered = true;
            if (ach.type === 'special' && ach.id === 'best_streak_record' && stats.streak > habit.bestStreak) triggered = true;

            if (triggered) {
                const unlocked = unlockAchievement(ach.id);
                if (unlocked) {
                    const achNotif: Notification = {
                        id: `ach-${Date.now()}`,
                        title: `🏆 Achievement Unlocked: ${ach.title}`,
                        message: ach.description,
                        timestamp: Date.now(),
                        type: 'achievement',
                        read: false
                    };
                    addNotification(achNotif);
                    setNotifications(prev => [...prev, achNotif]);
                }
            }
        });

        // AI Motivation & Milestones
        const MILESTONES = [7, 14, 21, 30, 50, 100, 365];
        
        if (MILESTONES.includes(stats.streak)) {
             const msg = await getMotivationalMessage(updatedHabit, 'streak');
             setMotivationalMessage(`🎉 AMAZING! ${stats.streak} Day Streak! ${msg}`);
             
             // Special Milestone Notification
             const milestoneNotif: Notification = {
                 id: `milestone-${Date.now()}`,
                 title: `🌟 ${stats.streak} Day Milestone!`,
                 message: `You've hit a ${stats.streak}-day streak on ${updatedHabit.title}. Keep the fire burning!`,
                 timestamp: Date.now(),
                 type: 'motivation',
                 read: false,
                 relatedHabitId: updatedHabit.id
             };
             addNotification(milestoneNotif);
             setNotifications(prev => [...prev, milestoneNotif]);
        } else if (stats.streak % 3 === 0 && stats.streak > 0) {
            const msg = await getMotivationalMessage(updatedHabit, 'streak');
            setMotivationalMessage(`🔥 ${stats.streak} Day Streak! ${msg}`);
        } else {
            const msg = await getMotivationalMessage(updatedHabit, 'completion');
            setMotivationalMessage(msg);
        }
    }
  };

  const dismissNotification = (id: string) => {
    markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleFabClick = () => {
    switch (activeTab) {
      case 'home':
        setEditingHabit(null);
        setIsHabitFormOpen(true);
        break;
      case 'journal':
        setIsJournalFormOpen(true);
        break;
      case 'expenses':
        setIsExpenseFormOpen(true);
        break;
      case 'analytics':
        break;
    }
  };

  const filteredHabits = habits.filter(h => filterCategory === 'All' || h.category === filterCategory);
  const sortedHabits = [...filteredHabits].sort((a, b) => {
      const today = new Date().toISOString().split('T')[0];
      const aDone = !!a.completedDates[today];
      const bDone = !!b.completedDates[today];
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-obsidian-950 text-white font-sans selection:bg-accent selection:text-white pb-24">
      <SimulatedNotifications notifications={notifications} onDismiss={dismissNotification} />
      <MotivationalPopup message={motivationalMessage} onClose={() => setMotivationalMessage(null)} />

      <header className="sticky top-0 z-30 bg-obsidian-950/80 backdrop-blur-md border-b border-obsidian-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <span className="text-3xl" role="img" aria-label="owl">🦉</span>
           <div>
               <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500">
                 Dailytornado
               </h1>
               <p className="text-xs text-obsidian-500 font-medium leading-none mt-0.5">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </p>
           </div>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'home' && (
            <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
                className="bg-obsidian-900 border border-obsidian-700 text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-accent"
            >
                <option value="All">All Habits</option>
                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="p-2 text-obsidian-400 hover:text-white hover:bg-obsidian-800 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
             {/* Goals Section */}
             <div className="mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-bold text-obsidian-400 uppercase tracking-wider">Focus Goals</h2>
                    <button 
                        onClick={() => setIsGoalFormOpen(true)}
                        className="text-xs text-accent hover:text-white flex items-center transition-colors"
                    >
                        <Plus size={14} className="mr-1" /> Add Goal
                    </button>
                </div>
                {goals.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
                        {goals.map(goal => (
                            <GoalCard 
                                key={goal.id} 
                                goal={goal} 
                                linkedHabits={habits.filter(h => goal.linkedHabitIds.includes(h.id))} 
                                onDelete={handleDeleteGoal}
                            />
                        ))}
                    </div>
                ) : (
                    <div 
                        onClick={() => setIsGoalFormOpen(true)}
                        className="border border-dashed border-obsidian-800 rounded-xl p-4 text-center cursor-pointer hover:bg-obsidian-900 transition-colors"
                    >
                        <p className="text-xs text-obsidian-500">Set an overarching goal to track multiple habits.</p>
                    </div>
                )}
             </div>

             {/* Habits List */}
             <div>
                <h2 className="text-sm font-bold text-obsidian-400 uppercase tracking-wider mb-3 px-1">Habits</h2>
                {sortedHabits.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="mb-4 text-4xl">🌑</p>
                        <p>No habits found.</p>
                        <p className="text-sm">Tap '+' to start your journey.</p>
                    </div>
                ) : (
                    sortedHabits.map(habit => (
                        <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            onComplete={handleToggleHabit} 
                            onEdit={handleEditHabit}
                            onDelete={onRequestDeleteHabit}
                            isCompletedToday={!!habit.completedDates[new Date().toISOString().split('T')[0]]}
                        />
                    ))
                )}
             </div>
          </div>
        )}

        {activeTab === 'journal' && <Journal isFormOpen={isJournalFormOpen} setIsFormOpen={setIsJournalFormOpen} />}
        {activeTab === 'expenses' && <Expenses isFormOpen={isExpenseFormOpen} setIsFormOpen={setIsExpenseFormOpen} />}
        {activeTab === 'analytics' && <div className="animate-fade-in"><Analytics habits={habits} /></div>}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-obsidian-900/90 backdrop-blur-lg border-t border-obsidian-800 pb-safe pt-2 px-2 z-40 h-20">
         <div className="grid grid-cols-5 items-end h-full pb-2">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-accent' : 'text-obsidian-500 hover:text-obsidian-300'}`}>
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Habits</span>
           </button>
           <button onClick={() => setActiveTab('journal')} className={`flex flex-col items-center space-y-1 ${activeTab === 'journal' ? 'text-accent' : 'text-obsidian-500 hover:text-obsidian-300'}`}>
              <Book size={24} strokeWidth={activeTab === 'journal' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Journal</span>
           </button>
           <div className="flex justify-center relative">
             {activeTab !== 'analytics' && (
                <button onClick={handleFabClick} className="absolute -top-10 bg-accent hover:bg-accent-hover text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-transform hover:scale-105 active:scale-95 border-4 border-obsidian-950">
                    {activeTab === 'journal' ? <PenLine size={24} /> : <Plus size={28} />}
                </button>
             )}
           </div>
           <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center space-y-1 ${activeTab === 'expenses' ? 'text-accent' : 'text-obsidian-500 hover:text-obsidian-300'}`}>
              <Wallet size={24} strokeWidth={activeTab === 'expenses' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Wallet</span>
           </button>
           <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center space-y-1 ${activeTab === 'analytics' ? 'text-accent' : 'text-obsidian-500 hover:text-obsidian-300'}`}>
              <BarChart2 size={24} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Stats</span>
           </button>
         </div>
      </div>

      {isHabitFormOpen && (
        <HabitForm initialData={editingHabit} onSave={handleSaveHabit} onCancel={() => { setIsHabitFormOpen(false); setEditingHabit(null); }} />
      )}

      {isGoalFormOpen && (
          <GoalForm 
            habits={habits}
            onSave={handleSaveGoal}
            onCancel={() => setIsGoalFormOpen(false)}
          />
      )}

      {habitToDelete && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-slide-up">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-3 bg-danger/10 rounded-full text-danger mb-4"><Trash2 size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-2">Delete Habit?</h3>
                    <p className="text-sm text-obsidian-400">This action cannot be undone. All streak history for this habit will be lost.</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setHabitToDelete(null)} className="flex-1 py-3 px-4 bg-obsidian-800 hover:bg-obsidian-700 text-white rounded-xl font-semibold transition-colors">Cancel</button>
                    <button onClick={confirmDeleteHabit} className="flex-1 py-3 px-4 bg-danger hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">Delete</button>
                </div>
            </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-slide-up">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-3 bg-danger/10 rounded-full text-danger mb-4"><AlertTriangle size={32} /></div>
                    <h3 className="text-xl font-bold text-white mb-2">Reset App Data?</h3>
                    <p className="text-sm text-obsidian-400">This will permanently delete all your habits, journal entries, and financial data. This action cannot be undone.</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setIsResetModalOpen(false)} className="flex-1 py-3 px-4 bg-obsidian-800 hover:bg-obsidian-700 text-white rounded-xl font-semibold transition-colors">Cancel</button>
                    <button onClick={() => resetApp()} className="flex-1 py-3 px-4 bg-danger hover:bg-red-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center">
                        <Trash2 size={18} className="mr-2" /> Reset
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
