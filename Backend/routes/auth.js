import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

const COOKIE_NAME = "nexus_token";
const SESSION_DURATION_MS = 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function createToken(user) {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: "1h",
    },
  );
}

function setSessionCookie(res, user) {
  res.cookie(COOKIE_NAME, createToken(user), {
    ...cookieOptions,
    maxAge: SESSION_DURATION_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        error: "Name must contain 2–60 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        error: "Password must contain 8–72 characters.",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    setSessionCookie(res, user);

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    setSessionCookie(res, user);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      error: "Login failed. Please try again.",
    });
  }
});

// Current authenticated user
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});


router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { name } = req.body ?? {};

    if (typeof name !== "string") {
      return res.status(400).json({
        error: "A valid name is required.",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        error: "Name must contain 2–60 characters.",
      });
    }

    req.user.name = cleanName;
    await req.user.save();

    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      error: "Unable to update your profile.",
    });
  }
});


// Logout: invalidate existing JWTs for this user and clear the cookie.
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (payload.sub) {
          await User.findByIdAndUpdate(payload.sub, {
            $inc: { tokenVersion: 1 },
          });
        }
      } catch {
        // Even if the token is expired or invalid, clear the cookie.
      }
    }

    clearSessionCookie(res);

    return res.json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    clearSessionCookie(res);

    return res.status(500).json({
      error: "Unable to complete logout.",
    });
  }
});

export default router;
