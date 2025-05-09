// Almacenamiento local para pagos y reservas
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];

// Elementos del DOM
const paymentForm = document.getElementById('paymentForm');
const paymentList = document.getElementById('paymentList');
const filterStatus = document.getElementById('filterStatus');
const filterDate = document.getElementById('filterDate');
const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const paymentDetailModal = new bootstrap.Modal(document.getElementById('paymentDetailModal'));
const paymentAlerts = document.getElementById('paymentAlerts');

// Función para guardar datos en localStorage
function saveData() {
    localStorage.setItem('payments', JSON.stringify(payments));
}

// Función para actualizar el select de reservas
function updateReservationSelect() {
    const reservationSelect = document.getElementById('reservation');
    reservationSelect.innerHTML = '<option value="">Seleccione una reserva</option>';
    
    reservations.filter(r => r.estado === 'activa').forEach(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehiculoId);
        const cliente = getClienteInfo(reservation.clienteId);
        
        const option = document.createElement('option');
        option.value = reservation.id;
        option.textContent = `${cliente} - ${vehicle?.modelo || 'N/A'}`;
        option.dataset.amount = calculateTotalPrice(reservation);
        reservationSelect.appendChild(option);
    });
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

// Función para crear un nuevo pago
function createPayment(payment) {
    const reservation = reservations.find(r => r.id === payment.reservationId);
    if (!reservation) return;

    const newPayment = {
        ...payment,
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        estado: 'confirmado',
        montoTotal: calculateTotalPrice(reservation),
        ajustes: []
    };

    // Si hay un monto de ajuste, agregarlo al historial
    if (payment.adjustmentAmount) {
        newPayment.ajustes.push({
            fecha: new Date().toISOString(),
            descripcion: 'Reembolso por cancelación',
            monto: -Math.abs(payment.adjustmentAmount)
        });
    }

    payments.push(newPayment);
    saveData();
    renderPayments();
    checkPendingPayments();
}

// Función para renderizar la lista de pagos
function renderPayments(filteredPayments = null) {
    const paymentsToRender = filteredPayments || payments;
    paymentList.innerHTML = '';

    paymentsToRender.forEach(payment => {
        const reservation = reservations.find(r => r.id === payment.reservationId);
        const cliente = reservation ? getClienteInfo(reservation.clienteId) : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation ? `Reserva #${reservation.id}` : 'N/A'}</td>
            <td>${cliente}</td>
            <td>
                <i class="fas fa-${payment.metodo === 'efectivo' ? 'money-bill-wave' : 'credit-card'}"></i>
                ${payment.metodo}
            </td>
            <td>$${payment.montoTotal}</td>
            <td>${new Date(payment.fecha).toLocaleString()}</td>
            <td><span class="payment-status status-${payment.estado}">${payment.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-info btn-action" onclick="showPaymentDetail('${payment.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
                ${payment.estado === 'pendiente' ? `
                    <button class="btn btn-sm btn-success btn-action" onclick="confirmPayment('${payment.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </td>
        `;
        paymentList.appendChild(row);
    });
}

// Función para mostrar el detalle de un pago
function showPaymentDetail(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const reservation = reservations.find(r => r.id === payment.reservationId);
    const cliente = reservation ? getClienteInfo(reservation.clienteId) : 'N/A';

    document.getElementById('paymentInfo').innerHTML = `
        <div class="mb-3">
            <strong>Reserva:</strong> ${reservation ? `#${reservation.id}` : 'N/A'}
        </div>
        <div class="mb-3">
            <strong>Cliente:</strong> ${cliente}
        </div>
        <div class="mb-3">
            <strong>Método de Pago:</strong> 
            <i class="fas fa-${payment.metodo === 'efectivo' ? 'money-bill-wave' : 'credit-card'}"></i>
            ${payment.metodo}
        </div>
        <div class="mb-3">
            <strong>Monto Total:</strong> $${payment.montoTotal}
        </div>
        <div class="mb-3">
            <strong>Fecha:</strong> ${new Date(payment.fecha).toLocaleString()}
        </div>
        <div class="mb-3">
            <strong>Estado:</strong> <span class="payment-status status-${payment.estado}">${payment.estado}</span>
        </div>
    `;

    document.getElementById('adjustmentHistory').innerHTML = payment.ajustes.length > 0
        ? payment.ajustes.map(ajuste => `
            <div class="payment-timeline-item">
                <small class="text-muted">${new Date(ajuste.fecha).toLocaleString()}</small>
                <div>${ajuste.descripcion}</div>
                <div class="text-primary">Monto: $${ajuste.monto}</div>
            </div>
        `).join('')
        : '<p class="text-muted">No hay ajustes registrados</p>';

    paymentDetailModal.show();
}

// Función para confirmar un pago pendiente
function confirmPayment(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
        payment.estado = 'confirmado';
        saveData();
        renderPayments();
        checkPendingPayments();
    }
}

// Función para verificar pagos pendientes
function checkPendingPayments() {
    const now = new Date();
    const pendingPayments = payments.filter(payment => {
        if (payment.estado !== 'pendiente') return false;
        
        const paymentDate = new Date(payment.fecha);
        const hoursDiff = (now - paymentDate) / (1000 * 60 * 60);
        return hoursDiff >= 24;
    });

    paymentAlerts.innerHTML = pendingPayments.length > 0
        ? pendingPayments.map(payment => `
            <div class="payment-alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Hay ${pendingPayments.length} pago(s) pendiente(s) por más de 24 horas
            </div>
        `).join('')
        : '';
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

// Event Listeners
paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedMethod = document.querySelector('.payment-method-option.selected');
    if (!selectedMethod) {
        alert('Por favor seleccione un método de pago');
        return;
    }

    const payment = {
        reservationId: document.getElementById('reservation').value,
        metodo: selectedMethod.dataset.method,
        adjustmentAmount: document.getElementById('adjustmentAmount').value
    };

    createPayment(payment);
    paymentForm.reset();
    document.querySelectorAll('.payment-method-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById('adjustmentSection').style.display = 'none';
});

// Event Listeners para el selector de método de pago
document.querySelectorAll('.payment-method-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.payment-method-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
    });
});

// Event Listener para actualizar el monto total al seleccionar una reserva
document.getElementById('reservation').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    document.getElementById('totalAmount').textContent = 
        selectedOption.value ? `$${selectedOption.dataset.amount}` : '$0.00';
});

btnAplicarFiltros.addEventListener('click', () => {
    const status = filterStatus.value;
    const date = filterDate.value;

    let filteredPayments = payments;

    if (status !== 'todos') {
        filteredPayments = filteredPayments.filter(p => p.estado === status);
    }

    if (date) {
        const filterDate = new Date(date);
        filteredPayments = filteredPayments.filter(p => {
            const paymentDate = new Date(p.fecha);
            return paymentDate.toDateString() === filterDate.toDateString();
        });
    }

    renderPayments(filteredPayments);
});

// Inicialización
updateReservationSelect();
renderPayments();
checkPendingPayments();

// Verificar pagos pendientes cada minuto
setInterval(checkPendingPayments, 60000); 