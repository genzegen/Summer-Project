document.addEventListener('DOMContentLoaded', function () {
    // profile popup
    const profileButton = document.getElementById("profile-img");
    const profilePopup = document.getElementById("profile");
    const closeProfileButton = document.getElementById("close-profile");

    profileButton.addEventListener("click", function (event) {
        event.preventDefault();
        profilePopup.style.display = "flex";
    });

    closeProfileButton.addEventListener("click", function () {
        profilePopup.style.display = "none"; 
    });

    // Close popup if clicked outside
    window.addEventListener("click", function (event) {
        if (event.target === profilePopup) {
            popup.style.display = "none";
        }
    });
})