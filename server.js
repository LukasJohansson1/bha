const express = require("express");
const { engine } = require("express-handlebars");
const bcrypt = require('bcrypt');
const { getUsers, createUser } = require('./db');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/home", (req, res) => {
  res.render("home");
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
    const hashedPassword = await bcrypt.hash(password, 10); 
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
      const passwordMatch = await bcrypt.compare(password, user.password); 
      if (passwordMatch) {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
