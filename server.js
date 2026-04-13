const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'imbwA.@100',
    database: 'lyrics_app'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Routes
app.get('/songs', (req, res) => {
    const sql = "SELECT * FROM songs ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post("/add-song", (req, res) => {
    const { title, artist, lyrics, cover, password } = req.body;

    if (password !== "1234") {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const sql = "INSERT INTO songs (title, artist, lyrics, cover) VALUES (?, ?, ?, ?)";
    db.query(sql, [title, artist, lyrics, cover], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Song saved!" });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});