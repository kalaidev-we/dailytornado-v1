import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Notification } from '../types';

interface SimulatedNotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const SimulatedNotifications: React.FC<SimulatedNotificationsProps> = ({ notifications, onDismiss }) => {
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Show the most recent unread notification
    const latest = notifications.find(n => !n.read);
    if (latest) {
      setActiveNotification(latest);
      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        onDismiss(latest.id);
        setActiveNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
        setActiveNotification(null);
    }
  }, [notifications, onDismiss]);

  if (!activeNotification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-obsidian-800/95 backdrop-blur-md border border-obsidian-600 shadow-2xl rounded-2xl p-4 flex items-start gap-3 max-w-md mx-auto">
        <div className="p-2 bg-accent/20 rounded-xl text-accent">
          <Bell size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white">{activeNotification.title}</h4>
          <p className="text-sm text-obsidian-300 mt-1 leading-snug">{activeNotification.message}</p>
          <p className="text-xs text-obsidian-500 mt-2">Just now</p>
        </div>
        <button 
          onClick={() => {
            onDismiss(activeNotification.id);
            setActiveNotification(null);
          }}
          className="text-obsidian-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SimulatedNotifications;
