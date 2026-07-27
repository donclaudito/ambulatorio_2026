import React, { useState, useEffect } from 'react';
import { 
  reasonDataMap, 
  comorbidityMedicationsMap, 
  imageExamDiagnosesMap, 
  dermatologicalDiagnosesMap, 
  commonMedications,
  predefinedImageExams
} from '../../data/clinicalData';
import { generateClinicalTextUnified } from '../../services/aiService';
import { getCustomReasons, saveCustomReason } from '../../utils/storageUtils';
import { findReason } from '../../utils/textUtils';
import Modal from '../ui/Modal';
import ProcedureSelector from './ProcedureSelector';

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
    <span className="text-xl">{icon}</span>
    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
  </div>
);

const SurgicalForm = ({ formData, setFormData, onGenerate, onClear }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({ title: '', items: [], targetField: '' });
  const [isLoading, setIsLoading] = useState({ anamnesis: false, physicalExam: false, procedure: false, asa: false, cid10: false });
  // reasonDataMap tem prioridade: entradas oficiais nunca são sobrescritas pelo localStorage
  const [allReasons, setAllReasons] = useState(() => {
    const custom = getCustomReasons();
    // Filtra apenas entradas customizadas que NÃO existem no banco oficial
    const customOnly = Object.fromEntries(
      Object.entries(custom).filter(([key]) => !(key in reasonDataMap))
    );
    return { ...reasonDataMap, ...customOnly };
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [availableProcedures, setAvailableProcedures] = useState([]);

  useEffect(() => {
    const primary = formData.primaryReason;
    const associated = formData.associatedReason;
    if (!primary) {
      setAvailableProcedures([]);
      return;
    }

    let data;
    const found = findReason(allReasons, primary);

    if (found) {
      data = found.data;
    } else {
      // Fallback: usa template genérico de "Outro..."
      data = allReasons["Outro..."];
    }
    
    if ((primary === "Hérnia Umbilical" && associated === "Hérnia Epigástrica") ||
        (primary === "Hérnia Epigástrica" && associated === "Hérnia Umbilical")) {
      data = allReasons["Hérnia Umbilical e Epigástrica Associadas"];
    }

    if (primary === "Cirurgia Ambulatorial (Dermatológica)" && activeModal !== 'dermatology') {
      setActiveModal('dermatology');
    }

    // Se a demanda tem múltiplos procedimentos, mostrar o seletor
    const procs = data.procedures || [];
    setAvailableProcedures(procs);

    // Pré-selecionar o procedimento padrão:
    // - Se há array de procedures → usa o primeiro
    // - Se há procedure único → usa ele
    // - Se nenhum (custom reason sem procedure) → mantém o que o usuário já digitou
    const defaultProcedure = procs.length > 0
      ? procs[0]
      : (data.procedure || formData.proposedProcedure || '');

    // Lógica inteligente de atualização:
    // 1. Se for um motivo conhecido (found), atualiza sempre (comportamento padrão)
    // 2. Se for "Outro...", só preenche o template se o campo estiver vazio
    const isCustom = primary === "Outro...";
    
    const shouldUpdateProcedure = isCustom 
      ? !formData.proposedProcedure && defaultProcedure 
      : formData.proposedProcedure !== defaultProcedure;
      
    const shouldUpdateAnamnesis = isCustom
      ? !formData.anamnesis && data.anamnesis
      : formData.anamnesis !== data.anamnesis;

    const shouldUpdatePhysical = isCustom
      ? !formData.physicalExam && data.physicalExam
      : formData.physicalExam !== data.physicalExam;

    const shouldUpdateConduct = isCustom
      ? !formData.conduct && data.conduct
      : formData.conduct !== data.conduct;

    if (shouldUpdateProcedure || shouldUpdateAnamnesis || shouldUpdatePhysical || shouldUpdateConduct) {
      setFormData(prev => ({
        ...prev,
        proposedProcedure: shouldUpdateProcedure ? (defaultProcedure || prev.proposedProcedure) : prev.proposedProcedure,
        anamnesis: shouldUpdateAnamnesis ? data.anamnesis : prev.anamnesis,
        physicalExam: shouldUpdatePhysical ? data.physicalExam : prev.physicalExam,
        conduct: shouldUpdateConduct ? data.conduct : prev.conduct
      }));
    }
  }, [formData.primaryReason, formData.associatedReason]);

  const handleAIField = async (field) => {
    // Determina o contexto clínico (Motivo ou Procedimento)
    const reasonContext = formData.primaryReason === "Outro..." 
      ? formData.customReason 
      : formData.primaryReason;
    
    const procedureContext = formData.proposedProcedure || reasonContext;
    
    if (!procedureContext && field !== 'procedure') {
      setSaveStatus('⚠️ Defina um motivo ou procedimento primeiro.');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    const loadingKey = field === 'procedure' ? 'procedure' : field === 'asaClassification' ? 'asa' : field === 'cid10' ? 'cid10' : field;
    setIsLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const associatedText = formData.associatedReason ? ` associada a ${formData.associatedReason}` : '';
      const demographics = (formData.patientAge || formData.patientSex) 
        ? `Paciente de ${formData.patientAge || 'idade não informada'} anos, do sexo ${formData.patientSex || 'não informado'}. ` 
        : '';
      
      const biometrics = (formData.patientWeight && formData.patientHeight)
        ? `Peso: ${formData.patientWeight}kg, Altura: ${formData.patientHeight}cm. `
        : '';

      let prompt = '';

      if (field === 'procedure') {
        prompt = `Aja como um cirurgião sênior. ${demographics}${biometrics}Sugira o nome técnico do procedimento cirúrgico principal (apenas o nome, ex: 'Hernioplastia Inguinal') para um quadro de ${reasonContext}${associatedText}. Retorne APENAS o nome do procedimento técnico e preciso.`;
      } else if (field === 'anamnesis') {
        prompt = `Aja como um cirurgião sênior. Seja ESTRITAMENTE OBJETIVO. Gere *apenas o texto* de uma anamnese técnica e queixa principal baseada nestes dados: Quadro clínico: ${reasonContext}${associatedText}. Procedimento: ${procedureContext}. Contexto do paciente: ${demographics}${biometrics}. Use terminologia cirúrgica precisa. NÃO invente sintomas. Vá direto ao relato clínico. É PROIBIDO iniciar o texto repetindo os dados de identificação (idade, sexo, peso, altura) pois eles já constam no cabeçalho do laudo.`;
      } else if (field === 'physicalExam') {
        prompt = `Aja como um cirurgião sênior. Seja ESTRITAMENTE OBJETIVO. Gere *apenas o texto* de um exame físico técnico resumido para este quadro: ${reasonContext}${associatedText} (procedimento: ${procedureContext}). Contexto do paciente: ${demographics}${biometrics}. Use terminologia cirúrgica precisa. Foco em sinais vitais e achados locais. NÃO invente achados. Vá direto ao exame. É PROIBIDO iniciar o texto repetindo os dados de identificação (idade, sexo, peso, altura).`;
      } else if (field === 'asaClassification') {
        const imcText = (formData.patientWeight && formData.patientHeight) ? ` IMC Calculado: ${(parseFloat(formData.patientWeight) / Math.pow(parseFloat(formData.patientHeight) / 100, 2)).toFixed(1)}.` : '';
        prompt = `Aja como um anestesiologista avaliador. Avalie os seguintes dados do paciente: ${demographics}${biometrics}${imcText} Comorbidades relatadas: ${formData.comorbidities.join(', ') || 'Nenhuma'}. Medicamentos em uso: ${formData.medicationsInUse || 'Nenhum'}. Sugira a classificação de Risco Cirúrgico ASA (I a VI). Retorne a sugestão e explique brevemente os critérios utilizados para essa classificação com base nestes dados. Seja direto e não invente dados adicionais.`;
      } else if (field === 'cid10') {
        prompt = `Aja como um codificador médico sênior. Baseado neste quadro clínico: ${reasonContext}${associatedText} (procedimento proposto: ${procedureContext}), retorne APENAS o código CID-10 exato correspondente (ex: 'K40.9'). Não retorne explicações ou descrições, apenas o código bruto.`;
      }
      
      const text = await generateClinicalTextUnified(prompt);
      
      if (field === 'procedure') {
        setFormData(prev => ({ ...prev, proposedProcedure: text }));
      } else {
        setFormData(prev => ({ ...prev, [field]: text }));
      }
    } catch (error) {
      console.error(error);
      setSaveStatus('❌ Erro na IA. Verifique a chave API.');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
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

  const handleSaveCustomReason = () => {
    if (!formData.customReason) return;
    
    const newReasonData = {
      procedure: formData.proposedProcedure,
      anamnesis: formData.anamnesis,
      physicalExam: formData.physicalExam,
      conduct: formData.conduct
    };

    const success = saveCustomReason(formData.customReason, newReasonData);
    if (success) {
      setAllReasons(prev => ({ ...prev, [formData.customReason]: newReasonData }));
      setSaveStatus('Motivo salvo com sucesso!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Motivo e Procedimento */}
      <section className="card-section animate-slide-in-top">
        <SectionHeader icon="📋" title="Identificação da Demanda" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label-text">Idade</label>
            <input 
              type="number" 
              className="input-field"
              placeholder="Anos"
              value={formData.patientAge || ''}
              onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
            />
          </div>
          <div>
            <label className="label-text">Sexo</label>
            <select 
              className="input-field"
              value={formData.patientSex || ''}
              onChange={(e) => setFormData({...formData, patientSex: e.target.value})}
            >
              <option value="">--</option>
              <option value="Masculino">Masc</option>
              <option value="Feminino">Fem</option>
            </select>
          </div>
          <div>
            <label className="label-text">Peso (kg)</label>
            <input 
              type="number" 
              className="input-field"
              placeholder="Ex: 80"
              value={formData.patientWeight || ''}
              onChange={(e) => setFormData({...formData, patientWeight: e.target.value})}
            />
          </div>
          <div>
            <label className="label-text">Altura (cm)</label>
            <input 
              type="number" 
              className="input-field"
              placeholder="Ex: 175"
              value={formData.patientHeight || ''}
              onChange={(e) => setFormData({...formData, patientHeight: e.target.value})}
            />
          </div>
        </div>

        {/* BMI / IMC Display */}
        {formData.patientWeight && formData.patientHeight && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IMC Calculado:</span>
            {(() => {
              const weight = parseFloat(formData.patientWeight);
              const height = parseFloat(formData.patientHeight) / 100;
              const imc = (weight / (height * height)).toFixed(1);
              const isHigh = parseFloat(imc) > 35;
              return (
                <span className={`text-sm font-black ${isHigh ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                  {imc} {isHigh ? '(Obesidade Severa)' : ''}
                </span>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label-text">Motivo Principal</label>
            <select 
              className="input-field"
              value={formData.primaryReason}
              onChange={(e) => setFormData({...formData, primaryReason: e.target.value})}
            >
              <option value="">-- Selecione o motivo --</option>
              {Object.keys(allReasons).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Seletor de Procedimentos — aparece quando há múltiplas opções */}
          {availableProcedures.length >= 2 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <ProcedureSelector
                procedures={availableProcedures}
                selectedProcedure={formData.proposedProcedure}
                onSelect={(proc) => setFormData(prev => ({ ...prev, proposedProcedure: proc }))}
              />
            </div>
          )}

          {formData.primaryReason === "Outro..." && (
            <div className="flex gap-2 animate-slide-in-top">
              <input 
                type="text" 
                placeholder="Especifique o novo motivo..." 
                className="input-field flex-1"
                value={formData.customReason}
                onChange={(e) => setFormData({...formData, customReason: e.target.value})}
              />
              <button
                type="button"
                onClick={handleSaveCustomReason}
                disabled={!formData.customReason}
                className="px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                title="Salvar como novo modelo"
              >
                💾 {saveStatus ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          )}

          <div>
            <label className="label-text">Motivo Associado (Opcional)</label>
            <select 
              className="input-field"
              value={formData.associatedReason}
              onChange={(e) => setFormData({...formData, associatedReason: e.target.value})}
            >
              <option value="">-- Nenhum --</option>
              {Object.keys(allReasons).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="label-text">Procedimento Proposto</label>
              <button 
                type="button"
                onClick={() => handleAIField('procedure')}
                disabled={isLoading.procedure || (!formData.primaryReason && !formData.customReason)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter"
              >
                {isLoading.procedure ? "Sugerindo..." : "✨ Sugerir"}
              </button>
            </div>
            <input 
              className="input-field font-semibold text-blue-700"
              value={formData.proposedProcedure}
              onChange={(e) => setFormData({...formData, proposedProcedure: e.target.value})}
              placeholder="Ex: Hernioplastia Inguinal..."
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="label-text">CID-10 Principal</label>
              <button 
                type="button"
                onClick={() => handleAIField('cid10')}
                disabled={isLoading.cid10 || (!formData.primaryReason && !formData.customReason)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter"
              >
                {isLoading.cid10 ? "Buscando..." : "✨ Auto CID"}
              </button>
            </div>
            <input 
              className="input-field font-semibold text-emerald-700"
              value={formData.cid10 || ''}
              onChange={(e) => setFormData({...formData, cid10: e.target.value})}
              placeholder="Ex: K40.9"
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
              value={formData.anamnesis || ''}
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
              value={formData.physicalExam || ''}
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
                value={formData.allergyDetails || ''}
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
              value={formData.medicationsInUse || ''}
              onChange={(e) => setFormData({...formData, medicationsInUse: e.target.value})}
              placeholder="Separe por vírgulas..."
            />
            <datalist id="med-list">
              {commonMedications.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="label-text">Classificação ASA (Risco Cirúrgico)</label>
              <button 
                type="button"
                onClick={() => handleAIField('asaClassification')}
                disabled={isLoading.asa}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-tighter"
              >
                {isLoading.asa ? "Analisando..." : "✨ Avaliar Risco / ASA"}
              </button>
            </div>
            <textarea 
              rows="3"
              className="input-field text-sm"
              placeholder="Clique em 'Avaliar Risco / ASA' para gerar a classificação..."
              value={formData.asaClassification || ''}
              onChange={(e) => setFormData({...formData, asaClassification: e.target.value})}
            />
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
              value={formData.conduct || ''}
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
