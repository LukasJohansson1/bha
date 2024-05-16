const express = require("express");
const cookieParser = require("cookie-parser");
const { engine } = require("express-handlebars");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { getUsers, createUser, savePostToDatabase, connection , fetchPostsByUserId, get} = require('./db');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); // Add cookie-parser middleware

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/home", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const posts = await fetchLatestPosts();
    res.render("home", { user: decoded, messages: posts });
  } catch (error) {
    console.error(error);
    res.redirect("/login");
  }
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

app.get("/posts", (req, res) =>{
  res.render("posts")
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
    res.status(500).send("User already exsist");
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
        const token = jwt.sign({ username: user.username, id: user.id }, "your_secret_key");
        res.cookie("token", token);
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
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const username = await getUsernameById(decoded.id);
    await savePostToDatabase(message, decoded.id, username);
    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


async function fetchLatestPosts(limit) {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM posts ORDER BY timestamp DESC";
    if (limit) {
      query += " LIMIT ?";
    }
    connection.query(query, limit, (error, results) => {
      if (error) {
        console.error("Error fetching latest posts:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}



app.get("/user/:userId/posts", async (req, res) => {
  const userId = req.params.userId;
  try {
    const posts = await fetchPostsByUserId(userId);
    const username = await getUsernameById(userId); 
    res.render("posts", { username, posts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
