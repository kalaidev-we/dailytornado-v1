
import { Habit, JournalEntry, Account, Transaction, Notification, UnlockedAchievement, Goal } from '../types';
import { SEED_HABITS, SEED_ACCOUNTS, DEFAULT_CATEGORY_COLORS, EXPENSE_CATEGORIES as DEFAULT_EXPENSE_CATS, INCOME_CATEGORIES as DEFAULT_INCOME_CATS } from '../constants';

const HABITS_KEY = 'obsidian_habits_v1';
const GOALS_KEY = 'obsidian_goals_v1';
const JOURNAL_KEY = 'obsidian_journal_v1';
const ACCOUNTS_KEY = 'obsidian_accounts_v1';
const TRANSACTIONS_KEY = 'obsidian_transactions_v1';
const CATEGORY_COLORS_KEY = 'obsidian_category_colors_v1';
const CUSTOM_CATEGORIES_KEY = 'obsidian_custom_categories_v1';
const NOTIFICATIONS_KEY = 'obsidian_notifications_v1';
const SETTINGS_KEY = 'obsidian_settings_v1';
const JOURNAL_DRAFT_KEY = 'obsidian_journal_draft_v1';
const ACHIEVEMENTS_KEY = 'obsidian_achievements_v1';

export const getHabits = (): Habit[] => {
  const stored = localStorage.getItem(HABITS_KEY);
  if (!stored) {
    // Seed initial data
    localStorage.setItem(HABITS_KEY, JSON.stringify(SEED_HABITS));
    return SEED_HABITS;
  }
  return JSON.parse(stored);
};

export const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
};

export const addHabit = (habit: Habit) => {
  const habits = getHabits();
  habits.push(habit);
  saveHabits(habits);
};

export const updateHabit = (updatedHabit: Habit) => {
  const habits = getHabits();
  const index = habits.findIndex(h => h.id === updatedHabit.id);
  if (index !== -1) {
    habits[index] = updatedHabit;
    saveHabits(habits);
  }
};

export const deleteHabit = (id: string) => {
  const habits = getHabits();
  const filtered = habits.filter(h => h.id !== id);
  saveHabits(filtered);
};

// --- Goals ---

export const getGoals = (): Goal[] => {
  const stored = localStorage.getItem(GOALS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveGoals = (goals: Goal[]) => {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const addGoal = (goal: Goal) => {
  const goals = getGoals();
  goals.push(goal);
  saveGoals(goals);
};

export const deleteGoal = (id: string) => {
  const goals = getGoals();
  const filtered = goals.filter(g => g.id !== id);
  saveGoals(filtered);
};

// --- Journal ---

export const getJournalEntries = (): JournalEntry[] => {
  const stored = localStorage.getItem(JOURNAL_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addJournalEntry = (entry: JournalEntry) => {
  const entries = getJournalEntries();
  entries.unshift(entry);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
};

export const deleteJournalEntry = (id: string) => {
  const entries = getJournalEntries();
  const filtered = entries.filter(e => e.id !== id);
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(filtered));
};

// --- Finance Storage ---

export const getAccounts = (): Account[] => {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  }
  return JSON.parse(stored);
};

export const saveAccounts = (accounts: Account[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const updateAccount = (updatedAccount: Account) => {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === updatedAccount.id);
  if (index !== -1) {
    accounts[index] = updatedAccount;
    saveAccounts(accounts);
  }
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addTransaction = (transaction: Transaction) => {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

  // Update account balance
  const accounts = getAccounts();
  const accountIndex = accounts.findIndex(a => a.id === transaction.accountId);
  
  if (accountIndex !== -1) {
    if (transaction.type === 'income') {
      accounts[accountIndex].balance += transaction.amount;
    } else if (transaction.type === 'expense') {
      accounts[accountIndex].balance -= transaction.amount;
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      // Transfer logic
      // 1. Deduct from source
      accounts[accountIndex].balance -= transaction.amount;
      
      // 2. Add to destination
      const destIndex = accounts.findIndex(a => a.id === transaction.toAccountId);
      if (destIndex !== -1) {
        accounts[destIndex].balance += transaction.amount;
      }
    }
    saveAccounts(accounts);
  }
};

export const addAccount = (account: Account) => {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
};

export const deleteTransaction = (id: string) => {
  const transactions = getTransactions();
  const txToDelete = transactions.find(t => t.id === id);
  
  if (txToDelete) {
    // Revert balance
    const accounts = getAccounts();
    const accountIndex = accounts.findIndex(a => a.id === txToDelete.accountId);
    
    if (accountIndex !== -1) {
       if (txToDelete.type === 'income') {
         accounts[accountIndex].balance -= txToDelete.amount;
       } else if (txToDelete.type === 'expense') {
         accounts[accountIndex].balance += txToDelete.amount;
       } else if (txToDelete.type === 'transfer' && txToDelete.toAccountId) {
          // Revert transfer
          // 1. Add back to source
          accounts[accountIndex].balance += txToDelete.amount;
          
          // 2. Deduct from destination
          const destIndex = accounts.findIndex(a => a.id === txToDelete.toAccountId);
          if (destIndex !== -1) {
            accounts[destIndex].balance -= txToDelete.amount;
          }
       }
    }
    // Note: If accountIndex is -1 (account deleted), we only clean up the transaction record.
    saveAccounts(accounts);
  }

  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
};

// --- Category Colors & Management ---

export const getCategoryColors = (): Record<string, string> => {
  const stored = localStorage.getItem(CATEGORY_COLORS_KEY);
  if (!stored) {
    return DEFAULT_CATEGORY_COLORS;
  }
  return { ...DEFAULT_CATEGORY_COLORS, ...JSON.parse(stored) };
};

export const saveCategoryColors = (colors: Record<string, string>) => {
  localStorage.setItem(CATEGORY_COLORS_KEY, JSON.stringify(colors));
};

export const getExpenseCategories = (): string[] => {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!stored) return DEFAULT_EXPENSE_CATS;
    const { expense } = JSON.parse(stored);
    return expense && expense.length > 0 ? expense : DEFAULT_EXPENSE_CATS;
};

export const getIncomeCategories = (): string[] => {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!stored) return DEFAULT_INCOME_CATS;
    const { income } = JSON.parse(stored);
    return income && income.length > 0 ? income : DEFAULT_INCOME_CATS;
};

export const addCustomCategory = (type: 'expense' | 'income', category: string) => {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    let categories = stored ? JSON.parse(stored) : { expense: DEFAULT_EXPENSE_CATS, income: DEFAULT_INCOME_CATS };
    
    if (type === 'expense') {
        if (!categories.expense.includes(category)) {
            categories.expense = [...categories.expense, category];
        }
    } else {
        if (!categories.income.includes(category)) {
            categories.income = [...categories.income, category];
        }
    }
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
};

// --- Notifications ---

export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addNotification = (notification: Notification) => {
  const notifications = getNotifications();
  // Avoid duplicates if rapid firing
  if (!notifications.some(n => n.id === notification.id)) {
      notifications.push(notification);
      // Keep only last 20 notifications to avoid bloat
      if (notifications.length > 20) notifications.shift();
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

export const markNotificationRead = (id: string) => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

export const clearNotifications = () => {
    localStorage.removeItem(NOTIFICATIONS_KEY);
};

// --- Achievements ---

export const getUnlockedAchievements = (): UnlockedAchievement[] => {
  const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const unlockAchievement = (id: string) => {
  const unlocked = getUnlockedAchievements();
  if (!unlocked.some(a => a.id === id)) {
    unlocked.push({ id, unlockedAt: Date.now() });
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    return true;
  }
  return false;
};

// --- Settings ---

export interface AppSettings {
    filterCategory: string;
    activeTab: 'home' | 'journal' | 'expenses' | 'analytics';
}

export const getAppSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { filterCategory: 'All', activeTab: 'home' };
};

export const saveAppSettings = (settings: Partial<AppSettings>) => {
    const current = getAppSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
};

// --- Journal Draft ---

export const getJournalDraft = (): string => {
    return localStorage.getItem(JOURNAL_DRAFT_KEY) || '';
};

export const saveJournalDraft = (draft: string) => {
    localStorage.setItem(JOURNAL_DRAFT_KEY, draft);
};


export const resetApp = () => {
  // Explicitly set to empty arrays to prevent auto-seeding on reload
  localStorage.setItem(HABITS_KEY, JSON.stringify([]));
  localStorage.setItem(GOALS_KEY, JSON.stringify([]));
  localStorage.setItem(JOURNAL_KEY, JSON.stringify([]));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([]));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
  localStorage.setItem(CATEGORY_COLORS_KEY, JSON.stringify({}));
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify({ expense: DEFAULT_EXPENSE_CATS, income: DEFAULT_INCOME_CATS }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({}));
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([]));
  localStorage.removeItem(JOURNAL_DRAFT_KEY);
  
  window.location.reload();
};
