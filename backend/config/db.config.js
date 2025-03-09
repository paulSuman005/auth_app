import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URI;

const connectionDb = () => {
    mongoose.connect(MONGODB_URL)
    .then((conn) => {
        console.log(`db connected to ${conn.connection.host}`);
    }).catch(e => {
        console.log(e);
        process.exit(1);
    });
}

export default connectionDb;