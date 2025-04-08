const axios = require('axios');
const config = require("../config/config");
// const client = require("twilio")(
//     config.TWILIO_ACCOUNT_SID,
//     config.TWILIO_AUTH_TOKEN,
// );

module.exports.sendOtpOnMobile = async (mobile) => {
    try {
        await client.verify.v2
            .services(config.TWILIO_SERVICE_ID)
            .verifications.create({ to: `+91${mobile}`, channel: "sms" });
        return true;
    } catch (err) {
        return false;
    }
};

// Twilio
module.exports.sendOtpOnEmail = async (email) => {
    try {
        await client.verify.v2
            .services(config.TWILIO_SERVICE_ID)
            .verifications.create({ to: email, channel: "email" });
        return true;
    } catch {
        return false;
    }
};

module.exports.verifyMobileOtp = async(mobile, otp) => {
    try {
        await client.verify.v2
            .services(config.TWILIO_SERVICE_ID)
            .verificationChecks.create({ to: `+91${mobile}`, code: otp });
        return true;
    } catch(e) {
        return false;
    }
};

module.exports.verifyEmailOtp = async(email, otp) => {
    try {
        await client.verify.v2
            .services(config.TWILIO_SERVICE_ID)
            .verificationChecks.create({ to: email, code: otp });
        return true;
    } catch(e) {
        return false;
    }
};

module.exports.welcomeMail = async (email, loginId) => {
    try {
        let data = JSON.stringify({
            "authuser": "user@example.com",
            "authpass": "SMkhhf4J68XX",
            "from": "boostbullion@gmail.com",
            "to": email,
            "subject": "Welcome to BNBX",
            "content": "This is the plain text version of the message.", // Plain text version
            "html_content": `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Welcome to BNBX</h2>
                    <p>We are excited to have you on board. Below are your login details:</p>
                    <p><strong>Login ID:</strong> ${loginId}</p>
                    <p>Please keep this information secure and do not share it with anyone.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The BNBX Team</p>
                </div>
            `
        });

        let axiosConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.turbo-smtp.com/api/v2/mail/send',
            headers: { 
                'accept': 'application/json', 
                'Authorization': 'bCSdm382HawO7hkGlVzqXLoPEcr4jFDt', 
                'consumerKey': 'b53737e85e3ae186fbb21e16b22757ba', 
                'consumerSecret': 'bCSdm382HawO7hkGlVzqXLoPEcr4jFDt', 
                'Content-Type': 'application/json'
            },
            data: data
        };

        await axios.request(axiosConfig);
        console.log("Login Id send on email");
        return true; // Email sent successfully
    } catch (e) {
        console.error('Error sending email:', e.message);
        return false; // Failed to send email
    }
};

module.exports.sendEmailOtp = async (email, otp) => {
    try {
        let data = JSON.stringify({
            "authuser": "user@example.com",
            "authpass": "SMkhhf4J68XX",
            "from": "testbnbx@gmail.com",
            "to": email,
            "subject": "Password Reset OTP - BNBX",
            "content": `Your OTP for password reset is ${otp}.`, // Plain text version
            "html_content": `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset the password for your BNBX account associated with this email address.</p>
                    <p><strong>Your OTP for password reset is:</strong></p>
                    <h1 style="color: #2d89ef;">${otp}</h1>
                    <p>Please use this OTP within the next 10 minutes. If you did not request a password reset, please ignore this email or contact our support team.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The BNBX Team</p>
                </div>
            `
        });

        let axiosConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.turbo-smtp.com/api/v2/mail/send',
            headers: { 
                'accept': 'application/json', 
                'Authorization': 'bCSdm382HawO7hkGlVzqXLoPEcr4jFDt', 
                'consumerKey': 'b53737e85e3ae186fbb21e16b22757ba', 
                'consumerSecret': 'bCSdm382HawO7hkGlVzqXLoPEcr4jFDt', 
                'Content-Type': 'application/json'
            },
            data: data
        };

        await axios.request(axiosConfig);
        console.log("OTP sent to email");
        return true; // Email sent successfully
    } catch (e) {
        console.error('Error sending email:', e.message);
        return false; // Failed to send email
    }
};

