require('dotenv').config();
const express = require('express');
const cors = require('cors');
const telegramRoutes = require('./routes/telegramRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', telegramRoutes);

const scoreRoutes = require('./routes/scoreRoutes');
app.use('/api/telegram', scoreRoutes);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));