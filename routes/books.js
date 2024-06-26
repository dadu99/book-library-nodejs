const express = require("express");
const router = express.Router();
//const multer = require("multer");
//const path = require("path");
//const fs = require("fs");
const Book = require("../models/book");
const Author = require("../models/author");

//upload file cover book
//const uploadPath = path.join("public", Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/*
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});
*/

//All Books Route
router.get("/", async (req, res) => {
  let query = Book.find();
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title, "i"));
  }

  //returning only those documents where the "publishedDate" is less than or equal to the value of "publishedBefore"
  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishedDate", req.query.publishedBefore);
  }

  //"publishedDate" is greater than or equal to the value of "publishedAfter".
  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishedDate", req.query.publishedAfter);
  }
  try {
    const books = await query.exec();
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

//New Book Route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

//Create Book Route
router.post("/", async (req, res) => {
  // const fileName = req.file != null ? req.file.filename : null;
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    // coverImageName: fileName,
    description: req.body.description,
  });

  saveCover(book, req.body.cover);

  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
    // res.redirect(`books`);
  } catch {
    /*
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }
    */
    renderNewPage(res, book, true);
  }
});

/*
function removeBookCover(filename) {
  fs.unlink(path.join(uploadPath, filename), (err) => {
    if (err) console.error(err);
  });
}
*/

//Show book route - Page
router.get("/:id/", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("author").exec(); //populate because we need the author name into show ejs template

    res.render("books/show", { book: book });
  } catch {
    res.redirect("/");
  }
});

//Edit Book route
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    renderEditPage(res, book);
  } catch {
    res.redirect("/");
  }
});

//Update book route
router.put("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findByIdAndUpdate(req.params.id); //Find the book by its id and update it with new data from req.body
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);
    book.pageCount = req.body.pageCount;
    book.description = req.body.description;

    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(book, req.body.cover);
    }

    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch (err) {
    console.log(err);
    if (book != null) {
      renderEditPage(res, book, true);
    } else {
      redirect("/");
    }
  }
});

//Delete book route
router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.deleteOne();
    res.redirect("/books");
  } catch {
    if (book != null) {
      res.render("books/show", {
        book: book,
        errorMessage: "Error deleting the book.",
      });
    } else {
      res.redirect("/");
    }
  }
});

async function renderNewPage(res, book, hasError = false) {
  renderFormPage(res, book, "new", hasError);
}

async function renderEditPage(res, book, hasError = false) {
  renderFormPage(res, book, "edit", hasError);
}

async function renderFormPage(res, book, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };
    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Updating Book";
      } else {
        params.errorMessage = "Error Creating Book";
      }
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}
function saveCover(book, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64");
    book.coverImageType = cover.type;
  }
}

module.exports = router;
