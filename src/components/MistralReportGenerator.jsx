import React, { useState } from 'react';
import { generateMistralReport } from '../services/mistralService';
import { cleanAiResponse } from '../services/aiService';

const MistralReportGenerator = ({ initialData, onCopy }) => {
  const [surgeryData, setSurgeryData] = useState(initialData || '');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!surgeryData.trim()) {
      setError('Por favor, insira os dados da cirurgia.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    const prompt = `Aja como um revisor médico sênior. Sua tarefa é aprimorar a redação técnica do seguinte laudo, tornando-a mais profissional, coesa e gramaticalmente correta, mas mantendo 100% de FIDELIDADE aos fatos clínicos inseridos pelo usuário. NÃO adicione informações novas. NÃO invente dados. Use terminologia cirúrgica precisa.\n\nDados de Entrada:\n${surgeryData}`;

    try {
      const report = await generateMistralReport(prompt);
      setGeneratedReport(cleanAiResponse(report));
    } catch (err) {
      setError('Erro ao gerar o laudo. Verifique sua chave de API ou conexão.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-3xl p-6 shadow-xl border border-slate-200/50">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Gerador Mistral AI (Mixtral 8x22)</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-text">Dados da Cirurgia</label>
            <textarea
              className="input-field min-h-[150px] font-mono text-sm"
              placeholder="Ex: Paciente com hérnia inguinal à direita, proposto hernioplastia. Sem comorbidades..."
              value={surgeryData}
              onChange={(e) => setSurgeryData(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              isGenerating 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processando com Mistral AI...</span>
              </>
            ) : (
              <>
                <span>✨ Gerar Laudo Profissional</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {generatedReport && (
        <div className="glass rounded-3xl shadow-2xl overflow-hidden animate-slide-in-bottom">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-700 uppercase">Laudo Sugerido pela IA</h3>
            </div>
            <button
              onClick={() => onCopy(generatedReport, 'mistral')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-200 transition-all shadow-sm flex items-center gap-2"
            >
              🔗 Copiar Tudo
            </button>
          </div>
          
          <textarea
            className="w-full min-h-[400px] p-8 text-base text-slate-800 leading-relaxed bg-white border-none focus:ring-0 resize-none font-serif"
            value={generatedReport}
            onChange={(e) => setGeneratedReport(e.target.value)}
            placeholder="Edite o laudo gerado aqui..."
          />
        </div>
      )}
    </div>
  );
};

export default MistralReportGenerator;
