// signup , signin , logout

import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

// Sign up

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;

        if (!fullName || !email || !password || !mobile || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // email validation
        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
            });
        }

        // 🔴 FIXED LINE
        let user = await User.findOne({ email });

        if (user) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        if (mobile.length < 10) {
            return res
                .status(400)
                .json({ message: "Mobile number must be at least 10 digits" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            mobile,
            role,
        });

        const token = await genToken(user._id);

        res.cookie("token", token , {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to Sign Up",
            user
        });
    }
};


// Sign In

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "User does not exist."
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        const token = await genToken(user._id)

        res.cookie("token", token , {
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        
        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.fullName}`,
            user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Failed to Sign In",
            user
        })
    }
}

// Sign Out
export const signOut = async (req, res) => {
    try {
        res.clearCookie("token")
        return res.status(200).json({ message: "Log out Suceessfully" })
    } catch (error) {
        return res.status(500).json({
            message: `Log out error`
        })
    }
}

// Reset Password Controller

// 1. OTP generation --->  send the OTP to email (install nodemailer on backend for send this otp to email)

export const sendOtp = async (req,res) => {
    try {
      const {email} = req.body
      const user = await User.findOne({email})
      if(!user){
        return res.status(400).json({
            success:false,
            message:"User does not exist"
        })
      }  
    //   generate OTP with 6 digit 
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    // store the otp on resetOtp
    user.resetOtp=otp
    // expire otp
    user.otpExpires = Date.now()+5*60*1000

    user.isOtpVerified = false
    await user.save()
    await sendOtpMail(email , otp)
    return res.status(200).json({
        success:true,
        message:"Otp send successfully"
    })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message: `Otp does not send`
        })
    }
}

// OTP verification ---> user put the OTP and compare with the otp which is store in resetOtp

// Controller to verify OTP sent to user's email
export const verifyOtp = async (req, res) => {
    try {
        // Extract email and OTP from request body
        const { email, otp } = req.body

        // Find the user using the provided email
        const user = await User.findOne({ email })

        // Validation:
        // 1. User does not exist
        // 2. OTP does not match
        // 3. OTP has expired
        if (
            !user ||
            user.resetOtp !== otp ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            })
        }

        // Mark OTP as successfully verified
        user.isOtpVerified = true

        // Clear OTP and expiry time after successful verification
        user.resetOtp = undefined
        user.otpExpires = undefined

        // Save updated user data
        await user.save()

        // Send success response
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        })

    } catch (error) {
        // Handle unexpected server errors
        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        })
    }
};

// 3. Finally Reset the Password 

export const resetPassword = async (req,res) => {
    try {
       const {email , newPassword} = req.body
       const user = await User.findOne({email})
        if(!user || !user.isOtpVerified){
        return res.status(400).json({
            success:false,
            message:"OTP verification required"
        })
      }  
      const hashedPassword = await bcrypt.hash(newPassword,10)
      user.password = hashedPassword
      
      user.isOtpVerified=false
      await user.save()
      return res.status(200).json({
        success:true,
        message:"Password reset successfully"
      })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Reset Password Error"
        })
    }
}

// Controller for Google authentication
// This controller is used for BOTH signup and signin
export const googleAuth = async (req, res) => {
    try {
        // Destructure required user details from request body
        // These values are sent from frontend after Google login
        const { fullName, email, mobile,role } = req.body;

        // Check if the user already exists in the database using email
        // Email is unique for each Google account
        let user = await User.findOne({ email });

        // If user does NOT exist → create a new user (Signup)
        if (!user) {
            user = await User.create({
                fullName,
                email,
                mobile,
                role
            });
        }

        // Generate JWT token for the user (Signin / Session creation)
        // user._id is used to uniquely identify the user
        const token = await genToken(user._id);

        // Store the token in an HTTP-only cookie
        // httpOnly → prevents access from JavaScript (XSS protection)
        // sameSite → prevents CSRF attacks
        // maxAge → cookie expiry (7 days)
        res.cookie("token", token, {
            secure: false,           // set true in production (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
        });

        // Send success response to client
        return res.status(201).json({
            success: true,
            message: `Welcome back ${user.fullName}`,
            user
        });

    } catch (error) {
        console.log(error);
        // Handle server or authentication errors
        return res.status(500).json({
            success: false,
            message: "Google Authentication error"
        });
    }
};
