import { generateClinicalText as generateWithGemini } from './geminiService';
import { generateMistralReport as generateWithMistral } from './mistralService';
import { configService } from './configService';

/**
 * Limpa a resposta da IA de blocos de código markdown e metadados indesejados.
 */
export const cleanAiResponse = (text) => {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // 1. Remove blocos de código markdown (```markdown ... ``` ou ``` ... ```)
    // Pega o conteúdo de dentro do bloco se existir um bloco que envolva quase tudo
    const codeBlockMatch = cleaned.match(/^```(?:markdown)?\n?([\s\S]*?)\n?```$/i);
    if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
    }
    
    // 2. Remove prefixos remanescentes se a IA apenas começou com "markdown"
    if (cleaned.toLowerCase().startsWith('markdown')) {
        cleaned = cleaned.substring(8).trim();
    }

    // 3. Remove backticks isolados no início/fim
    cleaned = cleaned.replace(/^`+|`+$/g, '').trim();

    return cleaned;
};

/**
 * Unified AI service that handles fallback logic between different providers.
 * Priority: Gemini -> Mistral AI
 */
export async function generateClinicalTextUnified(prompt) {
    const hasGemini = configService.hasGeminiKey();
    const hasMistral = configService.hasMistralKey();
    let response = '';

    // 1. Tenta Gemini se a chave existir
    if (hasGemini) {
        try {
            console.log("Tentando gerar com Gemini AI...");
            response = await generateWithGemini(prompt);
            return cleanAiResponse(response);
        } catch (error) {
            console.warn("Gemini AI falhou ou chave inválida. Tentando fallback para Mistral...", error);
            if (!hasMistral) throw error;
        }
    }

    // 2. Fallback para Mistral AI
    if (hasMistral) {
        try {
            console.log("Gerando com Mistral AI (Fallback)...");
            response = await generateWithMistral(prompt);
            return cleanAiResponse(response);
        } catch (error) {
            console.error("Mistral AI também falhou:", error);
            throw error;
        }
    }

    throw new Error("Nenhuma chave de API configurada (Gemini ou Mistral). Por favor, configure nas configurações (⚙️).");
}
