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

export const saveCustomReason = (name, data) => {
    try {
        const current = getCustomReasons();
        const updated = { ...current, [name]: data };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error("Erro ao salvar motivo personalizado:", error);
        return false;
    }
};
