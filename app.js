require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
let mongoose = require("mongoose");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

var app = express();

app.use(cors()); // Enable CORS for all routes

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
// Bắt lỗi Malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu JSON không hợp lệ (Malformed JSON)",
    });
  }
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", indexRouter);
app.use("/auth", require("./routes/auth")); // Public routes (register, login, refresh)

// Protected API routes
const authMiddleware = require("./utils/authMiddleware");
app.use("/api/v1/users", authMiddleware, require("./routes/users"));
app.use("/api/v1/roles", authMiddleware, require("./routes/roles"));
app.use("/api/v1/support-entities", require("./routes/supportEntities"));
app.use("/api/v1/pc-components", require("./routes/pcComponents"));
app.use("/api/v1/builds", require("./routes/builds"));
app.use("/api/v1/files", require("./routes/files"));

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
  if (
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/auth")
  ) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.render("error");
});

module.exports = app;
