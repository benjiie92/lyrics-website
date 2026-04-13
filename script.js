console.log("JS is working");

// 🔹 Songs from DB
let songs = [];

// 🔹 Elements
const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");
const songTitle = document.getElementById("songTitle");
const artist = document.getElementById("artist");
const lyrics = document.getElementById("lyrics");
const form = document.getElementById("searchForm");

let isAdmin = false;
let debounceTimer;

// 🔐 Hidden admin (Ctrl + Shift + A)
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        const password = prompt("Enter admin password:");

        if (password === "benjie") {
            isAdmin = true;
            document.getElementById("uploadSection").style.display = "block";
            alert("Admin mode activated");
        } else {
            alert("Wrong password");
        }
    }
});

// 🔄 Load songs
async function loadSongs() {
    try {
        const res = await fetch("http://localhost:3000/songs");
        const data = await res.json();

        songs.length = 0;

        data.forEach(song => {
            songs.push(song);
        });

        // Display latest music after loading
        displayLatestMusic();
    } catch (error) {
        console.error("Failed to load songs:", error);
    }
}

loadSongs();

// 🔍 Search
async function performSearch() {
    const query = searchBox.value.toLowerCase().trim();
    resultsDiv.innerHTML = "";

    if (!query) return;

    resultsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching...</p>
        </div>
    `;

    let hasResults = false;

    const localSongs = songs.filter(song =>
        song.title.toLowerCase().includes(query)
    );

    const apiSongs = await fetchSuggestions(query);

    resultsDiv.innerHTML = "";

    // 🔹 DB songs
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
            songTitle.textContent = song.title;
            artist.textContent = song.artist;
            lyrics.textContent = song.lyrics;
        });

        resultsDiv.appendChild(div);
    });

    // 🔹 API songs
    apiSongs.forEach(song => {
        hasResults = true;

        const div = document.createElement("div");
        div.classList.add("result-item");

        div.innerHTML = `
            <div class="result-content">
                <img src="${song.album.cover_small}" />
                <div>
                    <strong>${song.title}</strong>
                    <small>${song.artist.name}</small>
                </div>
            </div>
        `;

        div.addEventListener("click", () => {
            fetchLyrics(song.artist.name, song.title);
        });

        resultsDiv.appendChild(div);
    });

    if (!hasResults) {
        resultsDiv.innerHTML = "<p>No songs found 😔</p>";
    }
}

// ⌨️ Input
searchBox.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSearch, 400);
});

// ⏎ Enter
form.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearch();
});

// ➕ Add song
async function addSong() {
    if (!isAdmin) return alert("Unauthorized");

    const title = document.getElementById("newTitle").value;
    const artist = document.getElementById("newArtist").value;
    const lyrics = document.getElementById("newLyrics").value;
    const cover = document.getElementById("newCover").value;

    await fetch("http://localhost:3000/add-song", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ title, artist, lyrics, cover, password: "1234" })
    });

    alert("Song saved!");
    loadSongs();
}

// 🎵 Fetch lyrics
async function fetchLyrics(artistName, songTitleText) {
    lyrics.textContent = "Loading...";

    const res = await fetch(`https://api.lyrics.ovh/v1/${artistName}/${songTitleText}`);
    const data = await res.json();

    lyrics.textContent = data.lyrics || "Not found";
}

// 🌐 API suggestions
async function fetchSuggestions(query) {
    const res = await fetch(`https://api.lyrics.ovh/suggest/${query}`);
    const data = await res.json();
    return data.data.slice(0, 5);
}

// 🎶 Display Latest Music
function displayLatestMusic() {
    const container = document.getElementById("latestMusicContainer");
    
    songs.forEach(song => {
        const card = document.createElement("div");
        card.classList.add("music-card");
        
        card.innerHTML = `
            <img src="${song.cover || 'https://via.placeholder.com/120'}" alt="${song.title}">
            <div class="card-title">${song.title}</div>
            <div class="card-artist">${song.artist}</div>
        `;
        
        card.addEventListener("click", () => {
            songTitle.textContent = song.title;
            artist.textContent = song.artist;
            lyrics.textContent = song.lyrics;
            window.scrollTo(0, 0);
        });
        
        container.appendChild(card);
    });
}

// Load on page startup
// window.addEventListener("DOMContentLoaded", displayLatestMusic);