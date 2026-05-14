import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { generateClinicalText } from '../services/geminiService';

const ReportOutput = ({ report, evaluationRequests, onCopy }) => {
  const [isAihModalOpen, setIsAihModalOpen] = useState(false);
  const [isGeneratingAih, setIsGeneratingAih] = useState(false);
  const [generatedAih, setGeneratedAih] = useState(null);
  const [editableReport, setEditableReport] = useState(report);

  // Sync with prop when it changes (initial generation)
  useEffect(() => {
    setEditableReport(report);
  }, [report]);

  const handleGenerateAih = async () => {
    setIsGeneratingAih(true);
    setIsAihModalOpen(true);
    try {
      const prompt = `Com base nestes dados cirúrgicos: "${editableReport}", gere um resumo para os campos 20 (Sinais e Sintomas), 21 (Justificativa) e 22 (Resultados de Exames) de uma AIH. Responda em formato JSON com as chaves "section20", "section21", "section22".`;
      const response = await generateClinicalText(prompt);
      const data = JSON.parse(response.replace(/```json|```/g, ''));
      setGeneratedAih(data);
    } catch (error) {
      console.error(error);
      setGeneratedAih({
        section20: "Erro ao gerar com IA.",
        section21: "Favor preencher manualmente.",
        section22: ""
      });
    } finally {
      setIsGeneratingAih(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEditableReport(prev => prev + (prev ? '\n\n' : '') + text);
    } catch (err) {
      console.error('Falha ao ler área de transferência:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const CopySection = ({ title, content, type }) => {
    if (!content) return null;
    return (
      <div className="glass p-5 rounded-2xl shadow-sm border border-white/50 space-y-3 animate-in fade-in slide-in-from-right-4 no-print">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-700">{title}</h3>
          <button 
            onClick={() => onCopy(content, type)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
          >
            📋 Copiar
          </button>
        </div>
        <div className="bg-white/50 p-4 rounded-xl text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full lg:w-1/2 space-y-8 print:w-full print:p-0">
      <div className="flex flex-wrap gap-3 no-print">
        <button onClick={handleGenerateAih} className="btn-secondary text-sm flex-1">Gerar AIH</button>
        <button onClick={handlePrint} className="btn-primary text-sm flex-1">🖨️ Imprimir Laudo</button>
      </div>

      {/* Editable Final Report Section */}
      <div className="glass p-6 rounded-2xl shadow-lg border border-blue-200/50 space-y-4 animate-in fade-in zoom-in print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="flex justify-between items-center no-print">
          <h3 className="text-xl font-bold text-blue-800">Laudo Final</h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePaste}
              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors border border-blue-200 font-bold"
            >
              📋 Colar Dados
            </button>
            <button 
              onClick={() => onCopy(editableReport, 'final')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors font-bold"
            >
              🔗 Copiar Tudo
            </button>
          </div>
        </div>
        
        <textarea
          className="w-full min-h-[400px] p-4 bg-white/50 rounded-xl text-sm text-gray-800 leading-relaxed border-none focus:ring-0 resize-y print:min-h-0 print:p-0 print:text-base print:bg-transparent print:overflow-visible"
          value={editableReport}
          onChange={(e) => setEditableReport(e.target.value)}
          placeholder="O laudo final aparecerá aqui..."
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 no-print">
        <CopySection title="Avaliação Pré-Anestésica" content={evaluationRequests.anesthetic} type="anesthetic" />
        <CopySection title="Avaliação Cardiológica" content={evaluationRequests.cardio} type="cardio" />
        <CopySection title="Avaliação Pneumológica" content={evaluationRequests.pulmo} type="pulmo" />
      </div>

      <Modal
        isOpen={isAihModalOpen}
        title="Laudo AIH (Autorização de Internação Hospitalar)"
        onClose={() => setIsAihModalOpen(false)}
      >
        {isGeneratingAih ? (
          <div className="flex flex-col items-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm font-medium text-gray-500">A IA está processando os dados para a AIH...</p>
          </div>
        ) : generatedAih && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">20 - Sinais e Sintomas</label>
              <div className="p-4 bg-gray-50 rounded-xl text-sm flex justify-between gap-4">
                <span className="flex-1">{generatedAih.section20}</span>
                <button onClick={() => onCopy(generatedAih.section20)} className="text-blue-600 font-bold text-xs shrink-0">Copiar</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">21 - Justificativa</label>
              <div className="p-4 bg-gray-50 rounded-xl text-sm flex justify-between gap-4">
                <span className="flex-1">{generatedAih.section21}</span>
                <button onClick={() => onCopy(generatedAih.section21)} className="text-blue-600 font-bold text-xs shrink-0">Copiar</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">22 - Resultados de Exames</label>
              <div className="p-4 bg-gray-50 rounded-xl text-sm flex justify-between gap-4">
                <span className="flex-1">{generatedAih.section22}</span>
                <button onClick={() => onCopy(generatedAih.section22)} className="text-blue-600 font-bold text-xs shrink-0">Copiar</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportOutput;

