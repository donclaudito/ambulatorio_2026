import React from 'react';

/**
 * ProcedureSelector
 * Exibe inline os procedimentos disponíveis para a demanda selecionada.
 * Aparece automaticamente quando há 2+ procedimentos mapeados.
 */
const ProcedureSelector = ({ procedures, selectedProcedure, onSelect }) => {
  if (!procedures || procedures.length < 2) return null;

  return (
    <div className="animate-slide-in-top">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-[10px]">🔍</span>
        </div>
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">
          Procedimentos disponíveis para esta demanda
        </p>
      </div>

      {/* Cards de procedimento */}
      <div className="grid grid-cols-1 gap-2">
        {procedures.map((proc, index) => {
          const isSelected = selectedProcedure === proc;
          const isDefault = index === 0;

          return (
            <button
              key={proc}
              type="button"
              onClick={() => onSelect(proc)}
              className={`
                w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200
                flex items-center justify-between gap-3 group
                ${isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {/* Ícone + texto */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}
                `}>
                  {index + 1}
                </div>
                <span className="text-sm font-semibold leading-tight truncate">
                  {proc}
                </span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isDefault && !isSelected && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    Padrão
                  </span>
                )}
                {isSelected && (
                  <span className="text-[10px] font-bold text-white/80">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dica */}
      {!selectedProcedure && (
        <p className="text-[10px] text-slate-400 mt-2 text-center italic">
          Selecione o procedimento mais adequado para o caso clínico.
        </p>
      )}
    </div>
  );
};

export default ProcedureSelector;
