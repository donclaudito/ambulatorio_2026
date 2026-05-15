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

/**
 * Normaliza uma string para comparação flexível:
 * remove acentos, converte para minúsculas e elimina espaços extras.
 * Permite que "tumor de colon" encontre "Tumor de Cólon" e vice-versa.
 */
export const normalizeKey = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')                    // separa base + diacrítico
        .replace(/[\u0300-\u036f]/g, '')     // remove diacríticos (acentos)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');              // normaliza espaços múltiplos
};

/**
 * Busca um item em um mapa de razões de forma flexível (ignora acentos e maiúsculas).
 * @param {object} reasonMap - O objeto { "Demanda": { procedure, ... } }
 * @param {string} query - O termo a buscar (pode ter variação de acento/caixa)
 * @returns {{ key: string, data: object } | null}
 */
export const findReason = (reasonMap, query) => {
    if (!query || !reasonMap) return null;

    // 1. Tentativa exata (mais rápida, zero custo)
    if (reasonMap[query]) return { key: query, data: reasonMap[query] };

    // 2. Busca normalizada (ignora acentos e caixa)
    const normalizedQuery = normalizeKey(query);
    const entry = Object.entries(reasonMap).find(
        ([key]) => normalizeKey(key) === normalizedQuery
    );

    return entry ? { key: entry[0], data: entry[1] } : null;
};
