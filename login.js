// Usuarios de ejemplo (en un sistema real, esto vendría de una base de datos)
const users = [
    {
        username: 'admin',
        password: 'admin',
        role: 'admin',
        name: 'Administrador'
    },
    {
        username: 'usuario',
        password: '123',
        role: 'user',
        name: 'Usuario Normal'
    }
];

// Referencias a elementos del DOM
const loginForm = document.getElementById('loginForm');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');

// Función para mostrar errores
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'block';
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

// Función para manejar el login
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Buscar usuario
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Crear sesión
        const session = {
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        // Guardar sesión
        if (rememberMe) {
            localStorage.setItem('session', JSON.stringify(session));
        } else {
            sessionStorage.setItem('session', JSON.stringify(session));
        }

        // Redirigir al dashboard
        window.location.href = 'index.html';
    } else {
        showError('Usuario o contraseña incorrectos');
    }
}

// Función para verificar si ya hay una sesión activa
function checkSession() {
    const session = JSON.parse(localStorage.getItem('session')) || JSON.parse(sessionStorage.getItem('session'));
    if (session) {
        window.location.href = 'index.html';
    }
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', checkSession); 