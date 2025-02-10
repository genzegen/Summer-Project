function toggleForms() {
    document.querySelector('.messages')?.remove();

    let loginForm = document.getElementById("loginForm");
    let registerForm = document.getElementById("registerForm");
    let toggleText = document.getElementById("toggleFormText");
    let toggleLink = document.getElementById("toggleFormLink");

    if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Register Here";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Login Here";
    }
}