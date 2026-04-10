/* ── MANEJO DE FORMULARIOS LOGIN/REGISTRO ── */
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const btnToRegister = document.getElementById('btn-to-register');
const btnToLogin = document.getElementById('btn-to-login');

if (btnToRegister && btnToLogin) {
    btnToRegister.addEventListener('click', () => {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    btnToLogin.addEventListener('click', () => {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });
}