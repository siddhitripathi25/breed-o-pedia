
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
const loadMoreBtn = document.getElementById('loadMoreBtn');

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
loadMoreBtn.addEventListener('click', loadMoreImages);

window.handleVote = handleVote;


fetchBreeds();