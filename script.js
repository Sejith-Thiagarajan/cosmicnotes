// --- GLOBAL PAGINATION STATE ---
// Will store ALL posts from the CSV after parsing
let allPosts = []; 
const POSTS_PER_PAGE = 3;
let currentPage = 1;

// 1. Function to render the HTML for the currently selected subset of blog posts
function renderBlogPostsHTML(posts) {
    const container = document.getElementById('blog-list-container');
    const loadingMessage = document.getElementById('loading-message');
    let blogHTML = '';

    // 1. Remove the loading message if it exists
    if (loadingMessage) {
        loadingMessage.remove();
    }
    
    // 2. Clear the container content but keep the vertical timeline bar
    // Note: Assumes the vertical bar is the first child of blog-list-container
    container.innerHTML = `<div class="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-600"></div>`; 

    // 3. Loop through the subset of posts (max 10)
    posts.forEach((post, index) => {
        const postHTML = `
            <a href="#" class="block rounded-lg transition-colors duration-300 ease-in-out hover:bg-gray-900/50 p-4 -ml-4">
                <article class="relative">
                    <div class="flex items-center">
                        <div class="w-5 h-px bg-gray-600 mr-4"></div>
                        <h2 class="text-xl font-bold text-white">#${post.serial}. ${post.title}</h2>
                    </div>
                    <p class="text-sm text-gray-400 mt-2 ml-9">posted on ${post.date} by ${post.author}</p>
                    <p class="mt-4 ml-9">
                        ${post.description}
                        ${post.reading_time ? `<span class="text-gray-500"> - ${post.reading_time} min read</span>` : ''}
                    </p>
                </article>
            </a>
            ${index < posts.length - 1 ? '<div class="h-8"></div>' : ''}
        `;
        blogHTML += postHTML;
    });

    // 4. Insert the generated HTML
    if (container) {
        container.insertAdjacentHTML('beforeend', blogHTML);
    }
}


// 2. Function to generate the Previous, Next, and numbered buttons WITH ELLIPSIS LOGIC
function renderPaginationControls() {
    const controlsContainer = document.getElementById('pagination-controls');
    controlsContainer.innerHTML = ''; // Clear previous buttons
    
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return; 

    let controlsHTML = '';
    const buttonBaseClass = "px-3 py-1 text-sm rounded-full border border-gray-700 hover:bg-gray-800 transition-colors duration-200 cursor-pointer";
    const disabledClass = "opacity-50 cursor-not-allowed";
    const activeClass = "bg-gray-500 text-white";
    const range = 2; // Show 2 pages before and 2 pages after current

    // --- 1. Previous Button ---
    controlsHTML += `
        <button 
            onclick="changePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled' : ''}
            class="${buttonBaseClass} ${currentPage === 1 ? disabledClass : ''}">
            Previous
        </button>
    `;
    
    // --- 2. Numbered Page Buttons with Ellipsis Logic ---
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    // Adjust range to ensure enough context near the start/end
    if (currentPage <= range + 1) {
        endPage = Math.min(totalPages, 2 * range + 1);
    }
    if (currentPage >= totalPages - range) {
        startPage = Math.max(1, totalPages - 2 * range);
    }

    // Always show page 1 and ellipsis if necessary
    if (startPage > 1) {
        controlsHTML += `<button onclick="changePage(1)" class="${buttonBaseClass}">1</button>`;
        if (startPage > 2) {
            controlsHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
    }

    // Show pages in the computed range
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage ? activeClass : '';
        controlsHTML += `
            <button 
                onclick="changePage(${i})"
                class="${buttonBaseClass} ${isActive}">
                ${i}
            </button>
        `;
    }

    // Always show the last page and ellipsis if necessary
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            controlsHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
        // Only show last page number if it wasn't already included in the loop range
        if (endPage < totalPages) {
            controlsHTML += `<button onclick="changePage(${totalPages})" class="${buttonBaseClass}">
                ${totalPages}
            </button>`;
        }
    }
    
    // --- 3. Next Button ---
    controlsHTML += `
        <button 
            onclick="changePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled' : ''}
            class="${buttonBaseClass} ${currentPage === totalPages ? disabledClass : ''}">
            Next
        </button>
    `;

    controlsContainer.insertAdjacentHTML('beforeend', controlsHTML);
}


// 3. Function called by the pagination buttons (globally accessible via window)
window.changePage = function(newPage) {
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderPage(currentPage);
        // Optional: Scroll to the top of the blog list when changing pages
        // document.getElementById('blog-list-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// 4. Main function to slice the data and trigger rendering
function renderPage(pageNumber) {
    const startIndex = (pageNumber - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    
    // Use .slice() to get only the 10 posts for the current page
    const postsToDisplay = allPosts.slice(startIndex, endIndex);

    renderBlogPostsHTML(postsToDisplay); 
    renderPaginationControls();
}


// 5. Initialization Function (replaces loadAndParseCSV)
function initializePosts() {
    const csvFilePath = 'posts.csv'; 

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("Finished parsing CSV:", results.data);
            
            if (results.data && results.data.length > 0) {
                // 1. Store ALL valid posts globally, filter empty rows, and reverse the list (Newest first)
                allPosts = results.data
                    .filter(post => post.title && post.title.trim() !== '')
                    .reverse(); 
                
                // 2. Render the first page
                renderPage(currentPage); 
            } else {
                 const loadingMessage = document.getElementById('loading-message');
                 if (loadingMessage) {
                    loadingMessage.textContent = "No blog posts found.";
                 }
            }
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = "Error loading blog posts.";
            }
        }
    });
}

// Execute the loading function when the page loads
document.addEventListener('DOMContentLoaded', initializePosts);