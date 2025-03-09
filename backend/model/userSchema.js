import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import crypto from 'crypto';


const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'name should be required'],
        minLength: [5, 'name should be atleast 5 characters'],
        maxLength: [20, 'name should be less than 20 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: [true, 'password is a required field'],
        select: false
    },
    forgetPassword: String,
    forgetPasswordExprie: Date
}, {
    timestamps: true
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    return next();
})

userSchema.methods = {
    jwtoken: function () {
        return JWT.sign(
            {id: this._id, email: this.email},
            process.env.SECRET_KEY,
            {expiresIn: '24h'}
        )
    },

    generatePasswordToken : function () {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgetPassword = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.forgetPasswordExprie = Date.now() + 10 * 60 * 1000;

        return resetToken;
    }
}


const User = mongoose.model('User', userSchema);
export default User;