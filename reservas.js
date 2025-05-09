// Almacenamiento local para las reservas
let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];

// Elementos del DOM
const reservationForm = document.getElementById('reservationForm');
const reservationList = document.getElementById('reservationList');
const filterEstado = document.getElementById('filterEstado');
const filterFecha = document.getElementById('filterFecha');
const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const reservationDetailModal = new bootstrap.Modal(document.getElementById('reservationDetailModal'));

// Función para guardar datos en localStorage
function saveData() {
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

// Función para actualizar el select de vehículos
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

// Función para renderizar la lista de reservas
function renderReservations(filteredReservations = null) {
    const reservationsToRender = filteredReservations || reservations;
    reservationList.innerHTML = '';

    reservationsToRender.forEach(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
        const cliente = getClienteInfo(reservation.clienteId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente}</td>
            <td>${vehicle ? vehicle.modelo : 'N/A'}</td>
            <td>${new Date(reservation.fechaInicio).toLocaleString()}</td>
            <td>${new Date(reservation.fechaFin).toLocaleString()}</td>
            <td><span class="status-badge status-${reservation.estado}">${reservation.estado}</span></td>
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

// Función para obtener información del cliente
function getClienteInfo(clienteId) {
    const clientes = {
        '1': 'Juan Pérez',
        '2': 'María García',
        '3': 'Carlos López'
    };
    return clientes[clienteId] || 'Cliente Desconocido';
}

// Función para mostrar el detalle de una reserva
function showReservationDetail(reservationId) {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
    const cliente = getClienteInfo(reservation.clienteId);

    // Actualizar imagen y detalles del vehículo
    document.getElementById('vehicleImage').src = vehicle?.imagen || 'https://via.placeholder.com/600x400';
    document.getElementById('vehicleModel').textContent = vehicle?.modelo || 'N/A';
    document.getElementById('vehicleDetails').textContent = 
        `${vehicle?.tipo || ''} - ${vehicle?.matricula || ''} - ${vehicle?.anio || ''}`;

    // Actualizar información de la reserva
    document.getElementById('reservationInfo').innerHTML = `
        <div class="mb-3">
            <strong>Cliente:</strong> ${cliente}
        </div>
        <div class="mb-3">
            <strong>Fecha Inicio:</strong> ${new Date(reservation.fechaInicio).toLocaleString()}
        </div>
        <div class="mb-3">
            <strong>Fecha Fin:</strong> ${new Date(reservation.fechaFin).toLocaleString()}
        </div>
        <div class="mb-3">
            <strong>Estado:</strong> <span class="status-badge status-${reservation.estado}">${reservation.estado}</span>
        </div>
        <div class="mb-3">
            <strong>Precio Total:</strong> $${calculateTotalPrice(reservation)}
        </div>
    `;

    // Actualizar historial de ajustes
    document.getElementById('adjustmentHistory').innerHTML = reservation.ajustes.length > 0
        ? reservation.ajustes.map(ajuste => `
            <div class="timeline-item">
                <small class="text-muted">${new Date(ajuste.fecha).toLocaleString()}</small>
                <div>${ajuste.descripcion}</div>
                <div class="text-primary">Monto: $${ajuste.monto}</div>
            </div>
        `).join('')
        : '<p class="text-muted">No hay ajustes registrados</p>';

    reservationDetailModal.show();
}

// Función para calcular el precio total
function calculateTotalPrice(reservation) {
    const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
    if (!vehicle) return 0;

    const startDate = new Date(reservation.fechaInicio);
    const endDate = new Date(reservation.fechaFin);
    const hours = (endDate - startDate) / (1000 * 60 * 60);
    
    let total = vehicle.precio * hours;
    
    // Aplicar ajustes
    reservation.ajustes.forEach(ajuste => {
        total += ajuste.monto;
    });

    return total.toFixed(2);
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

// Función para actualizar el estado del vehículo
function updateVehicleState(vehicleId, newState) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        vehicle.estado = newState;
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        updateVehicleSelect();
    }
}

// Event Listeners
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

btnAplicarFiltros.addEventListener('click', () => {
    const estado = filterEstado.value;
    const fecha = filterFecha.value;

    let filteredReservations = reservations;

    if (estado !== 'todos') {
        filteredReservations = filteredReservations.filter(r => r.estado === estado);
    }

    if (fecha) {
        const filterDate = new Date(fecha);
        filteredReservations = filteredReservations.filter(r => {
            const reservationDate = new Date(r.fechaInicio);
            return reservationDate.toDateString() === filterDate.toDateString();
        });
    }

    renderReservations(filteredReservations);
});

// Inicialización
updateVehicleSelect();
renderReservations(); 