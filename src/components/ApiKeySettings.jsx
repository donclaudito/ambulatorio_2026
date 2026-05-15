import React, { useState, useEffect } from 'react';
import { configService } from '../services/configService';

const ApiKeySettings = ({ onSave }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    setGeminiKey(configService.getGeminiKey());
    setMistralKey(configService.getMistralKey());
  }, []);

  const handleSave = () => {
    configService.setGeminiKey(geminiKey);
    configService.setMistralKey(mistralKey);
    
    setSaveStatus('Sucesso! As chaves foram salvas localmente.');
    
    if (onSave) onSave();
    
    setTimeout(() => {
      setSaveStatus('');
    }, 3000);
  };

  return (
    <div className="space-y-6 py-2">
      <p className="text-xs text-slate-500 leading-relaxed">
        Suas chaves de API são salvas apenas no seu navegador (**localStorage**) e nunca são enviadas para nossos servidores, exceto para as próprias APIs da Google e Mistral.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Google Gemini API Key
          </label>
          <input
            type="password"
            className="input-field font-mono"
            placeholder="AIzaSy..."
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Mistral AI API Key
          </label>
          <input
            type="password"
            className="input-field font-mono"
            placeholder="Sua chave Mistral..."
            value={mistralKey}
            onChange={(e) => setMistralKey(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <button
          onClick={handleSave}
          className="btn-primary w-full shadow-lg shadow-blue-200 py-4 flex items-center justify-center gap-2 group"
        >
          <span>💾</span>
          <span>Salvar Configurações</span>
        </button>

        {saveStatus && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-zoom-in">
            <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeySettings;
