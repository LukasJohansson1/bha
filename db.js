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

async function savePostToDatabase(message, userId, username) {
  try {
    await connection.promise().query("INSERT INTO posts (message, userId, username) VALUES (?, ?, ?)", [message, userId, username]);
  } catch (error) {
    throw error;
  }
}

async function fetchPostsByUserId(userId) {
  try {
    const [rows] = await connection.promise().query("SELECT * FROM posts WHERE userId = ?", [userId]);
    console.log("Fetched posts from DB:", rows);
    return rows;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}


async function getUsernameById(userId) {
  try {
    const [user] = await connection.promise().query("SELECT username FROM users WHERE id = ?", [userId]);
    return user[0].username;
  } catch (error) {
    throw error;
  }
}

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

async function updateUserPassword(userId, newPasswordHash) {
  try {
    await connection.promise().query("UPDATE users SET hashpassword = ? WHERE id = ?", [newPasswordHash, userId]);
  } catch (error) {
    throw error;
  }
}

async function deletePostByIdAndUserId(postId, userId) {
  try {
    const [result] = await connection.promise().query("DELETE FROM posts WHERE id = ? AND userId = ?", [postId, userId]);
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUsers,
  createUser,
  savePostToDatabase,
  connection,
  fetchPostsByUserId,
  getUsernameById,
  fetchLatestPosts,
  updateUserPassword,
  deletePostByIdAndUserId,
};

