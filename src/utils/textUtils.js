/**
 * Remove marcações Markdown de um texto, mantendo a estrutura básica e quebras de linha.
 */
export const stripMarkdown = (text) => {
    if (!text) return '';
    
    return text
        // 1. Remove cabeçalhos (# Título)
        .replace(/^#+\s+/gm, '')
        // 2. Remove negrito (**texto** ou __texto__)
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        // 3. Remove itálico (*texto* ou _texto_)
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        // 4. Remove código inline (`texto`)
        .replace(/`(.*?)`/g, '$1')
        // 5. Remove links ([texto](url))
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        // 6. Remove marcadores de lista (apenas o símbolo, mantém o texto e o recuo básico)
        .replace(/^\s*[-*+]\s+/gm, '')
        // 7. Remove marcadores de lista numerada (1. texto)
        .replace(/^\s*\d+\.\s+/gm, '')
        // 8. Remove blockquotes (> texto)
        .replace(/^>\s+/gm, '')
        // 9. Remove linhas horizontais (--- ou ***)
        .replace(/^[*-]{3,}$/gm, '')
        // 10. Normaliza múltiplas quebras de linha (evita espaços excessivos)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};
