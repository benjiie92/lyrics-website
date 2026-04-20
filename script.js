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
let recentSongs = [];
let currentSongId = null;

// Update Now Playing widget
function updateNowPlaying(title, artist, cover) {
    const content = document.getElementById("nowPlayingContent");
    content.innerHTML = `
        <img src="${cover || 'https://via.placeholder.com/60'}" alt="Cover" style="width:60px; height:60px; border-radius:8px; margin-bottom:8px; display:block;">
        <strong>${title}</strong><br>
        <small>${artist}</small>
    `;
}

// Add to recent songs
function addToRecent(title, artist, cover, album) {
    // Remove if already exists
    recentSongs = recentSongs.filter(song => song.title !== title || song.artist !== artist);
    // Add to front
    recentSongs.unshift({ title, artist, cover, album });
    // Limit to 5
    if (recentSongs.length > 5) recentSongs.pop();
    updateRecentViewed();
}

// Update Recent Viewed widget
function updateRecentViewed() {
    const container = document.getElementById("recentViewedList");
    container.innerHTML = "";
    recentSongs.forEach(song => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;
        li.addEventListener("click", () => {
            songTitle.textContent = song.title;
            artist.textContent = song.artist;
            lyrics.textContent = song.lyrics;
            updateNowPlaying(song.title, song.artist, song.cover);
            displayAlbumSuggestions(song.album);
            window.scrollTo(0, 0);
        });
        container.appendChild(li);
    });
}

// Display songs from the same album
function displayAlbumSuggestions(albumName) {
    const container = document.getElementById("albumSuggestionsList");
    container.innerHTML = "";
    
    if (!albumName) {
        container.innerHTML = "<li style='color: #999;'>No album info</li>";
        return;
    }
    
    const albumSongs = songs.filter(song => 
        (song.album || '').trim().toLowerCase() === albumName.trim().toLowerCase() &&
        song.album // Only show if album is not empty
    );
    
    if (albumSongs.length === 0) {
        container.innerHTML = "<li style='color: #999;'>No other songs</li>";
        return;
    }
    
    albumSongs.forEach(song => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${song.title}</strong> - ${song.artist}`;
        li.style.cursor = 'pointer';
        li.addEventListener("click", () => {
            songTitle.textContent = song.title;
            artist.textContent = song.artist;
            lyrics.textContent = song.lyrics;
            updateNowPlaying(song.title, song.artist, song.cover);
            addToRecent(song.title, song.artist, song.cover, song.album);
            displayAlbumSuggestions(song.album);
            currentSongId = song.id;
            loadComments(song.id);
            document.getElementById('commentsSection').style.display = 'block';
            window.scrollTo(0, 0);
        });
        container.appendChild(li);
    });
}

// Load comments for a song
async function loadComments(songId) {
    const res = await fetch(`http://localhost:3000/comments/${songId}`);
    const comments = await res.json();
    const container = document.getElementById("commentsList");
    container.innerHTML = "";
    comments.forEach(comment => {
        const div = document.createElement("div");
        div.classList.add("comment");
        div.innerHTML = `
            <div class="comment-user">${comment.user_name}</div>
            <div class="comment-text">${comment.comment}</div>
            <div class="comment-date">${new Date(comment.created_at).toLocaleString()}</div>
        `;
        container.appendChild(div);
    });
}

// Post a comment
async function postComment(songId, userName, comment) {
    await fetch("http://localhost:3000/add-comment", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ songId, userName, comment })
    });
    loadComments(songId);
}

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
        displayAllSongs();
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
            resultsDiv.innerHTML = "";
            updateNowPlaying(song.title, song.artist, song.cover);
            addToRecent(song.title, song.artist, song.cover, song.album);
            displayAlbumSuggestions(song.album);
            currentSongId = song.id;
            loadComments(song.id);
            document.getElementById('commentsSection').style.display = 'block';
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
            songTitle.textContent = song.title;
            artist.textContent = song.artist.name;
            currentSongId = null;
            fetchLyrics(song.artist.name, song.title);
            resultsDiv.innerHTML = "";
            updateNowPlaying(song.title, song.artist.name, song.album.cover_small);
            addToRecent(song.title, song.artist.name, song.album.cover_small, song.album.name);
            displayAlbumSuggestions(null);
            document.getElementById('commentsSection').style.display = 'none';
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

    if (searchBox.value.trim() === "") {
        resultsDiv.innerHTML = "";
    }
});

// ⏎ Enter
form.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearch();
});

// 📱 Click outside to hide dropdown
document.addEventListener("click", (e) => {
    const searchSection = document.querySelector(".search-section");
    if (!searchSection.contains(e.target)) {
        resultsDiv.innerHTML = "";
    }
});

// ➕ Add song
async function addSong() {
    if (!isAdmin) return alert("Unauthorized");

    const title = document.getElementById("newTitle").value;
    const artist = document.getElementById("newArtist").value;
    const lyrics = document.getElementById("newLyrics").value;
    const coverFile = document.getElementById("newCover").files[0];
    const country = document.getElementById("newCountry").value;
    const album = document.getElementById("newAlbum").value;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('lyrics', lyrics);
    formData.append('country', country);
    formData.append('album', album);
    formData.append('password', '1234');
    if (coverFile) {
        formData.append('cover', coverFile);
    }

    await fetch("http://localhost:3000/add-song", {
        method: "POST",
        body: formData
    });

    alert("Song saved!");
    loadSongs();
}

// 🎵 Fetch lyrics
async function fetchLyrics(artistName, songTitleText) {
    songTitle.textContent = songTitleText;
    artist.textContent = artistName;
    lyrics.textContent = "Loading...";

    const res = await fetch(`https://api.lyrics.ovh/v1/${artistName}/${songTitleText}`);
    const data = await res.json();

    if (data.lyrics) {
        lyrics.textContent = data.lyrics;
    } else {
        lyrics.textContent = "Lyrics not available.";
        window.open('data:text/html,<html><body><h1>Song not found</h1><p>The lyrics for "' + songTitleText + '" by ' + artistName + ' could not be found.</p></body></html>', '_blank');
    }
    resultsDiv.innerHTML = "";
}

// 🌐 API suggestions
async function fetchSuggestions(query) {
    const res = await fetch(`https://api.lyrics.ovh/suggest/${query}`);
    const data = await res.json();
    return data.data.slice(0, 5);
}

// 🎶 Display All Songs
function displayAllSongs() {
    const container = document.getElementById("latestMusicContainer");
    const title = document.querySelector("#latestMusicContainer").previousElementSibling;
    title.textContent = "🎶 Latest Music";
    
    container.innerHTML = "";
    songs.slice(0, 4).forEach(song => {
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
            updateNowPlaying(song.title, song.artist, song.cover);
            addToRecent(song.title, song.artist, song.cover, song.album);
            displayAlbumSuggestions(song.album);
            window.scrollTo(0, 0);
            currentSongId = song.id;
            loadComments(song.id);
            document.getElementById('commentsSection').style.display = 'block';
        });
        
        container.appendChild(card);
    });
}

// 🎶 Display Filtered Songs
function displayFilteredSongs(filteredSongs, filterName) {
    const container = document.getElementById("latestMusicContainer");
    const title = document.querySelector("#latestMusicContainer").previousElementSibling;
    title.textContent = `🎶 Songs from ${filterName}`;

    container.innerHTML = "";
    if (filteredSongs.length === 0) {
        container.innerHTML = `<p style="color:#ccc; padding: 20px;">No songs found for ${filterName}.</p>`;
        return;
    }
    filteredSongs.slice(0, 4).forEach(song => {
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
            updateNowPlaying(song.title, song.artist, song.cover);
            addToRecent(song.title, song.artist, song.cover, song.album);
            displayAlbumSuggestions(song.album);
            window.scrollTo(0, 0);
            currentSongId = song.id;
            loadComments(song.id);
            document.getElementById('commentsSection').style.display = 'block';
        });

        container.appendChild(card);
    });
}

function bindSidebarClicks() {
    document.querySelectorAll('.right-sidebar .widget h3').forEach(h3 => {
        const ul = h3.nextElementSibling;
        if (ul && ul.tagName === 'UL') {
            ul.querySelectorAll('li').forEach(li => {
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => {
                    if (h3.textContent.trim() === 'Countries') {
                        const country = li.textContent.trim();
                        const filteredSongs = songs.filter(song => (song.country || '').trim().toLowerCase() === country.toLowerCase());
                        displayFilteredSongs(filteredSongs, country);
                    } else {
                        searchBox.value = li.textContent.trim();
                        performSearch();
                    }
                });
            });
        }
    });
}

// Comment form
const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = document.getElementById('commentUser').value;
        const comment = document.getElementById('commentText').value;
        if (currentSongId && userName && comment) {
            postComment(currentSongId, userName, comment);
            document.getElementById('commentUser').value = '';
            document.getElementById('commentText').value = '';
        }
    });
}

bindSidebarClicks();