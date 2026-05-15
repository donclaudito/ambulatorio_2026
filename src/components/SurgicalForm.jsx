import React, { useState, useEffect } from 'react';
import { 
  reasonDataMap, 
  comorbidityMedicationsMap, 
  imageExamDiagnosesMap, 
  dermatologicalDiagnosesMap, 
  commonMedications,
  predefinedImageExams
} from '../data/clinicalData';
import { generateClinicalTextUnified } from '../services/aiService';
import Modal from './Modal';

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
    <span className="text-xl">{icon}</span>
    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
  </div>
);

const SurgicalForm = ({ formData, setFormData, onGenerate, onClear }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({ title: '', items: [], targetField: '' });
  const [isLoading, setIsLoading] = useState({ anamnesis: false, physicalExam: false });

  useEffect(() => {
    const primary = formData.primaryReason;
    const associated = formData.associatedReason;
    if (!primary) return;

    let data = reasonDataMap[primary] || reasonDataMap["Outro..."];
    
    if ((primary === "Hérnia Umbilical" && associated === "Hérnia Epigástrica") ||
        (primary === "Hérnia Epigástrica" && associated === "Hérnia Umbilical")) {
      data = reasonDataMap["Hérnia Umbilical e Epigástrica Associadas"];
    }

    if (primary === "Cirurgia Ambulatorial (Dermatológica)" && activeModal !== 'dermatology') {
      setActiveModal('dermatology');
    }

    // Only update if something actually changed to avoid "Cannot update a component..." error
    const needsUpdate = 
      formData.proposedProcedure !== (data.procedure || formData.proposedProcedure) ||
      formData.anamnesis !== data.anamnesis ||
      formData.physicalExam !== data.physicalExam ||
      formData.conduct !== data.conduct;

    if (needsUpdate) {
      setFormData(prev => ({
        ...prev,
        proposedProcedure: data.procedure || prev.proposedProcedure,
        anamnesis: data.anamnesis,
        physicalExam: data.physicalExam,
        conduct: data.conduct
      }));
    }
  }, [formData.primaryReason, formData.associatedReason]);

  const handleAIField = async (field) => {
    if (!formData.proposedProcedure) return;
    
    setIsLoading(prev => ({ ...prev, [field]: true }));
    try {
      const prompt = field === 'anamnesis' 
        ? `Gere *apenas o texto* de uma anamnese e queixa principal resumida para um paciente que será submetido ao procedimento de ${formData.proposedProcedure}. Seja conciso, sem cabeçalhos.`
        : `Gere *apenas o texto* de um exame físico resumido (2-3 frases) para um paciente que será submetido ao procedimento de ${formData.proposedProcedure}.`;
      
      const text = await generateClinicalTextUnified(prompt);
      setFormData(prev => ({ ...prev, [field]: text }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleComorbidity = (value) => {
    // 1. Determina as mudanças de estado do formulário primeiro
    setFormData(prev => {
      if (value === "Nenhuma Comorbidade Conhecida") {
        return { ...prev, comorbidities: [value], medicationsInUse: "" };
      }
      const newComorbidities = prev.comorbidities.includes(value)
        ? prev.comorbidities.filter(c => c !== value)
        : [...prev.comorbidities.filter(c => c !== "Nenhuma Comorbidade Conhecida"), value];
      
      return { ...prev, comorbidities: newComorbidities };
    });

    // 2. Dispara efeitos colaterais (modais) fora do setFormData para evitar erro de renderização
    if (!formData.comorbidities.includes(value) && comorbidityMedicationsMap[value]) {
      setModalData({
        title: `Medicamentos para ${value}`,
        items: comorbidityMedicationsMap[value],
        targetField: 'medicationsInUse'
      });
      setActiveModal('medication');
    }
  };

  const handleModalSelection = (selectedItems) => {
    const { targetField } = modalData;
    
    setFormData(prev => {
      const current = prev[targetField] ? prev[targetField].split(',').map(s => s.trim()) : [];
      const combined = [...new Set([...current, ...selectedItems])].filter(Boolean).join(', ');
      return { ...prev, [targetField]: combined };
    });
    
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Motivo e Procedimento */}
      <section className="card-section animate-slide-in-top">
        <SectionHeader icon="📋" title="Identificação da Demanda" />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label-text">Motivo Principal</label>
            <select 
              className="input-field"
              value={formData.primaryReason}
              onChange={(e) => setFormData({...formData, primaryReason: e.target.value})}
            >
              <option value="">-- Selecione o motivo --</option>
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

          <div>
            <label className="label-text">Motivo Associado (Opcional)</label>
            <select 
              className="input-field"
              value={formData.associatedReason}
              onChange={(e) => setFormData({...formData, associatedReason: e.target.value})}
            >
              <option value="">-- Nenhum --</option>
              {Object.keys(reasonDataMap).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="label-text">Procedimento Proposto</label>
            <input 
              className="input-field font-semibold text-blue-700"
              value={formData.proposedProcedure}
              onChange={(e) => setFormData({...formData, proposedProcedure: e.target.value})}
              placeholder="Ex: Hernioplastia Inguinal..."
            />
          </div>
        </div>
      </section>

      {/* 2. História Clínica */}
      <section className="card-section animate-slide-in-top" style={{animationDelay: '0.1s'}}>
        <SectionHeader icon="📝" title="História e Exame Físico" />
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="label-text">Anamnese / Queixa Principal</label>
              <button 
                type="button"
                onClick={() => handleAIField('anamnesis')}
                disabled={isLoading.anamnesis}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter"
              >
                {isLoading.anamnesis ? "Gerando..." : "✨ IA Autofill"}
              </button>
            </div>
            <textarea 
              rows="3" 
              className="input-field"
              value={formData.anamnesis}
              onChange={(e) => setFormData({...formData, anamnesis: e.target.value})}
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="label-text">Exame Físico</label>
              <button 
                type="button"
                onClick={() => handleAIField('physicalExam')}
                disabled={isLoading.physicalExam}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter"
              >
                {isLoading.physicalExam ? "Gerando..." : "✨ IA Autofill"}
              </button>
            </div>
            <textarea 
              rows="3" 
              className="input-field"
              value={formData.physicalExam}
              onChange={(e) => setFormData({...formData, physicalExam: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* 3. Antecedentes e Exames */}
      <section className="card-section animate-slide-in-top" style={{animationDelay: '0.2s'}}>
        <SectionHeader icon="🏥" title="Antecedentes e Exames" />
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="label-text">Comorbidades e Riscos</label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[...Object.keys(comorbidityMedicationsMap), "Alergia a Medicamentos", "Nenhuma Comorbidade Conhecida"].map(c => (
                <label key={c} className="flex items-center space-x-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.comorbidities.includes(c)}
                    onChange={() => toggleComorbidity(c)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={formData.comorbidities.includes(c) ? "text-blue-700 font-bold" : "text-slate-600"}>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.comorbidities.includes("Alergia a Medicamentos") && (
            <div className="animate-zoom-in">
              <label className="label-text">Detalhes da Alergia</label>
              <input 
                className="input-field border-red-200 focus:ring-red-500/20"
                value={formData.allergyDetails}
                onChange={(e) => setFormData({...formData, allergyDetails: e.target.value})}
                placeholder="Liste os medicamentos..."
              />
            </div>
          )}

          <div>
            <label className="label-text">Medicamentos em Uso</label>
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

          <div className="space-y-3">
            <label className="label-text">Exames de Imagem Selecionados</label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {predefinedImageExams.map(e => (
                <label key={e} className="flex items-center space-x-3 text-xs font-medium cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
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
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={formData.imageExams.includes(e) ? "text-blue-700 font-bold" : "text-slate-600"}>{e}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">Conduta / Recomendações</label>
            <textarea 
              rows="3" 
              className="input-field"
              value={formData.conduct}
              onChange={(e) => setFormData({...formData, conduct: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <div className="flex items-center gap-4 pt-4 sticky bottom-6 z-50">
        <button onClick={onGenerate} className="btn-primary flex-1 shadow-lg shadow-blue-200">
          Gerar Laudo Clínico
        </button>
        <button onClick={() => setActiveModal('confirmation')} className="btn-danger flex-1">
          Limpar Tudo
        </button>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'medication' || activeModal === 'diagnosis'} 
        title={modalData.title}
        onClose={() => setActiveModal(null)}
        footer={
          <button 
            className="btn-primary w-full"
            onClick={() => {
              const checked = Array.from(document.querySelectorAll('.modal-check:checked')).map(el => el.value);
              handleModalSelection(checked);
            }}
          >
            Confirmar Seleção
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {modalData.items.map(item => (
            <label key={item} className="flex items-center space-x-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-100">
              <input type="checkbox" value={item} className="modal-check w-5 h-5 rounded border-slate-300 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </label>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'dermatology'}
        title="Diagnósticos Dermatológicos"
        onClose={() => setActiveModal(null)}
      >
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(dermatologicalDiagnosesMap).map(diag => (
            <button
              key={diag}
              className="text-left p-4 glass hover:bg-blue-600 hover:text-white border border-slate-100 rounded-2xl transition-all text-sm font-bold shadow-sm"
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
          <div className="flex gap-3 w-full">
            <button className="flex-1 py-3 text-slate-500 font-bold text-sm" onClick={() => setActiveModal(null)}>Cancelar</button>
            <button className="btn-danger flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => { onClear(); setActiveModal(null); }}>Sim, Limpar Tudo</button>
          </div>
        }
      >
        <p className="text-slate-600 leading-relaxed text-center py-4">Tem certeza que deseja apagar todos os dados do formulário? <br/><span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span></p>
      </Modal>
    </div>
  );
};

export default SurgicalForm;
