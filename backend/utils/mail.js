import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// Configure Brevo API client
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Email API instance
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();


// Function to send OTP email for password reset
export const sendOtpMail = async (to, otp) => {
  try {

    const email = {
      sender: {
        name: "Bitez Support",
        email: process.env.SENDER_EMAIL
      },
      to: [{ email: to }],
      subject: "Reset Your Password",
      htmlContent: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`
    };

    await emailApi.sendTransacEmail(email);

  } catch (error) {
    console.log("Email sending error:", error);
  }
};


// Function to send Delivery OTP email
export const sendDeliveryOTPMail = async (user, otp) => {
  try {

    const email = {
      sender: {
        name: "Bitez Delivery",
        email: process.env.SENDER_EMAIL
      },
      to: [{ email: user.email }],
      subject: "Delivery OTP",
      htmlContent: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`
    };

    await emailApi.sendTransacEmail(email);

  } catch (error) {
    console.log("Email sending error:", error);
  }
};