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
                model: "open-mixtral-8x22b",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente médico especializado em cirurgia. Sua tarefa é gerar laudos cirúrgicos profissionais, precisos e bem formatados."
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
