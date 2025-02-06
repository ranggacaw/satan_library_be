const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const router = express.Router();

app.use(express.json()); // Add this to parse JSON requests
app.use(express.urlencoded({ extended: true }))

const prisma = new PrismaClient();

// Your routes go here


// Get Books
router.get('/', async (req, res) => {
    try {
        const book = await prisma.book.findMany();
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// Add Books
router.post('/', async (req, res) => {
    const { title, content, userId } = req.body;
    console.log(req.body);
    

    if (!title || !userId || !content) {
        return res.status(400).json({ error: 'Title, Content and userId are required' });
    }

    try {
        const userInt = parseInt(userId);
        const book = await prisma.book.create({ data: { title, content, userId: userInt } });
        res.json(book);
    } catch (error) {
        console.error('Error creating book:', error); // Log detailed error
        res.status(500).json({ error: 'Failed to added book' });
    }
});

// Details Books
router.get('/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10); // Convert ID to integer

        if (isNaN(bookId)) {
            return res.status(400).json({ error: 'Invalid book ID' });
        }

        // Fetch book details from MySQL database using Prisma
        const book = await prisma.book.findUnique({
            where: { id: bookId },
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book); // Return book details
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// Edit Book
router.put('/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        const { content } = req.body;

        const updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: { content },
        });

        res.json(updatedBook);
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// Delete Books
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.book.delete({ where: { id: Number(id) } });
        res.json({ message: "Book deleted successfully", id });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete book" });
    }
});

module.exports = router;
