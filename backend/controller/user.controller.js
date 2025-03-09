import emailValidator from 'email-validator';
import User from '../model/userSchema.js';
import otpgenerator, { generate } from 'otp-generator';
import sendEmail from '../utills/sendEmail.js';
import NodeCache from 'node-cache';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const otpCache = new NodeCache({ stdTTL: 300 });

const generateOTPEmail = (otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Your OTP Code</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f7f9;
                text-align: center;
                padding: 30px;
            }
            .container {
                background-color: #ffffff;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15);
                max-width: 450px;
                margin: auto;
                border-left: 5px solid #4285F4; /* Gmail Blue */
            }
            h2 {
                color: #4285F4; /* Gmail Blue */
            }
            p {
                color: #555;
                font-size: 16px;
            }
            .otp {
                font-size: 24px;
                font-weight: bold;
                color: #ffffff;
                background: linear-gradient(45deg, #4285F4, #34A853); /* Gmail Blue & Green */
                display: inline-block;
                padding: 12px 24px;
                border-radius: 8px;
                margin: 15px 0;
                letter-spacing: 2px;
            }
            .footer {
                font-size: 13px;
                color: #777;
                margin-top: 20px;
            }
            .footer a {
                color: #4285F4;
                text-decoration: none;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔐 Your Secure OTP Code</h2>
            <p>Hello,</p>
            <p>Your one-time password (OTP) for verification is:</p>
            <div class="otp">${otp}</div>
            <p>This OTP is valid for only <b>5 minutes</b>. Do not share it with anyone! 🚀</p>
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <div class="footer">
                <p>Stay secure! <br><b>Your App Team</b></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

const genrateForgetPasswordEmail = (RESET_LINK) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 500px;
                    margin: 50px auto;
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                h2 {
                    color: #333;
                }
                p {
                    font-size: 16px;
                    color: #555;
                }
                .btn {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 20px;
                    font-size: 16px;
                    color: #fff;
                    background: #007BFF;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                }
                .btn:hover {
                    background: #0056b3;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to reset it.</p>
                <a href="{{RESET_LINK}}" class="btn">Reset Password</a>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p class="footer">If you need help, contact our support team.</p>
            </div>
        </body>
        </html>
    `
}

export const signup = async (req, res) => {
    const {name, email, password} = req.body;
    
    if(!email || !name || !password){
        return res.status(400).json({
            success: false,
            message: 'every field is required'
        })
    }

    const validEmail = emailValidator.validate(email);
    if(!validEmail) {
        return res.status(400).json({
            success: false,
            message: 'provide a valid email'
        })
    }

    const userExists = await User.findOne({email});
    console.log(userExists);
    if(userExists){
        return res.status(400).json({
            success: false,
            message: 'email id is already exists'
        })
    }
    try {
        const otp = otpgenerator.generate(6, {upperCaseAlphabets: false, specialChars: false});
        console.log('otp : ', otp);

        otpCache.set(email, {otp, email, password, name});

        const message = generateOTPEmail(otp);

        await sendEmail(email, 'Your Secure OTP Code', message);

        res.status(200).json({
            success: true,
            message: 'otp is send to mail go furother process'
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: e.message
        })
    }
}

export const verifyOtp = async (req, res) => {
    const {email, otp} = req.body;
    const storedData = otpCache.get(email);
    if(!storedData) {
        return res.status(400).json({
            success: false,
            message: 'otp is expired'
        })
    }
    if(String(storedData.otp) !== String(otp)){
        return res.status(400).json({
            success: false,
            message: 'invalid otp'
        })
    }

    otpCache.del(email);
    console.log('otp is verified successfully!');

    const userInfo = new User({email: storedData.email, password: storedData.password, name: storedData.name});
    const result = await userInfo.save();

    res.status(200).json({
        success: true,
        message: 'signup successfully',
        data: result
    })
}

export const signin = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: 'provide all fields'
        })
    }

    const user = await User.findOne({email}).select('+password');

    if(!user) {
        return res.status(400).json({
            success: false,
            message: 'user not found'
        })
    }

    const passwordMatch = bcrypt.compare(password, user.password);

    if(!passwordMatch){
        return res.status(400).json({
            success: false,
            message: 'wrong password'
        })
    }

    user.password = null;

    const token = await user.jwtoken();
    console.log(token);

    const cookieOptions = {
        maxage: 60 * 60 * 24 * 1000,
        httpOnly: true
    }

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        message: 'login successfull'
    })
}

export const logout = async (req, res) => {
    try {
        const cookieOptions = {
            expire: new Date(),
            httpOnly: true
        }

        res.cookie('token', null, cookieOptions);

        res.status(200).json({
            success: true,
            message: 'logged successfully'
        })

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error
        })
    }
}

export const getUser = async (req, res) => {

    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if(!user){
            return res.status(400).json({
                success: false,
                message: 'user is not exists'
            })
        }

        res.status(200).json({
            success: true,
            message: 'fetching user data successfully',
            data: user
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error
        })
    }
    
}

export const forgotPassword = async (req, res) => {
    const {email} = req.body;

    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({
            success: false,
            message: 'user is not found'
        })
    }

    try {
        const resetToken = user.generatePasswordToken();
        console.log(resetToken);

        await user.save();

        const resetPasswordUrl = `http//:localhost:5000/reset-password/${resetToken}`;

        const message = genrateForgetPasswordEmail(resetPasswordUrl);
        const subject = "RESETTNG PASSWORD URL"

        await sendEmail(email, subject, message);

        return res.status(200).json({
            success: true,
            message: `the reset password link is send to ${email} successfully`
        })
    } catch (error) {
        user.forgetPassword = undefined;
        user.forgetPasswordExprie = undefined;

        await user.save();

        res.status(400).json({
            success: false,
            message: error.message || error
        })
    }

}

export const resetPassword = async (req, res) => {
    const {resetToken} = req.params;

    const { password } = req.body;

    if(!password){
        return res.status(400).json({
            success: false,
            message: 'please provide password!'
        })
    }

    const forgetPassword = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        forgetPassword,
        forgetPasswordExprie: { $gt: Date.now() }
    });
    console.log(user);

    if(!user) {
        return res.status(400).json({
            success: false,
            message: 'user not found'
        })
    }

    user.password = password;
    user.forgetPassword = undefined;
    user.forgetPasswordExprie = undefined;
    await user.save();

    return res.status(200).json({
        success: true,
        message: 'password changed successfully!'
    })
}