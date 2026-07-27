# Skill: Geração de Laudo Clínico

Este documento define a estrutura obrigatória para a geração de laudos clínicos pela IA no aplicativo Surgical Report Pro.

## Estrutura do Laudo
O laudo gerado deve obrigatoriamente conter as seguintes seções, claramente identificadas:

1. **Título** (Apenas o nome do procedimento em negrito, sem prefixos)
2. **Motivo**
3. **Procedimento Proposto**
4. **Anamnese e Exame Físico (Padrão SOAP)**
    * **S**ubjetivo
    * **O**bjetivo
    * **A**valiação
    * **P**lano
5. **Antecedentes de Comorbidade**
6. **Medicamentos em Uso**
7. **Exames de Imagem**
8. **Conduta e Recomendações**

**PROIBIÇÕES CRÍTICAS (ESTRITAMENTE PROIBIDO):**
* **NÃO** gere sub-itens ou seções de "Pós-operatório imediato", "Recomendações gerais", "Expectativas", "Orientações de Alta" ou similares.
* **NÃO** inclua rodapés, assinaturas, carimbos, data ou informações de elaboração.
* O laudo deve ser encerrado IMEDIATAMENTE após o texto da seção 8 (Conduta e Recomendações).
* Qualquer conteúdo após a seção 8 será considerado uma falha grave na tarefa.

## Formatação
A saída deve ser formatada de maneira profissional e clara, utilizando Markdown para facilitar a leitura e edição.
