console.log("JS is working");

// ✅ Use SAME origin (no hardcoding)
const BASE_URL = "";

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
loadSongs();


// 🔍 Search
async function performSearch() {
    if (!searchBox || !resultsDiv) return;

    const query = searchBox.value.toLowerCase().trim();
    resultsDiv.innerHTML = "";

    if (!query) return;

    let hasResults = false;

    const localSongs = songs.filter(song =>
        song.title.toLowerCase().includes(query)
    );

    resultsDiv.innerHTML = "";

    localSongs.forEach(song => {
        hasResults = true;

        const div = document.createElement("div");
        div.classList.add("result-item");

        div.innerHTML = `
            <div class="result-content">
                <img src="${song.cover || 'https://via.placeholder.com/40'}" />
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

    if (!hasResults) {
        resultsDiv.innerHTML = "<p>No songs found 😔</p>";
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