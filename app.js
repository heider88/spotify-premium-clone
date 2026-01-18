/**
 * SPOTIFY CLONE - SENIOR FRONTEND IMPLEMENTATION
 * 
 * This script handles audio playback, dynamic rendering, 
 * persistence through local storage, and UI interactions 
 * with a focus on clean, performant vanilla JavaScript.
 */

// --- DATA MANAGEMENT ---
// Fetch personal collection from localStorage or fallback to default dataset
const STORAGE_KEY = 'premium_spoty_v1';
let songDatabase = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { id: 1, title: "Neon Flux", artist: "Dreamscape Symphony", img: "assets/electronic.png", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", category: "Featured", isLiked: false },
    { id: 2, title: "Rainy Nights", artist: "Lofi Girl", img: "assets/lofi.png", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", category: "Featured", isLiked: false },
    { id: 3, title: "Smoke & Steel", artist: "Iron Echoes", img: "assets/rock.png", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", category: "Featured", isLiked: false },
    { id: 4, title: "Luna Pulse", artist: "Nova Night", img: "assets/pop.png", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", category: "Featured", isLiked: false },
    { id: 5, title: "Deep Red", artist: "Crimson Waves", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", category: "Recent", isLiked: false },
    { id: 6, title: "Midnight City", artist: "M83", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", category: "Recent", isLiked: false },
    { id: 7, title: "Crimson Ghost", artist: "The Shadows", img: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", category: "Viral", isLiked: false },
    { id: 8, title: "Ruby Dreams", artist: "Scarlet", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", category: "Viral", isLiked: false },
    { id: 9, title: "Dark Pulse", artist: "Void", img: "https://images.unsplash.com/photo-1514525253361-bee8a18744ad?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", category: "Electro", isLiked: false },
    { id: 10, title: "Blood Moon", artist: "Lunar", img: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", category: "Electro", isLiked: false }
];

/**
 * Persist current state of the database to LocalStorage
 */
const persistData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songDatabase));
};

// --- GLOBAL STATE ---
const audio = new Audio();
let activeId = null;
let isShuffle = false;
let isRepeat = false;
let isDraggingProgress = false;
let isDraggingVolume = false;

// --- DYNAMIC RENDERING ---

/**
 * Helper to generate HTML for a single music card
 */
const createSongCard = (song) => {
    const isPlaying = activeId === song.id && !audio.paused;
    return `
        <div class="card" onclick="window.handleTrackSelection(${song.id})">
            <div class="card-img-container">
                <img src="${song.img}" alt="${song.title}" class="card-img" loading="lazy">
                <div class="play-btn-overlay" style="opacity:${isPlaying ? '1' : ''};transform:${isPlaying ? 'translateY(0)' : ''}">
                    <i data-lucide="${isPlaying ? 'pause' : 'play'}" fill="currentColor"></i>
                </div>
            </div>
            <div class="card-title">${song.title}</div>
            <div class="card-desc">${song.artist}</div>
        </div>`;
};

/**
 * Renders main grids based on search filter or categories
 */
const renderMainSections = (query = "") => {
    const sections = { featured: 'Featured', recent: 'Recent', viral: 'Other' };

    Object.entries(sections).forEach(([gridId, category]) => {
        const container = document.getElementById(`${gridId}-grid`);
        if (!container) return;

        const filteredList = songDatabase.filter(song => {
            const matchesCat = (category === 'Other')
                ? !['Featured', 'Recent'].includes(song.category)
                : song.category === category;

            const matchesQuery = song.title.toLowerCase().includes(query.toLowerCase()) ||
                song.artist.toLowerCase().includes(query.toLowerCase());

            return matchesCat && matchesQuery;
        });

        container.innerHTML = filteredList.map(createSongCard).join('');
    });

    if (window.lucide) window.lucide.createIcons();
};

/**
 * Renders the Sidebar Favorites (Library) list
 */
const renderLibraryList = () => {
    const container = document.getElementById('library-list');
    if (!container) return;

    const likedOnes = songDatabase.filter(s => s.isLiked);

    if (!likedOnes.length) {
        container.innerHTML = '<li style="color:var(--text-subdued);padding:10px;font-size:13px;">Your favorites will appear here</li>';
        return;
    }

    container.innerHTML = likedOnes.map(song => `
        <li class="library-item" onclick="window.handleTrackSelection(${song.id})">
            <img src="${song.img}" alt="${song.title}">
            <div class="library-item-info">
                <div class="library-item-title">${song.title}</div>
                <div class="library-item-artist">${song.artist}</div>
            </div>
            <i data-lucide="volume-2" size="14" style="color:var(--primary);display:${activeId === song.id ? 'block' : 'none'}"></i>
        </li>`).join('');

    if (window.lucide) window.lucide.createIcons();
};

// --- AUDIO CONTROLLER ---

/**
 * Public entry point for clicking a track
 */
window.handleTrackSelection = (id) => {
    const target = songDatabase.find(t => t.id === id);
    if (activeId === id) {
        togglePlayback();
    } else {
        loadAndPlay(target);
    }
};

/**
 * Synchronizes the play/pause icons across all cards without re-rendering the whole grid.
 * This is crucial for performance.
 */
const syncPlayIcons = () => {
    // Sync Main Grids
    const allPlayOverlays = document.querySelectorAll('.play-btn-overlay i');
    allPlayOverlays.forEach(icon => {
        const card = icon.closest('.card');
        // Extract ID from the handleTrackSelection call in the onclick attribute
        const onclickAttr = card.getAttribute('onclick');
        const match = onclickAttr.match(/\d+/);
        const cardId = match ? parseInt(match[0]) : null;

        const isCurrent = (cardId === activeId);
        const iconName = (isCurrent && !audio.paused) ? 'pause' : 'play';

        if (icon.getAttribute('data-lucide') !== iconName) {
            icon.setAttribute('data-lucide', iconName);
            // Show/Hide overlay based on play state
            icon.parentElement.style.opacity = isCurrent && !audio.paused ? '1' : '';
            icon.parentElement.style.transform = isCurrent && !audio.paused ? 'translateY(0)' : '';
        }
    });

    if (window.lucide) window.lucide.createIcons();
};

/**
 * Loads a track into the audio engine and updates UI
 */
const loadAndPlay = (song) => {
    activeId = song.id;
    audio.src = song.audio;
    audio.play().catch(e => console.warn("Autoplay blocked or stream error"));

    // Sync Player UI
    const trackImg = document.querySelector('.current-track .track-img');
    const trackTitle = document.querySelector('.current-track .title');
    const trackArtist = document.querySelector('.current-track .artist');

    if (trackImg) trackImg.src = song.img;
    if (trackTitle) trackTitle.textContent = song.title;
    if (trackArtist) trackArtist.textContent = song.artist;

    syncHeartStatus(song.isLiked);
    updateMainPlayButton(true);

    // Selective updates instead of full render
    syncPlayIcons();
    renderLibraryList();
};

const togglePlayback = () => {
    if (!activeId && songDatabase.length > 0) {
        loadAndPlay(songDatabase[0]);
        return;
    }
    audio.paused ? audio.play() : audio.pause();
    updateMainPlayButton(!audio.paused);
    syncPlayIcons();
};

const updateMainPlayButton = (playing) => {
    const btn = document.querySelector('.btn-play-pause');
    if (btn) {
        btn.innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}" fill="currentColor"></i>`;
        window.lucide?.createIcons();
    }
};

const syncHeartStatus = (liked) => {
    const heart = document.getElementById('main-heart');
    if (heart) {
        heart.classList.toggle('liked', liked);
        heart.innerHTML = `<i data-lucide="heart" size="18" ${liked ? 'fill="currentColor"' : ''}></i>`;
        window.lucide?.createIcons();
    }
};

// --- NAVIGATION & UTILS ---

const skipForward = () => {
    const currentIndex = songDatabase.findIndex(s => s.id === activeId);
    const nextIdx = isShuffle
        ? Math.floor(Math.random() * songDatabase.length)
        : (currentIndex + 1) % songDatabase.length;
    loadAndPlay(songDatabase[nextIdx]);
};

const skipBackward = () => {
    const currentIndex = songDatabase.findIndex(s => s.id === activeId);
    const prevIdx = (currentIndex - 1 + songDatabase.length) % songDatabase.length;
    loadAndPlay(songDatabase[prevIdx]);
};

// --- DOM EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // Dynamic shelf injection if needed
    const main = document.getElementById('main-content');
    if (main && !document.getElementById('viral-grid')) {
        const shelf = document.createElement('section');
        shelf.className = "shelf";
        shelf.style.marginTop = "40px";
        shelf.innerHTML = `<h2 class="shelf-title">Community Favorites</h2><div class="card-grid" id="viral-grid"></div>`;
        main.appendChild(shelf);
    }

    // --- SEARCH ---
    document.getElementById('search-input')?.addEventListener('input', (e) => renderMainSections(e.target.value));

    // --- TRANSPORT CONTROLS ---
    document.querySelector('.btn-play-pause')?.addEventListener('click', togglePlayback);
    document.querySelector('[data-lucide="skip-forward"]')?.parentElement.addEventListener('click', skipForward);
    document.querySelector('[data-lucide="skip-back"]')?.parentElement.addEventListener('click', skipBackward);

    document.getElementById('main-heart')?.addEventListener('click', () => {
        const current = songDatabase.find(t => t.id === activeId);
        if (current) {
            current.isLiked = !current.isLiked;
            persistData();
            syncHeartStatus(current.isLiked);
            renderLibraryList();
        }
    });

    // --- PROGRESS & VOLUME INTERACTION ---
    const progressContainer = document.querySelector('.progress-bar');
    const updateProgressUI = (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (isDraggingProgress) audio.currentTime = ratio * audio.duration;
        document.querySelector('.progress-fill').style.width = `${ratio * 100}%`;
    };

    progressContainer?.addEventListener('mousedown', (e) => { isDraggingProgress = true; updateProgressUI(e); });

    const volContainer = document.getElementById('volume-bar');
    const updateVolumeUI = (e) => {
        const rect = volContainer.getBoundingClientRect();
        const level = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.volume = level;
        document.getElementById('volume-fill').style.width = `${level * 100}%`;
    };
    volContainer?.addEventListener('mousedown', (e) => { isDraggingVolume = true; updateVolumeUI(e); });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) updateProgressUI(e);
        if (isDraggingVolume) updateVolumeUI(e);
    });

    window.addEventListener('mouseup', () => { isDraggingProgress = false; isDraggingVolume = false; });

    // --- AUDIO ENGINE UPDATES ---
    audio.addEventListener('timeupdate', () => {
        if (isDraggingProgress || isNaN(audio.duration)) return;
        const progressPct = (audio.currentTime / audio.duration) * 100;
        document.querySelector('.progress-fill').style.width = `${progressPct}%`;

        const timestamp = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
        document.querySelector('.progress-container span:first-child').textContent = timestamp(audio.currentTime);
        document.querySelector('.progress-container span:last-child').textContent = timestamp(audio.duration);
    });

    audio.addEventListener('ended', () => isRepeat ? (audio.currentTime = 0, audio.play()) : skipForward());

    // --- INITIAL RENDER ---
    // Start with skeleton loading for UX feel
    const grids = document.querySelectorAll('.card-grid');
    // Using DocumentFragment for efficient skeleton injection
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 4; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = "card skeleton";
        skeleton.style.height = "260px";
        skeleton.style.border = "none";
        fragment.appendChild(skeleton);
    }
    grids.forEach(g => {
        g.innerHTML = '';
        g.appendChild(fragment.cloneNode(true));
    });

    // Optimized timeout for a snappier feel
    setTimeout(() => {
        renderMainSections();
        renderLibraryList();
    }, 120);
});
