// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();
// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));


// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Or your preferred method of secure key storage.
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// //Generate Key
// router.post('/generateQuestion', async (req, res) => {
//     try {
//         const { topic, difficulty } = req.body;
//         const prompt = `Generate 5 questions on ${topic} at ${difficulty} level, Here qustions are in form of object and each object has question and 4 options and answer .Provide all question in single array of objects`;

//         if (!prompt) {
//             return res.status(400).json({ error: 'Prompt is required' });
//         }
//         const result = await model.generateContent(prompt);

//         const response = result.response;
//         const text = response.text();
//         const codeString = text;
//         const arrayStart = codeString.indexOf('[');
//         const arrayEnd = codeString.lastIndexOf(']') + 1;
//         const arrayString = codeString.slice(arrayStart, arrayEnd);

//         const jsonString = arrayString.replace(/(\w+):/g, '"$1":');
//         const backendQuestions = JSON.parse(jsonString);


//         res.status(200).json({ questions: backendQuestions });

//     } catch (error) {
//         console.error("Error generating questions:", error);
//         res.status(500).json({ error: error.message });
//     }
// })

// module.exports = router;

//Now new correct

const express = require("express");
const router = express.Router();
require("dotenv").config();

router.use(express.json());

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

let lastRequestTime = 0;

router.post("/generateQuestion", async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequestTime < 1500) {
      return res.status(429).json({ error: "Too many requests" });
    }
    lastRequestTime = now;

    const { topic, difficulty } = req.body;

    const prompt = `
Generate 5 questions on "${topic}" at "${difficulty}" level.
Return ONLY valid JSON in this format:
[
  {
    "question": "",
    "options": ["", "", "", ""],
    "answer": ""
  }
]
`;

    const result = await model.generateContent(prompt);
    const questions = JSON.parse(result.response.text());

    res.status(200).json({ questions });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
