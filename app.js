const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const path = require("path");
const { User, Sport } = require("./models");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("Shh! Some Secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELTE"]));

app.use(
  session({
    secret: "my-super-secret-key-24386981602896017092640982168",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passportField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const res = await bcrypt.compare(password, user.password);
          if (res) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch((err) => {
          return err;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", (req, res) => {
  if (req.user) {
    return res.redirect("/sport");
  } else {
    res.render("index", {
      title: "Sports Scheduler",
      crsfToken: req.csrfToken(),
    });
  }
});

app.get("/sport", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const user = await User.findByPk(loggedInUser);
    const userName = user.dataValues.firstname;
    const sports = await Sport.getSport(loggedInUser);
    const role = user.dataValues.role;
    if (req.accepts("html")) {
      res.render("sport", {
        title: "Sports Details",
        userName,
        sports,
        role,
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({ sports });
    }
  } catch (e) {
    console.log(e);
  }
});

app.get(
  "/createsport",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.role === "admin") {
      res.render("createsport", {
        title: "Create sport",
        csrfToken: req.csrfToken(),
      });
    }
  }
);

app.post(
  "/createsport",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    // console.log("Creating Sport");
    if (req.user.role === "admin") {
      try {
        const sport = await Sport.createsports({
          sportName: req.body.sportName,
          userId: req.user.id,
        }); 
        // console.log(sport.sportName);
        return res.redirect("/sport");
      } catch (e) {
        console.log(e);
      }
    } else {
      return res.redirect("/");
    }
  }
);

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    csrfToken: req.csrfToken(),
  });
});

app.get("/login", async (req, res) => {
  res.render("login", {
    title: "Login",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/users", async (req, res) => {
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  const btn_val = req.body.submit;
  try {
    if (btn_val === "admin") {
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
        res.redirect("/sport");
      });
    } else if (btn_val === "player") {
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
        res.redirect("/sport");
      });
    }
  } catch (err) {
    console.log(err);
    return response.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/sport");
  }
);

module.exports = app;
