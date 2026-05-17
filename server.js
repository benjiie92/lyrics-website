const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { URL } = require('url');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
const corsOptions = {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static("public"));

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Database connection
const debug = process.env.NODE_ENV !== 'production';
const databaseUrl = process.env.DATABASE_URL;
const dbConfig = databaseUrl ? (() => {
    try {
        const url = new URL(databaseUrl);
        return {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.replace(/^\//, ''),
            port: Number(url.port) || 3306
        };
    } catch (error) {
        console.error('Invalid DATABASE_URL:', error);
        return {};
    }
})() : {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306
};

if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error('Missing database configuration. Set DATABASE_URL or MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE.');
    process.exit(1);
}

console.log('Database config:', {
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port
});

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Routes
app.get('/songs', (req, res) => {
    const sql = "SELECT * FROM songs ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            const payload = { message: "Failed to retrieve songs" };
            if (debug) payload.error = err.message;
            return res.status(500).json(payload);
        }
        res.json(results);
    });
});

app.get('/search', (req, res) => {
    const query = (req.query.q || '').trim();
    if (!query) {
        return res.json([]);
    }

    const searchTerm = `%${query}%`;
    const sql = `SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? OR country LIKE ? ORDER BY id DESC`;
    db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            const payload = { message: 'Failed to search songs' };
            if (debug) payload.error = err.message;
            return res.status(500).json(payload);
        }
        res.json(results);
    });
});

app.post("/add-song", upload.single('cover'), (req, res) => {
    const { title, artist, lyrics, password, country, album } = req.body;
    const cover = req.file ? `/uploads/${req.file.filename}` : null;

    const adminPassword = process.env.ADMIN_PASSWORD || '1234';
    if (password !== adminPassword) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const sql = "INSERT INTO songs (title, artist, lyrics, cover, country, album) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, artist, lyrics, cover, country, album], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Failed to save song" });
        }
        res.json({ message: "Song saved!" });
    });
});

app.get('/comments/:songId', (req, res) => {
    const songId = req.params.songId;
    const sql = "SELECT * FROM comments WHERE song_id = ? ORDER BY created_at DESC";
    db.query(sql, [songId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Failed to retrieve comments" });
        }
        res.json(results);
    });
});

app.post('/add-comment', (req, res) => {
    const { songId, userName, comment } = req.body;
    const sql = "INSERT INTO comments (song_id, user_name, comment) VALUES (?, ?, ?)";
    db.query(sql, [songId, userName, comment], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Failed to add comment" });
        }
        res.json({ message: "Comment added!" });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});