const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const env = require("dotenv");
env.config();
const app = express();
const port = 8000;
app.use(cors());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
// SQL command to create the 'abc' table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS user1 (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    age INTEGER,
    dob DATE,
    contact VARCHAR(255)
  );
  `;

async function createTable() {
  try {
    const client = await pool.connect();
    await client.query(createTableQuery);
    console.log("Table created successfully");
    client.release();
  } catch (error) {
    console.error("Error creating table:", error);
  } 
//   finally {
//     // Close the connection pool
//   }
}

// Call the function to create the table
createTable();
console.log("Database connected successfully");

app.use(express.json());

// Create a new user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO user1 (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, password]
    );
    res.json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM user1 WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length === 0) {
      res.json({ message: "Invalid username or password" });
    } else {
      res.json({ message: "Login successful", user: result.rows[0] });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "An error occurred while logging in" });
  }
});

app.put("/profile/:id", async (req, res) => {
  const { age, dob, contact } = req.body;
  const {id} = req.params;
  console.log(id)
  try {
    const result = await pool.query(
      `UPDATE user1 SET age = $1, dob = $2, contact = $3 WHERE id = $4 RETURNING *`,
      [age, dob, contact,id]
    );
    res.json({
      message: "Profile saved successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the profile" });
  }
});

app.put("/profile/:id/edit", async (req, res) => {
    const { age, dob, contact } = req.body;
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        `UPDATE user1 SET age = $1, dob = $2, contact = $3 WHERE id = $4 RETURNING *`,
        [age, dob, contact, id]
      );
  
    //   if (result.rows.length === 0) {
    //     return res.status(404).json({ error: "User not found" });
    //   }
  
      res.json({
        message: "Profile updated successfully",
        profile: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "An error occurred while updating the profile" });
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
