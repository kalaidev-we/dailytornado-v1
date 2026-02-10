
import { Activity, BookOpen, Briefcase, Dumbbell, Heart, Leaf, Zap, Trophy, Medal, Crown, Star, Flame, Target } from 'lucide-react';
import { Category, Account, Achievement } from './types';

export const CATEGORY_ICONS: Record<Category, any> = {
  [Category.HEALTH]: Heart,
  [Category.STUDY]: BookOpen,
  [Category.FITNESS]: Dumbbell,
  [Category.GROWTH]: Zap,
  [Category.WORK]: Briefcase,
  [Category.MINDFULNESS]: Leaf,
};

export const ACHIEVEMENT_ICONS: Record<string, any> = {
  'Trophy': Trophy,
  'Medal': Medal,
  'Crown': Crown,
  'Star': Star,
  'Flame': Flame,
  'Target': Target,
  'Zap': Zap,
  'Activity': Activity
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HEALTH]: 'text-red-400',
  [Category.STUDY]: 'text-blue-400',
  [Category.FITNESS]: 'text-orange-400',
  [Category.GROWTH]: 'text-yellow-400',
  [Category.WORK]: 'text-indigo-400',
  [Category.MINDFULNESS]: 'text-emerald-400',
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_3',
    title: 'Fire Starter',
    description: 'Reach a 3-day streak on any habit.',
    iconName: 'Flame',
    milestoneValue: 3,
    type: 'streak',
    rarity: 'common'
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak on any habit.',
    iconName: 'Medal',
    milestoneValue: 7,
    type: 'streak',
    rarity: 'common'
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Reach a 30-day streak on any habit.',
    iconName: 'Trophy',
    milestoneValue: 30,
    type: 'streak',
    rarity: 'rare'
  },
  {
    id: 'streak_100',
    title: 'Centurion',
    description: 'Reach a 100-day streak on any habit.',
    iconName: 'Crown',
    milestoneValue: 100,
    type: 'streak',
    rarity: 'epic'
  },
  {
    id: 'total_10',
    title: 'Getting Started',
    description: 'Complete 10 total habit logs.',
    iconName: 'Zap',
    milestoneValue: 10,
    type: 'total',
    rarity: 'common'
  },
  {
    id: 'total_100',
    title: 'Dedicated Soul',
    description: 'Complete 100 total habit logs.',
    iconName: 'Star',
    milestoneValue: 100,
    type: 'total',
    rarity: 'rare'
  },
  {
    id: 'total_500',
    title: 'Unstoppable Force',
    description: 'Complete 500 total habit logs.',
    iconName: 'Target',
    milestoneValue: 500,
    type: 'total',
    rarity: 'epic'
  },
  {
    id: 'best_streak_record',
    title: 'Record Breaker',
    description: 'Surpass your previous longest streak.',
    iconName: 'Activity',
    milestoneValue: 1,
    type: 'special',
    rarity: 'legendary'
  }
];

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent/Mortgage',
  'Transport',
  'Dining Out',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Travel',
  'Savings',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other'
];

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  // Expenses
  'Groceries': '#4ade80', // green-400
  'Utilities': '#60a5fa', // blue-400
  'Rent/Mortgage': '#f87171', // red-400
  'Transport': '#fb923c', // orange-400
  'Dining Out': '#facc15', // yellow-400
  'Entertainment': '#a78bfa', // violet-400
  'Shopping': '#e879f9', // fuchsia-400
  'Health': '#2dd4bf', // teal-400
  'Education': '#818cf8', // indigo-400
  'Travel': '#38bdf8', // sky-400
  'Savings': '#34d399', // emerald-400
  'Other': '#94a3b8', // slate-400
  
  // Income
  'Salary': '#22c55e', // green-500
  'Freelance': '#8b5cf6', // violet-500
  'Investment': '#3b82f6', // blue-500
  'Business': '#f59e0b', // amber-500
  'Gift': '#ec4899', // pink-500
  'Transfer': '#64748b' // slate-500
};

export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#64748b', '#78716c', '#1e293b'
];

// Initial seed data if local storage is empty
export const SEED_HABITS = [
  {
    id: '1',
    title: 'Morning Run 5k',
    description: 'Start the day with energy.',
    category: Category.FITNESS,
    createdAt: Date.now(),
    streak: 3,
    bestStreak: 12,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    reminderTime: '07:00',
    completedDates: {},
  },
  {
    id: '2',
    title: 'Read 30 mins',
    description: 'Focus on philosophy or tech.',
    category: Category.STUDY,
    createdAt: Date.now(),
    streak: 0,
    bestStreak: 5,
    lastCompletedDate: null,
    reminderTime: '20:00',
    completedDates: {},
  },
  {
    id: '3',
    title: 'Drink 2L Water',
    description: 'Stay hydrated.',
    category: Category.HEALTH,
    createdAt: Date.now(),
    streak: 1,
    bestStreak: 1,
    lastCompletedDate: new Date().toISOString().split('T')[0], // Today
    reminderTime: '10:00',
    completedDates: { [new Date().toISOString().split('T')[0]]: true },
  },
];

export const SEED_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Cash',
    type: 'cash',
    balance: 150.00,
    color: 'text-emerald-400'
  },
  {
    id: '2',
    name: 'Main Bank',
    type: 'bank',
    balance: 2450.00,
    color: 'text-blue-400'
  },
  {
    id: '3',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 5000.00,
    color: 'text-purple-400'
  }
];
