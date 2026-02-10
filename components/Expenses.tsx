
import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, CreditCard, IndianRupee, PieChart as PieChartIcon, Trash2, X, Landmark, Tag, Check, ArrowUpDown, Upload, Download, ArrowRightLeft, Search, Save, History, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Account, Transaction, AccountType, TransactionType } from '../types';
import { getAccounts, getTransactions, addTransaction, addAccount, deleteTransaction, updateAccount, getCategoryColors, saveCategoryColors, getExpenseCategories, getIncomeCategories, addCustomCategory } from '../services/storageService';
import { DEFAULT_CATEGORY_COLORS, COLOR_PALETTE } from '../constants';

interface ExpensesProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

const ACCOUNT_COLORS = [
  { name: 'Blue', class: 'text-blue-400' },
  { name: 'Violet', class: 'text-accent' },
  { name: 'Emerald', class: 'text-emerald-400' },
  { name: 'Orange', class: 'text-orange-400' },
  { name: 'Pink', class: 'text-pink-400' },
  { name: 'Cyan', class: 'text-cyan-400' },
  { name: 'Red', class: 'text-red-400' },
  { name: 'Yellow', class: 'text-yellow-400' },
];

const Expenses: React.FC<ExpensesProps> = ({ isFormOpen, setIsFormOpen }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  
  // Sorting & Searching State
  const [sortOption, setSortOption] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Account Details Modal State
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editBalance, setEditBalance] = useState('');

  // Form State for Transaction
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAccountId, setTxAccountId] = useState('');
  const [txToAccountId, setTxToAccountId] = useState(''); // For Transfer
  const [txCategory, setTxCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form State for Account
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accBalance, setAccBalance] = useState('');
  const [accColor, setAccColor] = useState(ACCOUNT_COLORS[0].class);
  
  // Category Color Editing State
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Set default account when opening form if none selected
  useEffect(() => {
    if (isFormOpen) {
        if (!txAccountId && accounts.length > 0) {
            setTxAccountId(accounts[0].id);
        }
        if (txType !== 'transfer' && !txCategory) {
            // Wait for categories to load
            const cats = txType === 'expense' ? getExpenseCategories() : getIncomeCategories();
            setTxCategory(cats[0] || '');
        }
        setIsAddingNewCategory(false);
        setNewCategoryName('');
    }
  }, [isFormOpen, accounts, txAccountId, txType]); // Removed txCategory dependency to avoid reset loops

  const loadData = () => {
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    setCategoryColors(getCategoryColors());
    setExpenseCategories(getExpenseCategories());
    setIncomeCategories(getIncomeCategories());
  };

  const handleColorChange = (category: string, color: string) => {
    const newColors = { ...categoryColors, [category]: color };
    setCategoryColors(newColors);
    saveCategoryColors(newColors);
  };

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const monthlyFlow = useMemo(() => {
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

    return { income, expense };
  }, [transactions]);

  // Chart Data: Expenses by Category for Current Month
  const expenseStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const stats: Record<string, number> = {};
    let total = 0;
    
    transactions.forEach(t => {
        const d = new Date(t.timestamp);
        if (t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const cat = t.category || 'Other';
            stats[cat] = (stats[cat] || 0) + t.amount;
            total += t.amount;
        }
    });
    
    return Object.entries(stats)
        .map(([name, value]) => ({ 
            name, 
            value, 
            percentage: (value / total) * 100,
            color: categoryColors[name] || DEFAULT_CATEGORY_COLORS[name] || '#94a3b8'
        }))
        .sort((a, b) => b.value - a.value);
  }, [transactions, categoryColors]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.type === 'transfer' && 'transfer'.includes(query))
      );
    }

    // Sort
    switch (sortOption) {
        case 'date-desc':
            return result.sort((a, b) => b.timestamp - a.timestamp);
        case 'date-asc':
            return result.sort((a, b) => a.timestamp - b.timestamp);
        case 'amount-desc':
            return result.sort((a, b) => b.amount - a.amount);
        case 'amount-asc':
            return result.sort((a, b) => a.amount - b.amount);
        case 'type-income':
            return result.sort((a, b) => {
                if (a.type === b.type) return b.timestamp - a.timestamp;
                return a.type === 'income' ? -1 : 1;
            });
        case 'type-expense':
            return result.sort((a, b) => {
                if (a.type === b.type) return b.timestamp - a.timestamp;
                return a.type === 'expense' ? -1 : 1;
            });
        default:
            return result;
    }
  }, [transactions, sortOption, searchQuery]);

  // Selected Account Transactions
  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    return transactions.filter(t => 
        t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id
    ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
  }, [selectedAccount, transactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txAccountId) return;
    
    // Validations
    if (txType === 'transfer') {
        if (!txToAccountId || txAccountId === txToAccountId) return; // Must have diff dest
    } else {
        if (!txTitle) return; // Title needed for Income/Expense
    }

    let finalCategory = txCategory;

    // Handle new category addition
    if (isAddingNewCategory && newCategoryName.trim()) {
        const catName = newCategoryName.trim();
        addCustomCategory(txType === 'expense' ? 'expense' : 'income', catName);
        finalCategory = catName;
    }

    const newTx: Transaction = {
      id: Date.now().toString(),
      title: txType === 'transfer' ? 'Transfer' : txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      accountId: txAccountId,
      toAccountId: txType === 'transfer' ? txToAccountId : undefined,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      category: txType === 'transfer' ? 'Transfer' : (finalCategory || 'Other')
    };

    addTransaction(newTx);
    loadData();
    setIsFormOpen(false);
    setTxTitle('');
    setTxAmount('');
    setTxCategory('');
    setTxType('expense');
    setTxToAccountId('');
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;

    const newAcc: Account = {
      id: Date.now().toString(),
      name: accName,
      type: accType,
      balance: parseFloat(accBalance) || 0,
      color: accColor
    };

    addAccount(newAcc);
    loadData();
    setShowAddAccount(false);
    setAccName('');
    setAccBalance('');
    setAccColor(ACCOUNT_COLORS[0].class);
  };

  const handleDeleteTx = (id: string) => {
    deleteTransaction(id);
    loadData();
  };

  const handleAccountClick = (acc: Account) => {
      setSelectedAccount(acc);
      setEditBalance(acc.balance.toString());
  };

  const handleSaveBalance = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAccount) return;
      
      const newBalance = parseFloat(editBalance);
      if (isNaN(newBalance)) return;

      const updatedAccount = { ...selectedAccount, balance: newBalance };
      updateAccount(updatedAccount);
      setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
      setSelectedAccount(updatedAccount);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    // Headers
    const headers = ['Date', 'Time', 'Title', 'Type', 'Amount', 'Category', 'From Account', 'To Account'];
    
    // Sort by date descending for export
    const exportData = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

    const rows = exportData.map(tx => {
      const fromAccount = accounts.find(a => a.id === tx.accountId)?.name || 'Unknown';
      const toAccount = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId)?.name : '';
      const dateObj = new Date(tx.timestamp);
      const date = dateObj.toLocaleDateString();
      const time = dateObj.toLocaleTimeString();
      
      // Escape fields that might contain commas
      const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;

      return [
        date,
        time,
        escape(tx.title),
        tx.type,
        tx.amount.toFixed(2),
        escape(tx.category || ''),
        escape(fromAccount),
        escape(toAccount || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dailytornado_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'cash': return <IndianRupee size={18} />;
      case 'investment': return <TrendingUp size={18} />;
      case 'digital': return <Wallet size={18} />;
      default: return <Landmark size={18} />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-white mb-4">Finance & Assets</h2>

      {/* Overview Card */}
      <div className="bg-gradient-to-br from-obsidian-800 to-obsidian-900 p-6 rounded-2xl border border-obsidian-700 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <PieChartIcon size={100} />
         </div>
         <div className="relative z-10">
           <p className="text-obsidian-400 text-xs uppercase tracking-wider font-semibold">Net Worth</p>
           <h3 className="text-4xl font-bold text-white mt-2">{formatCurrency(totalBalance)}</h3>
           
           <div className="flex gap-6 mt-6">
             <div>
                <div className="flex items-center text-success mb-1">
                   <div className="p-1 bg-success/20 rounded-full mr-2">
                     <TrendingUp size={12} />
                   </div>
                   <span className="text-xs font-medium">Income (Mo)</span>
                </div>
                <p className="text-lg font-semibold text-white">{formatCurrency(monthlyFlow.income)}</p>
             </div>
             <div>
                <div className="flex items-center text-danger mb-1">
                   <div className="p-1 bg-danger/20 rounded-full mr-2">
                     <TrendingDown size={12} />
                   </div>
                   <span className="text-xs font-medium">Expense (Mo)</span>
                </div>
                <p className="text-lg font-semibold text-white">{formatCurrency(monthlyFlow.expense)}</p>
             </div>
           </div>
         </div>
      </div>

      {/* Accounts List */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h3 className="font-semibold text-white">Accounts</h3>
           <button 
             onClick={() => setShowAddAccount(true)}
             className="text-xs text-accent hover:text-white transition-colors flex items-center"
           >
             <Plus size={14} className="mr-1" /> Add Account
           </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
           {accounts.map(acc => (
             <div 
               key={acc.id} 
               onClick={() => handleAccountClick(acc)}
               className="min-w-[160px] bg-obsidian-800 p-4 rounded-xl border border-obsidian-700 flex flex-col justify-between snap-center hover:border-obsidian-600 transition-colors cursor-pointer active:scale-95 duration-200"
             >
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-2 bg-obsidian-900 rounded-lg ${acc.color || 'text-white'}`}>
                      {getAccountIcon(acc.type)}
                   </div>
                   <span className="text-[10px] uppercase text-obsidian-500 font-bold tracking-wider">{acc.type}</span>
                </div>
                <div>
                   <p className="text-xs text-obsidian-300 truncate font-medium">{acc.name}</p>
                   <p className="text-lg font-bold text-white">{formatCurrency(acc.balance)}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Monthly Spending Chart */}
      {expenseStats.length > 0 && (
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl p-5 shadow-lg">
             <h3 className="text-lg font-semibold text-white mb-4">Monthly Spending</h3>
             <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expenseStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3">
                    {expenseStats.slice(0, 5).map((stat, index) => (
                        <div key={stat.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                <span className="text-sm text-obsidian-200">{stat.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-obsidian-400 font-medium">{Math.round(stat.percentage)}%</span>
                                <span className="text-sm font-semibold text-white">{formatCurrency(stat.value)}</span>
                            </div>
                        </div>
                    ))}
                    {expenseStats.length > 5 && (
                        <p className="text-xs text-center text-obsidian-500 mt-2 italic">
                            + {expenseStats.length - 5} other categories
                        </p>
                    )}
                </div>
             </div>
          </div>
      )}

      {/* Transactions List */}
      <div className="bg-obsidian-900 border border-obsidian-800 rounded-xl p-5 animate-fade-in">
         <div className="flex flex-col gap-4 mb-4 border-b border-obsidian-800 pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h4 className="text-obsidian-400 text-xs uppercase tracking-wider font-semibold">Transactions</h4>
                    <div className="relative group">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="bg-obsidian-800 text-xs text-obsidian-400 border border-obsidian-700 rounded-md py-1 pl-2 pr-6 appearance-none focus:outline-none focus:border-accent cursor-pointer hover:text-white transition-colors"
                        >
                            <option value="date-desc">Newest</option>
                            <option value="date-asc">Oldest</option>
                            <option value="amount-desc">High Amount</option>
                            <option value="amount-asc">Low Amount</option>
                            <option value="type-income">Income</option>
                            <option value="type-expense">Expenses</option>
                        </select>
                        <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-obsidian-500">
                            <ArrowUpDown size={10} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowCategorySettings(true)}
                        className="bg-obsidian-800 hover:bg-obsidian-700 text-obsidian-400 hover:text-white p-1.5 rounded-lg transition-colors"
                        title="Category Settings"
                    >
                        <Palette size={16} />
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="bg-obsidian-800 hover:bg-obsidian-700 text-obsidian-400 hover:text-white p-1.5 rounded-lg transition-colors"
                        title="Export to CSV"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                     onClick={() => {
                        setTxAccountId(accounts[0]?.id || '');
                        setTxType('expense');
                        setTxCategory(expenseCategories[0] || '');
                        setIsFormOpen(true);
                     }}
                     className="bg-obsidian-800 hover:bg-obsidian-700 text-white p-1.5 rounded-lg transition-colors"
                    >
                       <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-obsidian-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or category..."
                    className="w-full bg-obsidian-800 border border-obsidian-700 text-obsidian-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-obsidian-600 transition-all"
                />
            </div>
         </div>

         <div className="space-y-3">
            {filteredAndSortedTransactions.length === 0 ? (
                <p className="text-center text-obsidian-500 text-sm py-4">
                    {searchQuery ? 'No matching transactions found.' : 'No transactions found.'}
                </p>
            ) : (
                filteredAndSortedTransactions.slice(0, 10).map(tx => {
                    const account = accounts.find(a => a.id === tx.accountId);
                    const toAccount = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;
                    const isTransfer = tx.type === 'transfer';
                    const categoryName = tx.category || 'Other';
                    const catColor = categoryColors[categoryName] || DEFAULT_CATEGORY_COLORS[categoryName] || '#94a3b8';

                    return (
                        <div key={tx.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isTransfer ? 'bg-blue-500/10 text-blue-400' : tx.type === 'income' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                    {isTransfer ? <ArrowRightLeft size={16} /> : tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium">
                                        {isTransfer && toAccount 
                                            ? `To: ${toAccount.name}` 
                                            : tx.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div className="flex items-center bg-obsidian-800 px-1.5 py-0.5 rounded border border-obsidian-700">
                                         <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: isTransfer ? '#64748b' : catColor }}></div>
                                         <span className="text-[10px] text-obsidian-400">
                                            {tx.category || 'Other'}
                                          </span>
                                      </div>
                                      <span className="text-xs text-obsidian-500">
                                        {new Date(tx.timestamp).toLocaleDateString()}
                                      </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className={`font-semibold text-sm ${isTransfer ? 'text-white' : tx.type === 'income' ? 'text-success' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                    <span className="text-[10px] text-obsidian-500">
                                        {isTransfer ? `From: ${account?.name}` : account?.name}
                                    </span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTx(tx.id)}
                                  className="text-obsidian-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                                >
                                   <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
         </div>
      </div>

      {/* Category Settings Modal */}
      {showCategorySettings && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <Palette className="mr-2 text-accent" size={20} />
                        Category Colors
                    </h3>
                    <button onClick={() => setShowCategorySettings(false)}><X className="text-obsidian-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Expense Categories */}
                    <div>
                        <h4 className="text-xs font-bold text-obsidian-400 uppercase tracking-wider mb-3">Expenses</h4>
                        <div className="space-y-2">
                            {expenseCategories.map(cat => {
                                const currentColor = categoryColors[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#94a3b8';
                                const isExpanded = expandedCategory === cat;
                                
                                return (
                                    <div key={cat} className="bg-obsidian-800 rounded-lg border border-obsidian-700 overflow-hidden">
                                        <button 
                                            onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-obsidian-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full shadow-sm border border-white/10" style={{ backgroundColor: currentColor }}></div>
                                                <span className="text-sm font-medium text-white">{cat}</span>
                                            </div>
                                            {isExpanded ? <ChevronUp size={16} className="text-obsidian-400"/> : <ChevronDown size={16} className="text-obsidian-400"/>}
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="p-3 border-t border-obsidian-700 bg-obsidian-900/50">
                                                <p className="text-[10px] text-obsidian-500 mb-2">Select a color:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {COLOR_PALETTE.map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => handleColorChange(cat, color)}
                                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${currentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                                            style={{ backgroundColor: color }}
                                                            aria-label={`Select ${color}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Income Categories */}
                    <div>
                        <h4 className="text-xs font-bold text-obsidian-400 uppercase tracking-wider mb-3">Income</h4>
                        <div className="space-y-2">
                             {incomeCategories.map(cat => {
                                const currentColor = categoryColors[cat] || DEFAULT_CATEGORY_COLORS[cat] || '#94a3b8';
                                const isExpanded = expandedCategory === cat;
                                
                                return (
                                    <div key={cat} className="bg-obsidian-800 rounded-lg border border-obsidian-700 overflow-hidden">
                                        <button 
                                            onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-obsidian-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full shadow-sm border border-white/10" style={{ backgroundColor: currentColor }}></div>
                                                <span className="text-sm font-medium text-white">{cat}</span>
                                            </div>
                                            {isExpanded ? <ChevronUp size={16} className="text-obsidian-400"/> : <ChevronDown size={16} className="text-obsidian-400"/>}
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="p-3 border-t border-obsidian-700 bg-obsidian-900/50">
                                                <p className="text-[10px] text-obsidian-500 mb-2">Select a color:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {COLOR_PALETTE.map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => handleColorChange(cat, color)}
                                                            className={`w-8 h-8 rounded-full border-2 transition-transform ${currentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                                            style={{ backgroundColor: color }}
                                                            aria-label={`Select ${color}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up h-[85vh] sm:h-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-obsidian-800 rounded-lg ${selectedAccount.color || 'text-white'}`}>
                            {getAccountIcon(selectedAccount.type)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{selectedAccount.name}</h3>
                            <p className="text-xs text-obsidian-400 uppercase tracking-wider">{selectedAccount.type}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedAccount(null)}><X className="text-obsidian-400" /></button>
                </div>
                
                {/* Balance Editor */}
                <form onSubmit={handleSaveBalance} className="mb-6 bg-obsidian-800 p-4 rounded-xl border border-obsidian-700">
                    <label className="text-xs text-obsidian-400 font-semibold uppercase block mb-2">Current Balance</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <IndianRupee size={16} className="absolute left-3 top-3 text-obsidian-500" />
                            <input 
                                type="number" step="0.01" 
                                value={editBalance} onChange={e => setEditBalance(e.target.value)}
                                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-accent font-bold"
                            />
                        </div>
                        <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-4 rounded-lg flex items-center transition-colors">
                            <Save size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-obsidian-500 mt-2">
                        Updating balance here will not create a transaction record.
                    </p>
                </form>

                {/* History */}
                <div className="flex-1 overflow-y-auto">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                        <History size={16} className="mr-2 text-obsidian-400" />
                        Last 30 Transactions
                    </h4>
                    
                    <div className="space-y-2">
                        {accountTransactions.length === 0 ? (
                            <p className="text-center text-obsidian-500 text-sm py-4">No activity found.</p>
                        ) : (
                            accountTransactions.map(tx => {
                                const isIncome = tx.type === 'income';
                                const isTransferIn = tx.type === 'transfer' && tx.toAccountId === selectedAccount.id;
                                const isInflow = isIncome || isTransferIn;
                                const amountColor = isInflow ? 'text-success' : 'text-white';
                                const sign = isInflow ? '+' : '-';

                                return (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-obsidian-800 transition-colors border border-transparent hover:border-obsidian-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-full bg-obsidian-800 text-obsidian-400`}>
                                                {tx.type === 'transfer' ? <ArrowRightLeft size={14} /> : isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-obsidian-200 font-medium">
                                                    {tx.type === 'transfer' 
                                                        ? (isInflow ? `From: ${accounts.find(a => a.id === tx.accountId)?.name}` : `To: ${accounts.find(a => a.id === tx.toAccountId)?.name}`)
                                                        : tx.title}
                                                </p>
                                                <p className="text-[10px] text-obsidian-500">
                                                    {new Date(tx.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold ${amountColor}`}>
                                            {sign}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">Add Transaction</h3>
                 <button onClick={() => setIsFormOpen(false)}><X className="text-obsidian-400" /></button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                 <div className="flex gap-2 p-1 bg-obsidian-800 rounded-lg overflow-x-auto">
                    <button 
                       type="button" 
                       onClick={() => { setTxType('expense'); setTxCategory(expenseCategories[0]); setIsAddingNewCategory(false); }}
                       className={`flex-1 py-2 px-1 rounded-md text-xs sm:text-sm font-medium transition-all ${txType === 'expense' ? 'bg-danger text-white shadow' : 'text-obsidian-400 hover:text-white'}`}
                    >
                       Expense
                    </button>
                    <button 
                       type="button" 
                       onClick={() => { setTxType('income'); setTxCategory(incomeCategories[0]); setIsAddingNewCategory(false); }}
                       className={`flex-1 py-2 px-1 rounded-md text-xs sm:text-sm font-medium transition-all ${txType === 'income' ? 'bg-success text-obsidian-900 shadow' : 'text-obsidian-400 hover:text-white'}`}
                    >
                       Income
                    </button>
                    <button 
                       type="button" 
                       onClick={() => { setTxType('transfer'); setTxCategory('Transfer'); setIsAddingNewCategory(false); }}
                       className={`flex-1 py-2 px-1 rounded-md text-xs sm:text-sm font-medium transition-all ${txType === 'transfer' ? 'bg-blue-500 text-white shadow' : 'text-obsidian-400 hover:text-white'}`}
                    >
                       Transfer
                    </button>
                 </div>
                 
                 <div>
                    <label className="text-xs text-obsidian-400 font-semibold uppercase">Amount</label>
                    <div className="relative mt-1">
                       <IndianRupee size={16} className="absolute left-3 top-3 text-obsidian-500" />
                       <input 
                         type="number" step="0.01" 
                         value={txAmount} onChange={e => setTxAmount(e.target.value)}
                         className="w-full bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-accent"
                         placeholder="0.00"
                       />
                    </div>
                 </div>

                 {txType !== 'transfer' && (
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-obsidian-400 font-semibold uppercase">Title</label>
                            <input 
                            type="text" 
                            value={txTitle} onChange={e => setTxTitle(e.target.value)}
                            className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent"
                            placeholder={txType === 'expense' ? 'e.g. Groceries' : 'e.g. Salary'}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-obsidian-400 font-semibold uppercase">Category</label>
                            <div className="relative mt-1">
                                {isAddingNewCategory ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            placeholder="New Category..."
                                            className="w-full bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-accent"
                                            autoFocus
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => { setIsAddingNewCategory(false); setNewCategoryName(''); }}
                                            className="bg-obsidian-700 text-white px-2 rounded-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag size={16} className="absolute left-3 top-3 text-obsidian-500" />
                                            <select 
                                                value={txCategory} 
                                                onChange={e => setTxCategory(e.target.value)}
                                                className="w-full bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-accent appearance-none"
                                            >
                                                {(txType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => { setIsAddingNewCategory(true); setNewCategoryName(''); }}
                                            className="bg-obsidian-700 hover:bg-obsidian-600 text-white px-3 rounded-lg transition-colors"
                                            title="Add new category"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                 )}

                 {txType === 'transfer' ? (
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs text-obsidian-400 font-semibold uppercase">From Account</label>
                           <select 
                             value={txAccountId} onChange={e => {
                                 setTxAccountId(e.target.value);
                                 if (e.target.value === txToAccountId) setTxToAccountId('');
                             }}
                             className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent appearance-none"
                           >
                              <option value="" disabled>Select</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-xs text-obsidian-400 font-semibold uppercase">To Account</label>
                           <select 
                             value={txToAccountId} onChange={e => setTxToAccountId(e.target.value)}
                             className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent appearance-none"
                           >
                              <option value="" disabled>Select</option>
                              {accounts.filter(a => a.id !== txAccountId).map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                 ) : (
                     <div>
                        <label className="text-xs text-obsidian-400 font-semibold uppercase">Account</label>
                        <select 
                          value={txAccountId} onChange={e => setTxAccountId(e.target.value)}
                          className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent appearance-none"
                        >
                           <option value="" disabled>Select Account</option>
                           {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                     </div>
                 )}

                 <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl mt-4">
                    {txType === 'transfer' ? 'Transfer Funds' : 'Save Transaction'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">Add Account</h3>
                 <button onClick={() => setShowAddAccount(false)}><X className="text-obsidian-400" /></button>
              </div>
              <form onSubmit={handleAddAccount} className="space-y-4">
                 <div>
                    <label className="text-xs text-obsidian-400 font-semibold uppercase">Account Name</label>
                    <input 
                      type="text" 
                      value={accName} onChange={e => setAccName(e.target.value)}
                      className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent"
                      placeholder="e.g. Savings"
                    />
                 </div>
                 
                 <div>
                    <label className="text-xs text-obsidian-400 font-semibold uppercase">Type</label>
                    <select 
                      value={accType} onChange={e => setAccType(e.target.value as AccountType)}
                      className="w-full mt-1 bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-accent"
                    >
                       <option value="bank">Bank</option>
                       <option value="cash">Cash</option>
                       <option value="investment">Investment</option>
                       <option value="digital">Digital Wallet</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs text-obsidian-400 font-semibold uppercase">Current Balance</label>
                    <div className="relative mt-1">
                       <IndianRupee size={16} className="absolute left-3 top-3 text-obsidian-500" />
                       <input 
                         type="number" step="0.01" 
                         value={accBalance} onChange={e => setAccBalance(e.target.value)}
                         className="w-full bg-obsidian-800 border border-obsidian-700 rounded-lg py-2.5 pl-9 pr-4 text-white focus:outline-none focus:border-accent"
                         placeholder="0.00"
                       />
                    </div>
                 </div>

                 {/* Color Selection */}
                 <div>
                    <label className="text-xs text-obsidian-400 font-semibold uppercase">Account Color</label>
                    <div className="flex gap-3 mt-2 overflow-x-auto pb-2 scrollbar-hide">
                       {ACCOUNT_COLORS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setAccColor(c.class)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 flex-shrink-0 ${accColor === c.class ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            title={c.name}
                          >
                            <div className={`w-7 h-7 rounded-full shadow-sm ${c.class.replace('text-', 'bg-')}`}></div>
                          </button>
                       ))}
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl mt-4">
                    Create Account
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
