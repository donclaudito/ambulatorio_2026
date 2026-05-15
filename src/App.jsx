import React, { useState } from 'react';
import SurgicalForm from './components/SurgicalForm';
import ReportOutput from './components/ReportOutput';
import MistralReportGenerator from './components/MistralReportGenerator';
import ApiKeySettings from './components/ApiKeySettings';
import Modal from './components/Modal';
import { stripMarkdown } from './utils/textUtils';

const initialFormState = {
  primaryReason: '',
  customReason: '',
  associatedReason: '',
  proposedProcedure: '',
  anamnesis: '',
  physicalExam: '',
  comorbidities: [],
  allergyDetails: '',
  medicationsInUse: '',
  conduct: '',
  imageExams: [],
  relatedDiagnoses: ''
};

function App() {
  const [formData, setFormData] = useState(initialFormState);
  const [generatedReport, setGeneratedReport] = useState('');
  const [activeMode, setActiveMode] = useState('standard'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluationRequests, setEvaluationRequests] = useState({
    anesthetic: '',
    cardio: '',
    pulmo: ''
  });
  const [copyStatus, setCopyStatus] = useState('');

  const handleGenerateReport = () => {
    let report = `LAUDO MÉDICO\n\n`;
    
    const reason = formData.primaryReason === 'Outro...' ? formData.customReason : formData.primaryReason;
    report += `Motivo do Encaminhamento: ${reason}${formData.associatedReason ? ` e ${formData.associatedReason}` : ''}\n`;
    report += `Procedimento Proposto: ${formData.proposedProcedure}\n\n`;
    
    report += `Anamnese/Queixa Principal:\n${formData.anamnesis}\n\n`;
    report += `Exame Físico:\n${formData.physicalExam}\n\n`;
    
    report += `Comorbidades: ${formData.comorbidities.length > 0 ? formData.comorbidities.join(', ') : 'Nenhuma conhecida'}`;
    if (formData.allergyDetails) report += ` (Alergias: ${formData.allergyDetails})`;
    report += `\n\n`;
    
    report += `Medicamentos em Uso: ${formData.medicationsInUse || 'Nenhum informado'}\n\n`;
    
    if (formData.imageExams.length > 0) {
      report += `Exames de Imagem: ${formData.imageExams.join(', ')}\n`;
    }
    if (formData.relatedDiagnoses) {
      report += `Diagnósticos Relacionados: ${formData.relatedDiagnoses}\n\n`;
    } else {
      report += `\n`;
    }
    
    report += `Conduta/Recomendações:\n${formData.conduct}\n`;
    
    setGeneratedReport(report);

    const baseRequest = (specialty) => `SOLICITAÇÃO DE AVALIAÇÃO ${specialty}\n\nPrezados colegas,\n\nSolicito avaliação pré-operatória para o procedimento de ${formData.proposedProcedure}.\n\nComorbidades: ${formData.comorbidities.join(', ') || 'Nenhuma'}\nMedicações: ${formData.medicationsInUse || 'Nenhuma'}\n\nAtenciosamente.`;
    
    setEvaluationRequests({
      anesthetic: baseRequest('PRÉ-ANESTÉSICA'),
      cardio: baseRequest('CARDIOLÓGICA'),
      pulmo: baseRequest('PNEUMOLÓGICA')
    });
  };

  const handleCopy = (text, type) => {
    const plainText = stripMarkdown(text);
    navigator.clipboard.writeText(plainText);
    setCopyStatus(`Copiado como texto puro!`);
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Navigation Bar */}
      <nav className="glass sticky top-0 z-[100] border-b border-slate-200/50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <span className="text-xl font-bold italic">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">SurgicalReport<span className="text-blue-600">Pro</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Clinical Strategy Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveMode('standard')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeMode === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Laudo Padrão
              </button>
              <button 
                onClick={() => setActiveMode('mistral')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeMode === 'mistral' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                ✨ Mistral AI
              </button>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors no-print"
              title="Configurações de API"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Side: Form (Scrollable on desktop) */}
        <div className="w-full lg:w-[45%] no-print">
          <SurgicalForm 
            formData={formData} 
            setFormData={setFormData} 
            onGenerate={handleGenerateReport}
            onClear={() => {
              setFormData(initialFormState);
              setGeneratedReport('');
              setEvaluationRequests({ anesthetic: '', cardio: '', pulmo: '' });
            }}
          />
        </div>
        
        {/* Right Side: Output */}
        <div className="w-full lg:w-[55%] print:w-full">
          {activeMode === 'mistral' ? (
            <MistralReportGenerator 
              initialData={generatedReport} 
              onCopy={handleCopy}
            />
          ) : generatedReport ? (
            <ReportOutput 
              report={generatedReport} 
              evaluationRequests={evaluationRequests}
              onCopy={handleCopy}
            />
          ) : (
            <div className="h-full min-h-[400px] glass rounded-3xl flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📄</div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">Aguardando dados da consulta</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                Preencha as informações do formulário ao lado para gerar o laudo clínico e as solicitações de avaliação.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* API Key Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configurações de API"
      >
        <ApiKeySettings onSave={() => {}} />
      </Modal>

      {/* Modern Toast Notification */}
      {copyStatus && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl animate-zoom-in z-[2000] flex items-center gap-3 no-print">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
          <span className="text-sm font-medium">{copyStatus}</span>
        </div>
      )}
    </div>
  );
}

export default App;
