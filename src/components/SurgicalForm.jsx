import React, { useState, useEffect } from 'react';
import { 
  reasonDataMap, 
  comorbidityMedicationsMap, 
  imageExamDiagnosesMap, 
  dermatologicalDiagnosesMap, 
  commonMedications,
  predefinedImageExams
} from '../data/clinicalData';
import { generateClinicalText } from '../services/geminiService';
import Modal from './Modal';

const SurgicalForm = ({ formData, setFormData, onGenerate, onClear }) => {
  const [activeModal, setActiveModal] = useState(null); // 'medication', 'diagnosis', 'dermatology', 'confirmation'
  const [modalData, setModalData] = useState({ title: '', items: [], targetField: '' });
  const [isLoading, setIsLoading] = useState({ anamnesis: false, physicalExam: false });

  // Handle auto-filling when reasons change
  useEffect(() => {
    const primary = formData.primaryReason;
    const associated = formData.associatedReason;

    let data = reasonDataMap[primary] || reasonDataMap["Outro..."];
    
    // Special case for combined hernias
    if ((primary === "Hérnia Umbilical" && associated === "Hérnia Epigástrica") ||
        (primary === "Hérnia Epigástrica" && associated === "Hérnia Umbilical")) {
      data = reasonDataMap["Hérnia Umbilical e Epigástrica Associadas"];
    }

    if (primary === "Cirurgia Ambulatorial (Dermatológica)") {
      setActiveModal('dermatology');
    }

    setFormData(prev => ({
      ...prev,
      proposedProcedure: data.procedure || prev.proposedProcedure,
      anamnesis: data.anamnesis,
      physicalExam: data.physicalExam,
      conduct: data.conduct
    }));
  }, [formData.primaryReason, formData.associatedReason]);

  const handleAIField = async (field) => {
    if (!formData.proposedProcedure) return;
    
    setIsLoading(prev => ({ ...prev, [field]: true }));
    try {
      const prompt = field === 'anamnesis' 
        ? `Gere *apenas o texto* de uma anamnese e queixa principal resumida para um paciente que será submetido ao procedimento de ${formData.proposedProcedure}. Seja conciso, sem cabeçalhos.`
        : `Gere *apenas o texto* de um exame físico resumido (2-3 frases) para um paciente que será submetido ao procedimento de ${formData.proposedProcedure}.`;
      
      const text = await generateClinicalText(prompt);
      setFormData(prev => ({ ...prev, [field]: text }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleComorbidity = (value) => {
    setFormData(prev => {
      if (value === "Nenhuma Comorbidade Conhecida") {
        return { ...prev, comorbidities: [value], medicationsInUse: "" };
      }
      const newComorbidities = prev.comorbidities.includes(value)
        ? prev.comorbidities.filter(c => c !== value)
        : [...prev.comorbidities.filter(c => c !== "Nenhuma Comorbidade Conhecida"), value];
      
      // Open medication modal if adding a comorbidity with meds
      if (!prev.comorbidities.includes(value) && comorbidityMedicationsMap[value]) {
        setModalData({
          title: `Medicamentos para ${value}`,
          items: comorbidityMedicationsMap[value],
          targetField: 'medicationsInUse'
        });
        setActiveModal('medication');
      }
      
      return { ...prev, comorbidities: newComorbidities };
    });
  };

  const handleModalSelection = (selectedItems) => {
    setFormData(prev => {
      const current = prev[modalData.targetField] ? prev[modalData.targetField].split(',').map(s => s.trim()) : [];
      const combined = [...new Set([...current, ...selectedItems])].filter(Boolean).join(', ');
      return { ...prev, [modalData.targetField]: combined };
    });
    setActiveModal(null);
  };

  return (
    <div className="w-full lg:w-1/2 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Dados da Consulta</h2>
      
      <div className="space-y-4">
        {/* Referral Reason */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Motivo do Encaminhamento Principal</label>
          <select 
            className="input-field"
            value={formData.primaryReason}
            onChange={(e) => setFormData({...formData, primaryReason: e.target.value})}
          >
            <option value="">-- Selecione --</option>
            {Object.keys(reasonDataMap).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {formData.primaryReason === "Outro..." && (
          <input 
            type="text" 
            placeholder="Especifique o motivo..." 
            className="input-field animate-slide-in-top"
            value={formData.customReason}
            onChange={(e) => setFormData({...formData, customReason: e.target.value})}
          />
        )}

        {/* Associated Reason */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Motivo Associado (Opcional)</label>
          <select 
            className="input-field"
            value={formData.associatedReason}
            onChange={(e) => setFormData({...formData, associatedReason: e.target.value})}
          >
            <option value="">-- Selecione --</option>
            {Object.keys(reasonDataMap).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Proposed Procedure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Procedimento Proposto</label>
          <input 
            className="input-field"
            value={formData.proposedProcedure}
            onChange={(e) => setFormData({...formData, proposedProcedure: e.target.value})}
          />
        </div>

        {/* Anamnesis */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Anamnese / Queixa Principal</label>
          <textarea 
            rows="3" 
            className="input-field"
            value={formData.anamnesis}
            onChange={(e) => setFormData({...formData, anamnesis: e.target.value})}
          />
          <button 
            type="button"
            onClick={() => handleAIField('anamnesis')}
            disabled={isLoading.anamnesis}
            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {isLoading.anamnesis ? "Gerando..." : "✨ Gerar com IA"}
          </button>
        </div>

        {/* Physical Exam */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Exame Físico</label>
          <textarea 
            rows="3" 
            className="input-field"
            value={formData.physicalExam}
            onChange={(e) => setFormData({...formData, physicalExam: e.target.value})}
          />
          <button 
            type="button"
            onClick={() => handleAIField('physicalExam')}
            disabled={isLoading.physicalExam}
            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {isLoading.physicalExam ? "Gerando..." : "✨ Gerar com IA"}
          </button>
        </div>

        {/* Comorbidities */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Comorbidades</label>
          <div className="grid grid-cols-2 gap-2">
            {[...Object.keys(comorbidityMedicationsMap), "Alergia a Medicamentos", "Uso de Drogas Ilícitas", "Nenhuma Comorbidade Conhecida"].map(c => (
              <label key={c} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.comorbidities.includes(c)}
                  onChange={() => toggleComorbidity(c)}
                  className="rounded text-blue-600"
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.comorbidities.includes("Alergia a Medicamentos") && (
          <div className="animate-zoom-in">
            <label className="block text-sm font-semibold text-gray-700">Qual(is) alergia(s)?</label>
            <input 
              className="input-field"
              value={formData.allergyDetails}
              onChange={(e) => setFormData({...formData, allergyDetails: e.target.value})}
            />
          </div>
        )}

        {/* Medications */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Medicamentos em Uso</label>
          <input 
            className="input-field"
            list="med-list"
            value={formData.medicationsInUse}
            onChange={(e) => setFormData({...formData, medicationsInUse: e.target.value})}
            placeholder="Separe por vírgulas..."
          />
          <datalist id="med-list">
            {commonMedications.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        {/* Imaging Exams */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Exames de Imagem Anexados</label>
          <div className="grid grid-cols-2 gap-2">
            {predefinedImageExams.map(e => (
              <label key={e} className="flex items-center space-x-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={formData.imageExams.includes(e)}
                  onChange={(evt) => {
                    const newExams = evt.target.checked 
                      ? [...formData.imageExams, e]
                      : formData.imageExams.filter(item => item !== e);
                    setFormData({...formData, imageExams: newExams});
                    
                    if (evt.target.checked && imageExamDiagnosesMap[e]) {
                      setModalData({
                        title: `Diagnósticos para ${e}`,
                        items: imageExamDiagnosesMap[e],
                        targetField: 'relatedDiagnoses'
                      });
                      setActiveModal('diagnosis');
                    }
                  }}
                  className="rounded text-blue-600"
                />
                <span>{e}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Conduct */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Conduta / Recomendações</label>
          <textarea 
            rows="3" 
            className="input-field"
            value={formData.conduct}
            onChange={(e) => setFormData({...formData, conduct: e.target.value})}
          />
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button onClick={onGenerate} className="btn-primary">Gerar Laudo</button>
          <button onClick={() => setActiveModal('confirmation')} className="btn-danger">Limpar Tudo</button>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'medication' || activeModal === 'diagnosis'} 
        title={modalData.title}
        onClose={() => setActiveModal(null)}
        footer={
          <button 
            className="btn-primary"
            onClick={() => {
              const checked = Array.from(document.querySelectorAll('.modal-check:checked')).map(el => el.value);
              handleModalSelection(checked);
            }}
          >
            Confirmar
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {modalData.items.map(item => (
            <label key={item} className="flex items-center space-x-2 p-2 hover:bg-white/50 rounded transition-colors cursor-pointer">
              <input type="checkbox" value={item} className="modal-check rounded text-blue-600" />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'dermatology'}
        title="Diagnósticos Dermatológicos"
        onClose={() => setActiveModal(null)}
      >
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(dermatologicalDiagnosesMap).map(diag => (
            <button
              key={diag}
              className="text-left p-3 glass hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl transition-all text-sm font-medium"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  proposedProcedure: dermatologicalDiagnosesMap[diag],
                  relatedDiagnoses: diag
                }));
                setActiveModal(null);
              }}
            >
              {diag}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'confirmation'}
        title="Confirmar Limpeza"
        onClose={() => setActiveModal(null)}
        footer={
          <>
            <button className="px-4 py-2 text-gray-600 font-bold" onClick={() => setActiveModal(null)}>Cancelar</button>
            <button className="btn-danger" onClick={() => { onClear(); setActiveModal(null); }}>Sim, Limpar</button>
          </>
        }
      >
        <p>Tem certeza que deseja apagar todos os dados do formulário? Esta ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
};

export default SurgicalForm;
