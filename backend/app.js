import express from "express";
import authRouter from "./router/authRoute.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);

app.use('/', (req, res) => {
    res.send('hello user');
})

export default app;