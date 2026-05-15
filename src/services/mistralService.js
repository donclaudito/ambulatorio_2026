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
1. Título (Apenas o nome do procedimento proposto em negrito)
2. Informações de Identificação (Idade, Sexo, IMC)
3. Motivo Principal e Procedimento Proposto
4. História Clínica (Anamnese) e Exame Físico
5. Antecedentes (Comorbidades e Alergias)
6. Medicamentos em Uso
7. Classificação ASA (Risco Cirúrgico)
8. Resultados de Exames de Imagem autorizados/solicitados
9. Conduta e Recomendações

DIRETRIZES DE ESTILO E CONTEÚDO:
- Evite repetições e informações duplicadas entre as seções.
- Por favor, gere um laudo clínico padrão utilizando estritamente todas as informações fornecidas, sem adicionar, modificar ou omitir nada. O resultado deve ser apenas uma transcrição fiel do conteúdo digitado, organizado no formato solicitado.
- Seja ESTRITAMENTE OBJETIVO. Use terminologia médico-cirúrgica precisa.
- SUA TAREFA PRINCIPAL: Aprimorar a redação técnica, mantendo 100% de FIDELIDADE aos fatos inseridos.

POLÍTICA DE TOLERÂNCIA ZERO PARA ALUCINAÇÕES E CONTRADIÇÕES:
1. JAMAIS invente, deduza ou adicione informações clínicas fictícias (ex: não descreva "múltiplos cálculos", "espessamento", dimensões ou achados específicos em exames de imagem se isso não estiver escrito EXATAMENTE na entrada).
2. PARA COMORBIDADES E MEDICAMENTOS: Use EXCLUSIVAMENTE a lista fornecida. Se estiver vazio ou "Nenhuma", escreva exatamente isso.
3. SE NÃO houver exames de imagem na entrada, OMITA completamente a seção "Resultados de Exames de Imagem". Sob nenhuma hipótese escreva "Não autorizados/solicitados" ou deixe o campo vazio. Apenas remova a seção 8.
4. GARANTA COERÊNCIA INTERNA: Nenhuma seção do laudo pode contradizer outra. (Ex: se Comorbidades = "Nenhuma", a Anamnese não pode citar controle de diabetes ou hipertensão).
5. Se um dado não foi fornecido, abstenha-se de preenchê-lo. NÃO crie hipóteses.

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
