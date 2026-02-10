
export enum Category {
  HEALTH = 'Health',
  STUDY = 'Study',
  FITNESS = 'Fitness',
  GROWTH = 'Growth',
  WORK = 'Work',
  MINDFULNESS = 'Mindfulness'
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: Category;
  createdAt: number;
  streak: number;
  bestStreak: number;
  lastCompletedDate: string | null; // ISO Date string YYYY-MM-DD
  reminderTime?: string; // HH:mm format
  completedDates: Record<string, boolean>; // Map of date strings to completion status
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  targetValue: number; // e.g. 100 completions
  linkedHabitIds: string[];
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'reminder' | 'motivation' | 'streak' | 'achievement';
  read: boolean;
  relatedHabitId?: string;
}

export interface DailySummary {
  date: string;
  totalCompleted: number;
  totalHabits: number;
}

// --- Finance Types ---

export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'investment' | 'digital';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  accountId: string; // Source for Expense/Transfer, Dest for Income
  toAccountId?: string; // Dest for Transfer
  date: string; // ISO Date string
  timestamp: number;
  category?: string;
}

// --- Gamification Types ---

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  milestoneValue: number;
  type: 'streak' | 'count' | 'total' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}
