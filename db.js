const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "första",
});

connection.connect(function (error) {
  if (error) throw error;
  console.log("Connection to DB created successfully.");
});

async function getUsers() {
  try {
    const [rows, fields] = await connection.promise().query("SELECT * from users");
    return rows;
  } catch (error) {
    throw error;
  }
}

async function createUser(username, password, hashpassword) {
  try {
    const [existingUsers] = await connection.promise().query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUsers.length > 0) {
      throw new Error("Username already exists");
    } else {
      await connection.promise().query("INSERT INTO users (username, password, hashpassword) VALUES (?, ?, ?)", [username, password, hashpassword]);
    }
  } catch (error) {
    throw error;
  }
}

async function savePostToDatabase(message, userId, connection) {
  try {
    await connection.promise().query("INSERT INTO posts (message, user_id) VALUES (?, ?)", [message, userId]);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUsers: getUsers,
  createUser: createUser,
  savePostToDatabase: savePostToDatabase
};
