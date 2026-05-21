console.log("JS is working");

// ✅ Set this in public/index.html or replace with your Railway backend URL
let BASE_URL = window.API_BASE_URL || "";
BASE_URL = BASE_URL.replace(/\/+$/, '');
console.log('BASE_URL:', BASE_URL);

if (!BASE_URL) {
    console.error("API_BASE_URL is not configured. Set window.API_BASE_URL in public/index.html to your Railway backend URL.");
    const resultsDiv = document.getElementById("results");
    if (resultsDiv) {
        resultsDiv.innerHTML = "<p style='color: #ffb3b3; padding: 20px;'>API_BASE_URL is missing. Set the Railway backend URL in public/index.html.</p>";
    }
}

// 🔹 Songs from DB
let songs = [];

// 🔹 Elements (safe access)
const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");
const songTitle = document.getElementById("songTitle");
const artist = document.getElementById("artist");
const lyrics = document.getElementById("lyrics");
const form = document.getElementById("searchForm");

let isAdmin = false;
let debounceTimer;
let recentSongs = [];
let currentSongId = null;

// 🔄 Load songs
async function loadSongs() {
    try {
        const res = await fetch(`${BASE_URL}/songs`);
        const data = await res.json();

        songs = data;
        displayAllSongs();

    } catch (error) {
        console.error("❌ Failed to load songs:", error);
    }
}

// Load immediately
if (BASE_URL) {
    loadSongs();
}


// 🔍 Search
async function performSearch() {
    if (!BASE_URL) return;
    if (!searchBox || !resultsDiv) return;

    const query = searchBox.value.trim();
    resultsDiv.innerHTML = "";

    if (!query) return;

    try {
        const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const searchResults = await res.json();

        if (!Array.isArray(searchResults) || searchResults.length === 0) {
            resultsDiv.innerHTML = "<p>No songs found 😔</p>";
            return;
        }

        searchResults.forEach(song => {
            const div = document.createElement("div");
            div.classList.add("result-item");

            div.innerHTML = `
                <div class="result-content">
                    <img src="${song.cover || 'https://via.placeholder.com/40'}" alt="${song.title} cover" />
                    <div>
                        <strong>${song.title}</strong>
                        <small>${song.artist}</small>
                    </div>
                </div>
            `;

            div.addEventListener("click", () => {
                if (!songTitle || !artist || !lyrics) return;

                songTitle.textContent = song.title;
                artist.textContent = song.artist;
                lyrics.textContent = song.lyrics;
                resultsDiv.innerHTML = "";

                currentSongId = song.id;
                loadComments(song.id);
            });

            resultsDiv.appendChild(div);
        });
    } catch (error) {
        console.error("❌ Search failed:", error);
        resultsDiv.innerHTML = "<p>Search error. Please try again.</p>";
    }
}

// ⌨️ Input (SAFE)
if (searchBox) {
    searchBox.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 400);

        if (searchBox.value.trim() === "") {
            resultsDiv.innerHTML = "";
        }
    });
}

// ⏎ Enter
if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        performSearch();
    });
}

// 📦 Load comments
async function loadComments(songId) {
    if (!BASE_URL) return;
    try {
        const res = await fetch(`${BASE_URL}/comments/${songId}`);
        const comments = await res.json();

        const container = document.getElementById("commentsList");
        if (!container) return;

        container.innerHTML = "";

        comments.forEach(comment => {
            const div = document.createElement("div");
            div.innerHTML = `<strong>${comment.user_name}</strong>: ${comment.comment}`;
            container.appendChild(div);
        });

    } catch (err) {
        console.error("❌ Comments error:", err);
    }
}

// ➕ Add song
async function addSong() {
    if (!BASE_URL) return alert("API_BASE_URL is not configured. Set window.API_BASE_URL in public/index.html.");
    if (!isAdmin) return alert("Unauthorized");

    const title = document.getElementById("newTitle").value;
    const artistName = document.getElementById("newArtist").value;
    const lyricsText = document.getElementById("newLyrics").value;
    const coverFile = document.getElementById("newCover").files[0];
    const password = document.getElementById("adminPassword") ? document.getElementById("adminPassword").value : '';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artistName);
    formData.append('lyrics', lyricsText);
    formData.append('password', password);

    if (coverFile) {
        formData.append('cover', coverFile);
    }

    try {
        const response = await fetch(`${BASE_URL}/add-song`, {
            method: "POST",
            body: formData
        });
        const result = await response.json();

        if (!response.ok) {
            return alert(result.message || "Failed to save song");
        }

        alert("Song saved!");
        loadSongs();
    } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload song');
    }
}

// 🎶 Display songs
function displayAllSongs() {
    const container = document.getElementById("latestMusicContainer");
    if (!container) return;

    container.innerHTML = "";

    songs.forEach(song => {
        const card = document.createElement("div");
        card.classList.add("music-card");
        card.innerHTML = `
            <img src="${song.cover || 'https://via.placeholder.com/300'}" alt="${song.title} cover" onerror="this.src='https://via.placeholder.com/300'" />
            <div class="card-title">${song.title}</div>
            <div class="card-artist">${song.artist}</div>
        `;

        card.addEventListener("click", () => {
            if (!songTitle || !artist || !lyrics) return;

            songTitle.textContent = song.title;
            artist.textContent = song.artist;
            lyrics.textContent = song.lyrics;

            currentSongId = song.id;
            loadComments(song.id);
        });

        container.appendChild(card);
    });
}