const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const path = require("path");
const { User } = require("./models");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("Shh! Some Secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELTE"]));

app.use(session({
  secret: "my-super-secret-key-24386981602896017092640982168",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passportField: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username, password: password } })
    .then((user) => {
    return done(null, user);
    }).catch((err) => {
      return (err);
  })
}));

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    })
});

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
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  const subval = req.body.submit;
  try {
    if (subval === "admin") {
      const admin = await User.create({
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        email: req.body.email,
        password: hashedPwd,
        role: "admin",
      });
      req.login(admin, (err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/sports");
      });
    } else if (subval === "player") {
      const player = await User.create({
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        email: req.body.email,
        password: hashedPwd,
        role: "player",
      });
      req.login(player, (err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/sports");
      });
    }
  } catch (err) {
    console.log(err);
    return response.redirect("/signup");
  }
});

module.exports = app;
