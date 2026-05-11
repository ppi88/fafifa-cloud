import React from 'react';
import { motion } from 'framer-motion';

const BottomNav = ({ menuItems, activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] px-6 pointer-events-none md:hidden">
      <nav className="max-w-[380px] mx-auto bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-1.5 flex justify-between items-center shadow-2xl border border-white/20 pointer-events-auto transform-gpu">
        
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex-1 flex flex-col items-center py-2.5 relative outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Highlight Background - Pakai spring yang kaku agar cepat */}
              {isActive && (
                <motion.div 
                  layoutId="bubble"
                  className="absolute inset-x-1 inset-y-1 bg-blue-500/10 dark:bg-blue-400/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              
              {/* Icon - Tanpa efek scale besar, cukup transisi warna */}
              <div className={`relative z-10 transition-transform duration-200 ${isActive ? '-translate-y-0.5' : ''}`}>
                {React.cloneElement(item.icon, { 
                  className: `w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400'}` 
                })}
              </div>
              
              <span className={`relative z-10 text-[8px] font-bold uppercase tracking-wider mt-1 transition-colors duration-200 ${
                isActive ? 'text-blue-600 opacity-100' : 'text-slate-400 opacity-60'
              }`}>
                {item.label}
              </span>

              {/* Titik Indikator - Meluncur cepat */}
              {isActive && (
                <motion.div 
                  layoutId="dot"
                  className="absolute bottom-0 w-1 h-1 bg-blue-600 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;