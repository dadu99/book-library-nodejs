const express = require("express");
const router = express.Router();
const Book = require("../models/book");

router.get("/", async (req, res) => {
  let books;
  try {
    books = await Book.find().sort({ createAt: 1 }).limit(12).exec();
    res.render("index", { books: books });
  } catch {
    books = [];
  }
});

module.exports = router;
