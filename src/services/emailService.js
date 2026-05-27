const nodemailer = require('nodemailer');
require('dotenv').config();

// Create nodemailer transporter if credentials exist
let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends the 6-character access code to the user's email.
 * Falls back to printing to the console if no SMTP credentials are provided.
 */
const sendAccessCode = async (email, code) => {
  const subject = 'Tu Código de Acceso para Genus Animus';
  const textContent = `¡Felicidades por asimilar tu primera mutación!
  
Tu código de acceso único para reanudar tu partida en Genus Animus es:
👉 ${code}

Usa este código junto con tu dirección de correo electrónico (${email}) para iniciar sesión desde cualquier dispositivo.

Que la evolución guíe tu camino.
El Planeta.`;

  const htmlContent = `
    <div style="font-family: monospace; background-color: #031514; color: #2ee0c7; padding: 20px; border-radius: 8px; border: 1px solid rgba(46,224,199,0.3);">
      <h2 style="color: #39ffd0; text-align: center; border-bottom: 1px solid rgba(46,224,199,0.3); padding-pb: 10px;">
        GENUS ANIMUS
      </h2>
      <p>¡Felicidades por asimilar tu primera mutación!</p>
      <p>Tu código de acceso único para reanudar tu partida es:</p>
      <div style="background-color: #000; padding: 15px; border-radius: 4px; text-align: center; border: 1px solid #39ffd0; font-size: 24px; letter-spacing: 4px; font-weight: bold; margin: 20px 0;">
        ${code}
      </div>
      <p>Usa este código junto con tu dirección de correo electrónico (<strong>${email}</strong>) para iniciar sesión desde cualquier dispositivo.</p>
      <hr style="border: 0; border-top: 1px solid rgba(46,224,199,0.2); margin: 20px 0;" />
      <p style="font-size: 10px; color: rgba(46,224,199,0.6); text-align: center;">
        Que la evolución guíe tu camino. <br/>El Planeta.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@genusanimus.com',
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`Email successfully sent to ${email} (via SMTP).`);
      return true;
    } catch (err) {
      console.error('Failed to send email via SMTP, falling back to console:', err);
    }
  }

  // Console fallback with ascii/text box representation
  console.log('\n' + '='.repeat(60));
  console.log('   MOCK EMAIL SERVICE — CÓDIGO DE ACCESO GENERADO');
  console.log('='.repeat(60));
  console.log(`   Para:     ${email}`);
  console.log(`   Asunto:   ${subject}`);
  console.log(`   Código:   [ ${code} ]`);
  console.log('-'.repeat(60));
  console.log('   Cuerpo del mensaje:');
  console.log(textContent.split('\n').map(line => '   ' + line).join('\n'));
  console.log('='.repeat(60) + '\n');
  return true;
};

module.exports = {
  sendAccessCode,
};
