import { configService } from './configService';
const API_URL = "https://api.mistral.ai/v1/chat/completions";

export async function generateMistralReport(prompt) {
    const API_KEY = configService.getMistralKey();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "open-mixtral-8x22b", // Este é o modelo mistral-default do sistema
                messages: [
                    {
                        role: "system",
                        content: `Você é um assistente médico especializado em cirurgia. Sua tarefa é gerar laudos cirúrgicos profissionais, precisos e bem formatados.
                        
O laudo deve seguir OBRIGATORIAMENTE esta estrutura:
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

Use Markdown para formatação.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro na API Mistral: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Erro ao chamar Mistral AI:", error);
        throw error;
    }
}
