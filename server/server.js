// In /home/omar/zklogin-mern/server/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // Corrected line
const passport = require('./config/passport');
const cors = require('cors');
// We no longer need to import authRoutes at the top

// Load environment variables
dotenv.config();

// App initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize()); // It's common to initialize passport here

// --- Routes ---
// Each route is defined cleanly and only once.
app.use('/api/auth', require('./routes/auth')); // This now handles all auth-related routes
app.use('/api/zk', require('./routes/zk'));         // This handles all zk-related routes
app.use('/api/mpc', require('./routes/mpc'));       // This handles all mpc-related routes

// --- MongoDB connection and server start ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(3001, () => {
      console.log('Server running on port 3001');
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });