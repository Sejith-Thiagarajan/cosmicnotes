// --- GLOBAL PAGINATION STATE ---
let allPosts = []; 
const POSTS_PER_PAGE = 10;
let currentPage = 1;

// 1. Function to render the HTML for the currently selected subset of blog posts
function renderBlogPostsHTML(posts) {
    const container = document.getElementById('blog-list-container');
    const loadingMessage = document.getElementById('loading-message');
    let blogHTML = '';

    if (loadingMessage) {
        loadingMessage.remove();
    }
    
    // Clear the container content but keep the vertical timeline bar
    container.innerHTML = `<div class="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-600"></div>`; 

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
                    </p>
                </article>
            </a>
            ${index < posts.length - 1 ? '<div class="h-8"></div>' : ''}
        `;
        blogHTML += postHTML;
    });

    if (container) {
        container.insertAdjacentHTML('beforeend', blogHTML);
    }
}


// 2. Function to generate the Previous, Next, and numbered buttons WITH ELLIPSIS LOGIC
function renderPaginationControls() {
    const controlsContainer = document.getElementById('pagination-controls');
    controlsContainer.innerHTML = ''; 
    
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return; 

    let controlsHTML = '';
    const buttonBaseClass = "px-3 py-1 text-sm rounded-full border border-gray-700 hover:bg-gray-800 transition-colors duration-200 cursor-pointer";
    const disabledClass = "opacity-50 cursor-not-allowed";
    const activeClass = "bg-gray-500 text-white";
    const range = 2; 

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

    if (currentPage <= range + 1) {
        endPage = Math.min(totalPages, 2 * range + 1);
    }
    if (currentPage >= totalPages - range) {
        startPage = Math.max(1, totalPages - 2 * range);
    }

    if (startPage > 1) {
        controlsHTML += `<button onclick="changePage(1)" class="${buttonBaseClass}">1</button>`;
        if (startPage > 2) {
            controlsHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
    }

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

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            controlsHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
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
        
        // ******************************************************
        // ** NEW CODE TO SCROLL TO THE TOP OF THE BLOG SECTION **
        // ******************************************************
        const blogContainer = document.getElementById('blog-list-container');
        if (blogContainer) {
            blogContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}


// 4. Main function to slice the data and trigger rendering
function renderPage(pageNumber) {
    const startIndex = (pageNumber - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    
    const postsToDisplay = allPosts.slice(startIndex, endIndex);

    renderBlogPostsHTML(postsToDisplay); 
    renderPaginationControls();
}


// 5. Initialization Function
function initializePosts() {
    const csvFilePath = 'posts.csv'; 

    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                allPosts = results.data
                    .filter(post => post.title && post.title.trim() !== '')
                    .reverse(); 
                
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
