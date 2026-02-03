const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send contact form email
exports.sendContactEmail = async (contactData) => {
  try {
    const transporter = createTransporter();
    
    // Email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission from ${contactData.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
        <hr>
        <p>This message was sent from your portfolio website contact form.</p>
      `
    };
    
    // Auto-reply to user
    const userMailOptions = {
      from: process.env.EMAIL_FROM,
      to: contactData.email,
      subject: 'Thank you for contacting me!',
      html: `
        <h2>Thank You for Your Message!</h2>
        <p>Dear ${contactData.name},</p>
        <p>I have received your message and will get back to you as soon as possible.</p>
        <p>Here's a copy of your message:</p>
        <blockquote>${contactData.message}</blockquote>
        <hr>
        <p>Best regards,<br>${process.env.SITE_NAME || 'Portfolio Admin'}</p>
      `
    };
    
    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);
    
    console.log('Contact emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
};

// Test email configuration
exports.testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    
    const testMailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from Portfolio Backend',
      text: 'This is a test email to confirm your email configuration is working correctly.'
    };
    
    await transporter.sendMail(testMailOptions);
    console.log('Test email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
};