const API_KEY = "AIzaSyBsWFw-01rIa7MtZ0b2lQlR4CZBWX9lPA8"; // Note: Use .env for production
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function fetchWithRetry(payload, maxRetries = 5) {
    const finalApiUrl = `${API_URL}?key=${API_KEY}`;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(finalApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                throw new Error(`Erro na API (Status ${response.status}): ${JSON.stringify(errorBody)}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function generateClinicalText(prompt) {
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };
    
    const result = await fetchWithRetry(payload);
    
    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    throw new Error("Resposta inesperada da API");
}
