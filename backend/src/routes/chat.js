const express = require("express");
const router = express.Router();

const { verifyAccessToken } = require("../middleware/auth.js");
const { sendMessage, getMessages } = require("../controllers/chatController");

router.post("/send", verifyAccessToken, sendMessage);
router.get("/:chatId", verifyAccessToken, getMessages);

module.exports = router;