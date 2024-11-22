import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Book Schema and Model
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  likes: { type: Number, default: 0 },
  reviews: [{ rating: Number, comment: String }],
});

const Book = mongoose.model('Book', bookSchema);

// Async Error Handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes

// Get all books (with optional search query)
app.get(
  '/api/books',
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const query = search ? { title: new RegExp(search, 'i') } : {};
    const books = await Book.find(query);
    res.status(200).json(books);
  })
);

// Get a single book by ID
app.get(
  '/api/books/:id',
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.status(200).json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  })
);

// Add a new book (with validation)
app.post(
  '/api/books',
  [
    body('title').isString().notEmpty(),
    body('author').isString().notEmpty(),
    body('description').isString().notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  })
);

// Add multiple books
app.post(
  '/api/books/multiple',
  asyncHandler(async (req, res) => {
    if (Array.isArray(req.body)) {
      const newBooks = await Book.insertMany(req.body);
      res.status(201).json(newBooks);
    } else {
      res.status(400).json({ error: 'Request body must be an array' });
    }
  })
);

// Like a book
app.post(
  '/api/books/:id/like',
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (book) {
      book.likes += 1;
      await book.save();
      res.status(200).json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  })
);

// Add a review to a book
app.post(
  '/api/books/:id/reviews',
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (book) {
      book.reviews.push(req.body);
      await book.save();
      res.status(201).json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  })
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
