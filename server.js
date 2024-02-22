const express = require("express");
const { engine } = require("express-handlebars");
const { getUsers, createUser } = require('./db');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");


app.get("/", (req, res) => {
  res.render("login");
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
});


app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    await createUser(username, password);
    res.redirect("/"); 
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
