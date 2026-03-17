// Firebase Configuración
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyBqgJcGVg1L8tEcNpzGlUWt0txMgjYlvBM",
	authDomain: "integraseo-a2251.firebaseapp.com",
	projectId: "integraseo-a2251",
	storageBucket: "integraseo-a2251.firebaseapp.com",
	messagingSenderId: "641850273091",
	appId: "1:641850273091:web:f4b84be073bda16c7213f6",
	measurementId: "G-0R5MCH0RRY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos DOM
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthYear = document.getElementById('calendar-month-year');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const weekdaysContainer = document.getElementById('calendar-weekdays');
const modalReminder = document.getElementById('modal-reminder');
const btnCloseReminderModal = document.getElementById('btn-close-reminder-modal');
const btnCancelReminder = document.getElementById('btn-cancel-reminder');
const formReminder = document.getElementById('form-reminder');
// Referencia al navbar (para ocultarlo cuando se abran modales)
const navbar = document.querySelector('.bottom-nav');
// Select de contratos en el modal
const selectReminderContract = document.getElementById('reminder-contract');

let currentDate = new Date();

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function renderWeekdays() {
	weekdaysContainer.innerHTML = '';
	WEEKDAYS.forEach(day => {
		const div = document.createElement('div');
		div.textContent = day;
		weekdaysContainer.appendChild(div);
	});
}

function renderCalendar(date) {
	calendarGrid.innerHTML = '';
	const year = date.getFullYear();
	const month = date.getMonth();
	calendarMonthYear.textContent = `${date.toLocaleString('es-ES', { month: 'long' })} ${year}`;

	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startDay = firstDay.getDay();
	const totalDays = lastDay.getDate();

	// Días del mes anterior
	for (let i = 0; i < startDay; i++) {
		const emptyCell = document.createElement('div');
		emptyCell.className = 'calendar-day other-month';
		calendarGrid.appendChild(emptyCell);
	}

	// Días del mes actual
	for (let d = 1; d <= totalDays; d++) {
		const dayCell = document.createElement('div');
		dayCell.className = 'calendar-day';
		dayCell.textContent = d;
		const cellDate = new Date(year, month, d);
		if (isToday(cellDate)) {
			dayCell.classList.add('today');
		}
		dayCell.addEventListener('click', () => openReminderModal(cellDate));
		calendarGrid.appendChild(dayCell);
	}
}

function isToday(date) {
	const today = new Date();
	return date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear();
}

function openReminderModal(date) {
	// Intentamos abrir el modal de confirmación de visita si existe.
	const modalVisitConfirm = document.getElementById('modal-visit-confirm');
	const visitDateText = document.getElementById('visit-date-text');
	const remDateInput = document.getElementById('reminder-date');

	// Formatear la fecha para mostrarla en español
	const formattedDate = date.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	if (modalVisitConfirm && visitDateText) {
		visitDateText.textContent = formattedDate;
		modalVisitConfirm.classList.remove('hidden');
		if (navbar) navbar.classList.add('navbar-hidden');
		// Guardar la fecha seleccionada como atributo del modal para usarla después
		modalVisitConfirm.dataset.selectedDate = date.toISOString().slice(0, 10);
	} else {
		// Si no existe el modal de visita (falla por elementos faltantes en el HTML),
		// hacer un fallback abriendo el modal de creación de recordatorio y
		// prefijando la fecha seleccionada en el input de fecha si existe.
		console.warn('modal-visit-confirm o visit-date-text no encontrados — usando fallback a modal de recordatorio');
		if (remDateInput) {
			remDateInput.value = date.toISOString().slice(0, 10);
		}
		if (modalReminder) {
			modalReminder.classList.remove('hidden');
		}
		if (navbar) navbar.classList.add('navbar-hidden');
	}
}

function closeReminderModal() {
	modalReminder.classList.add('hidden');
		if (navbar) navbar.classList.remove('navbar-hidden');
}

btnPrevMonth.addEventListener('click', () => {
	currentDate.setMonth(currentDate.getMonth() - 1);
	renderCalendar(currentDate);
});
btnNextMonth.addEventListener('click', () => {
	currentDate.setMonth(currentDate.getMonth() + 1);
	renderCalendar(currentDate);
});
btnCloseReminderModal.addEventListener('click', closeReminderModal);
btnCancelReminder.addEventListener('click', closeReminderModal);

formReminder.addEventListener('submit', async (e) => {
	e.preventDefault();
	const title = document.getElementById('reminder-title').value;
	const date = document.getElementById('reminder-date').value;
	const time = document.getElementById('reminder-time').value;
	const description = document.getElementById('reminder-description').value;
	const contractId = selectReminderContract ? selectReminderContract.value : '';
	const contractName = (selectReminderContract && selectReminderContract.selectedOptions.length > 0)
		? selectReminderContract.selectedOptions[0].textContent : '';
	try {
		await addDoc(collection(db, 'recordatorios'), {
			title,
			date,
			time,
			description,
			contractId: contractId || null,
			contractName: contractName || null,
			createdAt: Timestamp.now()
		});
		closeReminderModal();
	} catch (err) {
		alert('Error al guardar el recordatorio');
	}
});

// Event listeners para el modal de confirmación de visita (protegidos si los elementos faltan)
const modalVisitConfirm = document.getElementById('modal-visit-confirm');
const btnCloseVisitModal = document.getElementById('btn-close-visit-modal');
const btnCancelVisit = document.getElementById('btn-cancel-visit');
const btnConfirmVisit = document.getElementById('btn-confirm-visit');

function closeVisitModal() {
	if (modalVisitConfirm) modalVisitConfirm.classList.add('hidden');
	if (navbar) navbar.classList.remove('navbar-hidden');
}

if (btnCloseVisitModal) btnCloseVisitModal.addEventListener('click', closeVisitModal);
if (btnCancelVisit) btnCancelVisit.addEventListener('click', closeVisitModal);

if (btnConfirmVisit) {
	btnConfirmVisit.addEventListener('click', async () => {
		if (!modalVisitConfirm) {
			console.warn('No hay modalVisitConfirm al confirmar visita — abortando acción');
			return;
		}
		const selectedDate = modalVisitConfirm.dataset.selectedDate;
		try {
			await addDoc(collection(db, 'visitas'), {
				date: selectedDate,
				createdAt: Timestamp.now()
			});
			closeVisitModal();
			// Opcional: Mostrar mensaje de éxito
			alert('Visita confirmada exitosamente');
		} catch (err) {
			alert('Error al guardar la visita');
			console.error('Error:', err);
		}
	});
}

// Inicialización
renderWeekdays();
renderCalendar(currentDate);
// Cargar contratos para el select del modal (si existe)
async function loadContractsForSelect() {
	if (!selectReminderContract) return;
	try {
		const contractsSnapshot = await getDocs(collection(db, 'contracts'));
		// Limpiar opciones excepto la primera (sin contrato)
		selectReminderContract.innerHTML = '<option value="">-- Sin contrato --</option>';
		contractsSnapshot.forEach(doc => {
			const data = doc.data();
			const opt = document.createElement('option');
			opt.value = doc.id;
			opt.textContent = data.name || data.title || (`Contrato ${doc.id}`);
			selectReminderContract.appendChild(opt);
		});
	} catch (err) {
		console.error('Error al cargar contratos para el select:', err);
	}
}

// Llamar una vez al iniciar para poblar el select
loadContractsForSelect();
