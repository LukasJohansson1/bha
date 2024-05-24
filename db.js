const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "första",
});

connection.connect(function (error) {
  if (error) {
    console.error("Error connecting to the database:", error);
    return;
  }
  console.log("Connection to DB created successfully.");
});

async function getUsers() {
  try {
    const [rows, fields] = await connection.promise().query("SELECT * from users");
    return rows;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
}

async function createUser(username, hashpassword) {
  try {
    const [existingUsers] = await connection.promise().query("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUsers.length > 0) {
      console.error("Username already exists");
      return "Username already exists";
    } else {
      await connection.promise().query("INSERT INTO users (username, hashpassword) VALUES (?, ?)", [username, hashpassword]);
      return "User created successfully";
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

async function savePostToDatabase(message, userId, username) {
  try {
    await connection.promise().query("INSERT INTO posts (message, userId, username) VALUES (?, ?, ?)", [message, userId, username]);
    return "Post saved successfully";
  } catch (error) {
    console.error("Error saving post:", error);
    return null;
  }
}

async function fetchPostsByUserId(userId) {
  try {
    const [rows] = await connection.promise().query("SELECT * FROM posts WHERE userId = ?", [userId]);
    console.log("Fetched posts from DB:", rows);
    return rows;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return null;
  }
}

async function getUsernameById(userId) {
  try {
    const [user] = await connection.promise().query("SELECT username FROM users WHERE id = ?", [userId]);
    return user[0].username;
  } catch (error) {
    console.error("Error fetching username:", error);
    return null;
  }
}

async function updateUserPassword(userId, newPasswordHash) {
  try {
    await connection.promise().query("UPDATE users SET hashpassword = ? WHERE id = ?", [newPasswordHash, userId]);
    return "Password updated successfully";
  } catch (error) {
    console.error("Error updating password:", error);
    return null;
  }
}

async function deletePostByIdAndUserId(postId, userId) {
  try {
    const [result] = await connection.promise().query("DELETE FROM posts WHERE id = ? AND userId = ?", [postId, userId]);
    return result;
  } catch (error) {
    console.error("Error deleting post:", error);
    return null;
  }
}

async function likePost(userId, postId) {
  try {
    await connection.promise().query("INSERT INTO likes (userId, postId) VALUES (?, ?)", [userId, postId]);
    return "Post liked successfully";
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') {
      console.error("Error liking post:", error);
    }
    return null;
  }
}

async function unlikePost(userId, postId) {
  try {
    await connection.promise().query("DELETE FROM likes WHERE userId = ? AND postId = ?", [userId, postId]);
    return "Post unliked successfully";
  } catch (error) {
    console.error("Error unliking post:", error);
    return null;
  }
}

async function getLikesCount(postId) {
  try {
    const [rows] = await connection.promise().query("SELECT COUNT(*) AS likesCount FROM likes WHERE postId = ?", [postId]);
    return rows[0].likesCount;
  } catch (error) {
    console.error("Error fetching likes count:", error);
    return null;
  }
}

async function fetchPosts(limit = 8) {
  try {
    const [posts] = await connection.promise().query("SELECT * FROM posts ORDER BY timestamp DESC LIMIT ?", [limit]);
    for (const post of posts) {
      const likesCount = await getLikesCount(post.id);
      post.likesCount = likesCount;
    }
    return posts;
  } catch (error) {
    console.error("Error fetching posts with likes:", error);
    return null;
  }
}

module.exports = {
  getUsers,
  createUser,
  savePostToDatabase,
  connection,
  fetchPostsByUserId,
  getUsernameById,
  updateUserPassword,
  deletePostByIdAndUserId,
  likePost,
  unlikePost,
  getLikesCount,
  fetchPosts
};
