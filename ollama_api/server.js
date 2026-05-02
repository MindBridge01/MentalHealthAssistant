require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // For logging

const app = express();

// --- Security & Middleware ---
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Bonus: Logs all requests to the terminal

// Basic Rate Limiting: Max 20 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Basic API Key Authentication
const API_KEY = process.env.API_KEY || 'my-super-secret-key';
const authenticate = (req, res, next) => {
    const clientKey = req.headers['x-api-key'];
    if (!clientKey || clientKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// --- Routes ---
const OLLAMA_URL = 'http://localhost:11434';

app.post('/api/generate', authenticate, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Forward the request to your local Ollama instance
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: "llama3",
            prompt: prompt,
            stream: false // Set to true if you want to implement Server-Sent Events later
        });

        // Return only the text response to the user
        res.json({ reply: response.data.response });

    } catch (error) {
        console.error('Ollama Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Proxy for the main backend's chat structure
app.post('/api/chat', authenticate, async (req, res) => {
    try {
        const response = await axios.post(`${OLLAMA_URL}/api/chat`, req.body, {
            responseType: req.body.stream ? 'stream' : 'json'
        });
        
        if (req.body.stream) {
            response.data.pipe(res);
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error('Ollama Chat Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Wrapper running locally at http://localhost:${PORT}`);
});
