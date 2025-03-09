import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_AUTH_USER,
            pass: process.env.SMTP_AUTH_PASS
        }
    });

    transporter.verify((error, success) => {
        if (error) {
            console.error(error);
        } else {
            console.log("SMTP connection successful!");
        }
    });

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: subject,
        html: message
    }

    const info = await transporter.sendMail(mailOptions);
}


export default sendEmail;
