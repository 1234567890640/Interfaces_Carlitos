// Almacenamiento local para los vehículos y reservas
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [
    { id: '1', name: 'Admin', role: 'admin' }
];

// Elementos del DOM
const vehicleForm = document.getElementById('vehicleForm');
const vehicleList = document.getElementById('vehicleList');
const filterEstado = document.getElementById('filterEstado');
const btnBuscarDisponibles = document.getElementById('btnBuscarDisponibles');
const changeStateModal = new bootstrap.Modal(document.getElementById('changeStateModal'));
const changeStateForm = document.getElementById('changeStateForm');
const reservationForm = document.getElementById('reservationForm');
const reservationList = document.getElementById('reservationList');
const filterReservaEstado = document.getElementById('filterReservaEstado');
const reservationDetailModal = new bootstrap.Modal(document.getElementById('reservationDetailModal'));

// Función para guardar datos en localStorage
function saveData() {
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

// Función para agregar un nuevo vehículo
function addVehicle(vehicle) {
    vehicles.push(vehicle);
    saveData();
    renderVehicles();
    updateVehicleSelect();
}

// Función para actualizar el estado de un vehículo
function updateVehicleState(id, newState) {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
        vehicle.estado = newState;
        saveData();
        renderVehicles();
        updateVehicleSelect();
    }
}

// Función para renderizar la lista de vehículos
function renderVehicles(filteredVehicles = null) {
    const vehiclesToRender = filteredVehicles || vehicles;
    vehicleList.innerHTML = '';

    vehiclesToRender.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${vehicle.imagen || 'https://via.placeholder.com/50'}" 
                     alt="${vehicle.modelo}" 
                     class="img-thumbnail" 
                     style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${vehicle.modelo}</td>
            <td>${vehicle.matricula}</td>
            <td>${vehicle.anio}</td>
            <td>${vehicle.tipo}</td>
            <td>$${vehicle.precio}</td>
            <td>${vehicle.capacidad}</td>
            <td><span class="estado-${vehicle.estado.toLowerCase()}">${vehicle.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-warning btn-action" onclick="openChangeStateModal('${vehicle.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        vehicleList.appendChild(row);
    });
}

// Función para actualizar el select de vehículos en el formulario de reserva
function updateVehicleSelect() {
    const vehicleSelect = document.getElementById('vehiculo');
    vehicleSelect.innerHTML = '<option value="">Seleccione vehículo</option>';
    
    vehicles.filter(v => v.estado === 'Libre').forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.modelo} - ${vehicle.matricula}`;
        vehicleSelect.appendChild(option);
    });
}

// Función para crear una nueva reserva
function createReservation(reservation) {
    // Validar disponibilidad
    const isAvailable = checkVehicleAvailability(
        reservation.vehiculoId,
        new Date(reservation.fechaInicio),
        new Date(reservation.fechaFin)
    );

    if (!isAvailable) {
        alert('El vehículo no está disponible en las fechas seleccionadas');
        return;
    }

    // Validar plazo mínimo de 24 horas
    const now = new Date();
    const startDate = new Date(reservation.fechaInicio);
    const hoursDiff = (startDate - now) / (1000 * 60 * 60);

    if (hoursDiff < 24 && hoursDiff > 0) {
        alert('La reserva debe realizarse con al menos 24 horas de anticipación');
        return;
    }

    // Crear la reserva
    const newReservation = {
        ...reservation,
        id: Date.now().toString(),
        estado: 'activa',
        empleadoId: '1', // ID del empleado actual
        ajustes: []
    };

    reservations.push(newReservation);
    saveData();
    renderReservations();
    updateVehicleState(reservation.vehiculoId, 'Reservado');
}

// Función para verificar disponibilidad del vehículo
function checkVehicleAvailability(vehicleId, startDate, endDate) {
    return !reservations.some(reservation => {
        if (reservation.vehiculoId !== vehicleId || reservation.estado === 'cancelada') {
            return false;
        }

        const resStart = new Date(reservation.fechaInicio);
        const resEnd = new Date(reservation.fechaFin);

        return (startDate >= resStart && startDate < resEnd) ||
               (endDate > resStart && endDate <= resEnd) ||
               (startDate <= resStart && endDate >= resEnd);
    });
}

// Función para renderizar la lista de reservas
function renderReservations(filteredReservations = null) {
    const reservationsToRender = filteredReservations || reservations;
    reservationList.innerHTML = '';

    reservationsToRender.forEach(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
        const empleado = users.find(u => u.id === reservation.empleadoId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.clienteId}</td>
            <td>${vehicle ? vehicle.modelo : 'N/A'}</td>
            <td>${new Date(reservation.fechaInicio).toLocaleString()}</td>
            <td>${new Date(reservation.fechaFin).toLocaleString()}</td>
            <td><span class="estado-${reservation.estado}">${reservation.estado}</span></td>
            <td>${empleado ? empleado.name : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-info btn-action" onclick="showReservationDetail('${reservation.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
                ${reservation.estado === 'activa' ? `
                    <button class="btn btn-sm btn-warning btn-action" onclick="updateReservation('${reservation.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="cancelReservation('${reservation.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        reservationList.appendChild(row);
    });
}

// Función para mostrar el detalle de una reserva
function showReservationDetail(reservationId) {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
    const empleado = users.find(u => u.id === reservation.empleadoId);

    document.getElementById('reservationInfo').innerHTML = `
        <div class="mb-3">
            <strong>Cliente:</strong> ${reservation.clienteId}
        </div>
        <div class="mb-3">
            <strong>Vehículo:</strong> ${vehicle ? vehicle.modelo : 'N/A'}
        </div>
        <div class="mb-3">
            <strong>Fecha Inicio:</strong> ${new Date(reservation.fechaInicio).toLocaleString()}
        </div>
        <div class="mb-3">
            <strong>Fecha Fin:</strong> ${new Date(reservation.fechaFin).toLocaleString()}
        </div>
        <div class="mb-3">
            <strong>Estado:</strong> <span class="estado-${reservation.estado}">${reservation.estado}</span>
        </div>
        <div class="mb-3">
            <strong>Empleado:</strong> ${empleado ? empleado.name : 'N/A'}
        </div>
    `;

    document.getElementById('adjustmentHistory').innerHTML = reservation.ajustes.length > 0
        ? reservation.ajustes.map(ajuste => `
            <div class="mb-2">
                <small class="text-muted">${new Date(ajuste.fecha).toLocaleString()}</small>
                <div>${ajuste.descripcion}</div>
                <div class="text-primary">Monto: $${ajuste.monto}</div>
            </div>
        `).join('')
        : '<p class="text-muted">No hay ajustes registrados</p>';

    reservationDetailModal.show();
}

// Función para cancelar una reserva
function cancelReservation(reservationId) {
    if (!confirm('¿Está seguro de cancelar esta reserva?')) return;

    const reservation = reservations.find(r => r.id === reservationId);
    if (reservation) {
        reservation.estado = 'cancelada';
        updateVehicleState(reservation.vehiculoId, 'Libre');
        saveData();
        renderReservations();
    }
}

// Event Listeners
vehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const vehicle = {
        id: Date.now().toString(),
        modelo: document.getElementById('modelo').value,
        matricula: document.getElementById('matricula').value,
        anio: document.getElementById('anio').value,
        tipo: document.getElementById('tipo').value,
        precio: document.getElementById('precio').value,
        capacidad: document.getElementById('capacidad').value,
        estado: document.getElementById('estado').value,
        imagen: document.getElementById('imagen').files[0] 
            ? URL.createObjectURL(document.getElementById('imagen').files[0])
            : null
    };

    addVehicle(vehicle);
    vehicleForm.reset();
});

reservationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const reservation = {
        clienteId: document.getElementById('cliente').value,
        vehiculoId: document.getElementById('vehiculo').value,
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaFin: document.getElementById('fechaFin').value
    };

    createReservation(reservation);
    reservationForm.reset();
});

filterEstado.addEventListener('change', () => {
    const estado = filterEstado.value;
    if (estado === 'todos') {
        renderVehicles();
    } else {
        const filteredVehicles = vehicles.filter(v => v.estado === estado);
        renderVehicles(filteredVehicles);
    }
});

filterReservaEstado.addEventListener('change', () => {
    const estado = filterReservaEstado.value;
    if (estado === 'todos') {
        renderReservations();
    } else {
        const filteredReservations = reservations.filter(r => r.estado === estado);
        renderReservations(filteredReservations);
    }
});

btnBuscarDisponibles.addEventListener('click', () => {
    const availableVehicles = vehicles.filter(v => v.estado === 'Libre');
    renderVehicles(availableVehicles);
});

changeStateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const vehicleId = document.getElementById('vehicleId').value;
    const newState = document.getElementById('newEstado').value;
    
    updateVehicleState(vehicleId, newState);
    changeStateModal.hide();
    changeStateForm.reset();
});

// Inicialización
renderVehicles();
renderReservations();
updateVehicleSelect(); 