const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();
const SECRET_KEY = 'yoursecretkey';

// Register
router.post("/register", async (req, res) => {
    try {
        const { uid, email, name, password } = req.body;

        console.log("Received data:", { uid, email, name, password }); // Debugging

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { firebaseUid: uid },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password before saving
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user to database
        const newUser = await prisma.user.create({
            data: {
                firebaseUid: uid,
                email,
                name,
                password: hashedPassword, // Store hashed password
            },
        });

        console.log("Saved user:", newUser);

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});


// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare provided password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ 
            token, 
            user_id: user.id, 
            status: true,
            message: 'Login successful', user
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
