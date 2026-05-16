import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

class AuthModule {
  constructor(config) {
    this.secret = config.jwtSecret || 'seu_segredo_super_seguro';
    this.tokenExpiration = config.tokenExpiration || '1h';
    
    // Configuração do transportador para o Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailUser, // Seu email do Gmail
        pass: config.emailPass  // Sua senha de app gerada no Google
      }
    });

    this.siteUrl = config.siteUrl || 'http://localhost:5173';
    this.emailFrom = config.emailFrom || config.emailUser;
  }

  /**
   * Gera um token JWT para um usuário
   * @param {Object} payload Dados do usuário para colocar no token
   * @returns {String} Token JWT
   */
  gerarToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.tokenExpiration });
  }

  /**
   * Verifica se um token JWT é válido
   * @param {String} token Token JWT
   * @returns {Object|null} Payload do token ou null se inválido
   */
  verificarToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Envia o email de confirmação com um link contendo o token
   * @param {String} emailUsuario Email do usuário que receberá a mensagem
   * @param {String} token Token gerado
   * @returns {Promise}
   */
  enviarEmailConfirmacao(emailUsuario, token) {
    const linkConfirmacao = `${this.siteUrl}/confirmar?token=${token}`; // Link para o frontend
    
    const mailOptions = {
      from: this.emailFrom,
      to: emailUsuario,
      subject: 'Confirme seu cadastro no SurgicalReportPro',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
          <h2 style="color: #0f172a; margin-bottom: 20px; font-size: 24px;">Confirmação de Cadastro</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Olá! Ficamos muito felizes em ter você no <strong>SurgicalReportPro</strong>. Para ativar sua conta e concluir o cadastro, por favor clique no botão abaixo:
          </p>
          <div style="margin: 35px 0;">
            <a href="${linkConfirmacao}" style="background-color: #2563eb; color: #ffffff; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
              Confirmar Cadastro
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Se o botão não funcionar, você também pode copiar e colar o seguinte link no seu navegador:<br>
            <span style="color: #3b82f6; word-break: break-all;">${linkConfirmacao}</span>
          </p>
        </div>
      `
    };

    return new Promise((resolve, reject) => {
      // Modo simulação se usar o e-mail de exemplo
      if (this.transporter.options.auth.user === 'seuemail@gmail.com' || !this.transporter.options.auth.pass || this.transporter.options.auth.pass === 'sua_senha_de_app_aqui') {
        console.log('\n===================================================');
        console.log('📧 [SIMULAÇÃO DE E-MAIL] Confirmação de Cadastro');
        console.log(`Para: ${emailUsuario}`);
        console.log(`Link de Confirmação: ${linkConfirmacao}`);
        console.log('===================================================\n');
        return resolve({ response: '250 Simulação OK (Configure credenciais reais para envio via Gmail)' });
      }

      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Erro ao enviar email:', error);
          reject(error);
        } else {
          console.log('Email enviado:', info.response);
          resolve(info);
        }
      });
    });
  }

  /**
   * Envia o email de redefinição de senha com um link contendo o token
   * @param {String} emailUsuario Email do usuário
   * @param {String} token Token gerado
   * @returns {Promise}
   */
  enviarEmailRedefinicaoSenha(emailUsuario, token) {
    const linkRedefinicao = `${this.siteUrl}/redefinir-senha?token=${token}`;
    
    const mailOptions = {
      from: this.emailFrom,
      to: emailUsuario,
      subject: 'Redefinição de Senha - SurgicalReportPro',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
          <h2 style="color: #0f172a; margin-bottom: 20px; font-size: 24px;">Redefinição de Senha</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Você solicitou a redefinição da sua senha no <strong>SurgicalReportPro</strong>. Clique no botão abaixo para criar uma nova senha:
          </p>
          <div style="margin: 35px 0;">
            <a href="${linkRedefinicao}" style="background-color: #0891b2; color: #ffffff; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(8, 145, 178, 0.3);">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Se você não solicitou isso, por favor ignore este email.<br>
            Link direto: <span style="color: #0891b2; word-break: break-all;">${linkRedefinicao}</span>
          </p>
        </div>
      `
    };

    return new Promise((resolve, reject) => {
      // Modo simulação se usar o e-mail de exemplo
      if (this.transporter.options.auth.user === 'seuemail@gmail.com' || !this.transporter.options.auth.pass || this.transporter.options.auth.pass === 'sua_senha_de_app_aqui') {
        console.log('\n===================================================');
        console.log('📧 [SIMULAÇÃO DE E-MAIL] Redefinição de Senha');
        console.log(`Para: ${emailUsuario}`);
        console.log(`Link de Redefinição: ${linkRedefinicao}`);
        console.log('===================================================\n');
        return resolve({ response: '250 Simulação OK (Configure credenciais reais para envio via Gmail)' });
      }

      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Erro ao enviar email de redefinição:', error);
          reject(error);
        } else {
          console.log('Email de redefinição enviado:', info.response);
          resolve(info);
        }
      });
    });
  }
  
  /**
   * Fluxo completo: Gera token e envia email de confirmação
   * @param {String} emailUsuario Email de destino
   * @param {Object} dadosUsuario Dados adicionais para o token (ex: id)
   */
  async registrarEEnviarConfirmacao(emailUsuario, dadosUsuario) {
    const token = this.gerarToken({ email: emailUsuario, ...dadosUsuario });
    await this.enviarEmailConfirmacao(emailUsuario, token);
    return token;
  }

  /**
   * Fluxo completo: Gera token e envia email de redefinição de senha
   * @param {String} emailUsuario Email de destino
   * @param {Object} dadosUsuario Dados adicionais para o token
   */
  async solicitarRedefinicaoSenha(emailUsuario, dadosUsuario = {}) {
    const token = this.gerarToken({ email: emailUsuario, redefinicao: true, ...dadosUsuario });
    await this.enviarEmailRedefinicaoSenha(emailUsuario, token);
    return token;
  }
}

export default AuthModule;
