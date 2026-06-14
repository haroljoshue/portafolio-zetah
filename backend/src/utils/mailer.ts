import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Predefined automated response email template (HTML)
const getWelcomeTemplate = () => {
  return `
    <div style="background-color: #0c0519; color: #e5e7eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2.5rem; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #2d1b4e; box-shadow: 0 10px 30px rgba(112, 0, 255, 0.15);">
      <!-- Header / Logo -->
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #00d2ff 0%, #7000ff 100%); border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(112, 0, 255, 0.3);">
        <h1 style="color: #ffffff; font-weight: 900; letter-spacing: 0.18em; margin: 0; font-size: 30px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">ZETAH GALLERY</h1>
        <p style="color: rgba(255,255,255,0.9); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.3em; margin: 0.5rem 0 0; font-weight: 600;">Software Engineer & Audiovisual Producer</p>
      </div>
      
      <div style="padding: 1rem 0;">
        <h2 style="color: #ffffff; font-size: 1.5rem; margin-top: 0; font-weight: 700; border-left: 4px solid #00d2ff; padding-left: 10px;">¡Gracias por tu interés en mi trabajo!</h2>
        <p style="line-height: 1.6; color: #d1d5db; font-size: 1.05rem;">Hola,</p>
        <p style="line-height: 1.6; color: #d1d5db; font-size: 1.05rem;">He recibido tu suscripción en mi portafolio web. Como estudiante de Ingeniería de Software y productor audiovisual / fotógrafo, me apasiona fusionar la tecnología y la estética visual para crear proyectos únicos y de alta calidad.</p>
        
        <div style="background: rgba(18, 9, 36, 0.65); border: 1px solid #2d1b4e; padding: 1.5rem; border-radius: 12px; margin: 2.5rem 0;">
          <h3 style="color: #00d2ff; margin-top: 0; font-size: 1.15rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem; font-weight: 600;">Canales de Contacto Oficiales:</h3>
          <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
            <li style="margin-bottom: 0.75rem; color: #e5e7eb; font-size: 1rem;">
              <strong>📞 WhatsApp:</strong> <a href="https://w.app/l469ab" style="color: #00d2ff; text-decoration: none; font-weight: 600;">+593 99 232 3613</a>
            </li>
            <li style="margin-bottom: 0.75rem; color: #e5e7eb; font-size: 1rem;">
              <strong>✉️ Correo Directo:</strong> <a href="mailto:haroljoshue17@gmail.com" style="color: #00d2ff; text-decoration: none; font-weight: 600;">haroljoshue17@gmail.com</a>
            </li>
            <li style="margin-bottom: 0.75rem; color: #e5e7eb; font-size: 1rem;">
              <strong>📸 Instagram:</strong> <a href="https://www.instagram.com/haroljoshue/" style="color: #00d2ff; text-decoration: none; font-weight: 600;">@haroljoshue</a>
            </li>
          </ul>
        </div>

        <p style="line-height: 1.6; color: #d1d5db; font-size: 1.05rem;">Te mantendré al tanto de mis últimos cortometrajes, tarifas de producción de video y fotografía, y actualizaciones importantes de mis sistemas de software.</p>
        <p style="line-height: 1.6; color: #ffffff; font-size: 1.1rem; font-weight: 600; margin-top: 2rem; text-align: center;">¡Construyamos algo increíble juntos!</p>
      </div>
      
      <div style="text-align: center; border-top: 1px solid #2d1b4e; padding-top: 2rem; font-size: 0.85rem; color: #9ca3af; margin-top: 2rem;">
        <p style="margin: 0;">ZetaH Gallery &copy; 2026. Ibarra, Imbabura, Ecuador.</p>
        <p style="margin: 0.5rem 0 0; color: #7000ff; font-weight: bold; letter-spacing: 0.15em; font-size: 0.9rem;">MAÑANA SERÁ OTRO DÍA</p>
      </div>
    </div>
  `;
};

// Generic campaign wrapper template (HTML)
const getCampaignTemplate = (content: string) => {
  return `
    <div style="background-color: #0c0519; color: #e5e7eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2.5rem; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #2d1b4e; box-shadow: 0 10px 30px rgba(112, 0, 255, 0.15);">
      <!-- Header / Logo -->
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #00d2ff 0%, #7000ff 100%); border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(112, 0, 255, 0.3);">
        <h1 style="color: #ffffff; font-weight: 900; letter-spacing: 0.18em; margin: 0; font-size: 30px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">ZETAH GALLERY</h1>
        <p style="color: rgba(255,255,255,0.9); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.3em; margin: 0.5rem 0 0; font-weight: 600;">Boletín Informativo</p>
      </div>
      
      <div style="padding: 1rem 0; line-height: 1.7; color: #d1d5db; font-size: 1.05rem;">
        ${content.replace(/\n/g, '<br>')}
      </div>
      
      <div style="text-align: center; border-top: 1px solid #2d1b4e; padding-top: 2rem; font-size: 0.85rem; color: #9ca3af; margin-top: 2rem;">
        <p style="margin: 0;">Recibes este correo porque te suscribiste a la lista de ZetaH Gallery.</p>
        <p style="margin: 0.25rem 0 0;">ZetaH Gallery &copy; 2026. Ibarra, Imbabura, Ecuador.</p>
      </div>
    </div>
  `;
};

// Create transporter
const getTransporter = () => {
  const user = process.env.EMAIL_REMITENTE || 'haroljoshue17@gmail.com';
  const pass = process.env.APP_PASSWORD_GMAIL || 'srfnhgzfraqkxqoe';
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

/**
 * Sends a welcome automated email to a new subscriber.
 */
export async function sendWelcomeEmail(recipientEmail: string): Promise<boolean> {
  console.log(`[MAILER] Dispatching automated response welcome email to: ${recipientEmail}`);
  const transporter = getTransporter();
  const htmlContent = getWelcomeTemplate();
  
  const mailOptions = {
    from: `"ZetaH Gallery" <${process.env.EMAIL_REMITENTE || 'haroljoshue17@gmail.com'}>`,
    to: recipientEmail,
    subject: '🤖 ¡Bienvenido a ZetaH Gallery! - Contactos & Portafolio',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[MAILER] Welcome email sent successfully:', info.messageId);
    return true;
  } catch (err: any) {
    console.error('[MAILER] Error sending welcome email:', err.message);
    return false;
  }
}

/**
 * Sends a newsletter campaign email to a subscriber.
 */
export async function sendCampaignEmail(recipientEmail: string, subject: string, content: string): Promise<boolean> {
  console.log(`[MAILER] Dispatching campaign email to: ${recipientEmail} with subject: "${subject}"`);
  const transporter = getTransporter();
  const htmlContent = getCampaignTemplate(content);

  const mailOptions = {
    from: `"ZetaH Gallery" <${process.env.EMAIL_REMITENTE || 'haroljoshue17@gmail.com'}>`,
    to: recipientEmail,
    subject: subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[MAILER] Campaign email sent successfully:', info.messageId);
    return true;
  } catch (err: any) {
    console.error('[MAILER] Error sending campaign email:', err.message);
    return false;
  }
}

/**
 * Sends congratulations email to the winner and warning to the admin.
 */
export async function sendWinnerEmails(winnerName: string, winnerEmail: string, winnerPhone: string): Promise<boolean> {
  console.log(`[MAILER] Dispatching winner notification emails for: ${winnerName} (${winnerEmail})`);
  const transporter = getTransporter();
  const adminEmail = process.env.EMAIL_REMITENTE || 'haroljoshue17@gmail.com';

  const winnerHtml = `
    <div style="background-color: #0c0519; color: #e5e7eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2.5rem; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #2d1b4e; box-shadow: 0 10px 30px rgba(112, 0, 255, 0.15);">
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #00d2ff 0%, #7000ff 100%); border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(112, 0, 255, 0.3);">
        <h1 style="color: #ffffff; font-weight: 900; letter-spacing: 0.18em; margin: 0; font-size: 30px; text-shadow: 0 2px 5px rgba(0,0,0,0.3);">¡FELICIDADES!</h1>
        <p style="color: rgba(255,255,255,0.9); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.3em; margin: 0.5rem 0 0; font-weight: 600;">Ganaste una Sesión de Fotos Gratis</p>
      </div>
      
      <div style="padding: 1rem 0;">
        <h2 style="color: #ffffff; font-size: 1.5rem; margin-top: 0; font-weight: 700; border-left: 4px solid #00d2ff; padding-left: 10px;">¡Completaste el reto en ZetaH Runner!</h2>
        <p style="line-height: 1.6; color: #d1d5db; font-size: 1.05rem;">Hola ${winnerName},</p>
        <p style="line-height: 1.6; color: #d1d5db; font-size: 1.05rem;">¡Impresionante! Has alcanzado los 1000 puntos en ZetaH Runner y te has ganado una sesión de fotos completamente gratis con ZetaH.</p>
        
        <div style="background: rgba(18, 9, 36, 0.65); border: 1px solid #2d1b4e; padding: 1.5rem; border-radius: 12px; margin: 2.5rem 0; text-align: center;">
          <h3 style="color: #00d2ff; margin-top: 0; font-size: 1.15rem; font-weight: 600;">⚠️ PASO IMPORTANTE PARA RECLAMAR TU PREMIO:</h3>
          <p style="color: #ffffff; font-size: 1.1rem; line-height: 1.6;">
            Por favor, responde directamente a este correo adjuntando una <strong>captura de pantalla (screenshot)</strong> de tu pantalla de victoria con los 1000 puntos para verificar tu logro y poder coordinar la fecha, lugar y detalles de tu sesión de fotos.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; border-top: 1px solid #2d1b4e; padding-top: 2rem; font-size: 0.85rem; color: #9ca3af; margin-top: 2rem;">
        <p style="margin: 0;">ZetaH Gallery &copy; 2026. Ibarra, Imbabura, Ecuador.</p>
      </div>
    </div>
  `;

  const adminHtml = `
    <div style="background-color: #0c0519; color: #e5e7eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2.5rem; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #2d1b4e; box-shadow: 0 10px 30px rgba(112, 0, 255, 0.15);">
      <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #7000ff 100%); border-radius: 12px; margin-bottom: 2rem;">
        <h1 style="color: #ffffff; font-weight: 900; letter-spacing: 0.18em; margin: 0; font-size: 30px;">🏆 ¡NUEVO GANADOR!</h1>
        <p style="color: rgba(255,255,255,0.9); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.3em; margin: 0.5rem 0 0; font-weight: 600;">Premio: Sesión de Fotos Gratis</p>
      </div>
      
      <div style="padding: 1rem 0;">
        <h2 style="color: #ffffff; font-size: 1.3rem; margin-top: 0;">Un jugador superó los 1000 puntos en ZetaH Runner:</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; color: #e5e7eb;">
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #2d1b4e; width: 30%;">Nombre:</td>
            <td style="padding: 8px; border-bottom: 1px solid #2d1b4e;">${winnerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #2d1b4e;">Correo:</td>
            <td style="padding: 8px; border-bottom: 1px solid #2d1b4e;"><a href="mailto:${winnerEmail}" style="color: #00d2ff; text-decoration: none;">${winnerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #2d1b4e;">Celular:</td>
            <td style="padding: 8px; border-bottom: 1px solid #2d1b4e;">${winnerPhone}</td>
          </tr>
        </table>
        <p style="color: #9ca3af; line-height: 1.6;">El ganador ha sido notificado por correo y se le ha solicitado que envíe una captura de pantalla del juego para validar el premio.</p>
      </div>
    </div>
  `;

  try {
    // 1. Send to winner
    await transporter.sendMail({
      from: `"ZetaH Gallery" <${adminEmail}>`,
      to: winnerEmail,
      subject: '🏆 ¡Ganaste una sesión de fotos gratis con ZetaH!',
      html: winnerHtml
    });

    // 2. Send to admin
    await transporter.sendMail({
      from: `"ZetaH Gallery" <${adminEmail}>`,
      to: adminEmail,
      subject: `🏆 ¡Nuevo Ganador de Sesión de Fotos: ${winnerName}!`,
      html: adminHtml
    });

    console.log('[MAILER] Winner notification emails sent successfully.');
    return true;
  } catch (err: any) {
    console.error('[MAILER] Error sending winner notification emails:', err.message);
    return false;
  }
}
