document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const sidebarBtn = document.getElementById("sidebar-btn");
    const sidebarContent = document.querySelector(".sidebar-content");

    let isOpen = true;

    if (sidebarBtn) {
        sidebarBtn.addEventListener("click", function () {
            isOpen = !isOpen;
            if (isOpen) {
                sidebar.style.width = "20vw"; // Open sidebar
                sidebarBtn.textContent = "◀";  // Change button text
                sidebarContent.style.opacity = "1"; // Show sidebar content
            } else {
                sidebar.style.width = "2.5vw";  // Close sidebar
                sidebarBtn.textContent = "▶";  // Change button text
                sidebarContent.style.opacity = "0"; // Hide sidebar content
            }
        });
    } else {
        console.error("Sidebar button not found!");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".sidebar-content .button");
    const scrollContent = document.getElementById("scroll-content");
    
    function loadPage(url) {
        if (!url) {
            console.error("No URL provided.");
            return;
        }
        fetch(url)
            .then(response => response.text())
            .then(data => {
                if (scrollContent) {
                    scrollContent.innerHTML = data;
                    attachScreenshotModalEvents();
                    attachPostButtonEvents();
                } else {
                    console.error("scroll-content element not found.");
                }
            })
            .catch(error => console.error("Error loading page:", error));
    }

    // Check if homeUrl exists before using it
    if (typeof homeUrl !== "undefined") {
        loadPage(homeUrl);
    } else {
        console.error("homeUrl is not defined.");
    }

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const pageUrl = this.getAttribute("data-page");
            loadPage(pageUrl);
        });
    });

    // Popup Logic
    const newProjButton = document.getElementById("new-proj");
    const popup = document.getElementById("new-project-popup");
    const closePopupButton = document.getElementById("close-popup");

    newProjButton.addEventListener("click", function (event) {
        event.preventDefault();
        popup.style.display = "flex";
    });

    closePopupButton.addEventListener("click", function () {
        popup.style.display = "none"; 
    });

    // Close popup if clicked outside
    window.addEventListener("click", function (event) {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    });

    const createButton = document.getElementById("create-proj-btn");
    const projTitle = document.getElementById("project-title");

    createButton.addEventListener("click", function (event) {
        if(projTitle.value.trim().length === 0) {
            console.log("empty");
            event.preventDefault();
            projTitle.style.border = "1px solid red";
            projTitle.setAttribute("placeholder", "Your title cannot be empty!");
        } else {
            projTitle.style.border = "";
        }
    });

    window.addEventListener("load", function () {
        projTitle.value = "";
        projTitle.style.border = "";
        projTitle.setAttribute("placeholder", "Project Name");
    });

    // FOR SCREENSHOT
    function attachScreenshotModalEvents() {
        const modal = document.getElementById("screenshot-modal");
        const modalImg = document.getElementById("modal-image");
        const closeModal = document.querySelector(".close-modal");
    
        if (!modal || !modalImg || !closeModal) {
            console.error("Modal elements not found!");
            return;
        }
    
        // Remove existing event listeners (to prevent duplicates)
        document.querySelectorAll(".open-screenshot-btn").forEach(button => {
            button.removeEventListener("click", openScreenshotModal);
            button.addEventListener("click", openScreenshotModal);
        });
    
        function openScreenshotModal() {
            const roomDiv = this.closest(".screenshot-item");
            const imageUrl = roomDiv.querySelector("img").src;
            modalImg.src = imageUrl;
            modal.style.display = "flex";
        }
    
        closeModal.onclick = () => modal.style.display = "none";
    
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };

        document.querySelectorAll(".download-screenshot-btn").forEach(button => {
            button.removeEventListener("click", downloadScreenshot);
            button.addEventListener("click", downloadScreenshot);
        });
    
        function downloadScreenshot() {
            const roomDiv = this.closest(".screenshot-item");
            const imageUrl = roomDiv.querySelector("img").src;
            const fileName = roomDiv.dataset.title.replace(/\s+/g, "_") + ".jpg"; // Set filename
    
            const link = document.createElement("a");
            link.href = imageUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    }

    function attachPostButtonEvents() {
        document.querySelectorAll('.post-button').forEach(button => {
            button.addEventListener('click', async function () {
                const roomId = this.getAttribute('data-room-id');
                const description = prompt('Enter a description for your post:');
                
                try {
                    const response = await fetch(`/post-project/${roomId}/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCSRFToken(), // Use a function to get the token
                        },
                        body: JSON.stringify({ description: description }),
                    });
    
                    const result = await response.json();
                    if (result.status === 'success') {
                        alert('Project posted successfully!');
                    } else {
                        alert('Failed to post project: ' + result.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to post project.');
                }
            });
        });
    }

    function getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('csrftoken=')) {
                    cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
});
