// Simple Router
function navigateTo(pageId) {
    // Update active link
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById('link-' + pageId).classList.add('active');

    // Show active page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Data rendering
const resultsContainer = document.getElementById('resultsContainer');
const searchInput = document.getElementById('searchInput');
const resultsInfo = document.getElementById('resultsInfo');

// We have `dictionaryData` from data.js
let allEntries = dictionaryData || [];

const defaultWords = ['might', 'aggressive', 'violate', 'conflict', 'bad', 'assert', 'amount', 'afford', 'reputation', 'scenario', 'advert', 'virtue', 'pray', 'accompany', 'access', 'advice', 'ask', 'associate', 'remote', 'warm'];

function getDefaultEntries() {
    const defaultEntries = [];
    for (const word of defaultWords) {
        // Use word boundary to match exact word
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        const entry = allEntries.find(e => 
            e.pairs.some(p => regex.test(p.english_plain || p.english))
        );
        if (entry && !defaultEntries.includes(entry)) {
            defaultEntries.push(entry);
            if (defaultEntries.length >= 20) break;
        }
    }
    // Fallback if not enough found
    if (defaultEntries.length < 20) {
        const remaining = allEntries.filter(e => !defaultEntries.includes(e));
        defaultEntries.push(...remaining.slice(0, 20 - defaultEntries.length));
    }
    return defaultEntries;
}

function renderCards(entries, query = '') {
    resultsContainer.innerHTML = '';
    
    if (entries.length === 0) {
        resultsInfo.textContent = 'לא נמצאו תוצאות.';
        return;
    }

    if (query) {
        resultsInfo.textContent = `נמצאו ${entries.length} תוצאות עבור החיפוש "${query}"`;
    } else {
        resultsInfo.textContent = `מציג את כל ${entries.length} הערכים במילון`;
    }

    entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'word-card';
        
        let html = `
            <div class="card-header-row">
                <div class="header-cell">תרגום</div>
                <div class="header-cell">אנגלית</div>
            </div>
        `;
        
        entry.pairs.forEach(pair => {
            const englishText = highlightText(pair.english, query);
            const translationText = highlightText(pair.translation, query);
            
            html += `
                <div class="word-pair-row">
                    <div class="pair-cell">${translationText}</div>
                    <div class="pair-cell english">${englishText}</div>
                </div>
            `;
        });
        
        if (entry.decoding) {
            html += `
                <div class="section-header">פיענוח וקישור לעברית בקיצור</div>
                <div class="section-content">${highlightText(entry.decoding, query)}</div>
            `;
        }
        
        if (entry.expansion) {
            html += `
                <div class="section-header">בהרחבה</div>
                <div class="section-content">${highlightText(entry.expansion, query)}</div>
            `;
        }
        
        if (entry.beginner) {
            html += `
                <div class="section-header beginner-header">הסבר למתחילים</div>
                <div class="section-content beginner-content">${highlightText(entry.beginner, query)}</div>
            `;
        }
        
        card.innerHTML = html;
        resultsContainer.appendChild(card);
    });
}

function highlightText(text, query) {
    if (!query) return text;
    // escape regex chars
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Use word boundaries \b to only highlight exact whole words
    const regex = new RegExp(`\\b(${escapedQuery})\\b`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query === '') {
        renderCards(allEntries);
        return;
    }
    
    // Filter entries
    // escape regex chars for the query
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Use \b to ensure we match whole words only, not partial words
    const queryRegex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
    
    const filtered = allEntries.filter(entry => {
        // Check if query exists ONLY as a whole word in the English cell
        // We use english_plain because english now contains HTML tags
        return entry.pairs.some(p => queryRegex.test(p.english_plain || p.english));
    });
    
    renderCards(filtered, query);
}

// Sidebar logic
function toggleSidebar() {
    const sidebar = document.getElementById('wordListSidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function toggleStatAnswer(id) {
    const answer = document.getElementById(id);
    if (answer) {
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    }
}

function filterSidebar() {
    const input = document.getElementById('sidebarSearchInput');
    const filter = input.value.toLowerCase();
    const ul = document.getElementById('sidebarWordList');
    const li = ul.getElementsByTagName('li');

    for (let i = 0; i < li.length; i++) {
        const txtValue = li[i].textContent || li[i].innerText;
        if (txtValue.toLowerCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

function searchFromSidebar(word) {
    navigateTo('search');
    const searchInput = document.getElementById('searchInput');
    searchInput.value = word;
    handleSearch();
    
    const sidebar = document.getElementById('wordListSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
    }
}

function populateSidebar() {
    const wordList = document.getElementById('sidebarWordList');
    if (!wordList) return;
    
    // Update total words count
    let totalWords = 0;
    allEntries.forEach(entry => {
        if (entry.pairs && Array.isArray(entry.pairs)) {
            totalWords += entry.pairs.length;
        }
    });

    const countElement = document.getElementById('totalWordsCount');
    if (countElement) {
        countElement.textContent = totalWords;
    }
    
    const explainedWords = new Set();
    allEntries.forEach(entry => {
        if (entry.decoding || entry.expansion) {
            entry.pairs.forEach(p => {
                const word = (p.english_plain || p.english).trim();
                let cleanWord = word.replace(/<\/?[^>]+(>|$)/g, ""); // strip html
                // Clean up any extra spaces or punctuation at edges if necessary
                if (cleanWord && cleanWord !== '-') {
                    explainedWords.add(cleanWord.toLowerCase());
                }
            });
        }
    });
    
    const sortedWords = Array.from(explainedWords).sort();
    
    sortedWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.onclick = () => searchFromSidebar(word);
        wordList.appendChild(li);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    populateSidebar();
    
    const initialEntries = getDefaultEntries();
    // Render first 20 entries initially to not overload the DOM if there are thousands
    renderCards(initialEntries);
    resultsInfo.textContent = `מציג 20 דוגמאות מובחרות מתוך המילון`;
    
    // Setup search listener with a small debounce
    let timeoutId;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            if (query === '') {
                renderCards(getDefaultEntries());
                resultsInfo.textContent = `מציג 20 דוגמאות מובחרות מתוך המילון`;
            } else {
                handleSearch();
            }
        }, 300);
    });
});
