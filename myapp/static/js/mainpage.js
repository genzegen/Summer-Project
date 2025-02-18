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

});
