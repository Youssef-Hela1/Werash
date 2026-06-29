const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Database Helpers (Strictly in-memory for testing, no filesystem writes)
let dbInMemory = { users: [] };

function readDB() {
  return dbInMemory;
}

function writeDB(data) {
  dbInMemory = data;
  return true;
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Auth server is running.' });
});

// Registration API
app.post('/api/register', (req, res) => {
  const { fullName, email, password, carBrand, carModel, carYear } = req.body;

  // Basic Validation
  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Full Name, Email, and Password are required fields.'
    });
  }

  const db = readDB();
  const emailNormalized = email.trim().toLowerCase();

  // Check if email already exists
  const existingUser = db.users.find(u => u.email === emailNormalized);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'This email address is already registered.'
    });
  }

  // Hash Password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create new user record
  const newUser = {
    id: Date.now().toString(),
    fullName: fullName.trim(),
    email: emailNormalized,
    password: hashedPassword,
    carBrand: (carBrand || '').trim(),
    carModel: (carModel || '').trim(),
    carYear: (carYear || '').trim(),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  const writeSuccess = writeDB(db);

  if (!writeSuccess) {
    return res.status(500).json({
      success: false,
      message: 'Failed to write registration details to server storage.'
    });
  }

  // Omit password hash in response payload
  const { password: _, ...userWithoutPassword } = newUser;

  console.log(`[AUTH] Registered user: ${newUser.email}`);
  res.status(201).json({
    success: true,
    message: 'User registered successfully!',
    user: userWithoutPassword
  });
});

// Login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Basic Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and Password are required.'
    });
  }

  const db = readDB();
  const emailNormalized = email.trim().toLowerCase();

  // Find User
  const user = db.users.find(u => u.email === emailNormalized);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  // Check Password
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  // Omit password hash in response payload
  const { password: _, ...userWithoutPassword } = user;

  console.log(`[AUTH] User logged in: ${user.email}`);
  res.json({
    success: true,
    message: 'Login successful!',
    user: userWithoutPassword
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`   Werash Auth Server running on port ${PORT}`);
  console.log(`========================================`);
});
