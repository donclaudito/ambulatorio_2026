### Lógica de Fallback da API

A IA do aplicativo Surgical Report Pro deve priorizar o uso da API do Gemini, se uma chave válida estiver configurada pelo usuário.

**Regra de Ouro:**
Se **não** houver uma chave de API do Gemini cadastrada e válida no sistema, o aplicativo **deve** usar automaticamente a API do Mistral AI (modelo `mistral-default`) para garantir a continuidade do serviço e a geração do laudo clínico.
