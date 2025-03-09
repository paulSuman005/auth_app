import express from 'express';
import { forgotPassword, getUser, logout, resetPassword, signin, signup, verifyOtp } from '../controller/user.controller.js';
import jwtAuth from '../middleware/jwtAuth.js';

const authRouter = express.Router();

authRouter.post('/signup', signup);
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/signin', signin);
authRouter.post('/forgotpassword', forgotPassword);
authRouter.post('/reset/:resetToken', resetPassword);
authRouter.get('/getuser', jwtAuth, getUser);
authRouter.get('/logout', jwtAuth, logout);


export default authRouter;