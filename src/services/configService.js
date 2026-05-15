const KEYS = {
  GEMINI: 'surgical_report_pro_gemini_key',
  MISTRAL: 'surgical_report_pro_mistral_key'
};

export const configService = {
  getGeminiKey: () => localStorage.getItem(KEYS.GEMINI) || '',
  getMistralKey: () => localStorage.getItem(KEYS.MISTRAL) || '',
  
  setGeminiKey: (key) => localStorage.setItem(KEYS.GEMINI, key),
  setMistralKey: (key) => localStorage.setItem(KEYS.MISTRAL, key),
  
  hasGeminiKey: () => !!localStorage.getItem(KEYS.GEMINI),
  hasMistralKey: () => !!localStorage.getItem(KEYS.MISTRAL)
};
