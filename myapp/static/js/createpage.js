// for side bar drop down
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
                sidebar.style.width = "3vw";  // Close sidebar
                sidebarBtn.textContent = "▶";  // Change button text
                sidebarContent.style.opacity = "0"; // Hide sidebar content
            }
        });
    } else {
        console.error("Sidebar button not found!");
    }

    const helpBtn = document.getElementById("help-btn");
    const helpContainer = document.querySelector(".help-container");
    const closeHelp = document.getElementById("close-help");

    helpBtn.addEventListener("click", function () {
        helpContainer.style.display = "flex";
    });
    closeHelp.addEventListener("click", function() {
        helpContainer.style.display = "none";
    })

    const saveBtn = document.getElementById("save-btn");
    const closeBtn = document.getElementById("close-save");
    const savePopup = document.getElementById("save-popup");

    saveBtn.addEventListener("click", function() {
        savePopup.style.display = "flex";
    });
    closeBtn.addEventListener("click", function() {
        savePopup.style.display = "none";        
    });
});

// for side bar button functionality
document.addEventListener("DOMContentLoaded", function () {
    // Buttons & Dropdowns
    const layoutBtn = document.getElementById("layout-btn");
    const layoutDropdown = document.getElementById("layout-dropdown");

    const importBtn = document.getElementById("import-btn");
    const furnitureDropdown = document.getElementById("furniture-dropdown");

    const gridBtn = document.getElementById("grid-btn");
    const gridDropdown = document.getElementById("grid-dropdown");

    const colorBtn = document.getElementById("color-btn");
    const colorDropdown = document.getElementById("color-dropdown");

    // Dropdown Toggle Function
    function toggleDropdown(button, dropdown) {
        const isActive = dropdown.classList.contains("show");

        // Close all dropdowns before opening a new one
        closeAllDropdowns();

        if (!isActive) {
            dropdown.classList.add("show");
            button.classList.add("active");
        }
    }

    function closeAllDropdowns() {
        layoutDropdown.classList.remove("show");
        layoutBtn.classList.remove("active");

        furnitureDropdown.classList.remove("show");
        importBtn.classList.remove("active");

        gridDropdown.classList.remove("show");
        gridBtn.classList.remove("active");

        colorDropdown.classList.remove("show");
        colorBtn.classList.remove("active");
    }

    // Button Click Events
    layoutBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleDropdown(layoutBtn, layoutDropdown);
    });

    importBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleDropdown(importBtn, furnitureDropdown);
    });

    gridBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleDropdown(gridBtn, gridDropdown);
    });

    colorBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleDropdown(colorBtn, colorDropdown);
    });

    // Close dropdowns when clicking outside
    window.addEventListener("click", function (event) {
        if (
            !layoutBtn.contains(event.target) &&
            !layoutDropdown.contains(event.target) &&
            !importBtn.contains(event.target) &&
            !furnitureDropdown.contains(event.target) &&
            !gridBtn.contains(event.target) &&
            !gridDropdown.contains(event.target) &&
            !colorBtn.contains(event.target) &&
            !colorDropdown.contains(event.target)
        ) {
            closeAllDropdowns();
        }
    });
});


