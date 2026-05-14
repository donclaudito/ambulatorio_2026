import React, { useState } from 'react';
import SurgicalForm from './components/SurgicalForm';
import ReportOutput from './components/ReportOutput';

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

    // Auto-generate evaluation requests as well
    const baseRequest = (specialty) => `SOLICITAÇÃO DE AVALIAÇÃO ${specialty}\n\nPrezados colegas,\n\nSolicito avaliação pré-operatória para o procedimento de ${formData.proposedProcedure}.\n\nComorbidades: ${formData.comorbidities.join(', ') || 'Nenhuma'}\nMedicações: ${formData.medicationsInUse || 'Nenhuma'}\n\nAtenciosamente.`;
    
    setEvaluationRequests({
      anesthetic: baseRequest('PRÉ-ANESTÉSICA'),
      cardio: baseRequest('CARDIOLÓGICA'),
      pulmo: baseRequest('PNEUMOLÓGICA')
    });
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`Copiado!`);
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      <header className="mb-10 text-center space-y-2 max-w-4xl no-print">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Surgical Report Pro
        </h1>
        <p className="text-gray-500 font-medium">Gerador Inteligente de Laudos de Cirurgia Eletiva</p>
      </header>

      <main className="glass w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row gap-0 print:block print:bg-transparent print:shadow-none">
        <div className="p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-white/20 no-print">
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
        
        <div className="p-6 sm:p-10 bg-white/30 backdrop-blur-md flex-1 print:p-0 print:bg-transparent">
          {generatedReport ? (
            <ReportOutput 
              report={generatedReport} 
              evaluationRequests={evaluationRequests}
              onCopy={handleCopy}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">📝</div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-700">Aguardando dados</h3>
                <p className="text-sm text-gray-500 max-w-xs">Preencha as informações ao lado para gerar o laudo clínico e as solicitações automáticas.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {copyStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce-short z-[2000] flex items-center gap-2 no-print">
          <span className="text-green-400">✓</span> {copyStatus}
        </div>
      )}
    </div>
  );
}

export default App;
