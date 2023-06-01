const express = require("express");
const app = express();


app.use(express.urlencoded({ extended: false }));

// app.get("/", (req, res) => {
//   res.send("Welcome");
// });

app.get("/createsport", (req, res) => {
  console.log("Sport");
});

app.post("/createsport", (req, res) => {
  console.log("Creating Sport");
});

module.exports = app;
