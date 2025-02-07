const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Load environment variables
dotenv.config();

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore();


// Import routes (ensure these files exist and export a valid router)
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/book');

// Check if routes are correctly imported
if (!authRoutes || !bookRoutes) {
    console.error("Error: One or more route files are not properly imported.");
    process.exit(1); // Stop server if routes are invalid
}

// Use routes
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
