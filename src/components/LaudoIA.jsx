import React, { useState } from 'react';
import DOMPurify from 'dompurify';

export default function LaudoIA() {
  const [laudoHTML, setLaudoHTML] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Função simulada de chamada ao backend (substitua pela sua chamada real)
  const gerarLaudo = async () => {
    setCarregando(true);
    setErro('');
    
    try {
      // Exemplo de chamada ao seu backend:
      // const response = await fetch('http://localhost:3000/api/ia/gerar-laudo', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ dadosPaciente: { nome: 'João Silva', queixa: 'Dor abdominal' } })
      // });
      // const data = await response.json();
      // setLaudoHTML(data.laudo);

      // --- MOCK (Simulação) para você testar agora mesmo ---
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay de 1.5s
      const htmlSimulado = `
        <h2>Laudo Médico - Ambulatório de Cirurgia 2026</h2>
        <p><strong>Paciente:</strong> João da Silva</p>
        <p><strong>Data:</strong> 29/07/2026</p>
        <hr />
        <h3>1. Queixa Principal</h3>
        <p>Paciente relata dor abdominal em região epigástrica há 3 dias, associada a náuseas.</p>
        <h3>2. Exame Físico</h3>
        <ul>
          <li><strong>Abdome:</strong> Plano, flácido, doloroso à palpação profunda em epigástrio.</li>
          <li><strong>Sinais Vitais:</strong> PA: 120/80 mmHg, FC: 78 bpm, Temp: 36.5°C.</li>
        </ul>
        <h3>3. Conduta</h3>
        <p>Solicitado ultrassonografia de abdome total. Prescrito omeprazol 40mg VO por 14 dias. Retorno em 7 dias com exames.</p>
      `;
      setLaudoHTML(htmlSimulado);
      // -------------------------------------------------------

    } catch (error) {
      setErro('Falha ao gerar o laudo. Tente novamente.');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  // Função para copiar o HTML puro (útil para colar em sistemas de prontuário)
  const copiarHTML = () => {
    navigator.clipboard.writeText(laudoHTML);
    alert('Código HTML copiado para a área de transferência!');
  };

  // Função para imprimir o laudo
  const imprimirLaudo = () => {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Laudo - Ambulatório Cirurgia 2026</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
            h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h3 { color: #2980b9; margin-top: 20px; }
            ul { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          ${laudoHTML}
        </body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    janelaImpressao.print();
    janelaImpressao.close();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#2c3e50' }}>Gerador de Laudo com IA</h2>
      
      <button 
        onClick={gerarLaudo} 
        disabled={carregando}
        style={{
          padding: '10px 20px',
          backgroundColor: carregando ? '#95a5a6' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: carregando ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {carregando ? 'Gerando laudo...' : '✨ Gerar Laudo Sugerido pela IA'}
      </button>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      {laudoHTML && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={copiarHTML} style={btnStyle}>📋 Copiar Código HTML</button>
            <button onClick={imprimirLaudo} style={btnStyle}>🖨️ Imprimir Laudo</button>
          </div>

          {/* Renderização segura do HTML */}
          <div 
            className="laudo-container"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(laudoHTML) 
            }}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '30px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.6'
            }}
          />
        </div>
      )}
    </div>
  );
}

// Estilo simples para os botões secundários
const btnStyle = {
  padding: '8px 15px',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};