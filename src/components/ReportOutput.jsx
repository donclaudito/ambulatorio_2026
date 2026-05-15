import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { generateClinicalText } from '../services/geminiService';

const ReportOutput = ({ report, evaluationRequests, onCopy }) => {
  const [isAihModalOpen, setIsAihModalOpen] = useState(false);
  const [isGeneratingAih, setIsGeneratingAih] = useState(false);
  const [generatedAih, setGeneratedAih] = useState(null);
  const [editableReport, setEditableReport] = useState(report);
  const [activeTab, setActiveTab] = useState('anesthetic');

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

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
          : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-slide-in-right">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-4 no-print">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Documentação Gerada</h2>
        <div className="flex gap-2">
          <button onClick={handleGenerateAih} className="btn-secondary text-xs px-4 py-2">
            ✨ Gerar AIH
          </button>
          <button onClick={handlePrint} className="btn-primary text-xs px-4 py-2">
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Main Paper: Laudo Final */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[2rem] blur opacity-5 group-hover:opacity-10 transition duration-1000 group-hover:duration-200 no-print"></div>
        <div className="relative glass rounded-3xl shadow-xl overflow-hidden print:shadow-none print:border-none print:p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h3 className="text-sm font-bold text-slate-700">LAUDO MÉDICO FINAL</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePaste} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors title='Colar dados'">
                📋 <span className="text-[10px] font-bold ml-1 uppercase">Colar</span>
              </button>
              <button onClick={() => onCopy(editableReport, 'final')} className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors title='Copiar tudo'">
                🔗 <span className="text-[10px] font-bold ml-1 uppercase">Copiar</span>
              </button>
            </div>
          </div>
          
          <textarea
            className="w-full min-h-[500px] p-8 text-base text-slate-800 leading-relaxed bg-white border-none focus:ring-0 resize-none font-serif print:p-0 print:text-base print:overflow-visible"
            value={editableReport}
            onChange={(e) => setEditableReport(e.target.value)}
            placeholder="O conteúdo do laudo aparecerá aqui..."
          />
        </div>
      </div>
      
      {/* Evaluation Requests: Tabbed View */}
      <div className="glass rounded-3xl shadow-lg overflow-hidden no-print">
        <div className="flex bg-slate-50/50 border-b border-slate-100">
          <TabButton id="anesthetic" label="Anestésica" icon="💉" />
          <TabButton id="cardio" label="Cardio" icon="❤️" />
          <TabButton id="pulmo" label="Pulmo" icon="🫁" />
        </div>
        
        <div className="p-8 relative">
          <button 
            onClick={() => onCopy(evaluationRequests[activeTab], activeTab)}
            className="absolute top-4 right-4 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100"
          >
            Copiar Texto
          </button>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-loose font-medium italic bg-slate-50/30 p-6 rounded-2xl border border-slate-100">
            {evaluationRequests[activeTab]}
          </div>
        </div>
      </div>

      {/* AIH Modal */}
      <Modal
        isOpen={isAihModalOpen}
        title="Laudo para Solicitação de AIH"
        onClose={() => setIsAihModalOpen(false)}
      >
        {isGeneratingAih ? (
          <div className="flex flex-col items-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Processando dados com IA...</p>
          </div>
        ) : generatedAih && (
          <div className="space-y-6">
            {['section20', 'section21', 'section22'].map((section, idx) => (
              <div key={section} className="space-y-2 animate-fade-in" style={{animationDelay: `${idx * 0.1}s`}}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Campo {20 + idx} - {idx === 0 ? 'Sinais e Sintomas' : idx === 1 ? 'Justificativa' : 'Resultados de Exames'}
                </label>
                <div className="group relative">
                  <div className="p-5 bg-slate-50 rounded-2xl text-sm text-slate-700 leading-relaxed border border-slate-100 group-hover:border-blue-200 transition-colors pr-20">
                    {generatedAih[section]}
                    <button 
                      onClick={() => onCopy(generatedAih[section])} 
                      className="absolute right-3 top-3 text-blue-600 font-bold text-[10px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-50"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Printing Only Area (hidden in UI) */}
      <div className="hidden print:block font-serif text-sm leading-relaxed text-black">
        {/* Only the editableReport is printed as per requirements, but evaluations could be added if requested */}
        <div className="whitespace-pre-wrap">{editableReport}</div>
      </div>
    </div>
  );
};

export default ReportOutput;
