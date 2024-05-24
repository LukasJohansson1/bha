const express = require("express");
const cookieParser = require("cookie-parser");
const { engine } = require("express-handlebars");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { getUsers, createUser, savePostToDatabase, connection, fetchPostsByUserId, 
getUsernameById, updateUserPassword, deletePostByIdAndUserId, likePost, 
unlikePost, fetchPosts } = require('./db');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.engine("handlebars", engine({
  helpers: {
    eq: (a, b) => a === b
  }
}));

app.set("view engine", "handlebars");
app.set("views", "./views");

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

app.get("/posts", (req, res) => {
  res.render("posts");
});

app.get("/update", (req, res) => {
  res.render("update");
});

app.get("/home", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const posts = await fetchPosts(8);
    res.render("home", { user: decoded, messages: posts });
  } catch (error) {
    console.error(error);
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await createUser(username, hashedPassword);
    if (result === "Username already exists") {
      return res.status(400).send("User already exists");
    }
    const users = await getUsers();
    const user = users.find(user => user.username === username);
    const token = jwt.sign({ username: user.username, id: user.id }, "your_secret_key");
    res.cookie("token", token);
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

app.get("/user/:userId/posts", async (req, res) => {
  const userId = req.params.userId;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }
  try {
    const posts = await fetchPostsByUserId(userId);
    const username = await getUsernameById(userId);
    res.render("posts", { username, posts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/update", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const [userResult] = await connection.promise().query("SELECT * FROM users WHERE id = ?", [decoded.id]);
    const user = userResult[0];

    if (!user) {
      return res.status(404).send("User not found");
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.hashpassword);

    if (!passwordMatch) {
      return res.status(400).send("Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    await updateUserPassword(decoded.id, hashedNewPassword);

    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete-post", async (req, res) => {
  const token = req.cookies.token;
  const { postId } = req.body;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const result = await deletePostByIdAndUserId(postId, decoded.id);

    if (result.affectedRows > 0) {
      res.redirect("back");  
    } else {
      res.status(403).send("You are not allowed to delete this post");
    }
  } catch (error) {
    console.error(error);
    res.status (500).send("Internal Server Error");
  }
});

app.post("/like-post", async (req, res) => {
  const token = req.cookies.token;
  const { postId } = req.body;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const result = await likePost(decoded.id, postId);
    if (result) {
      res.redirect("back");
    } else {
      res.status(500).send("Could not like the post");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/unlike-post", async (req, res) => {
  const token = req.cookies.token;
  const { postId } = req.body;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, "your_secret_key");
    const result = await unlikePost(decoded.id, postId);
    if (result) {
      res.redirect("back");
    } else {
      res.status(500).send("Could not unlike the post");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
