const express = require('express');
const router = express.Router();
const User = require('../schema.js');
const fetch = require('node-fetch');

router.post('/assignment/start/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const prompt = `Generate 5 finance multiple-choice questions. Each question should have:
- a short question
- 4 options
- specify the correct answer clearly in JSON format like:
[
  {
    "question": "What is a budget?",
    "options": ["A plan", "A tax", "A loan", "A debt"],
    "correctAnswer": "A plan"
  }
]`;

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await openRouterRes.json();
    let content = data.choices[0].message.content.trim();

    if (content.startsWith('```')) {
      content = content.replace(/```json|```/g, '').trim();
    }

    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']') + 1;
    const jsonArray = content.substring(startIdx, endIdx);

    const parsedQuestions = JSON.parse(jsonArray);

    const assignmentDocs = parsedQuestions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.assignments = assignmentDocs;
    await user.save();

    res.status(200).json({
      success: true,
      message: "5 assignments created",
      assignments: assignmentDocs.map(({ question, options }) => ({ question, options }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to parse JSON from AI" });
  }
});

router.post('/assignment/submit/:email', async (req, res) => {
  const { email } = req.params;
  const { answers } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.assignments || user.assignments.length < 5) {
      return res.status(400).json({ success: false, message: "No active assignments or incomplete set." });
    }

    let score = 0;
    user.assignments.forEach((q, idx) => {
      if (answers[idx] && answers[idx].trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        score++;
      }
    });

    user.assignments = [];
    await user.save();

    res.status(200).json({ success: true, score, total: 5 });
  } catch (e) {
    res.status(500).json({ success: false, message: "Evaluation failed" });
  }
});

module.exports = router;
