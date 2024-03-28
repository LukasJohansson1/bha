const express = require("express");
const session = require("express-session");
const { engine } = require("express-handlebars");
const bcrypt = require('bcrypt');
const { getUsers, createUser, savePostToDatabase } = require('./db');

const app = express();
const port = 3000;


app.use(session({
  secret: 'hemlig nyckel',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/home", (req, res) => {
  res.render("home", { user: req.session.user });
});

app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/welcome", (req, res) => {
  res.render("welcome");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); 
    await createUser(username, password, hashedPassword); 
    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await getUsers();
    const user = users.find(user => user.username === username); 
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.hashpassword); 
      if (passwordMatch) {
        req.session.user = user;
        res.redirect("/home");
      } else {
        res.render("login", { error: "Invalid username or password" });
      }
    } else {
      res.render("login", { error: "Invalid username or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/send-message", async (req, res) => {
  const message = req.body.message;
  const user = req.session.user;

  try {
    if (user && user.id) {
      await savePostToDatabase(message, user.id);
      res.redirect("/home");
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
