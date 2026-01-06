// src/controllers/recentDestination.controller.js

// 임시 코드
const userId = Number(req.header("x-user-id"));
if (!userId) return res.status(401).json({ message: "Unauthorized" });