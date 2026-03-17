// Import Firebase modules
import { renderVisits, addVisit, deleteVisit, renderVisitsCalendar, setupVisitsCalendar } from './visits.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqgJcGVg1L8tEcNpzGlUWt0txMgjYlvBM",
    authDomain: "integraseo-a2251.firebaseapp.com",
    projectId: "integraseo-a2251",
    storageBucket: "integraseo-a2251.appspot.com",
    messagingSenderId: "641850273091",
    appId: "1:641850273091:web:f4b84be073bda16c7213f6",
    measurementId: "G-0R5MCH0RRY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data Storage
let contracts = []
let currentContractId = null
let currentView = "contracts"
let currentMonth = new Date().getMonth()
let currentYear = new Date().getFullYear()
let events = [];
let reminders = [];

// Visitas variables
let currentMonthVisits = new Date().getMonth();
let currentYearVisits = new Date().getFullYear();

// Load data from Firestore
// Función para manejar los valores agregados
let valueItems = [];

function addValueFromInput() {
    const valueInput = document.getElementById('value-input');
    const value = valueInput.value.trim();
    
    if (value) {
        // Extraer cantidad y tipo (ejemplo: "1 jardinero")
        const match = value.match(/^(\d+)\s+(.+)$/);
        if (match) {
            const [, quantity, type] = match;
            valueItems.push({ quantity: parseInt(quantity), type });
            valueInput.value = '';
            renderValueItems();
        } else {
            alert('Por favor, ingresa el valor en el formato correcto (ejemplo: "1 jardinero")');
        }
    }
}

function removeValueItem(index) {
    valueItems.splice(index, 1);
    renderValueItems();
}

function renderValueItems() {
  const container = document.getElementById('value-items');
  if (!container) return;

  // Limpiar contenedor
  container.innerHTML = '';

  // Crear nodos y listeners para cada item (más seguro que usar onclick inline)
  valueItems.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'value-item';

    const span = document.createElement('span');
    span.textContent = `${item.quantity} ${item.type}`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-remove-value';
    btn.setAttribute('aria-label', `Eliminar ${item.type}`);

    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>`;

    btn.addEventListener('click', () => {
      removeValueItem(index);
    });

    itemEl.appendChild(span);
    itemEl.appendChild(btn);
    container.appendChild(itemEl);
  });
}

// Exponer la función removeValueItem al ámbito global para que los botones con
// el handler inline `onclick="removeValueItem(...)"` funcionen correctamente.
window.removeValueItem = removeValueItem;

// Add event listener for value input
document.addEventListener('DOMContentLoaded', () => {
    const btnAddValue = document.getElementById('btn-add-value');
    if (btnAddValue) {
        btnAddValue.addEventListener('click', addValueFromInput);
    }

    const valueInput = document.getElementById('value-input');
    if (valueInput) {
        valueInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addValueFromInput();
            }
        });
    }
});

async function loadData() {
    try {
        // Load contracts
        const contractsSnapshot = await getDocs(collection(db, "contracts"));
        
        // Obtenemos los contratos de Firestore
        contracts = contractsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                client: data.client || '',
                location: data.location || '',
                valueItems: data.valueItems || [],
                startDate: data.startDate || '',
                endDate: data.endDate || '',
                status: data.status || 'active',
                notes: data.notes || [],
                workers: data.workers || [],
                visits: data.visits || []
            };
        });

        // Load events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load reminders
        const remindersSnapshot = await getDocs(collection(db, "reminders"));
        reminders = remindersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("Datos cargados exitosamente");
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        throw error;
    }
}

function setupCalendarListeners() {
    // Calendar navigation
    const btnPrevMonth = document.getElementById("btn-prev-month");
    const btnNextMonth = document.getElementById("btn-next-month");
    const btnAddEvent = document.getElementById("btn-add-event");
    
    if (btnPrevMonth) {
        btnPrevMonth.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    if (btnAddEvent) {
        btnAddEvent.addEventListener("click", openEventModal);
    }
}

function setupReminderListeners() {
    const btnAddReminder = document.getElementById("btn-add-reminder");
    if (btnAddReminder) {
        btnAddReminder.addEventListener("click", openReminderModal);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await init();

    // Agregar listener para cambios de pestaña
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'visits') {
                renderVisitsCalendar(contracts, currentContractId, db);
                setupVisitsCalendar(contracts, currentContractId, db); // Aseguramos que los eventos se configuren después de renderizar
            }
        });
    });

    // Configurar eventos iniciales si estamos en la pestaña de visitas
    const visitsTab = document.querySelector('.tab[data-tab="visits"]');
    if (visitsTab?.classList.contains('active')) {
        renderVisitsCalendar(contracts, currentContractId, db);
        setupVisitsCalendar(contracts, currentContractId, db);
    }
});

async function init() {
    try {
        await loadData();
        console.log("Datos cargados exitosamente");
        setupEventListeners();
        
        // Renderizar los contratos si estamos en la página principal
        const currentPath = window.location.pathname;
        if (!currentPath.includes('calendario.html') && !currentPath.includes('recordatorios.html')) {
            renderContracts();
            console.log("Contratos disponibles:", contracts.length);
        }
    } catch (error) {
        console.error("Error al inicializar la aplicación:", error);
    }
}

// Setup event listeners
function setupEventListeners() {
    const currentPath = window.location.pathname;

    // Determinar qué vista está activa basado en la página actual
    if (currentPath.includes('calendario.html')) {
        setupCalendarListeners();
    } else if (currentPath.includes('recordatorios.html')) {
        setupReminderListeners();
    } else {
        setupContractListeners();
    }
}

function setupContractListeners() {
    // Add contract button
  const btnAddContract = getAddContractBtn();
  if (btnAddContract) {
    btnAddContract.addEventListener("click", () => {
      openContractModal();
    });
  }
  // Search in header (contracts)
  const searchInput = document.getElementById('contracts-search');
  const btnSearch = document.getElementById('btn-contracts-search');

  // Debounce helper
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  if (searchInput) {
    const onSearch = debounce(() => {
      renderContracts(searchInput.value || '');
    }, 300);
    searchInput.addEventListener('input', onSearch);
    searchInput.addEventListener('search', onSearch);
  }

  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const val = (searchInput && searchInput.value) ? searchInput.value : '';
      renderContracts(val);
    });
  }
  const formContract = document.getElementById("form-contract");
  const btnCancelContract = document.getElementById("btn-cancel-contract");
  const btnCloseContractModal = document.getElementById("btn-close-contract-modal");

  if (formContract) formContract.addEventListener("submit", handleContractSubmit);
  if (btnCancelContract) btnCancelContract.addEventListener("click", closeContractModal);
  if (btnCloseContractModal) btnCloseContractModal.addEventListener("click", closeContractModal);

  // Back button
  document.getElementById("btn-back-detail")?.addEventListener("click", () => {
    document.getElementById("contracts-view").classList.remove("hidden");
    document.getElementById("contract-detail-view").classList.add("hidden");
    const _addBtn = getAddContractBtn();
    if (_addBtn) _addBtn.style.display = "block";
  });

    // Edit contract button
  const btnEditContract = document.getElementById("btn-edit-contract");
  if (btnEditContract) {
    btnEditContract.addEventListener("click", () => {
      openContractModal(currentContractId);
    });
  }

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab) {
      tab.addEventListener("click", () => {
        switchTab(tab.dataset.tab);
      });
    }
  });

  // Add note button
  document.getElementById("btn-add-note").addEventListener("click", openNoteModal)
  document.getElementById("form-note").addEventListener("submit", handleNoteSubmit)
  document.getElementById("btn-cancel-note").addEventListener("click", closeNoteModal)
  document.getElementById("btn-close-note-modal").addEventListener("click", closeNoteModal)

  // Add worker button
  document.getElementById("btn-add-worker").addEventListener("click", openWorkerModal)
  document.getElementById("form-worker").addEventListener("submit", handleWorkerSubmit)
  document.getElementById("btn-cancel-worker").addEventListener("click", closeWorkerModal)
  document.getElementById("btn-close-worker-modal").addEventListener("click", closeWorkerModal)

  // Calendar navigation
  document.getElementById("btn-prev-month").addEventListener("click", () => {
    currentMonth--
    if (currentMonth < 0) {
      currentMonth = 11
      currentYear--
    }
    renderCalendar()
  })

  document.getElementById("btn-next-month").addEventListener("click", () => {
    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear++
    }
    renderCalendar()
  })

  // Add event button
  document.getElementById("btn-add-event").addEventListener("click", openEventModal)
  document.getElementById("form-event").addEventListener("submit", handleEventSubmit)
  document.getElementById("btn-cancel-event").addEventListener("click", closeEventModal)
  document.getElementById("btn-close-event-modal").addEventListener("click", closeEventModal)

  // Add reminder button
  document.getElementById("btn-add-reminder").addEventListener("click", openReminderModal)
  document.getElementById("form-reminder").addEventListener("submit", handleReminderSubmit)
  document.getElementById("btn-cancel-reminder").addEventListener("click", closeReminderModal)
  document.getElementById("btn-close-reminder-modal").addEventListener("click", closeReminderModal)
}

// Función auxiliar para verificar si un elemento existe
function elementExists(id) {
    return document.getElementById(id) !== null;
}

// Devuelve el botón para añadir contrato (puede ser el del header o el FAB)
function getAddContractBtn() {
  return document.getElementById("btn-add-contract") || document.getElementById("btn-add-contract-fab");
}

// Switch tab
function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName)
  })

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active")
  })

  document.getElementById(`tab-${tabName}`).classList.add("active")
}

// Render contracts list
function renderContracts(searchTerm = '') {
  const contractsList = document.getElementById("contracts-list");
  if (!contractsList) {
    console.error("Elemento contracts-list no encontrado");
    return;
  }
  console.log("Renderizando contratos...", contracts.length, "contratos disponibles");

  if (!Array.isArray(contracts)) {
    console.error("La variable contracts no es un array");
    return;
  }

  // Filtrar según término de búsqueda si se proporciona
  const q = (searchTerm || '').trim().toLowerCase();
  const displayed = q
    ? contracts.filter(c => {
        const name = (c.name || '').toLowerCase();
        const client = (c.client || '').toLowerCase();
        return name.includes(q) || client.includes(q);
      })
    : contracts;

  if (displayed.length === 0) {
    const message = q ? 'No hay contratos que coincidan' : 'No hay contratos';
    const subtitle = q ? 'Prueba otra búsqueda o borra el filtro' : 'Añade tu primer contrato para comenzar';
    contractsList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <h3>${message}</h3>
                <p>${subtitle}</p>
            </div>
        `;
    return;
  }

  contractsList.innerHTML = displayed
    .map((contract) => {
      const initials = (contract.name || '').substring(0, 2).toUpperCase();
      const lastNote =
        contract.notes && contract.notes.length > 0
          ? contract.notes[contract.notes.length - 1].content
          : contract.client || '';

      return `
            <div class="contract-item" data-id="${contract.id}">
                <div class="contract-avatar">${initials}</div>
                <div class="contract-content">
                    <div class="contract-header">
                        <span class="contract-name">${contract.name}</span>
                        <span class="contract-date">${formatDate(contract.startDate)}</span>
                    </div>
                    <div class="contract-preview">${lastNote}</div>
                </div>
            </div>
        `
    })
    .join("")

  // Add click listeners
  document.querySelectorAll(".contract-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.dataset.id
      showContractDetail(id)
    })
  })
}

// Show contract detail
async function showContractDetail(id) {
    if (!id) {
        console.error("ID de contrato no válido");
        return;
    }

    try {
        currentContractId = id;
        const contractRef = doc(db, "contracts", id);
        const contractSnap = await getDoc(contractRef);
        
        if (!contractSnap.exists()) {
            console.error("El contrato no existe en Firestore");
            return;
        }
        
        const contract = { id: contractSnap.id, ...contractSnap.data() };
        
        const detailTitle = document.getElementById("detail-title");
        const detailSubtitle = document.getElementById("detail-subtitle");
        
        if (detailTitle) detailTitle.textContent = contract.name;
        if (detailSubtitle) detailSubtitle.textContent = contract.client;
        
        renderContractInfo(contract);
        renderNotes(contract);
        renderWorkers(contract);

        // Mostrar el calendario de visitas si estamos en esa pestaña
        if (document.querySelector('.tab.active')?.dataset.tab === 'visits') {
            renderVisitsCalendar(contracts, currentContractId, db);
        }
        
        const contractsView = document.getElementById("contracts-view");
        const contractDetailView = document.getElementById("contract-detail-view");
        const btnAddContract = getAddContractBtn();
        
        if (contractsView) contractsView.classList.add("hidden");
        if (contractDetailView) contractDetailView.classList.remove("hidden");
        if (btnAddContract) btnAddContract.style.display = "none";

        // Add tab change listener for visits calendar
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.dataset.tab === 'visits') {
                    renderVisitsCalendar(contracts, currentContractId, db);
                }
            });
        });
    } catch (error) {
        console.error("Error al mostrar el detalle del contrato:", error);
        alert("Error al cargar los detalles del contrato");
    }
}

// Render contract info
function renderContractInfo(contract) {
  const infoSection = document.getElementById("contract-info")

  const valueItemsHtml = contract.valueItems && contract.valueItems.length > 0
    ? contract.valueItems.map(item => `
        <div class="value-item-info">
            <span class="value-quantity">${item.quantity}</span>
            <span class="value-type">${item.type}</span>
        </div>
    `).join('')
    : '<span class="info-value">No especificado</span>';

  infoSection.innerHTML = `
        <div class="info-item">
            <span class="info-label">Cliente</span>
            <span class="info-value">${contract.client}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Ubicación</span>
            <span class="info-value">${contract.location || "No especificada"}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Valor Agregado</span>
            <div class="info-value value-items-list">
                ${valueItemsHtml}
            </div>
        </div>
        <div class="info-item">
            <span class="info-label">Estado</span>
            <span class="contract-status ${contract.status}">${getStatusText(contract.status)}</span>
        </div>
        <div class="delete-contract-section">
            <button class="btn-delete-contract" onclick="deleteContract('${contract.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Eliminar Contrato
            </button>
        </div>
    `
}

// Render notes
function renderNotes(contract) {
  const notesList = document.getElementById("notes-list");

  if (!contract.notes || contract.notes.length === 0) {
    notesList.innerHTML = `
            <div class="empty-state">
                <h3>No hay notas</h3>
                <p>Añade una nota para este contrato</p>
            </div>
        `
    return
  }

  // Render HTML with botones de editar y eliminar (editar abre modal con nota precargada)
  notesList.innerHTML = [...contract.notes].sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (note) => `
        <div class="note-item">
            <div class="note-header">
                <span class="note-datetime">${formatDate(note.date)} - ${note.time}</span>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <button class="btn-secondary btn-edit-note" type="button" onclick="openNoteEditor('${contract.id}', '${note.id}')">Editar</button>
                  <button class="btn-delete" onclick="deleteNote('${contract.id}', '${note.id}')" aria-label="Eliminar nota">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
            </div>
            <div class="note-content">${note.content}</div>
        </div>
    `,
    )
    .join("")
}

// Render workers
function renderWorkers(contract) {
  const workersList = document.getElementById("workers-list");

  if (!contract.workers || contract.workers.length === 0) {
    workersList.innerHTML = `
            <div class="empty-state">
                <h3>No hay operarios</h3>
                <p>Añade operarios a este contrato</p>
            </div>
        `
    return
  }

  workersList.innerHTML = contract.workers
    .map(
      (worker) => `
        <div class="worker-item">
            <div class="worker-info">
                <div class="worker-name">${worker.name}</div>
                <div class="worker-position">${worker.position}</div>
                ${worker.phone ? `<div class="worker-phone">${worker.phone}</div>` : ""}
            </div>
            <button class="btn-delete" onclick="deleteWorker('${contract.id}', '${worker.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `,
    )
    .join("")
}

// Contract modal
async function openContractModal(id = null) {
    const modal = document.getElementById("modal-contract");
    const titleEl = document.getElementById("modal-contract-title");
    const form = document.getElementById("form-contract");

    // Reset form and value items
    form.reset();
    valueItems = [];
    renderValueItems();

    if (id) {
        // Edit mode
        currentContractId = id;
        titleEl.textContent = "Editar Contrato";
        const contractRef = doc(db, "contracts", id);
        const contractSnap = await getDoc(contractRef);
        if (contractSnap.exists()) {
            const contract = contractSnap.data();
            document.getElementById("contract-name").value = contract.name;
            document.getElementById("contract-client").value = contract.client;
            document.getElementById("contract-location").value = contract.location || "";
            document.getElementById("contract-status").value = contract.status;

            // Cargar los valores existentes si existen
            if (contract.valueItems && Array.isArray(contract.valueItems)) {
                valueItems = [...contract.valueItems];
                renderValueItems();
            }
                renderValueItems();
            }
    } else {
        // New contract mode
        titleEl.textContent = "Nuevo Contrato";
        // Set default status as active
        document.getElementById("contract-status").value = "active";
    }

    // Show modal
    modal.classList.remove("hidden");
}

function closeContractModal() {
    const modal = document.getElementById("modal-contract");
    const form = document.getElementById("form-contract");
    if (form) form.reset();
    valueItems = []; // Resetear los items de valor
    renderValueItems(); // Actualizar la visualización
    modal.classList.add("hidden");
    currentContractId = null;
}

async function handleContractSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form) {
        console.error("Formulario no encontrado");
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    let originalButtonText = '';
    
    if (submitButton) {
        // Guardar el texto original del botón
        originalButtonText = submitButton.innerHTML;
        // Cambiar el botón a estado de carga
        submitButton.innerHTML = `
            <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32"/>
            </svg>
            Guardando...
        `;
        submitButton.disabled = true;
    }

    try {
        let contractData = {
            name: document.getElementById("contract-name").value,
            client: document.getElementById("contract-client").value,
            location: document.getElementById("contract-location").value,
            valueItems: valueItems,
            status: document.getElementById("contract-status").value,
            createdAt: new Date().toISOString()
        };

        if (currentContractId) {
            // Si estamos editando, obtener el contrato actual para preservar notas y operarios
            const docRef = doc(db, "contracts", currentContractId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const existingData = docSnap.data();
                // Preservar las notas y operarios existentes
                contractData.notes = existingData.notes || [];
                contractData.workers = existingData.workers || [];
            }
        } else {
            // Si es un nuevo contrato, inicializar arrays vacíos
            contractData.notes = [];
            contractData.workers = [];
        }

        if (currentContractId) {
            try {
                // Verificar si el documento existe antes de actualizarlo
                const docRef = doc(db, "contracts", currentContractId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    // Update existing contract
                    await updateDoc(docRef, contractData);
                    const index = contracts.findIndex((c) => c.id === currentContractId);
                    if (index !== -1) {
                        contracts[index] = { ...contracts[index], ...contractData };
                    }
                } else {
                    throw new Error("El contrato que intentas actualizar ya no existe");
                }
            } catch (error) {
                throw new Error("No se pudo actualizar el contrato: " + error.message);
            }
        } else {
            // Add new contract
            const docRef = await addDoc(collection(db, "contracts"), contractData);
            const newContract = { id: docRef.id, ...contractData };
            contracts = [...contracts, newContract];
        }
        
        // Recargar todos los contratos para asegurarnos de tener los datos más recientes
        await loadData();

        // Close modal and refresh list
        closeContractModal();
        renderContracts();

        // Show success message with toast
        showToast(currentContractId ? "Contrato actualizado exitosamente" : "Contrato creado exitosamente", "success");
    } catch (error) {
        console.error("Error al guardar el contrato:", error);
        showToast(error.message || "Error al guardar el contrato", "error");
    } finally {
        // Restaurar el botón a su estado original si existe
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
}


// Note modal
// Edit state for notes
let editingNoteId = null;
let editingNoteContractId = null;

function openNoteModal() {
  const modal = document.getElementById("modal-note")
  const form = document.getElementById("form-note")

  // Reset editing state for creating a new note
  editingNoteId = null;
  editingNoteContractId = null;

  form.reset()

  // Set modal title to 'Nueva Nota'
  const headerTitle = document.querySelector('#modal-note .modal-header h3');
  if (headerTitle) headerTitle.textContent = 'Nueva Nota';

  // Set current date and time
  const now = new Date()
  document.getElementById("note-date").value = now.toISOString().split("T")[0]
  document.getElementById("note-time").value = now.toTimeString().slice(0, 5)

  modal.classList.remove("hidden")
}

// Abrir editor de nota para edición — expuesto globalmente
async function openNoteEditor(contractId, noteId) {
  try {
    const modal = document.getElementById("modal-note");
    const form = document.getElementById("form-note");
    const headerTitle = document.querySelector('#modal-note .modal-header h3');

    // Find contract in local cache
    const contract = contracts.find(c => c.id === contractId);
    let note = null;
    if (contract && contract.notes) {
      note = contract.notes.find(n => n.id === noteId);
    }

    // If not found locally, try fetching from Firestore
    if (!note) {
      const contractRef = doc(db, 'contracts', contractId);
      const snap = await getDoc(contractRef);
      if (snap.exists()) {
        const data = snap.data();
        note = (data.notes || []).find(n => n.id === noteId) || null;
      }
    }

    if (!note) {
      console.error('Nota no encontrada para editar', contractId, noteId);
      return;
    }

    // Set editing state
    editingNoteId = noteId;
    editingNoteContractId = contractId;

    // Prefill form
    form.reset();
    document.getElementById('note-date').value = note.date;
    document.getElementById('note-time').value = note.time;
    document.getElementById('note-content').value = note.content;

    if (headerTitle) headerTitle.textContent = 'Editar Nota';

    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Error al abrir editor de nota:', err);
  }
}

// Exponer para handlers inline o llamadas externas
window.openNoteEditor = openNoteEditor;

function closeNoteModal() {
  const modal = document.getElementById("modal-note");
  const form = document.getElementById("form-note");
  if (form) form.reset();
  // Reset editing state
  editingNoteId = null;
  editingNoteContractId = null;
  // Restore modal title
  const headerTitle = document.querySelector('#modal-note .modal-header h3');
  if (headerTitle) headerTitle.textContent = 'Nueva Nota';
  if (modal) modal.classList.add("hidden");
}

async function handleNoteSubmit(e) {
  e.preventDefault()

  // If editingNoteId is set, update existing note
  if (editingNoteId && editingNoteContractId) {
    const contractRef = doc(db, 'contracts', editingNoteContractId);
    const contractSnap = await getDoc(contractRef);
    if (!contractSnap.exists()) {
      console.error('Contrato para nota a editar no encontrado');
      return;
    }

    const notes = contractSnap.data().notes || [];
    const updatedNotes = notes.map(n => {
      if (n.id === editingNoteId) {
        return {
          ...n,
          date: document.getElementById('note-date').value,
          time: document.getElementById('note-time').value,
          content: document.getElementById('note-content').value,
        };
      }
      return n;
    });

    await updateDoc(contractRef, { notes: updatedNotes });

    // Update local cache
    const contract = contracts.find(c => c.id === editingNoteContractId);
    if (contract) {
      contract.notes = updatedNotes;
      renderNotes(contract);
    }

    // Reset editing state
    editingNoteId = null;
    editingNoteContractId = null;
    closeNoteModal();
    return;
  }

  // Otherwise, create new note under currentContractId
  const contractRef = doc(db, "contracts", currentContractId);
  const contractSnap = await getDoc(contractRef);
  if (!contractSnap.exists()) return;

  const note = {
    id: Date.now().toString(),
    date: document.getElementById("note-date").value,
    time: document.getElementById("note-time").value,
    content: document.getElementById("note-content").value,
  }

  const currentNotes = contractSnap.data().notes || [];
  await updateDoc(contractRef, {
    notes: [...currentNotes, note]
  });

  const contract = contracts.find(c => c.id === currentContractId);
  contract.notes.push(note);
  renderNotes(contract)
  renderContracts()
  closeNoteModal()
}

async function deleteNote(contractId, noteId) {
  const contractRef = doc(db, "contracts", contractId);
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return;

  const updatedNotes = contract.notes.filter((n) => n.id !== noteId);
  await updateDoc(contractRef, { notes: updatedNotes });

  contract.notes = updatedNotes;
  renderNotes(contract)
}

// Worker modal
function openWorkerModal() {
  const modal = document.getElementById("modal-worker")
  const form = document.getElementById("form-worker")

  form.reset()
  modal.classList.remove("hidden")
}

function closeWorkerModal() {
  document.getElementById("modal-worker").classList.add("hidden")
}

async function handleWorkerSubmit(e) {
  e.preventDefault()

  if (!currentContractId) {
    console.error("No hay un contrato seleccionado");
    alert("Error: No se puede añadir un operario sin un contrato seleccionado");
    return;
  }

  const contractRef = doc(db, "contracts", currentContractId);
  const contractSnap = await getDoc(contractRef);
  if (!contractSnap.exists()) {
    console.error("El contrato no existe en Firestore");
    alert("Error: No se encontró el contrato");
    return;
  }

  const worker = {
    id: Date.now().toString(),
    name: document.getElementById("worker-name").value,
    position: document.getElementById("worker-position").value,
    phone: document.getElementById("worker-phone").value,
  }

  const currentWorkers = contractSnap.data().workers || [];
  await updateDoc(contractRef, {
    workers: [...currentWorkers, worker]
  });

  const contract = contracts.find(c => c.id === currentContractId);
  contract.workers.push(worker);
  renderWorkers(contract)
  closeWorkerModal()
}

async function deleteWorker(contractId, workerId) {
  const contractRef = doc(db, "contracts", contractId);
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return;

  const updatedWorkers = contract.workers.filter((w) => w.id !== workerId);
  await updateDoc(contractRef, { workers: updatedWorkers });

  contract.workers = updatedWorkers;
  renderWorkers(contract)
}

// Calendar
async function renderCalendar() {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  document.getElementById("calendar-month-year").textContent = `${monthNames[currentMonth]} ${currentYear}`

  const grid = document.getElementById("calendar-grid")
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  let html = ""

  // Day headers
  const dayHeaders = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  dayHeaders.forEach((day) => {
    html += `<div class="calendar-day-header">${day}</div>`
  })

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`
  }

  // Current month days
  const today = new Date()
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear
    const hasNotes = checkDateHasNotes(dateStr)

    html += `<div class="calendar-day ${isToday ? "today" : ""} ${hasNotes ? "has-notes" : ""}">${day}</div>`
  }

  // Next month days
  const totalCells = firstDay + daysInMonth
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  for (let i = 1; i <= remainingCells; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`
  }

  grid.innerHTML = html
  await renderEvents()
}

function checkDateHasNotes(dateStr) {
  return contracts.some((contract) => contract.notes && contract.notes.some((note) => note.date === dateStr))
}

async function renderEvents() {
  const eventsList = document.getElementById("events-list")
  const events = getAllEvents()

  if (events.length === 0) {
    eventsList.innerHTML = `
            <div class="empty-state">
                <h3>No hay eventos</h3>
                <p>Añade eventos al calendario</p>
            </div>
        `
    return
  }

  eventsList.innerHTML = events
    .map(
      (event) => `
        <div class="event-item">
            <div class="event-header">
                <span class="event-title">${event.title}</span>
                <button class="btn-delete" onclick="deleteEvent('${event.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div class="event-datetime">${formatDate(event.date)} - ${event.time}</div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ""}
        </div>
    `,
    )
    .join("")
}

function getAllEvents() {
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  });
  return filteredEvents.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
}

async function loadEvents() {
    const querySnapshot = await getDocs(collection(db, "events"));
    events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Event modal
function openEventModal() {
  const modal = document.getElementById("modal-event")
  const form = document.getElementById("form-event")

  form.reset()

  const now = new Date()
  document.getElementById("event-date").value = now.toISOString().split("T")[0]
  document.getElementById("event-time").value = now.toTimeString().slice(0, 5)

  modal.classList.remove("hidden")
}

function closeEventModal() {
  document.getElementById("modal-event").classList.add("hidden")
}

async function handleEventSubmit(e) {
  e.preventDefault()

  const event = {
    id: Date.now().toString(),
    title: document.getElementById("event-title").value,
    date: document.getElementById("event-date").value,
    time: document.getElementById("event-time").value,
    description: document.getElementById("event-description").value,
  }

  const docRef = await addDoc(collection(db, "events"), event);
  event.id = docRef.id; // Firestore generates its own ID
  events.push(event);

  renderCalendar()
  closeEventModal()

  // Schedule notification
  // scheduleNotification(event) // This needs user permission handling
}

async function deleteEvent(eventId) {
  await deleteDoc(doc(db, "events", eventId));
  events = events.filter((e) => e.id !== eventId);
  renderEvents()
}

// Reminders
async function renderReminders() {
  const remindersList = document.getElementById("reminders-list")

  if (reminders.length === 0) {
    remindersList.innerHTML = `
            <div class="empty-state">
                <h3>No hay recordatorios</h3>
                <p>Añade recordatorios para no olvidar tareas importantes</p>
            </div>
        `
    return
  }

  remindersList.innerHTML = [...reminders].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .map(
      (reminder) => `
        <div class="reminder-item ${reminder.completed ? "completed" : ""}">
            <div class="reminder-checkbox ${reminder.completed ? "checked" : ""}" 
                 onclick="toggleReminder('${reminder.id}')"></div>
            <div class="reminder-content">
                <div class="reminder-title">${reminder.title}</div>
                <div class="reminder-datetime">${formatDate(reminder.date)} - ${reminder.time}</div>
                ${reminder.description ? `<div class="reminder-description">${reminder.description}</div>` : ""}
            </div>
            <button class="btn-delete" onclick="deleteReminder('${reminder.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `,
    )
    .join("")
}

async function loadReminders() {
    const querySnapshot = await getDocs(collection(db, "reminders"));
    reminders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function toggleReminder(reminderId) {
  const reminder = reminders.find((r) => r.id === reminderId);
  if (reminder) {
    const newCompletedState = !reminder.completed;
    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, { completed: newCompletedState });
    reminder.completed = newCompletedState;
    renderReminders();
  }
}
 
// Reminder modal
function openReminderModal() {
  const modal = document.getElementById("modal-reminder")
  const form = document.getElementById("form-reminder")

  form.reset()

  const now = new Date()
  document.getElementById("reminder-date").value = now.toISOString().split("T")[0]
  document.getElementById("reminder-time").value = now.toTimeString().slice(0, 5)

  modal.classList.remove("hidden")
}

function closeReminderModal() {
  document.getElementById("modal-reminder").classList.add("hidden")
}

async function handleReminderSubmit(e) {
  e.preventDefault()

  const reminder = {
    id: Date.now().toString(),
    title: document.getElementById("reminder-title").value,
    date: document.getElementById("reminder-date").value,
    time: document.getElementById("reminder-time").value,
    description: document.getElementById("reminder-description").value,
    completed: false,
  }

  const docRef = await addDoc(collection(db, "reminders"), reminder);
  reminder.id = docRef.id;
  reminders.push(reminder);

  renderReminders()
  closeReminderModal()

  // Schedule notification
  // scheduleNotification(reminder)
}

async function deleteReminder(reminderId) {
  await deleteDoc(doc(db, "reminders", reminderId));
  reminders = reminders.filter((r) => r.id !== reminderId);
  renderReminders()
}

// Notifications
function scheduleNotification(item) {
  if ("Notification" in window && Notification.permission === "granted") {
    const itemDate = new Date(`${item.date}T${item.time}`)
    const now = new Date()
    const timeDiff = itemDate - now

    if (timeDiff > 0) {
      setTimeout(() => {
        new Notification(item.title, {
          body: item.description || "Tienes un evento programado",
          icon: "/notification-icon.jpg",
        })
      }, timeDiff)
    }
  }
}

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission()
}

// Utility functions
function formatDate(dateStr) {
  if (!dateStr) return "No especificada"
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getStatusText(status) {
  const statusMap = {
    active: "Activo",
    pending: "Pendiente",
    completed: "Completado",
  }
  return statusMap[status] || status
}

// Función para mostrar el modal de confirmación
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

    // Añadir el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('confirm-modal');
    const cancelBtn = document.getElementById('confirm-cancel');
    const deleteBtn = document.getElementById('confirm-delete');

    const closeModal = () => {
        modal.remove();
    };

    cancelBtn.addEventListener('click', closeModal);
    deleteBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });
}

// Función para eliminar contratos
async function deleteContract(contractId) {
    if (!contractId) return;

    showConfirmModal(
        "Eliminar Contrato",
        "¿Estás seguro de que deseas eliminar este contrato? Esta acción no se puede deshacer.",
        async () => {
            try {
                // Mostrar estado de carga en el botón
                const deleteBtn = document.querySelector('.btn-delete-contract');
                if (deleteBtn) {
                    deleteBtn.innerHTML = `
                        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32"/>
                        </svg>
                        Eliminando...
                    `;
                    deleteBtn.disabled = true;
                }

                // Eliminar de Firestore
                await deleteDoc(doc(db, "contracts", contractId));
                
                // Eliminar del array local
                contracts = contracts.filter(c => c.id !== contractId);
                
                // Volver a la vista de lista
                document.getElementById("contracts-view").classList.remove("hidden");
                document.getElementById("contract-detail-view").classList.add("hidden");
                const _addBtn2 = getAddContractBtn();
                if (_addBtn2) _addBtn2.style.display = "block";
                
                // Actualizar la lista de contratos
                renderContracts();
                
                // Mostrar notificación de éxito
                showToast("Contrato eliminado exitosamente", "success");
            } catch (error) {
                console.error("Error al eliminar el contrato:", error);
                showToast("Error al eliminar el contrato", "error");
            }
        }
    );
}

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

// Make functions available in the global scope for inline event handlers
window.deleteNote = deleteNote;
window.deleteWorker = deleteWorker;
window.deleteEvent = deleteEvent;
window.toggleReminder = toggleReminder;
window.deleteReminder = deleteReminder;
window.deleteContract = deleteContract;

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await init();
        await Promise.all([loadEvents(), loadReminders()]);
        setupVisitsCalendar(contracts, currentContractId, db);

        // Configurar listeners para los tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.dataset.tab === 'visits') {
                    renderVisitsCalendar(contracts, currentContractId, db);
                }
            });
        });
        
        console.log("Aplicación inicializada exitosamente");
    } catch (error) {
        console.error("Error al inicializar la aplicación:", error);
        showToast("Error al cargar la aplicación", "error");
    }
});
