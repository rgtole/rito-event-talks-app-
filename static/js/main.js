let allNotes = [];
let selectedNotes = [];
let activeFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const refreshBtn = document.getElementById('refresh-btn');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const notesContainer = document.getElementById('notes-container');
  const floatingBar = document.getElementById('floating-bar');
  const selectionCount = document.getElementById('selection-count');
  const btnClearSelection = document.getElementById('btn-clear');
  const btnTweetSelected = document.getElementById('btn-tweet-selected');
  
  // Tweet Modal Elements
  const tweetModal = document.getElementById('tweet-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const composerTextarea = document.getElementById('composer-textarea');
  const charCount = document.getElementById('char-count');
  const btnSendTweet = document.getElementById('btn-send-tweet');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  // Load Initial Data
  fetchReleaseNotes();

  // Event Listeners
  refreshBtn.addEventListener('click', fetchReleaseNotes);
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderNotes();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderNotes();
    });
  });

  btnClearSelection.addEventListener('click', clearSelection);

  btnTweetSelected.addEventListener('click', () => {
    openTweetComposer(generateCombinedTweetText());
  });

  // Modal events
  closeModalBtn.addEventListener('click', () => {
    tweetModal.classList.remove('active');
  });

  // Close modal when clicking background
  tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) {
      tweetModal.classList.remove('active');
    }
  });

  composerTextarea.addEventListener('input', () => {
    updateCharCounter();
  });

  btnSendTweet.addEventListener('click', () => {
    const tweetText = composerTextarea.value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    tweetModal.classList.remove('active');
  });

  // --- Functions ---

  function fetchReleaseNotes() {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    // Clear selection on refresh
    clearSelection();
    
    // Show loading skeleton/spinner in list
    notesContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Fetching latest BigQuery release notes...</p>
      </div>
    `;

    fetch('/api/release-notes')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(result => {
        if (result.status === 'success') {
          // Add a unique index ID to each note for easy selection handling
          allNotes = result.data.map((note, idx) => ({
            id: `note-${idx}`,
            ...note
          }));
          renderNotes();
        } else {
          showError(result.message || 'An error occurred while parsing the feed.');
        }
      })
      .catch(err => {
        showError(`Could not fetch release notes: ${err.message}. Please check your internet connection.`);
      })
      .finally(() => {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
      });
  }

  function renderNotes() {
    // Filter notes based on active category & search query
    let filtered = allNotes.filter(note => {
      // Category Filter
      if (activeFilter !== 'all') {
        const typeNormalized = note.type.toLowerCase();
        if (activeFilter === 'feature' && typeNormalized !== 'feature') return false;
        if (activeFilter === 'announcement' && typeNormalized !== 'announcement') return false;
        if (activeFilter === 'issue' && (typeNormalized !== 'issue' && typeNormalized !== 'deprecation')) return false;
      }
      
      // Search query Filter
      if (searchQuery) {
        const contentMatch = note.text.toLowerCase().includes(searchQuery);
        const typeMatch = note.type.toLowerCase().includes(searchQuery);
        const dateMatch = note.date.toLowerCase().includes(searchQuery);
        return contentMatch || typeMatch || dateMatch;
      }
      
      return true;
    });

    // Handle empty state
    if (filtered.length === 0) {
      notesContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>No release notes found</h3>
          <p>Try resetting filters or changing your search query.</p>
        </div>
      `;
      return;
    }

    notesContainer.innerHTML = '';
    
    // Render cards
    filtered.forEach(note => {
      const isSelected = selectedNotes.some(sn => sn.id === note.id);
      
      const card = document.createElement('div');
      card.className = `note-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = note.id;
      
      const typeClass = note.type.toLowerCase();
      
      card.innerHTML = `
        <div class="card-header">
          <div class="card-meta">
            <span class="type-tag ${typeClass}">${note.type}</span>
            <span class="date-badge">${note.date}</span>
          </div>
          <div class="select-indicator">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        <div class="card-body">
          ${note.html}
        </div>
        <div class="card-actions">
          <button class="btn-copy-inline" data-id="${note.id}">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            Copy Update
          </button>
          <button class="btn-tweet-inline" data-id="${note.id}">
            <svg viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Tweet Update
          </button>
        </div>
      `;
      
      // Card selection toggle event (excluding clicks on links and buttons)
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('.btn-tweet-inline') || e.target.closest('.btn-copy-inline')) {
          return; // Allow links, tweet, and copy button to work normally
        }
        toggleSelection(note);
      });
      
      // Inline Copy Button Event
      const inlineCopyBtn = card.querySelector('.btn-copy-inline');
      inlineCopyBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop card click handler
        const copyText = `BigQuery ${note.type} (${note.date}):\n${note.text}\n\nLink: ${note.link}`;
        navigator.clipboard.writeText(copyText).then(() => {
          inlineCopyBtn.classList.add('copied');
          const originalHTML = inlineCopyBtn.innerHTML;
          inlineCopyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
          `;
          setTimeout(() => {
            inlineCopyBtn.classList.remove('copied');
            inlineCopyBtn.innerHTML = originalHTML;
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy: ', err);
        });
      });
      
      // Inline Tweet Button Event
      const inlineTweetBtn = card.querySelector('.btn-tweet-inline');
      inlineTweetBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop card click handler
        openTweetComposer(generateTweetTextForNote(note));
      });
      
      notesContainer.appendChild(card);
    });
  }

  function showError(msg) {
    notesContainer.innerHTML = `
      <div class="error-state">
        <h3>Could not load updates</h3>
        <p>${msg}</p>
        <button class="btn-retry" id="btn-retry">Retry Fetching</button>
      </div>
    `;
    
    document.getElementById('btn-retry').addEventListener('click', fetchReleaseNotes);
  }

  function toggleSelection(note) {
    const index = selectedNotes.findIndex(sn => sn.id === note.id);
    if (index > -1) {
      selectedNotes.splice(index, 1);
    } else {
      selectedNotes.push(note);
    }
    
    // Re-render notes to reflect selection state
    renderNotes();
    updateFloatingBar();
  }

  function clearSelection() {
    selectedNotes = [];
    renderNotes();
    updateFloatingBar();
  }

  function updateFloatingBar() {
    const count = selectedNotes.length;
    if (count > 0) {
      selectionCount.textContent = `${count} Update${count > 1 ? 's' : ''} Selected`;
      floatingBar.classList.add('visible');
    } else {
      floatingBar.classList.remove('visible');
    }
  }

  // Helper to intelligently truncate text while preserving formatting/words
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // Truncate at word boundary if possible
    let truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength / 2) {
      truncated = truncated.substring(0, lastSpace);
    }
    return truncated + '...';
  }

  // Formats text for a single note tweet
  function generateTweetTextForNote(note) {
    const title = `BigQuery ${note.type} (${note.date}):`;
    const hashtags = `#BigQuery #GoogleCloud`;
    
    // Twitter's auto-shortened link size (t.co) is always counted as 23 characters.
    // Let's budget: 280 chars total - 23 (link) - 1 (space) - hashtags.length - 1 (space) - title.length - 1 (space)
    const urlLength = 23;
    const fixedLength = title.length + 1 + urlLength + 1 + hashtags.length + 1;
    const maxDescLength = Math.max(50, 280 - fixedLength);
    
    const cleanDesc = truncateText(note.text, maxDescLength);
    
    return `${title} ${cleanDesc} ${note.link} ${hashtags}`;
  }

  // Formats text for multi-note combined tweet
  function generateCombinedTweetText() {
    if (selectedNotes.length === 0) return '';
    if (selectedNotes.length === 1) return generateTweetTextForNote(selectedNotes[0]);
    
    // Sort by date/update order (newest first)
    const sorted = [...selectedNotes];
    
    // Make a summary list tweet
    const intro = `Latest BigQuery Updates:\n`;
    const hashtags = `\n#BigQuery #GoogleCloud`;
    const url = sorted[0].link; // Use link of the latest selected note
    const urlLength = 23;
    
    // Budget calculations
    const fixedLength = intro.length + urlLength + 1 + hashtags.length;
    let availableForItems = 280 - fixedLength;
    
    let itemsText = '';
    sorted.forEach((note, idx) => {
      // Form: "- [Type]: [ShortDesc]\n"
      const itemTitle = `• [${note.type}]: `;
      const itemText = truncateText(note.text, 50);
      const fullItem = `${itemTitle}${itemText}\n`;
      
      if (itemsText.length + fullItem.length <= availableForItems) {
        itemsText += fullItem;
      }
    });
    
    // If no items fit (unlikely), fallback to a basic title
    if (!itemsText) {
      itemsText = `• Multiple feature updates on ${sorted[0].date}\n`;
    }
    
    return `${intro}${itemsText}${url}${hashtags}`;
  }

  function openTweetComposer(text) {
    composerTextarea.value = text;
    tweetModal.classList.add('active');
    updateCharCounter();
    composerTextarea.focus();
  }

  function updateCharCounter() {
    const text = composerTextarea.value;
    
    // Simulate Twitter's link handling: replace links with a 23-char placeholder for counting
    const urlPattern = /https?:\/\/[^\s]+/g;
    let length = text.length;
    
    const matches = text.match(urlPattern);
    if (matches) {
      matches.forEach(m => {
        length = length - m.length + 23;
      });
    }
    
    charCount.textContent = `${length} / 280`;
    
    // Color status classes
    charCount.className = 'char-counter';
    if (length > 280) {
      charCount.classList.add('danger');
      btnSendTweet.disabled = true;
    } else if (length >= 260) {
      charCount.classList.add('warning');
      btnSendTweet.disabled = false;
    } else {
      btnSendTweet.disabled = false;
    }
  }

  function exportToCSV() {
    // Export currently matching/filtered notes
    let filtered = allNotes.filter(note => {
      if (activeFilter !== 'all') {
        const typeNormalized = note.type.toLowerCase();
        if (activeFilter === 'feature' && typeNormalized !== 'feature') return false;
        if (activeFilter === 'announcement' && typeNormalized !== 'announcement') return false;
        if (activeFilter === 'issue' && (typeNormalized !== 'issue' && typeNormalized !== 'deprecation')) return false;
      }
      
      if (searchQuery) {
        const contentMatch = note.text.toLowerCase().includes(searchQuery);
        const typeMatch = note.type.toLowerCase().includes(searchQuery);
        const dateMatch = note.date.toLowerCase().includes(searchQuery);
        return contentMatch || typeMatch || dateMatch;
      }
      
      return true;
    });

    if (filtered.length === 0) {
      alert('No updates to export in the current selection.');
      return;
    }

    const headers = ['Date', 'Type', 'Link', 'Description'];
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      return `"${str.toString().replace(/"/g, '""')}"`;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeCsv).join(','));

    filtered.forEach(note => {
      const row = [
        note.date,
        note.type,
        note.link,
        note.text
      ];
      csvRows.push(row.map(escapeCsv).join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const categorySuffix = activeFilter !== 'all' ? `_${activeFilter}` : '';
    const filename = `bigquery_release_notes${categorySuffix}_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
