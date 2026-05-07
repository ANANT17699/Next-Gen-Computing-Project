/**
 * E-Blood Bank Backend Server
 * Handles email verification, user management, and API endpoints
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const app = express();

// ══════════════════════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════════════════════
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ══════════════════════════════════════════════════════════
// EMAIL SERVICE SETUP
// ══════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.sendgrid.net",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === "true",

  auth: {
    user: process.env.EMAIL_USER || "apikey",
    pass: process.env.EMAIL_PASS || process.env.SENDGRID_API_KEY,
  },
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});

// ══════════════════════════════════════════════════════════
// IN-MEMORY STORAGE
// (Replace with MongoDB in production)
// ══════════════════════════════════════════════════════════
const verificationCodes = {};
const resetCodes = {};
const users = [];

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════

// Generate random 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, code, userName = "User") {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@ebloodbank.com",

    to: email,

    subject: "🩸 E-Blood Bank - Email Verification Code",

    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
          }

          .container {
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
          }

          .title {
            color: #d32f2f;
            text-align: center;
          }

          .code-box {
            text-align: center;
            margin: 30px 0;
          }

          .code {
            font-size: 36px;
            font-weight: bold;
            color: #d32f2f;
            letter-spacing: 5px;
          }

          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: gray;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <h1 class="title">🩸 E-Blood Bank</h1>

          <p>Hello ${userName},</p>

          <p>Your verification code is:</p>

          <div class="code-box">
            <div class="code">${code}</div>
          </div>

          <p>This code will expire in 10 minutes.</p>

          <p>
            If you did not request this verification,
            please ignore this email.
          </p>

          <div class="footer">
            © 2026 E-Blood Bank
          </div>

        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${email}`);

    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}
// Send password reset email
async function sendPasswordResetEmail(email, code, userName = "User") {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@ebloodbank.com",
    to: email,
    subject: "🩸 E-Blood Bank - Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
          }

          .container {
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
          }

          .title {
            color: #d32f2f;
            text-align: center;
          }

          .code-box {
            text-align: center;
            margin: 30px 0;
          }

          .code {
            font-size: 36px;
            font-weight: bold;
            color: #d32f2f;
            letter-spacing: 5px;
          }

          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: gray;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <h1 class="title">🩸 E-Blood Bank</h1>
          <p>Hello ${userName},</p>
          <p>Your password reset code is:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <div class="footer">© 2026 E-Blood Bank</div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return true;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
}
// ══════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════

// Send verification code
app.post("/api/send-verification-code", async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check existing user
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Generate code
    const code = generateVerificationCode();

    verificationCodes[email] = {
      code,
      timestamp: Date.now(),
      attempts: 0,
    };

    const userName = firstName
      ? `${firstName} ${lastName || ""}`.trim()
      : "User";

    // Send email
    const emailSent = await sendVerificationEmail(email, code, userName);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.json({
      success: true,
      message: "Verification code sent successfully",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Send verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Verify code
app.post("/api/verify-code", (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and code are required",
      });
    }

    const verification = verificationCodes[email];

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "No verification code found",
      });
    }

    // Check expiration
    const tenMinutes = 10 * 60 * 1000;

    if (Date.now() - verification.timestamp > tenMinutes) {
      delete verificationCodes[email];

      return res.status(400).json({
        success: false,
        message: "Verification code expired",
      });
    }

    // Check attempts
    if (verification.attempts >= 3) {
      delete verificationCodes[email];

      return res.status(400).json({
        success: false,
        message: "Too many failed attempts",
      });
    }

    // Validate code
    if (verification.code !== code) {
      verification.attempts++;

      return res.status(400).json({
        success: false,
        message: `Invalid code. ${
          3 - verification.attempts
        } attempts remaining.`,
      });
    }

    // Success
    delete verificationCodes[email];

    res.json({
      success: true,
      message: "Email verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Send password reset code
app.post("/api/send-password-reset-code", async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const code = generateVerificationCode();
    resetCodes[email] = {
      code,
      timestamp: Date.now(),
      attempts: 0,
    };

    const userName = firstName
      ? `${firstName} ${lastName || ""}`.trim()
      : "User";

    const emailSent = await sendPasswordResetEmail(email, code, userName);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }

    res.json({
      success: true,
      message: "Password reset code sent successfully",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Send password reset code error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Reset password using code
app.post("/api/reset-password", (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code and new password are required",
      });
    }

    const reset = resetCodes[email];
    if (!reset) {
      return res.status(400).json({
        success: false,
        message: "No password reset request found",
      });
    }

    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - reset.timestamp > tenMinutes) {
      delete resetCodes[email];
      return res.status(400).json({
        success: false,
        message: "Reset code expired",
      });
    }

    if (reset.attempts >= 3) {
      delete resetCodes[email];
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts",
      });
    }

    if (reset.code !== code) {
      reset.attempts += 1;
      return res.status(400).json({
        success: false,
        message: `Invalid reset code. ${3 - reset.attempts} attempts remaining.`,
      });
    }

    delete resetCodes[email];

    res.json({
      success: true,
      message: "Password reset code verified successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Register user
app.post("/api/register", (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      bloodType,
      phone,
      city,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Check existing user
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const newUser = {
      id: uuidv4(),

      email,
      password,

      firstName,
      lastName,

      fullName: `${firstName} ${lastName}`,

      role: role || "donor",

      bloodType: bloodType || "N/A",

      phone,
      city,

      verified: true,

      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    res.json({
      success: true,
      message: "Registration successful",

      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullName: newUser.fullName,
        role: newUser.role,
        bloodType: newUser.bloodType,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Login user
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not found",
      });
    }

    // Validate password
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Success
    res.json({
      success: true,
      message: "Login successful",

      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        bloodType: user.bloodType,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

// ══════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   E-Blood Bank Backend Server Started     ║
║   🩸 Server running on http://localhost:${PORT}   ║
╚════════════════════════════════════════════╝
  `);

  console.log("Available endpoints:");
  console.log("  POST /api/send-verification-code");
  console.log("  POST /api/verify-code");
  console.log("  POST /api/register");
  console.log("  POST /api/login");
  console.log("  GET  /api/health");
});

module.exports = app;
