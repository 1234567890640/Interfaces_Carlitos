// Utilidades de autenticación
const auth = {
    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!(localStorage.getItem('session') || sessionStorage.getItem('session'));
    },

    // Obtener la sesión actual
    getSession() {
        return JSON.parse(localStorage.getItem('session')) || JSON.parse(sessionStorage.getItem('session'));
    },

    // Verificar si el usuario es administrador
    isAdmin() {
        const session = this.getSession();
        return session && session.role === 'admin';
    },

    // Cerrar sesión
    logout() {
        localStorage.removeItem('session');
        sessionStorage.removeItem('session');
        window.location.href = 'login.html';
    },

    // Proteger rutas que requieren autenticación
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Proteger rutas que requieren rol de administrador
    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};

// Agregar botón de perfil a la barra de navegación
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario está autenticado
    if (auth.isAuthenticated()) {
        const session = auth.getSession();
        
        // Crear el botón de perfil
        const profileButton = document.createElement('div');
        profileButton.className = 'ms-auto d-flex align-items-center';
        profileButton.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center" 
                        type="button" 
                        id="profileDropdown" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false">
                    <div class="profile-circle me-2">
                        <i class="fas fa-user"></i>
                    </div>
                    <span>${session.name}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                    <li>
                        <a class="dropdown-item" href="#" onclick="showProfileModal()">
                            <i class="fas fa-user-circle me-2"></i>Mi Perfil
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" onclick="showChangePasswordModal()">
                            <i class="fas fa-key me-2"></i>Cambiar Contraseña
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="auth.logout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
        `;

        // Agregar estilos para el botón de perfil
        const style = document.createElement('style');
        style.textContent = `
            .profile-circle {
                width: 32px;
                height: 32px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .profile-circle i {
                color: white;
            }
            .dropdown-menu {
                border: none;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .dropdown-item {
                padding: 0.5rem 1rem;
            }
            .dropdown-item:hover {
                background-color: #f8f9fa;
            }
            .dropdown-item.text-danger:hover {
                background-color: #dc3545;
                color: white !important;
            }
        `;
        document.head.appendChild(style);

        // Buscar el navbar y agregar el botón de perfil
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.appendChild(profileButton);
        }
    }
});

// Función para mostrar el modal de perfil
function showProfileModal() {
    const session = auth.getSession();
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    document.getElementById('profileName').textContent = session.name;
    document.getElementById('profileUsername').textContent = session.username;
    document.getElementById('profileRole').textContent = session.role === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('profileLoginTime').textContent = new Date(session.loginTime).toLocaleString();
    modal.show();
}

// Función para mostrar el modal de cambio de contraseña
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
} 