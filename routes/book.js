const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const router = express.Router();
const admin = require('firebase-admin'); 

app.use(express.json()); // Add this to parse JSON requests
app.use(express.urlencoded({ extended: true }))

const prisma = new PrismaClient();

// Initialize Firestore (Make sure Firebase is configured correctly)
const db = admin.firestore();

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

    if (!title || !content || !userId) {
        return res.status(400).json({ error: 'Title, Content, and userId are required' });
    }

    try {
        const userInt = parseInt(userId, 10);

        // Check if the user exists in MySQL
        const user = await prisma.user.findUnique({ where: { id: userInt } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // ✅ Ensure Firestore and MySQL updates are atomic
        const firestoreRef = db.collection('books').doc(); // Generate Firestore ID but don't save yet

        const book = await prisma.book.create({
            data: {
                title,
                content,
                userId: userInt,
                firestoreId: firestoreRef.id, // Store Firestore ID in MySQL
            },
        });

        // ✅ Now add Firestore entry only once
        await firestoreRef.set({
            title,
            content,
            userId,
            createdAt: new Date().toISOString(),
        });

        res.json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Failed to add book' });
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
        const { title, content } = req.body;

        console.log("Updating book:", { bookId, title, content });

        // Update MySQL
        const updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: { title, content },
        });

        // Get Firestore ID from MySQL
        const firestoreId = updatedBook.firestoreId;

        if (!firestoreId) {
            return res.status(404).json({ error: 'Firestore ID not found for this book' });
        }

        // Update Firestore using the correct document ID
        const bookRef = db.collection('books').doc(firestoreId);
        await bookRef.update({ title, content });

        console.log("Updated in Firestore:", firestoreId);

        res.json({
            message: "Book updated successfully",
            mysqlData: updatedBook,
        });

    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

router.get('/debug-firestore', async (req, res) => {
    try {
        const booksCollection = db.collection('books');
        const snapshot = await booksCollection.get();

        const books = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log("Firestore books:", books);
        res.json(books);
    } catch (error) {
        console.error("Error fetching Firestore books:", error);
        res.status(500).json({ error: 'Failed to fetch Firestore books' });
    }
});


// Delete Books
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the Firestore document ID before deleting from MySQL
        const book = await prisma.book.findUnique({
            where: { id: Number(id) },
            select: { firestoreId: true }, // Get only Firestore ID
        });

        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        // Delete the book from MySQL
        await prisma.book.delete({ where: { id: Number(id) } });

        // Delete the book from Firestore if firestoreId exists
        if (book.firestoreId) {
            const bookRef = db.collection('books').doc(book.firestoreId);
            await bookRef.delete();
            console.log("Deleted from Firestore:", book.firestoreId);
        } else {
            console.log("No Firestore ID found, skipping Firestore deletion.");
        }

        res.json({ message: "Book deleted successfully", id });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete book" });
    }
});

module.exports = router;
