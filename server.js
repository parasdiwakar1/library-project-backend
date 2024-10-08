import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://paras22:BB2orhb1NHhtvT0J@cluster0.gejab.mongodb.net/bookData?retryWrites=true&w=majority&appName=Cluster0');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  imageUrl: String,
  likes: { type: Number, default: 0 },
  reviews: [{ rating: Number, comment: String }],
});

const Book = mongoose.model('Book', bookSchema);

app.get('/api/books', async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { title: new RegExp(search, 'i') } : {};
    const books = await Book.find(query);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching book' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Error adding book' });
  }
});

app.post('/api/books/:id/like', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      book.likes += 1;
      await book.save();
      res.json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error liking book' });
  }
});

app.post('/api/books/:id/reviews', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      book.reviews.push(req.body);
      await book.save();
      res.json(book);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding review' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

export default app;
