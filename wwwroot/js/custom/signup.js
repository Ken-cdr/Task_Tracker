document.addEventListener("DOMContentLoaded", function () {
    // Password Fields
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    // Toggle Icons
    const togglePassword = document.getElementById('toggleRegisterPassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');

    // Password Strength Message
    const message = document.getElementById("passwordMessage");

    // Password Strength Regex
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    // Toggle Register Password Visibility
    if (togglePassword && password) {
        togglePassword.addEventListener('click', () => {
            const isHidden = password.type === 'password';
            password.type = isHidden ? 'text' : 'password';

            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
            togglePassword.classList.toggle('active');

            togglePassword.title = isHidden ? 'Hide Password' : 'Show Password';
        });
    }

    // Toggle Confirm Password Visibility
    if (toggleConfirm && confirmPassword) {
        toggleConfirm.addEventListener('click', () => {
            const isHidden = confirmPassword.type === 'password';
            confirmPassword.type = isHidden ? 'text' : 'password';

            toggleConfirm.classList.toggle('fa-eye');
            toggleConfirm.classList.toggle('fa-eye-slash');
            toggleConfirm.classList.toggle('active');

            toggleConfirm.title = isHidden ? 'Hide Password' : 'Show Password';
        });
    }

    // Password Strength Checker
    if (password && message) {
        password.addEventListener("input", function () {
            const value = password.value;

            if (regex.test(value)) {
                message.textContent = "Strong password ✓";
                message.style.color = "green";
            } else {
                message.textContent = "Password does not meet the requirements.";
                message.style.color = "red";
            }
        });
    }
});