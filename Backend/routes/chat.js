import express from "express";
import Thread from "../models/Thread.js";
import requireAuth from "../middleware/auth.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();

// All chat routes require authentication.
router.use(requireAuth);

// Get only the authenticated user's threads.
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({
      userId: req.user._id,
    })
      .select("threadId title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.json(threads);
  } catch (error) {
    console.error("Fetch threads error:", error.message);

    return res.status(500).json({
      error: "Failed to fetch conversations.",
    });
  }
});

// Get a conversation only if it belongs to the current user.
router.get("/thread/:threadId", async (req, res) => {
  try {
    const thread = await Thread.findOne({
      threadId: req.params.threadId,
      userId: req.user._id,
    });

    if (!thread) {
      return res.status(404).json({
        error: "Conversation not found.",
      });
    }

    return res.json(thread.messages);
  } catch (error) {
    console.error("Fetch conversation error:", error.message);

    return res.status(500).json({
      error: "Failed to fetch conversation.",
    });
  }
});

// Delete only the authenticated user's conversation.
router.delete("/thread/:threadId", async (req, res) => {
  try {
    const deletedThread = await Thread.findOneAndDelete({
      threadId: req.params.threadId,
      userId: req.user._id,
    });

    if (!deletedThread) {
      return res.status(404).json({
        error: "Conversation not found.",
      });
    }

    return res.json({
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error("Delete conversation error:", error.message);

    return res.status(500).json({
      error: "Failed to delete conversation.",
    });
  }
});

// Send a message and save the conversation.
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body ?? {};

  if (
    typeof threadId !== "string" ||
    threadId.length < 1 ||
    threadId.length > 100 ||
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 10000
  ) {
    return res.status(400).json({
      error: "A valid conversation ID and message are required.",
    });
  }

  try {
    let thread = await Thread.findOne({
      threadId,
      userId: req.user._id,
    });

    if (!thread) {
      // Never create a second conversation using another user's ID.
      const threadExists = await Thread.exists({ threadId });

      if (threadExists) {
        return res.status(404).json({
          error: "Conversation not found.",
        });
      }

      thread = new Thread({
        threadId,
        userId: req.user._id,
        title: message.trim().slice(0, 100),
        messages: [],
      });
    }

    thread.messages.push({
      role: "user",
      content: message,
    });

    const assistantReply = await getOpenAIAPIResponse(message);

    thread.messages.push({
      role: "assistant",
      content: assistantReply,
    });

    thread.updatedAt = new Date();

    await thread.save();

    return res.json({
      reply: assistantReply,
    });
  } catch (error) {
    console.error("Chat error:", error.message);

    return res.status(500).json({
      error: "Unable to generate a response. Please try again.",
    });
  }
});

export default router;
