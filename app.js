const express = require("express");
const app = express();
var csrf = require("csurf");
var cookieParser = require("cookie-parser");
const path = require("path");
const { User } = require("./models");

app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("Shh! Some Secret String"));
app.use(csrf({ cookie: true }));


app.get("/", (req, res) => {
  res.render("index", {
    title: "Sports Scheduler",
  });
});

app.get("/createsport", (req, res) => {
  console.log("Sport");
});

app.post("/createsport", (req, res) => {
  console.log("Creating Sport");
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    csrfToken: req.csrfToken(),
  });
});

app.post("/users", async (req, res) => {
  const subval = req.body.submit;
  try {
    if (subval === "admin") {
      const admin = await User.create({
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        role: "admin",
      });
    } else if (subval === "player") {
      const player = await User.create({
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        role: "player",
      });
    }
  } catch (err) {
    console.log(err);
  }
})

module.exports = app;
