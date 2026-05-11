import React from 'react';

const ProductStockView = ({ items, currentField, handleInputChange, hideAdjustment }) => {
  const isTabBaru = currentField === 'stokBaru';

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {items && items.map((item) => (
        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 flex justify-between items-center shadow-sm">
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-black text-slate-200 text-[11px] uppercase truncate tracking-tight">
              {item.jenisKue}
            </h3>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[8px] text-blue-400 font-black uppercase bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                Kemarin: {item.sisaKemarin || 0}
              </span>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {!hideAdjustment && (
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black text-red-500 uppercase mb-1 tracking-tighter">Rusak</span>
                <input 
                  type="number" inputMode="numeric"
                  value={item.penyesuaian || ''} 
                  onChange={(e) => handleInputChange(item.id, e.target.value, 'penyesuaian')} 
                  placeholder="0"
                  className="w-10 h-8 rounded-lg text-center font-bold text-[12px] outline-none border border-slate-800 bg-slate-950 text-red-400 focus:border-red-500 transition-all"
                />
              </div>
            )}

            <div className={`flex flex-col items-center ${!hideAdjustment ? 'border-l border-slate-800 pl-3' : ''}`}>
              <span className={`text-[7px] font-black uppercase mb-1 tracking-tighter ${isTabBaru ? 'text-green-500' : 'text-blue-500'}`}>
                {isTabBaru ? 'Baru' : 'Sisa'}
              </span>
              <input 
                type="number" inputMode="numeric"
                value={item[currentField] || ''} 
                onChange={(e) => handleInputChange(item.id, e.target.value)} 
                placeholder="0"
                className={`w-14 h-8 rounded-lg text-center font-black text-sm outline-none border transition-all 
                  ${isTabBaru ? 'border-green-900 bg-green-950/30 text-green-500' : 'border-blue-900 bg-blue-950/30 text-blue-500'}`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductStockView; // Pakai default export