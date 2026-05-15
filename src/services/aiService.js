import { generateClinicalText as generateWithGemini } from './geminiService';
import { generateMistralReport as generateWithMistral } from './mistralService';
import { configService } from './configService';

/**
 * Unified AI service that handles fallback logic between different providers.
 * Priority: Gemini -> Mistral AI
 */
export async function generateClinicalTextUnified(prompt) {
    const hasGemini = configService.hasGeminiKey();
    const hasMistral = configService.hasMistralKey();

    // 1. Tenta Gemini se a chave existir
    if (hasGemini) {
        try {
            console.log("Tentando gerar com Gemini AI...");
            return await generateWithGemini(prompt);
        } catch (error) {
            console.warn("Gemini AI falhou ou chave inválida. Tentando fallback para Mistral...", error);
            // Se falhar e tiver Mistral, continua para o fallback
            if (!hasMistral) throw error;
        }
    }

    // 2. Fallback para Mistral AI
    if (hasMistral) {
        try {
            console.log("Gerando com Mistral AI (Fallback)...");
            return await generateWithMistral(prompt);
        } catch (error) {
            console.error("Mistral AI também falhou:", error);
            throw error;
        }
    }

    // 3. Caso não haja chaves configuradas
    throw new Error("Nenhuma chave de API configurada (Gemini ou Mistral). Por favor, configure nas configurações (⚙️).");
}
