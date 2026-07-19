require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3000;

const cors = require('cors');
app.use(cors());
app.use(express.json());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// set up secure password
app.get('/password', (req, res) => {
    res.json({password: process.env.PASSWORD});
});