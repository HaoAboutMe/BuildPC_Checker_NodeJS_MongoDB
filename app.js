require('dotenv').config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let mongoose = require("mongoose");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/auth", require("./routes/auth")); // Public routes (register, login, refresh)

// Protected API routes
const authMiddleware = require("./utils/authMiddleware");
app.use("/api/v1/users", authMiddleware, require("./routes/users"));
app.use("/api/v1/roles", authMiddleware, require("./routes/roles"));

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("connected", function () {
  console.log("connected");
  // Chạy seed dữ liệu khi kết nối thành công
  const seedData = require("./utils/seed");
  seedData();
});
mongoose.connection.on("disconnected", function () {
  console.log("disconnected");
});
mongoose.connection.on("disconnecting", function () {
  console.log("disconnecting");
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page or send JSON
  res.status(err.status || 500);
  if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/auth")) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.render("error");
});

module.exports = app;
