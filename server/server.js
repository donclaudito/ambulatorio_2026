import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import AuthModule from './auth.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Instancia o módulo de autenticação usando Variáveis de Ambiente (Segurança)
const auth = new AuthModule({
  jwtSecret: process.env.JWT_SECRET || 'chave_secreta_fallback_ambulatorio',
  tokenExpiration: '1h',
  emailUser: process.env.EMAIL_USER || 'seuemail@gmail.com',
  emailPass: process.env.EMAIL_PASS || 'sua_senha_de_app_aqui',
  siteUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
});

// Banco de dados em memória (Com um usuário padrão para facilitar testes imediatos)
const usuarios = [
  {
    id: 1,
    nome: 'Dr. Claudio',
    email: 'medico@hospital.com',
    senha: 'senha123',
    confirmado: true
  }
];

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// 1. Rota de Cadastro / Confirmação
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  // Verifica se usuário já existe
  const existente = usuarios.find(u => u.email === email);
  if (existente) {
    return res.status(400).json({ erro: 'Este e-mail já está cadastrado' });
  }

  try {
    const novoUsuario = { id: Date.now(), nome: nome || 'Usuário', email, senha, confirmado: true };
    usuarios.push(novoUsuario);

    // Usa o módulo para gerar o token e enviar o e-mail de confirmação
    const token = await auth.registrarEEnviarConfirmacao(email, { id: novoUsuario.id });
    
    res.status(201).json({ 
      mensagem: 'Usuário registrado com sucesso! Verifique seu e-mail (ou console do backend).', 
      token,
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Falha ao registrar ou enviar e-mail de confirmação' });
  }
});

// 2. Rota de Login
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);
  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  try {
    const token = auth.gerarToken({ email: usuario.email, id: usuario.id });
    res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao gerar token de login' });
  }
});

// 3. Rota para solicitar redefinição de senha
app.post('/api/auth/recover-password', async (req, res) => {
  const { email } = req.body;

  const usuarioExistente = usuarios.find(u => u.email === email);
  if (!usuarioExistente) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  try {
    await auth.solicitarRedefinicaoSenha(email, { id: usuarioExistente.id });
    res.status(200).json({ mensagem: 'E-mail de recuperação enviado com sucesso (verifique o console)!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Falha ao enviar e-mail de recuperação' });
  }
});

// 4. Rota para concluir a redefinição de senha
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
  }

  const payload = auth.verificarToken(token);
  if (!payload || !payload.redefinicao) {
    return res.status(403).json({ erro: 'Token de redefinição inválido ou expirado' });
  }

  const usuario = usuarios.find(u => u.email === payload.email);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário associado ao token não encontrado' });
  }

  // Atualiza a senha
  usuario.senha = novaSenha;

  res.status(200).json({ mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.' });
});

// 5. Rota protegida (Verificar Token / Retornar Perfil)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  const payload = auth.verificarToken(token);

  if (!payload) {
    return res.status(403).json({ erro: 'Token inválido ou expirado' });
  }

  const usuario = usuarios.find(u => u.email === payload.email);

  res.status(200).json({
    mensagem: 'Token válido',
    dadosUsuario: {
      ...payload,
      nome: usuario ? usuario.nome : payload.email.split('@')[0]
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Autenticação do SurgicalReportPro rodando em http://localhost:${PORT}`);
  console.log(`💡 Dica: Você pode fazer login imediatamente com: medico@hospital.com / senha123`);
  console.log(`Configure as credenciais reais do Gmail no arquivo .env se desejar envio real de e-mails.`);
});
