const express = require("express");
const { engine } = require("express-handlebars");
const { getUsers } = require('./db');

const app = express();
const port = 3000;

app.use(express.static("public"));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", async (req, res) => {
  try {
    const results = await getUsers();
    res.render("users", { users: results }); 
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
