import React from 'react';

const BottomNav = ({ menuItems, activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none">
      {/* Navbar Body: Extra Transparent & High Blur */}
      <nav className="max-w-[400px] mx-auto 
        bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl 
        rounded-[2.5rem] p-2 flex justify-between items-center 
        shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] 
        border border-white/20 dark:border-slate-800/40 
        pointer-events-auto transition-all duration-500">
        
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 transition-all duration-300 relative ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500/70 dark:text-slate-400/50'
              }`}
            >
              {isActive && (
                <div className="absolute inset-x-2 inset-y-1 bg-blue-500/20 rounded-2xl animate-in fade-in zoom-in duration-300"></div>
              )}
              
              <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 scale-110' : ''}`}>
                {item.icon}
              </div>
              
              <span className={`text-[9px] font-black uppercase tracking-tight transition-all duration-300 ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute bottom-0.5 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_12px_#60a5fa]"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;