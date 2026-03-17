import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Función para mostrar notificaciones toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 100);

    // Animar salida y remover
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Variables del calendario de visitas
let currentMonthVisits = new Date().getMonth();
let currentYearVisits = new Date().getFullYear();

export {
    addVisit,
    deleteVisit,
    renderVisits,
    renderVisitsCalendar,
    openVisitConfirmModal,
    closeVisitModal,
    confirmVisit,
    setupVisitsCalendar
};

// Función para agregar una nueva visita
async function addVisit(contracts, currentContractId, db) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    try {
        const visitId = Date.now().toString();
        const newVisit = {
            id: visitId,
            date: now.toISOString().split('T')[0],
            time: currentTime,
            createdAt: now.toISOString(),
            confirmedAt: now.toISOString(),
            status: 'confirmed',
            contractId: currentContractId,
            contractName: contracts.find(c => c.id === currentContractId)?.name || 'Contrato sin nombre'
        };

        // Actualizar el contrato en Firestore
        const contractRef = doc(db, 'contracts', currentContractId);
        const contract = contracts.find(c => c.id === currentContractId);
        
        if (!contract.visits) contract.visits = [];
        contract.visits.push(newVisit);

        await updateDoc(contractRef, {
            visits: contract.visits
        });

        renderVisits(contracts, currentContractId, db);
        showToast('Visita registrada con éxito');
    } catch (error) {
        console.error('Error al registrar la visita:', error);
        showToast('Error al registrar la visita', 'error');
    }
}

// Función para renderizar el calendario de visitas
function renderVisitsCalendar(contracts, currentContractId, db) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Actualizar título del calendario
    document.getElementById('calendar-month-year-visits').textContent = 
        `${monthNames[currentMonthVisits]} ${currentYearVisits}`;

    const calendarGrid = document.getElementById('visits-calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';

    // Obtener el primer día del mes
    const firstDay = new Date(currentYearVisits, currentMonthVisits, 1);
    const startingDay = firstDay.getDay();

    // Obtener el último día del mes
    const lastDay = new Date(currentYearVisits, currentMonthVisits + 1, 0);
    const totalDays = lastDay.getDate();

    // Crear los días del calendario
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // Verificar si hay visitas en este día
        const dateStr = `${currentYearVisits}-${String(currentMonthVisits + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasVisit = checkDateHasVisits(dateStr, contracts, currentContractId);
        if (hasVisit) {
            dayElement.classList.add('has-visit');
        }

        // Marcar el día actual
        const today = new Date();
        if (day === today.getDate() && 
            currentMonthVisits === today.getMonth() && 
            currentYearVisits === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Agregar evento click para programar visita
        dayElement.addEventListener('click', () => {
            const selectedDate = `${currentYearVisits}-${String(currentMonthVisits + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            openVisitConfirmModal(selectedDate);
        });

        calendarGrid.appendChild(dayElement);
    }

    // Renderizar lista de visitas del mes
    renderVisitsList(contracts, currentContractId);
}

// Funciones del calendario de visitas
function renderVisits(contracts, currentContractId, db) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Actualizar título del calendario
    document.getElementById('calendar-month-year-visits').textContent = 
        `${monthNames[currentMonthVisits]} ${currentYearVisits}`;

    const calendarGrid = document.getElementById('visits-calendar-grid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';

    // Obtener el primer día del mes
    const firstDay = new Date(currentYearVisits, currentMonthVisits, 1);
    const startingDay = firstDay.getDay();

    // Obtener el último día del mes
    const lastDay = new Date(currentYearVisits, currentMonthVisits + 1, 0);
    const totalDays = lastDay.getDate();

    // Crear los días del calendario
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // Verificar si hay visitas en este día
        const dateStr = `${currentYearVisits}-${String(currentMonthVisits + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasVisit = checkDateHasVisits(dateStr, contracts, currentContractId);
        if (hasVisit) {
            dayElement.classList.add('has-visit');
        }

        // Marcar el día actual
        const today = new Date();
        if (day === today.getDate() && 
            currentMonthVisits === today.getMonth() && 
            currentYearVisits === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Agregar evento click para programar visita
        dayElement.addEventListener('click', () => {
            const selectedDate = `${currentYearVisits}-${String(currentMonthVisits + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            openVisitConfirmModal(selectedDate);
        });

        calendarGrid.appendChild(dayElement);
    }

    // Renderizar lista de visitas del mes
    renderVisitsList(contracts, currentContractId);
}

function checkDateHasVisits(dateStr, contracts, currentContractId) {
    const contract = contracts.find(c => c.id === currentContractId);
    if (!contract || !contract.visits) return false;
    
    return contract.visits.some(visit => visit.date === dateStr);
}

function renderVisitsList(contracts, currentContractId) {
    const visitsList = document.getElementById('visits-list');
    if (!visitsList) return;

    visitsList.innerHTML = '';

    const contract = contracts.find(c => c.id === currentContractId);
    if (!contract || !contract.visits) return;

    // Filtrar visitas del mes actual
    const visitsThisMonth = contract.visits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate.getMonth() === currentMonthVisits && 
               visitDate.getFullYear() === currentYearVisits;
    });

    visitsThisMonth.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

    

    // Renderizar visitas confirmadas
    renderConfirmedVisitsList(contract);
}

function renderConfirmedVisitsList(contract) {
    const confirmedVisitsList = document.getElementById('confirmed-visits-list');
    if (!confirmedVisitsList) return;

    confirmedVisitsList.innerHTML = '';

    if (!contract || !contract.visits) {
        confirmedVisitsList.innerHTML = `
            <div class="empty-state">
                <h3>No hay visitas confirmadas</h3>
                <p>Las visitas confirmadas aparecerán aquí</p>
            </div>
        `;
        return;
    }

    // Filtrar visitas confirmadas
    const confirmedVisits = contract.visits
        .filter(visit => visit.status === 'confirmed')
        .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt));

    if (confirmedVisits.length === 0) {
        confirmedVisitsList.innerHTML = `
            <div class="empty-state">
                <h3>No hay visitas confirmadas</h3>
                <p>Las visitas confirmadas aparecerán aquí</p>
            </div>
        `;
        return;
    }

    confirmedVisits.forEach(visit => {
        const visitElement = document.createElement('div');
        visitElement.className = 'confirmed-visit-item';
        visitElement.innerHTML = `
            <div class="confirmed-visit-info">
                <div class="confirmed-visit-datetime">${formatDate(visit.date)} - ${visit.time}</div>
                <div class="confirmed-visit-details">
                    Confirmada el ${new Date(visit.confirmedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
            <span class="confirmed-visit-status">Confirmada</span>
        `;
        confirmedVisitsList.appendChild(visitElement);
    });
}

function openVisitConfirmModal(date) {
    const modal = document.getElementById('modal-visit-confirm');
    const visitDateText = document.getElementById('visit-date-text');
    
    // Formatear la fecha para mostrarla en español
    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    visitDateText.textContent = formattedDate;
    modal.dataset.selectedDate = date;
    modal.classList.remove('hidden');
}

function closeVisitModal() {
    document.getElementById('modal-visit-confirm').classList.add('hidden');
    document.getElementById('form-visit').reset();
}

async function confirmVisit(contracts, currentContractId, db) {
    const modal = document.getElementById('modal-visit-confirm');
    const visitDate = modal.dataset.selectedDate;
    const now = new Date();
    const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    try {
        const visitId = Date.now().toString();
        const newVisit = {
            id: visitId,
            date: visitDate,
            time: currentTime,
            createdAt: now.toISOString(),
            confirmedAt: now.toISOString(),
            status: 'confirmed',
            contractId: currentContractId,
            contractName: contracts.find(c => c.id === currentContractId)?.name || 'Contrato sin nombre'
        };

        // Actualizar el contrato en Firestore
        const contractRef = doc(db, 'contracts', currentContractId);
        const contract = contracts.find(c => c.id === currentContractId);
        
        if (!contract.visits) contract.visits = [];
        contract.visits.push(newVisit);

        await updateDoc(contractRef, {
            visits: contract.visits
        });

        // Actualizar la UI
        renderVisitsCalendar(contracts, currentContractId, db);
        renderConfirmedVisitsList(contract);
        closeVisitModal();
        showToast('Visita programada y confirmada con éxito');
    } catch (error) {
        
    }
}

async function deleteVisit(visitId, contracts, currentContractId, db) {
    if (!confirm('¿Está seguro de eliminar esta visita?')) return;

    try {
        const contractRef = doc(db, 'contracts', currentContractId);
        const contract = contracts.find(c => c.id === currentContractId);
        
        contract.visits = contract.visits.filter(v => v.id !== visitId);

        await updateDoc(contractRef, {
            visits: contract.visits
        });

        renderVisitsCalendar(contracts, currentContractId, db);
        renderConfirmedVisitsList(contract);
        showToast('Visita eliminada con éxito');
    } catch (error) {
        console.error('Error al eliminar la visita:', error);
        showToast('Error al eliminar la visita', 'error');
    }
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function setupVisitsCalendar(contracts, currentContractId, db) {
    // Setup visit calendar navigation
    document.getElementById('btn-prev-month-visits')?.addEventListener('click', () => {
        currentMonthVisits--;
        if (currentMonthVisits < 0) {
            currentMonthVisits = 11;
            currentYearVisits--;
        }
        renderVisitsCalendar(contracts, currentContractId, db);
    });

    document.getElementById('btn-next-month-visits')?.addEventListener('click', () => {
        currentMonthVisits++;
        if (currentMonthVisits > 11) {
            currentMonthVisits = 0;
            currentYearVisits++;
        }
        renderVisitsCalendar(contracts, currentContractId, db);
    });

    // Setup visit confirmation handlers
    const btnCancelVisit = document.getElementById('btn-cancel-visit');
    const btnCloseVisitModal = document.getElementById('btn-close-visit-modal');
    const btnConfirmVisit = document.getElementById('btn-confirm-visit');

    if (btnConfirmVisit) {
        btnConfirmVisit.onclick = function() {
            confirmVisit(contracts, currentContractId, db);
        };
    }
    if (btnCancelVisit) {
        btnCancelVisit.onclick = closeVisitModal;
    }
    if (btnCloseVisitModal) {
        btnCloseVisitModal.onclick = closeVisitModal;
    }
}