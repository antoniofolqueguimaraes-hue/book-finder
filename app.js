import { search, searchByTitle, searchByAuthor, searchBySubject, searchByISBN, trending } from './api.js';
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from './firebase.js';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchType = document.getElementById('search-type');
const resultsSection = document.getElementById('results-section');
const resultsGrid = document.getElementById('results-grid');
const resultsCount = document.getElementById('results-count');
const loadMoreBtn = document.getElementById('load-more-btn');

const trendingSection = document.getElementById('trending-section');
const trendingGrid = document.getElementById('trending-grid');

const navHome = document.getElementById('nav-home');
const navReadingList = document.getElementById('nav-reading-list');
const readingListSection = document.getElementById('reading-list-section');
const readingListFilter = document.getElementById('reading-list-filter');
const readingListGrid = document.getElementById('reading-list-grid');

let currentSession = {
  query: null,
  type: null,
  page: 1,
  limit: 20,
  lastResult: null,
  isLoading: false
};

function renderBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${book.title} cover" class="cover-img" loading="lazy">`
    : `<div class="cover-placeholder">No Cover Available</div>`;

  const ratingHtml = book.ratingsAverage
    ? `<div class="book-rating">★ ${book.ratingsAverage.toFixed(1)}</div>`
    : `<div>No rating</div>`;

  const yearHtml = book.firstPublishYear
    ? `<div>${book.firstPublishYear}</div>`
    : `<div>Year unknown</div>`;

  const authorsText = book.authors && book.authors.length > 0
    ? book.authors.join(', ')
    : 'Unknown Author';

  card.innerHTML = `
    <a href="${book.openLibraryUrl || '#'}" target="_blank" rel="noopener noreferrer" class="cover-wrapper">
      ${coverHtml}
    </a>
    <div class="book-info">
      <a href="${book.openLibraryUrl || '#'}" target="_blank" rel="noopener noreferrer">
        <h3 class="book-title">${book.title || 'Unknown Title'}</h3>
      </a>
      <p class="book-authors">${authorsText}</p>
      <div class="book-meta">
        ${yearHtml}
        ${ratingHtml}
      </div>
      <button class="save-btn">Save</button>
    </div>
  `;

  const saveBtn = card.querySelector('.save-btn');
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;
      await addDoc(collection(db, "saved_books"), {
        title: book.title || 'Unknown Title',
        authors: book.authors || [],
        coverUrl: book.coverUrl || null,
        firstPublishYear: book.firstPublishYear || null,
        ratingsAverage: book.ratingsAverage || null,
        openLibraryUrl: book.openLibraryUrl || null,
        savedAt: new Date().toISOString(),
        status: 'Want to Read'
      });
      saveBtn.textContent = 'Saved';
      saveBtn.classList.add('saved');
    } catch (err) {
      console.error("Error saving book: ", err);
      saveBtn.textContent = 'Error';
      saveBtn.disabled = false;
      alert("Failed to save. Please check your Firebase config.");
    }
  });

  return card;
}

function renderReadingListCard(book, docId) {
  const card = document.createElement('div');
  card.className = 'book-card';

  const coverHtml = book.coverUrl
    ? `<img src="${book.coverUrl}" alt="${book.title} cover" class="cover-img" loading="lazy">`
    : `<div class="cover-placeholder">No Cover Available</div>`;

  const authorsText = book.authors && book.authors.length > 0
    ? book.authors.join(', ')
    : 'Unknown Author';

  card.innerHTML = `
    <a href="${book.openLibraryUrl || '#'}" target="_blank" rel="noopener noreferrer" class="cover-wrapper">
      ${coverHtml}
    </a>
    <div class="book-info">
      <a href="${book.openLibraryUrl || '#'}" target="_blank" rel="noopener noreferrer">
        <h3 class="book-title">${book.title || 'Unknown Title'}</h3>
      </a>
      <p class="book-authors">${authorsText}</p>
      
      <div class="reading-list-controls">
        <select class="status-select">
          <option value="Want to Read" ${book.status === 'Want to Read' ? 'selected' : ''}>Want to Read</option>
          <option value="Read" ${book.status === 'Read' ? 'selected' : ''}>Read</option>
        </select>
        <button class="remove-btn">Remove</button>
      </div>
    </div>
  `;

  const statusSelect = card.querySelector('.status-select');
  statusSelect.addEventListener('change', async (e) => {
    try {
      await updateDoc(doc(db, "saved_books", docId), {
        status: e.target.value
      });
    } catch (err) {
      console.error("Error updating status: ", err);
      alert("Failed to update status.");
    }
    // Re-filter if needed
    if (readingListFilter.value !== 'all' && readingListFilter.value !== e.target.value) {
      card.remove();
    }
  });

  const removeBtn = card.querySelector('.remove-btn');
  removeBtn.addEventListener('click', async () => {
    try {
      await deleteDoc(doc(db, "saved_books", docId));
      card.remove();
    } catch (err) {
      console.error("Error deleting book: ", err);
      alert("Failed to remove book.");
    }
  });

  return card;
}

async function loadReadingList() {
  readingListGrid.innerHTML = '<div class="loader">Loading your books...</div>';
  try {
    const querySnapshot = await getDocs(collection(db, "saved_books"));
    readingListGrid.innerHTML = '';
    let count = 0;
    
    querySnapshot.forEach((docSnap) => {
      const book = docSnap.data();
      const docId = docSnap.id;
      
      if (readingListFilter.value === 'all' || book.status === readingListFilter.value) {
        readingListGrid.appendChild(renderReadingListCard(book, docId));
        count++;
      }
    });

    if (count === 0) {
      readingListGrid.innerHTML = '<p class="loader">No books found in this list.</p>';
    }
  } catch (err) {
    console.error(err);
    readingListGrid.innerHTML = `<p class="loader">Error loading reading list: ${err.message}</p>`;
  }
}

navHome.addEventListener('click', () => {
  navHome.classList.add('active');
  navReadingList.classList.remove('active');
  
  readingListSection.classList.add('hidden');
  
  if (currentSession.query) {
    resultsSection.classList.remove('hidden');
  } else {
    trendingSection.classList.remove('hidden');
  }
});

navReadingList.addEventListener('click', () => {
  navReadingList.classList.add('active');
  navHome.classList.remove('active');
  
  trendingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  readingListSection.classList.remove('hidden');
  
  loadReadingList();
});

readingListFilter.addEventListener('change', loadReadingList);

async function loadTrending() {
  try {
    const results = await trending(10);
    trendingGrid.innerHTML = '';
    if (results.books && results.books.length > 0) {
      results.books.forEach(book => {
        trendingGrid.appendChild(renderBookCard(book));
      });
    } else {
      trendingGrid.innerHTML = '<p class="loader">No trending books found.</p>';
    }
  } catch (err) {
    trendingGrid.innerHTML = `<p class="loader">Error loading trending books: ${err.message}</p>`;
  }
}

async function performSearch(query, type, page) {
  const opts = { page, limit: currentSession.limit };
  
  if (type === 'title') return searchByTitle(query, opts);
  if (type === 'author') return searchByAuthor(query, opts);
  if (type === 'subject') return searchBySubject(query, opts);
  if (type === 'isbn') return searchByISBN(query);
  
  return search(query, opts);
}

async function handleSearch(e) {
  e.preventDefault();
  const query = searchInput.value.trim();
  const type = searchType.value;
  
  if (!query) return;

  currentSession = {
    query,
    type,
    page: 1,
    limit: 20,
    lastResult: null,
    isLoading: true
  };

  trendingSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  resultsGrid.innerHTML = '<div class="loader">Searching...</div>';
  loadMoreBtn.classList.add('hidden');

  try {
    const result = await performSearch(query, type, currentSession.page);
    currentSession.lastResult = result;
    
    resultsGrid.innerHTML = '';
    
    if (result.books && result.books.length > 0) {
      result.books.forEach(book => {
        resultsGrid.appendChild(renderBookCard(book));
      });
      resultsCount.textContent = `(${result.numFound} found)`;
      
      const totalShown = currentSession.page * currentSession.limit;
      if (totalShown < result.numFound && type !== 'isbn') {
        loadMoreBtn.classList.remove('hidden');
      }
    } else {
      resultsGrid.innerHTML = '<p class="loader">No books found for your query.</p>';
      resultsCount.textContent = '(0 found)';
    }
  } catch (err) {
    resultsGrid.innerHTML = `<p class="loader">Error: ${err.message}</p>`;
  } finally {
    currentSession.isLoading = false;
  }
}

async function handleLoadMore() {
  if (currentSession.isLoading || !currentSession.query) return;
  
  currentSession.isLoading = true;
  currentSession.page += 1;
  const prevText = loadMoreBtn.textContent;
  loadMoreBtn.textContent = 'Loading...';

  try {
    const result = await performSearch(currentSession.query, currentSession.type, currentSession.page);
    currentSession.lastResult = result;
    
    if (result.books && result.books.length > 0) {
      result.books.forEach(book => {
        resultsGrid.appendChild(renderBookCard(book));
      });
      
      const totalShown = currentSession.page * currentSession.limit;
      if (totalShown >= result.numFound) {
        loadMoreBtn.classList.add('hidden');
      }
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  } catch (err) {
    console.error(err);
    alert('Error loading more results. Please try again.');
    currentSession.page -= 1; // Revert page
  } finally {
    loadMoreBtn.textContent = prevText;
    currentSession.isLoading = false;
  }
}

searchForm.addEventListener('submit', handleSearch);
loadMoreBtn.addEventListener('click', handleLoadMore);

// Load trending on init
document.addEventListener('DOMContentLoaded', loadTrending);
