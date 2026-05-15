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
            - Por favor, gere um laudo clínico padrão utilizando estritamente todas as informações fornecidas, sem adicionar, modificar ou omitir nada. O resultado deve ser apenas uma transcrição fiel do conteúdo digitado, organizado no formato solicitado.
            - Seja ESTRITAMENTE OBJETIVO. Use terminologia médico-cirúrgica precisa.
            - SUA TAREFA PRINCIPAL: Aprimorar a redação técnica, mantendo 100% de FIDELIDADE aos fatos inseridos.
            
            POLÍTICA DE TOLERÂNCIA ZERO PARA ALUCINAÇÕES E CONTRADIÇÕES:
            1. JAMAIS invente, deduza ou adicione informações clínicas fictícias (ex: não descreva "múltiplos cálculos", "espessamento", dimensões ou achados específicos em exames de imagem se isso não estiver escrito EXATAMENTE na entrada).
            2. PARA COMORBIDADES E MEDICAMENTOS: Use EXCLUSIVAMENTE a lista fornecida. Se estiver vazio ou "Nenhuma", escreva exatamente isso.
            3. GARANTA COERÊNCIA INTERNA: Nenhuma seção do laudo pode contradizer outra. (Ex: se Comorbidades = "Nenhuma", a Anamnese não pode citar controle de diabetes ou hipertensão).
            4. Se um dado não foi fornecido, abstenha-se de preenchê-lo. NÃO crie hipóteses.
            
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
