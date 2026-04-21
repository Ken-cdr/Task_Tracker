document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById('loginPassword');
    const togglePassword = document.getElementById('toggleLoginPassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isHidden = passwordInput.type === 'password';

            // Toggle password visibility
            passwordInput.type = isHidden ? 'text' : 'password';

            // Toggle Font Awesome icons
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');

            // Toggle active state
            togglePassword.classList.toggle('active');

            // Tooltip
            togglePassword.title = isHidden ? 'Hide Password' : 'Show Password';
        });
    }
});