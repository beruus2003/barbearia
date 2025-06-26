import { MailService } from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(apiKey);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email enviado com sucesso para ${params.to}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email via SendGrid:', error);
    return false;
  }
}

export function generateConfirmationEmailHtml(token: string, baseUrl: string): string {
  const confirmUrl = `${baseUrl}/confirm-email?token=${encodeURIComponent(token)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirme seu Email - Barbearia</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #2c3e50; margin-bottom: 30px;">✂️ Barbearia</h1>
        <h2 style="color: #34495e; margin-bottom: 20px;">Confirme seu Email</h2>
        <p style="font-size: 16px; margin-bottom: 30px;">
          Obrigado por se cadastrar! Para concluir seu cadastro, clique no botão abaixo:
        </p>
        <a href="${confirmUrl}" 
           style="display: inline-block; background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Confirmar Email
        </a>
        <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
          Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
          <a href="${confirmUrl}" style="color: #3498db;">${confirmUrl}</a>
        </p>
        <p style="font-size: 12px; color: #95a5a6; margin-top: 20px;">
          Este link expira em 24 horas.
        </p>
      </div>
    </body>
    </html>
  `;
}