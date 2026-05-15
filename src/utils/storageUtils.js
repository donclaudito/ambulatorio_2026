const STORAGE_KEY = 'surgical_report_custom_reasons';

export const getCustomReasons = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error("Erro ao carregar motivos personalizados:", error);
        return {};
    }
};

/**
 * Salva um motivo personalizado no localStorage.
 * @param {string} name - Nome da demanda (chave)
 * @param {object} data - Dados clínicos: { procedure, procedures?, anamnesis, physicalExam, conduct }
 */
export const saveCustomReason = (name, data) => {
    try {
        const current = getCustomReasons();
        // Garante que o campo procedures seja preservado se fornecido
        const entry = {
            procedure: data.procedure || '',
            procedures: Array.isArray(data.procedures) && data.procedures.length > 1
                ? data.procedures
                : undefined,
            anamnesis: data.anamnesis || '',
            physicalExam: data.physicalExam || '',
            conduct: data.conduct || ''
        };
        // Remove undefined para não poluir o JSON
        Object.keys(entry).forEach(k => entry[k] === undefined && delete entry[k]);

        const updated = { ...current, [name]: entry };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error("Erro ao salvar motivo personalizado:", error);
        return false;
    }
};

/**
 * Remove um motivo personalizado do localStorage.
 * @param {string} name - Nome da demanda a remover
 */
export const deleteCustomReason = (name) => {
    try {
        const current = getCustomReasons();
        const { [name]: _, ...rest } = current;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
        return true;
    } catch (error) {
        console.error("Erro ao remover motivo personalizado:", error);
        return false;
    }
};
