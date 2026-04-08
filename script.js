
const API_BASE = 'https://dog.ceo/api';

let allBreeds = {};
let currentBreed = '';
let currentSubBreed = '';
let currentImages = [];
let visibleImages = 12;
let isLoading = false;

const breedSelect = document.getElementById('breedSelect');
const subBreedGroup = document.getElementById('subBreedGroup');
const subBreedSelect = document.getElementById('subBreedSelect');
const gallery = document.getElementById('gallery');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const randomBtn = document.getElementById('randomBtn');
const toggleHeatmapBtn = document.getElementById('toggleHeatmapBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
let isHeatmapVisible = false;

function showLoading() {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    gallery.style.display = 'none';
    loadMoreContainer.style.display = 'none';
}

function hideLoading() {
    loadingState.style.display = 'none';
}

function showError() {
    errorState.style.display = 'block';
    gallery.style.display = 'none';
    loadMoreContainer.style.display = 'none';
    hideLoading();
}

function showGallery() {
    gallery.style.display = 'grid';
    errorState.style.display = 'none';
}


async function fetchBreeds() {
    try {
        const response = await fetch(`${API_BASE}/breeds/list/all`);
        if (!response.ok) throw new Error('Failed to fetch breeds');
        const data = await response.json();
        allBreeds = data.message;
        populateBreedSelect();
    } catch (error) {
        console.error('Error fetching breeds:', error);
        showError();
    }
}

async function fetchImages(breed, subBreed = '') {
    showLoading();
    try {
        let url = `${API_BASE}/breed/${breed}/images`;
        if (subBreed) {
            url = `${API_BASE}/breed/${breed}/${subBreed}/images`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch images');
        const data = await response.json();
        
        currentImages = data.message;
        visibleImages = 12;
        renderGallery();
        hideLoading();
        showGallery();
        
        if (currentImages.length > visibleImages) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        showError();
    }
}

async function fetchRandomImage() {
    try {
        const response = await fetch(`${API_BASE}/breeds/image/random`);
        if (!response.ok) throw new Error('Failed to fetch random image');
        const data = await response.json();
        
        currentImages = [data.message, ...currentImages];
        visibleImages++;
        renderGallery();
    } catch (error) {
        console.error('Error fetching random image:', error);
        alert('Failed to fetch random image. Please try again.');
    }
}

function populateBreedSelect() {
    breedSelect.innerHTML = '<option value="">Select a breed</option>';
    
    const sortedBreeds = Object.keys(allBreeds).sort();
    sortedBreeds.forEach(breed => {
        const option = document.createElement('option');
        option.value = breed;
        option.textContent = breed.charAt(0).toUpperCase() + breed.slice(1);
        breedSelect.appendChild(option);
    });
}

function populateSubBreedSelect(breed) {
    const subBreeds = allBreeds[breed];
    
    if (subBreeds && subBreeds.length > 0) {
        subBreedGroup.style.display = 'block';
        subBreedSelect.innerHTML = '<option value="">All sub-breeds</option>';
        
        subBreeds.forEach(subBreed => {
            const option = document.createElement('option');
            option.value = subBreed;
            option.textContent = subBreed.charAt(0).toUpperCase() + subBreed.slice(1);
            subBreedSelect.appendChild(option);
        });
    } else {
        subBreedGroup.style.display = 'none';
        currentSubBreed = '';
    }
}

let votes = JSON.parse(localStorage.getItem('dogVotes')) || {};

function saveVotes() {
    localStorage.setItem('dogVotes', JSON.stringify(votes));
}

function handleVote(imageUrl, isHot) {
    if (!votes[imageUrl]) {
        votes[imageUrl] = 0;
    }
    votes[imageUrl] += isHot ? 1 : -1;
    saveVotes();
    renderGallery();
    renderVotingHeatmap();
}

function extractBreedFromUrl(url) {
    const parts = url.split('/');
    if (parts.length >= 6 && parts[4]) {
        return parts[4].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Unknown';
}

function calculateBreedStats() {
    const stats = {};
    for (const [url, score] of Object.entries(votes)) {
        const breed = extractBreedFromUrl(url);
        if (!stats[breed]) {
            stats[breed] = 0;
        }
        stats[breed] += score;
    }
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
}

function renderVotingHeatmap() {
    const heatmapSection = document.getElementById('votingHeatmap');
    const heatmapContainer = document.getElementById('heatmapContainer');

    if (!isHeatmapVisible) {
        heatmapSection.style.display = 'none';
        return;
    }

    const sortedStats = calculateBreedStats();

    if (sortedStats.length === 0) {
        heatmapSection.style.display = 'none';
        return;
    }

    heatmapSection.style.display = 'block';
    
    // Handle cases if we have positive max and negative min
    const maxScore = Math.max(1, ...sortedStats.map(stat => Math.abs(stat[1])));

    let displayStats = [];
    if (sortedStats.length > 5) {
        displayStats.push(sortedStats[0], sortedStats[1], sortedStats[2]);
        displayStats.push(sortedStats[sortedStats.length - 2], sortedStats[sortedStats.length - 1]);
    } else {
        displayStats = sortedStats;
    }

    const seen = new Set();
    displayStats = displayStats.filter(stat => {
        if (!stat) return false;
        if (seen.has(stat[0])) return false;
        seen.add(stat[0]);
        return true;
    });

    heatmapContainer.innerHTML = displayStats.map(([breed, score]) => {
        const percentage = (Math.abs(score) / maxScore) * 100;
        let barClass = 'neutral';
        let rankLabel = '';
        if (score > 0) barClass = 'hot';
        else if (score < 0) barClass = 'cold';
        
        if (breed === sortedStats[0][0] && score > 0) rankLabel = ' 🥇 Most Loved';
        else if (breed === sortedStats[sortedStats.length - 1][0] && score < 0) rankLabel = ' 👎 Least Liked';

        return `
            <div class="heatmap-item">
                <div class="heatmap-label">
                    <span>${breed}${rankLabel}</span>
                    <span class="score">${score > 0 ? '+' : ''}${score}</span>
                </div>
                <div class="stats-bar-container">
                    <div class="stats-bar ${barClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGallery() {
    const imagesToShow = currentImages.slice(0, visibleImages);
    
    gallery.innerHTML = imagesToShow.map((image, index) => {
        const voteCount = votes[image] || 0;
        return `
            <div class="card">
                <img src="${image}" alt="Dog ${index + 1}" loading="lazy">
                <div class="card-content">
                    <div class="vote-buttons">
                        <button class="vote-btn vote-hot" onclick="handleVote('${image}', true)">
                            🔥 Hot ${voteCount > 0 ? `(${voteCount})` : ''}
                        </button>
                        <button class="vote-btn vote-not" onclick="handleVote('${image}', false)">
                            👎 Not ${voteCount < 0 ? `(${Math.abs(voteCount)})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (visibleImages >= currentImages.length) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
}

function loadMoreImages() {
    visibleImages += 12;
    renderGallery();
}

function onBreedChange() {
    currentBreed = breedSelect.value;
    currentSubBreed = '';
    
    if (currentBreed) {
        populateSubBreedSelect(currentBreed);
        fetchImages(currentBreed);
    } else {
        subBreedGroup.style.display = 'none';
        gallery.innerHTML = '';
        loadMoreContainer.style.display = 'none';
    }
}

function onSubBreedChange() {
    currentSubBreed = subBreedSelect.value;
    if (currentBreed) {
        fetchImages(currentBreed, currentSubBreed);
    }
}

breedSelect.addEventListener('change', onBreedChange);
subBreedSelect.addEventListener('change', onSubBreedChange);
randomBtn.addEventListener('click', fetchRandomImage);
toggleHeatmapBtn.addEventListener('click', () => {
    isHeatmapVisible = !isHeatmapVisible;
    if (isHeatmapVisible) {
        toggleHeatmapBtn.textContent = 'Hide Heatmap';
        renderVotingHeatmap();
    } else {
        toggleHeatmapBtn.textContent = '📊 Show Heatmap';
        document.getElementById('votingHeatmap').style.display = 'none';
    }
});
loadMoreBtn.addEventListener('click', loadMoreImages);

window.handleVote = handleVote;

const themeToggleBtn = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark-mode') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeToggleBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark-mode');
    } else {
        themeToggleBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light-mode');
    }
});
fetchBreeds();
renderVotingHeatmap();