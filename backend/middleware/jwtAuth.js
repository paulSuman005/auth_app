import JWT from 'jsonwebtoken';

const jwtAuth = (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        res.status(400).json({
            success: false,
            message: 'user is unAutherized'
        })
    }

    const verifyUser = JWT.verify(token, process.env.SECRET_KEY);
    req.user = {id: verifyUser.id, email: verifyUser.email};
    if(!verifyUser){
        res.status(400).json({
            success: false,
            message: 'Invalid token'
        })
    }

    next();
}

export default jwtAuth;