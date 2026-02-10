import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface MotivationalPopupProps {
  message: string | null;
  onClose: () => void;
}

const MotivationalPopup: React.FC<MotivationalPopupProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !isVisible) return null;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center pointer-events-none
      transition-opacity duration-300 ${message && isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className="bg-obsidian-800/90 backdrop-blur-md border border-accent/50 p-6 rounded-2xl shadow-2xl max-w-sm mx-4 text-center transform scale-100 pointer-events-auto relative overflow-hidden">
        
        {/* Animated background glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-75"></div>

        <div className="relative z-10">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-accent/30">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Keep it up!</h3>
          <p className="text-obsidian-200 mb-6 font-medium leading-relaxed">
            "{message}"
          </p>
          <button 
            onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
            className="text-sm text-obsidian-400 hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotivationalPopup;
