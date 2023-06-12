/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const path = require("path");
const { User, Sport, Session, participantSession } = require("./models");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;

// eslint-disable-next-line no-undef
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser("Shh! Some Secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELTE"]));
app.use(flash());

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
            return done(null, false, { messages: "Invalid password!" });
          }
        })
        .catch((err) => {
          return done(null, false, {
            message: "Account does not exist, Please Sign Up",
          });
        });
    }
  )
);

app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

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
    const uid = user.dataValues.id;
    const sports = await Sport.getSport();
    const playersessions = await participantSession.getSessionByPlayerId(
      req.user.id
    );
    //console.log(playersessions);
    const sessId = playersessions.map((v) => v.sessionId);
    //console.log(sessId);
    const allsessions = await Session.findSessionById(sessId);
    //console.log(allsessions);
    const upComing = await Session.filterUpcomingSessions(allsessions);
    const role = user.dataValues.role;
    if (req.accepts("html")) {
      res.render("sport", {
        title: "Sports Details",
        userName,
        uid,
        sports,
        upComing,
        role,
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({ sports, upComing });
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

app.get("/sport/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const sport = await Sport.findByPk(req.params.id);
  const role = req.user.role;
  const allSessions = await Session.findSportById(req.params.id);
  let upComing = await Session.filterUpcomingSessions(allSessions);
  upComing = await Session.getUncancelledSessionsFilteredByCancellationStatus(
    upComing
  );
  //console.log(upComing);
  if (req.accepts("html")) {
    try {
      res.render("sportSession", {
        title: sport.sportName,
        sport,
        upComing,
        role,
        csrfToken: req.csrfToken(),
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({
      sport,
      upComing,
    });
  }
});

app.delete(
  "/sport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sess = await Session.findSportById(req.params.id);
      const sessId = sess.map((v) => v.id);
      await participantSession.deleteSession(sessId);
      await Session.deleteSession(req.params.id);
      await Sport.deleteSportById(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.log(err);
      return res.status(422).json(err);
    }
  }
);

app.get(
  "/sport/session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const sport = await Sport.findByPk(req.params.id);
    try {
      res.render("createsession", {
        title: sport.sportName,
        sport,
        csrfToken: req.csrfToken(),
      });
    } catch (err) {
      console.log(err);
    }
  }
);

app.get("/sport/selectedsession/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  //console.log(req.params.id);
  const sess = await Session.findByPk(req.params.id);
  //console.log(sess.playerNums);
  const players = await participantSession.findAll({
    where: {
      sessionId: sess.id,
    }
  });
  //console.log(players[0].id);
  const userId = req.user.id;
  //console.log(userId);
  if (req.accepts("html")) {
    try {
      res.render("selectedSession", {
        title: sess.sessionName,
        sess,
        players,
        userId,
        csrfToken: req.csrfToken(),
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({
      players,
      sess,
    });
  }
});

app.delete("/playersession/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const pr = await participantSession.findByPk(req.params.id);
    const sess = await Session.findByPk(pr.sessionId);
    console.log(pr.sessionId);
    // await participantSession.destory({
    //   where: {
    //     playerId: req.params.id,
    //   }
    // });
    await participantSession.remove(req.params.id);
    await Session.increaseCount(sess);
    return res.json({ success: true });
  } catch (e) {
    console.log(e);
    return res.status(422).json(e);
  }
});

app.post("/playersession/participant/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const uid = req.user.id;
  try {
    const sess = await Session.findByPk(req.params.id);
    await participantSession.create({
      participants: `${req.user.firstname}`,
      playerId: uid,
      sessionId: req.params.id,
    });
    await Session.decreaseCount(sess);
    return res.redirect(`/sport/selectedsession/${req.params.id}`);
  } catch (err) {
    console.log(err);
    return res.status(422).json(err);
  }
});

app.delete("/playersession/participant/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    await participantSession.removeBysessionId(req.params.id, req.user.id);
    await Session.increaseCount(sess);
    return res.json({ success: true });
  } catch (e) {
    console.log(e);
    return res.status(422).json(e);
  }
});

app.get("/sport/selectedsession/cancel/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const sess = await Session.findByPk(req.params.id);
  const sid = await Sport.findByPk(Session.sportId);
  try {
    res.render("sessionCancel", {
      title: "Session Cancel",
      csrfToken: req.csrfToken(),
      sess,
      sid,
    });
  } catch (e) {
    console.log(e);
  }
});

app.post("/cancel/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sess = await Session.findByPk(req.params.id);
    await sess.update({
      sessionCancelled: true,
      reason: req.body.reason,
    });
    return res.redirect(`/sport/${sess.sportId}`);
  } catch (e) {
    console.log(e);
    return res.status(422).json(e);
  }
});

app.get("/sport/edit/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const sid = await Sport.findByPk(req.params.id);
  try {
    res.render("editsport", {
      title: "Edit Sport",
      csrfToken: req.csrfToken(),
      sid,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/sport/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const sid = await Sport.findByPk(req.params.id);
  try {
    await sid.update({
      sportName: req.body.sportname,
    });
    return res.redirect(`/sport/${req.params.id}`);
  } catch (e) {
    console.log(e);
    return res.status(422).json(e);
  }
});

app.get("/sport/selectedsession/editSession/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const sess = await Session.findByPk(req.params.id);
  const sport = await Sport.findByPk(sess.sportId);
  try {
    const participant = await participantSession.findAll({
      where: {
        sessionId: sess.id,
      }
    });
    const map_playerName = participant.map((x) => x.participants);
    const players = map_playerName.join(',');
    res.render("editSession", {
      title: "Edit Session",
      csrfToken: req.csrfToken(),
      sess,
      players,
      sport,
    });
  } catch (e) {
    console.log(e);
  }
});

app.post("/editsession/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.body.noplayers < 0) {
    req.flash('error', "Number of players must be greater than zero");
    return res.redirect(`/sport/selectedsesion/${req.params.id}`);
  }
  try {
    const sess = await Session.findByPk(req.params.id);
    const modifiedSession = await Session.editSession({
      sessid: sess,
      sessionName: req.body.sessionName,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      playerNums: req.body.noplayers,
    });
    const participant = await participantSession.findAll({
      where: {
        sessionId: sess.id,
      },
    });
    await participantSession.deleteSession(req.params.id);
    const playerNames = req.body.players.split(',');
    for (let playerName of playerNames) {
      let playerFound = false;
      for (let player of participant) {
        if (player.participants === playerName) {
          await participantSession.create({
            participants: playerName,
            sessionId: modifiedSession.id,
            playerId: player.playerId,
          });
          playerFound = true;
          break;
        }
      }
      if (!playerFound) {
        await participantSession.create({
          participants: playerName,
          sessionId: modifiedSession.id,
        });
      }
    }
    return res.redirect(`/sport/selectedsession/${req.params.id}`);
  } catch (e) {
    console.log(e);
    return res.status(422).json(e);
  }
});

app.post(
  "/createsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.body.playerNums < 0) {
      req.flash("error", "There can't be less than zero players");
      return res.redirect(`/sport/session/${req.params.id}`);
    }
    try {
      const sess = await Session.createSession({
        sessionName: req.body.sessionName,
        date: req.body.date,
        time: req.body.time,
        venue: req.body.venue,
        playerNums: req.body.noplayers,
        userId: req.user.id,
        sportId: req.params.id,
      });
      const players = await req.body.players;
      const arr = players.split(",");
      await participantSession.create({
        participants: req.user.firstname,
        playerId: req.user.id,
        sessionId: sess.id,
      });
      for (let i = 0; i < arr.length; i++) {
        await participantSession.create({
          participants: arr[i],
          sessionId: sess.id,
        });
      }
      return res.redirect(`/sport/${req.params.id}`);
    } catch (e) {
      console.log(e);
      return res.status(422).json(e);
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
  if (req.body.email.length == 0) {
    req.flash("error", "Email can't be empty!");
    return res.redirect("/signup");
  }
  if (req.body.firstName.length == 0) {
    req.flash("error", "Name can't be empty!");
    return res.redirect("/signup");
  }
  if (req.body.lastName.length == 0) {
    req.flash("error", "Name can't be empty!");
    return res.redirect("/signup");
  }
  if (req.body.password.length < 8) {
    req.flash("error", "Password is shorter than 8 characters!");
    return res.redirect("/signup");
  }
  const btn_val = req.body.submit;
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
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
    req.flash("error", "This mail already exists! Please try again");
    return res.redirect("/signup");
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
