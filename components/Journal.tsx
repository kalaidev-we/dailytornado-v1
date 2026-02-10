
import React, { useState, useEffect } from 'react';
import { Send, Trash2, Calendar, PenLine, X } from 'lucide-react';
import { JournalEntry } from '../types';
import { getJournalEntries, addJournalEntry, deleteJournalEntry, getJournalDraft, saveJournalDraft } from '../services/storageService';

interface JournalProps {
  isFormOpen: boolean;
  setIsFormOpen: (isOpen: boolean) => void;
}

const Journal: React.FC<JournalProps> = ({ isFormOpen, setIsFormOpen }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');

  useEffect(() => {
    setEntries(getJournalEntries());
    setNewEntry(getJournalDraft());
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setNewEntry(val);
      saveJournalDraft(val);
  };

  const handleSave = () => {
    if (!newEntry.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      content: newEntry,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };

    addJournalEntry(entry);
    setEntries(getJournalEntries());
    setNewEntry('');
    saveJournalDraft(''); // Clear draft
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteJournalEntry(id);
    setEntries(getJournalEntries());
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Daily Journal</h2>
       </div>

       {/* Entries List */}
       <div className="space-y-8 animate-fade-in">
         {Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
               <div className="bg-obsidian-800 p-4 rounded-full mb-3">
                 <Calendar size={32} className="text-obsidian-400" />
               </div>
               <p className="text-obsidian-400 text-sm">No entries yet. Tap the pen to write.</p>
            </div>
         ) : (
           Object.entries(groupedEntries).map(([date, dayEntries]) => (
             <div key={date}>
               <div className="flex items-center mb-3 sticky top-0 bg-obsidian-950/95 backdrop-blur py-2 z-10">
                 <div className="w-2 h-2 rounded-full bg-accent mr-2"></div>
                 <h3 className="text-xs font-bold text-obsidian-300 uppercase tracking-wider">{date}</h3>
                 <div className="flex-1 h-px bg-obsidian-800 ml-3"></div>
               </div>
               
               <div className="space-y-3 pl-4 border-l border-obsidian-800 ml-1">
                 {(dayEntries as JournalEntry[]).map(entry => (
                   <div key={entry.id} className="bg-obsidian-800 p-4 rounded-xl border border-obsidian-700 group relative hover:border-obsidian-600 transition-colors">
                     <p className="text-obsidian-100 whitespace-pre-wrap leading-relaxed text-sm">{entry.content}</p>
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-obsidian-700/50">
                       <span className="text-[10px] text-obsidian-500 font-mono">
                         {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <button
                         onClick={() => handleDelete(entry.id)}
                         className="text-obsidian-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-obsidian-900 rounded"
                         title="Delete entry"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ))
         )}
       </div>

       {/* Add Entry Modal */}
       {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="w-full sm:max-w-md bg-obsidian-900 border-t sm:border border-obsidian-700 sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center text-obsidian-200">
                    <PenLine size={18} className="mr-2 text-accent" />
                    <h3 className="text-xl font-bold text-white">New Entry</h3>
                 </div>
                 <button onClick={() => setIsFormOpen(false)}><X className="text-obsidian-400" /></button>
              </div>
              
              <textarea
                value={newEntry}
                onChange={handleTextChange}
                placeholder="Log your thoughts, activities, or wins..."
                className="w-full bg-obsidian-800 border border-obsidian-700 text-white rounded-xl p-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder-obsidian-500 transition-all resize-none min-h-[150px] mb-4 text-base"
                autoFocus
              />
              
              <button
                onClick={handleSave}
                disabled={!newEntry.trim()}
                className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} className="mr-2" /> Save Note
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
