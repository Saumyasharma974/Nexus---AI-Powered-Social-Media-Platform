import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'Gmail', // e.g., 'Gmail', 'SendGrid', etc.
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // Define the email options
    const mailOptions = {
        from: `Nexus Social <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // Actually send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
