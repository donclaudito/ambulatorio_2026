import { configService } from './configService';

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function fetchWithRetry(payload, maxRetries = 5) {
    const API_KEY = configService.getGeminiKey();
    
    // Google Gemini API v1beta recomenda o uso do header x-goog-api-key
    // A chave na URL ainda funciona, mas o header é mais robusto
    const headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
    };

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return await response.json();
            } else if (response.status === 429 || response.status >= 500) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.log(`Tentativa ${i + 1} falhou com status ${response.status}. Retentando em ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            } else {
                const errorBody = await response.json();
                throw new Error(`Erro na API Gemini (Status ${response.status}): ${JSON.stringify(errorBody)}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function generateClinicalText(prompt) {
    if (!configService.getGeminiKey()) {
        throw new Error("Chave de API do Gemini não configurada.");
    }

    const payload = {
        system_instruction: {
            parts: [{ text: `Você é um assistente médico especializado em cirurgia. 
            Gere laudos profissionais seguindo OBRIGATORIAMENTE esta estrutura:
            1. Título (Apenas o nome do procedimento em negrito, sem prefixos como "Laudo Médico")
            2. Motivo
            3. Procedimento Proposto
            4. Anamnese e Exame Físico (Padrão SOAP)
            5. Antecedentes de Comorbidade
            6. Medicamentos em Uso
            7. Exames de Imagem
            8. Conduta e Recomendações
            
            DIRETRIZES DE ESTILO E CONTEÚDO:
            - Seja ESTRITAMENTE OBJETIVO. Use terminologia médico-cirúrgica precisa.
            - Baseie-se EXCLUSIVAMENTE nos dados fornecidos pelo usuário. 
            - SUA TAREFA PRINCIPAL: Aprimorar a redação técnica, tornando-a mais profissional, coesa e gramaticalmente correta, mantendo 100% de FIDELIDADE aos fatos inseridos.
            - PARA COMORBIDADES, MEDICAMENTOS E EXAMES DE IMAGEM: Use exclusivamente as informações fornecidas. NÃO adicione ou invente itens.
            - NÃO gere conclusões, hipóteses ou informações que não estejam suportadas pela entrada.
            - NÃO invente sintomas, datas ou achados que não foram informados.
            
            IMPORTANTE (PROIBIÇÕES CRÍTICAS): 
            - NÃO inclua informações sobre o PERÍODO INTRAOPERATÓRIO (o que ocorreu durante a cirurgia).
            - O laudo deve ser baseado APENAS em dados observados ANTES da cirurgia.
            - NÃO inclua seções de "Pós-operatório", "Recomendações gerais" ou "Orientações de Alta". 
            - NÃO inclua rodapés, assinaturas ou datas. 
            - O laudo deve ser encerrado IMEDIATAMENTE após a seção 8.
            
            Use Markdown.` }]
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };
    
    const result = await fetchWithRetry(payload);
    
    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    throw new Error("Resposta inesperada da API");
}
