if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

//routes
const indexRouter = require("./routes/index.js");
const authorRouter = require("./routes/authors.js");
const bookRouter = require("./routes/books.js");

//set up view engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));

//Active menu item
app.use((req, res, next) => {
  res.locals.isActive = (link) => {
    return req.originalUrl === link ? "active" : "";
  };
  next();
});

//add favicon book image using '$ npm install serve-favicon'
var favicon = require("serve-favicon");
var path = require("path");
app.use(favicon(path.join(__dirname, "public", "book.ico")));

//begin connect to mongo database
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));
//end connect to mongo database

app.use("/", indexRouter);
app.use("/authors", authorRouter);
app.use("/books", bookRouter);

app.listen(process.env.PORT || 3000);
