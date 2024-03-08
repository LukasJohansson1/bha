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

async function createUser(username, password) {
  try {
    await connection.promise().query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUsers: getUsers,
  createUser: createUser
};
