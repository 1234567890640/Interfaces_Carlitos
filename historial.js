// Cargar datos del localStorage
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
let events = JSON.parse(localStorage.getItem('events')) || [];

// Referencias a elementos del DOM
const eventForm = document.getElementById('addEventForm');
const eventVehicleSelect = document.getElementById('eventVehicle');
const eventList = document.getElementById('eventList');
const filterVehicle = document.getElementById('filterVehicle');
const filterEventType = document.getElementById('filterEventType');
const filterDate = document.getElementById('filterDate');
const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const eventSummary = document.getElementById('eventSummary');

// Cargar vehículos en los selectores
function loadVehicles() {
    const vehicleOptions = vehicles.map(vehicle => 
        `<option value="${vehicle.id}">${vehicle.modelo} - ${vehicle.matricula}</option>`
    ).join('');
    
    eventVehicleSelect.innerHTML = '<option value="">Seleccione vehículo</option>' + vehicleOptions;
    filterVehicle.innerHTML = '<option value="todos">Todos los vehículos</option>' + vehicleOptions;
}

// Guardar evento
function saveEvent(event) {
    events.push(event);
    localStorage.setItem('events', JSON.stringify(events));
    renderEvents();
    updateEventSummary();
}

// Renderizar eventos
function renderEvents(filteredEvents = events) {
    eventList.innerHTML = filteredEvents.map(event => {
        const vehicle = vehicles.find(v => v.id === event.vehicleId);
        const eventTypeClass = `type-${event.type}`;
        
        return `
            <div class="event-item">
                <span class="event-type ${eventTypeClass}">${event.type}</span>
                <h6>${vehicle ? vehicle.modelo + ' - ' + vehicle.matricula : 'Vehículo no encontrado'}</h6>
                <p class="mb-1">${event.description}</p>
                <small class="text-muted">
                    <i class="fas fa-calendar me-1"></i>${new Date(event.date).toLocaleString()}
                    <i class="fas fa-user me-2 ms-2"></i>${event.responsible}
                </small>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="showEventDetails('${event.id}')">
                    <i class="fas fa-info-circle me-1"></i>Ver Detalles
                </button>
            </div>
        `;
    }).join('');
}

// Actualizar resumen de eventos
function updateEventSummary() {
    const summary = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
    }, {});

    eventSummary.innerHTML = Object.entries(summary).map(([type, count]) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="event-type type-${type}">${type}</span>
            <span class="badge bg-primary">${count}</span>
        </div>
    `).join('');
}

// Mostrar detalles del evento
function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    const vehicle = vehicles.find(v => v.id === event.vehicleId);
    
    if (!event) return;

    const eventInfo = document.getElementById('eventInfo');
    const eventChanges = document.getElementById('eventChanges');

    eventInfo.innerHTML = `
        <p><strong>Vehículo:</strong> ${vehicle ? vehicle.modelo + ' - ' + vehicle.matricula : 'No encontrado'}</p>
        <p><strong>Tipo:</strong> ${event.type}</p>
        <p><strong>Fecha:</strong> ${new Date(event.date).toLocaleString()}</p>
        <p><strong>Responsable:</strong> ${event.responsible}</p>
        <p><strong>Descripción:</strong> ${event.description}</p>
    `;

    eventChanges.innerHTML = `
        <div class="adjustment-history">
            <p><strong>Cambios Realizados:</strong></p>
            <p>${event.changes}</p>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
    modal.show();
}

// Aplicar filtros
function applyFilters() {
    let filteredEvents = [...events];
    
    const vehicleFilter = filterVehicle.value;
    const typeFilter = filterEventType.value;
    const dateFilter = filterDate.value;

    if (vehicleFilter !== 'todos') {
        filteredEvents = filteredEvents.filter(event => event.vehicleId === vehicleFilter);
    }

    if (typeFilter !== 'todos') {
        filteredEvents = filteredEvents.filter(event => event.type === typeFilter);
    }

    if (dateFilter) {
        const filterDateObj = new Date(dateFilter);
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === filterDateObj.toDateString();
        });
    }

    renderEvents(filteredEvents);
}

// Event Listeners
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newEvent = {
        id: Date.now().toString(),
        vehicleId: eventVehicleSelect.value,
        type: document.getElementById('eventType').value,
        date: document.getElementById('eventDate').value,
        description: document.getElementById('eventDescription').value,
        changes: document.getElementById('eventChanges').value,
        responsible: document.getElementById('eventResponsible').value
    };

    saveEvent(newEvent);
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
    modal.hide();
    eventForm.reset();
});

btnAplicarFiltros.addEventListener('click', applyFilters);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    renderEvents();
    updateEventSummary();
}); 