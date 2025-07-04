const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../schema.js');
const app = express();
app.use(express.json()); 

require('dotenv').config();

function isFinancialQuery(message) {
  const keywords = ['finance', 'money', 'saving', 'investment', 'budget', 'expense', 'spending', 'debt'];
  return keywords.some(k => message.toLowerCase().includes(k));
}

function isValidYouTubeURL(url) {
  return /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/.test(url);
}

router.post('/playlist', async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!isFinancialQuery(message)) {
      return res.status(400).json({ error: 'Only finance-related videos are allowed.' });
    }

    const userProfile = [
      user.about1, user.about2, user.about3, user.about4, user.about5,
      user.about6, user.about7, user.about8, user.about9, user.about10
    ].filter(Boolean).join('\n') || 'No profile info provided. Assume general finance background.';

    const systemPrompt = `
You are a financial assistant.
ONLY return 3–5 VALID full YouTube links related to the user's query. Format:
https://www.youtube.com/watch?v=XXXXXXXXXXX

Do NOT explain. Do NOT generate fake links.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistantReply = response.data.choices[0].message.content.trim();

    const urls = Array.from(
      assistantReply.matchAll(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}/g)
    ).map(match => match[0]);

    const validUrls = urls.filter(isValidYouTubeURL);
    const playlists = validUrls.slice(0, 5).map(url => ({ url }));

    if (playlists.length === 0) {
      return res.status(200).json({
        success: true,
        assistantReply: 'No valid finance-related YouTube videos found.',
        playlists: [],
        chatHistory: user.chatHistory
      });
    }

    user.playlists = playlists;
    user.chatHistory.push({
      role: 'assistant',
      message: assistantReply,
      timestamp: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      assistantReply,
      playlists,
      chatHistory: user.chatHistory
    });

  } catch (error) {
    console.error('❌ Playlist error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
