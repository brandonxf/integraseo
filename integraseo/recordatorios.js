// Firebase Configuración
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, Timestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const remindersList = document.getElementById('reminders-list');
// Select del modal para asignar contrato al recordatorio
const selectReminderContract = document.getElementById('reminder-contract');
// Select para filtrar la lista por contrato
const filterContractSelect = document.getElementById('filter-contract');

// Modal para editar recordatorio
const modalReminder = document.getElementById('modal-reminder');
const btnCloseReminderModal = document.getElementById('btn-close-reminder-modal');
const btnCancelReminder = document.getElementById('btn-cancel-reminder');
const formReminder = document.getElementById('form-reminder');
let editingReminderId = null;
// Referencia al navbar
const navbar = document.querySelector('.bottom-nav');

function openEditReminderModal(reminder) {
    modalReminder.classList.remove('hidden');
     if (navbar) navbar.classList.add('navbar-hidden');
    formReminder.reset();
    document.getElementById('reminder-title').value = reminder.title;
    document.getElementById('reminder-date').value = reminder.date;
    document.getElementById('reminder-time').value = reminder.time;
    document.getElementById('reminder-description').value = reminder.description || '';
    // Seleccionar contrato si existe
    if (selectReminderContract) {
        selectReminderContract.value = reminder.contractId || '';
    }
    editingReminderId = reminder.id;
}
function closeReminderModal() {
    modalReminder.classList.add('hidden');
     if (navbar) navbar.classList.remove('navbar-hidden');
    editingReminderId = null;
}
btnCloseReminderModal.addEventListener('click', closeReminderModal);
btnCancelReminder.addEventListener('click', closeReminderModal);

formReminder.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingReminderId) return;
    const title = document.getElementById('reminder-title').value;
    const date = document.getElementById('reminder-date').value;
    const time = document.getElementById('reminder-time').value;
    const description = document.getElementById('reminder-description').value;
    const contractId = selectReminderContract ? selectReminderContract.value : '';
    const contractName = (selectReminderContract && selectReminderContract.selectedOptions.length > 0)
        ? selectReminderContract.selectedOptions[0].textContent : '';
    try {
        const reminderRef = collection(db, 'recordatorios');
        await window.firebaseUpdateReminder(editingReminderId, {
            title,
            date,
            time,
            description,
            contractId: contractId || null,
            contractName: contractName || null
        });
        closeReminderModal();
        loadReminders();
    } catch (err) {
        alert('Error al editar el recordatorio');
    }
});

// Función global para actualizar recordatorio en Firestore
window.firebaseUpdateReminder = async (id, data) => {
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const reminderDoc = doc(db, 'recordatorios', id);
    await updateDoc(reminderDoc, data);
};

async function loadReminders() {
    remindersList.innerHTML = '';
    const snapshot = await getDocs(collection(db, 'recordatorios'));
    const reminders = [];
    snapshot.forEach(doc => reminders.push({ id: doc.id, ...doc.data() }));
    reminders.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    // Aplicar filtro por contrato si hay uno seleccionado
    const filterId = filterContractSelect ? filterContractSelect.value : '';
    const filtered = filterId ? reminders.filter(r => r.contractId === filterId) : reminders;
    filtered.forEach(reminder => {
        const item = document.createElement('div');
        item.className = 'reminder-item';
        let contractInfo = '';
        if (reminder.contractName) {
            contractInfo = `<div class="reminder-contract">Contrato: ${reminder.contractName}</div>`;
        }
        item.innerHTML = `
            <div class="reminder-row">
                <div class="reminder-content">
                    <div class="reminder-title">${reminder.title}</div>
                    <div class="reminder-datetime">${reminder.date} ${reminder.time}</div>
                    ${contractInfo}
                </div>
                <button class="btn-edit" title="Editar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary);"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                </button>
            </div>
            <div class="reminder-description">${reminder.description || ''}</div>
        `;
        // Editar
        item.querySelector('.btn-edit').addEventListener('click', () => openEditReminderModal(reminder));
        // Eliminar
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.title = 'Eliminar';
        delBtn.style.marginLeft = '8px';
        delBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        delBtn.addEventListener('click', () => deleteReminder(reminder.id));
        // Añadir botones al nodo (insertar después del btn-edit)
        const btnEdit = item.querySelector('.btn-edit');
        if (btnEdit && btnEdit.parentNode) {
            btnEdit.parentNode.appendChild(delBtn);
        } else {
            item.appendChild(delBtn);
        }
        remindersList.appendChild(item);
    });
}

// Cargar contratos y poblar selects (modal + filtro)
async function loadContractsForSelects() {
    try {
        const snapshot = await getDocs(collection(db, 'contracts'));
        // Poblar select del modal
        if (selectReminderContract) {
            selectReminderContract.innerHTML = '<option value="">-- Sin contrato --</option>';
            snapshot.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = data.name || data.title || (`Contrato ${doc.id}`);
                selectReminderContract.appendChild(opt);
            });
        }
        // Poblar filtro
        if (filterContractSelect) {
            filterContractSelect.innerHTML = '<option value="">Todos</option>';
            snapshot.forEach(doc => {
                const data = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = data.name || data.title || (`Contrato ${doc.id}`);
                filterContractSelect.appendChild(opt);
            });
            // Listener para filtrar
            filterContractSelect.addEventListener('change', () => loadReminders());
        }
    } catch (err) {
        console.error('Error al cargar contratos:', err);
    }
}

// Inicializar selects
loadContractsForSelects();

loadReminders();

// Modal de confirmación elegante (local)
function showConfirmModal(title, message, onConfirm) {
    const modalHtml = `
        <div class="confirm-modal" id="confirm-modal">
            <div class="confirm-content">
                <div class="confirm-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-cancel" id="confirm-cancel">Cancelar</button>
                    <button class="confirm-btn confirm-btn-delete" id="confirm-delete">Eliminar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('confirm-modal');
    const cancelBtn = document.getElementById('confirm-cancel');
    const deleteBtn = document.getElementById('confirm-delete');
    const closeModal = () => { modal?.remove(); };
    cancelBtn.addEventListener('click', closeModal);
    deleteBtn.addEventListener('click', () => { onConfirm(); closeModal(); });
}

// Mostrar toast pequeño
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'} show`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); toast.remove(); }, 2500);
}

// Eliminar recordatorio con confirmación
async function deleteReminder(reminderId) {
    if (!reminderId) return;
    showConfirmModal(
        'Eliminar Recordatorio',
        '¿Estás seguro de que deseas eliminar este recordatorio? Esta acción no se puede deshacer.',
        async () => {
            try {
                await deleteDoc(doc(db, 'recordatorios', reminderId));
                loadReminders();
                showToast('Recordatorio eliminado', 'success');
            } catch (err) {
                console.error('Error al eliminar recordatorio:', err);
                showToast('Error al eliminar', 'error');
            }
        }
    );
}