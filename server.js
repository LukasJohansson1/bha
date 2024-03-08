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
  res.render("welcome");
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
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
    const users = await getUsers();
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
      res.render("register", { error: "Username already exists. Please choose a different username" });
    } else {
      await createUser(username, password);
      res.redirect("/main");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await getUsers();
    const user = users.find(user => user.username === username && user.password === password); 
    if (user) {
      res.redirect("/main");
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
