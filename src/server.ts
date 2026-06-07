import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// تحميل الإعدادات من الخزنة السرية
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// رسالة ترحيبية للتأكد من عمل النظام
app.get('/', (req, res) => {
    res.send('🚀 Aswan Dental System API is Running');
    });

    app.listen(PORT, () => {
        console.log(`✅ Server is breathing on http://localhost:${PORT}`);
        });