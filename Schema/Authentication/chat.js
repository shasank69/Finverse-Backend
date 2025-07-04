const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../schema.js');
const fetch = require('node-fetch');
const app = express();
app.use(express.json()); 

require('dotenv').config();

function isFinancialQuery(message) {
  const keywords = ['finance', 'money', 'saving', 'investment', 'budget', 'expense', 'spending', 'debt'];
  return keywords.some(k => message.toLowerCase().includes(k));
}

function isVideoRequest(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes('suggest') && (lower.includes('video') || lower.includes('youtube')) ||
    lower.includes('give me videos') ||
    lower.includes('recommend videos') ||
    lower.includes('finance playlist')
  );
}

function isAssignmentRequest(message) {
  return message.toLowerCase().includes('assignment');
}

router.post('/', async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.chatHistory.push({ role: 'user', message, timestamp: new Date() });

    if (isAssignmentRequest(message)) {
      const response = await fetch(`https://finverse-backend-fbxo.onrender.com/assignment/start/${email}`, {
        method: 'POST'
      });
      const data = await response.json();
      await user.save();
      return res.status(200).json({
        success: true,
        assistantReply: 'Here are your 5 assignment questions.',
        assignment: data.assignments,
        chatHistory: user.chatHistory
      });
    }

    if (!isFinancialQuery(message)) {
      await user.save();
      return res.status(200).json({
        success: true,
        assistantReply: "Sorry, I can only assist with finance-related questions.",
        chatHistory: user.chatHistory
      });
    }

    if (isVideoRequest(message)) {
      await user.save();
      return res.status(200).json({
        success: true,
        playlistRequested: true,
        message: "This looks like a video request. Forwarding to playlist handler..."
      });
    }

    const aboutFields = [
      user.about1, user.about2, user.about3, user.about4, user.about5,
      user.about6, user.about7, user.about8, user.about9, user.about10
    ].filter(Boolean);

    const userProfile = aboutFields.length > 0
      ? `User's Financial Background:\n${aboutFields.map((a, i) => `About${i + 1}: ${a}`).join('\n')}`
      : 'No profile information provided. Assume general financial background.';

    const systemPrompt = `
You are a financial assistant.
ONLY reply to finance-related questions.
Ignore unrelated questions.
Use the user's profile below if relevant:

${userProfile}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...user.chatHistory.map(chat => ({
        role: chat.role,
        content: chat.message
      })),
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

    user.chatHistory.push({
      role: 'assistant',
      message: assistantReply,
      timestamp: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      assistantReply,
      chatHistory: user.chatHistory
    });

  } catch (error) {
    console.error('❌ Chat error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
