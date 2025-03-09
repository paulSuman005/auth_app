import 'dotenv/config';
import app from './app.js';
import connectionDb from './config/db.config.js';


const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
    connectionDb();
    console.log(`server is running at http://localhost:${PORT}`);
})
