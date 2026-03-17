// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    updateDoc,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
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

// Referencia a la lista de brigadas
const brigadasList = document.getElementById('brigadas-list');

// Función para obtener el estado de los servicios de un contrato
async function getContractServices(contractId) {
    try {
        const brigadaRef = doc(db, "brigadas", contractId);
        const brigadaDoc = await getDoc(brigadaRef);
        if (brigadaDoc.exists()) {
            return brigadaDoc.data();
        }
        return { jardineria: false, aseo: false };
    } catch (error) {
        console.error("Error al obtener servicios:", error);
        return { jardineria: false, aseo: false };
    }
}

// Función para actualizar los servicios de un contrato
async function updateContractServices(contractId, services) {
    try {
        const brigadaRef = doc(db, "brigadas", contractId);
        await setDoc(brigadaRef, services, { merge: true });
        console.log("Servicios actualizados correctamente");
    } catch (error) {
        console.error("Error al actualizar servicios:", error);
        throw error;
    }
}

// Función para cargar los contratos desde Firebase (puede filtrar por searchTerm)
async function loadContracts(searchTerm = '') {
    try {
        // Obtener los contratos de Firebase
        const contractsSnapshot = await getDocs(collection(db, "contracts"));

        if (contractsSnapshot.empty) {
            // Mostrar estado vacío si no hay contratos
            brigadasList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <circle cx="17" cy="7" r="3"></circle>
                    </svg>
                    <h3>No hay brigadas asignadas</h3>
                    <p>Los contratos con brigadas asignadas aparecerán aquí</p>
                </div>`;
            return;
        }

        // Construir array de contratos
        const contracts = contractsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Si hay término de búsqueda, filtrar por nombre o cliente (case-insensitive)
        let filtered = contracts;
        const q = (searchTerm || '').trim().toLowerCase();
        if (q) {
            filtered = contracts.filter(c => {
                const name = (c.name || '').toLowerCase();
                const client = (c.client || '').toLowerCase();
                return name.includes(q) || client.includes(q);
            });
        }

        if (filtered.length === 0) {
            brigadasList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <circle cx="17" cy="7" r="3"></circle>
                    </svg>
                    <h3>No hay contratos que coincidan</h3>
                    <p>Prueba otra búsqueda o borra el filtro</p>
                </div>`;
            return;
        }

        // Limpiar la lista actual
        brigadasList.innerHTML = '';

        // Crear las tarjetas de contratos filtrados
        for (const contract of filtered) {
            const services = await getContractServices(contract.id);

            const contractCard = document.createElement('div');
            contractCard.className = 'contract-card';
            contractCard.innerHTML = `
                <div class="contract-info">
                    <h3 class="contract-name">${contract.name || ''}</h3>
                    <p class="client-name">${contract.client || ''}</p>
                </div>
                <div class="service-checkboxes">
                    <label class="checkbox-container">
                        <input type="checkbox" name="jardineria" data-contract-id="${contract.id}" ${services.jardineria ? 'checked' : ''}> Jardinería
                    </label>
                    <label class="checkbox-container">
                        <input type="checkbox" name="aseo" data-contract-id="${contract.id}" ${services.aseo ? 'checked' : ''}> Aseo
                    </label>
                </div>
            `;

            // Agregar event listeners para los checkboxes
            contractCard.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', async (e) => {
                    const contractId = e.target.dataset.contractId;
                    const service = e.target.name;
                    const isChecked = e.target.checked;

                    try {
                        // Obtener el estado actual de los servicios
                        const currentServices = await getContractServices(contractId);

                        // Actualizar el servicio específico
                        const updatedServices = {
                            ...currentServices,
                            [service]: isChecked,
                            updatedAt: new Date().toISOString() // Agregar timestamp de actualización
                        };

                        // Guardar en Firebase
                        await updateContractServices(contractId, updatedServices);
                    } catch (error) {
                        console.error("Error al actualizar el servicio:", error);
                        // Revertir el checkbox si hay error
                        e.target.checked = !isChecked;
                    }
                });
            });

            brigadasList.appendChild(contractCard);
        }

    } catch (error) {
        console.error("Error al cargar los contratos:", error);
        brigadasList.innerHTML = '<p class="error">Error al cargar los contratos. Por favor, intenta de nuevo.</p>';
    }
}

// Función para limpiar todas las verificaciones
async function resetAllCheckboxes() {
    try {
        // Obtener todos los contratos
        const contractsSnapshot = await getDocs(collection(db, "contracts"));
        
        // Por cada contrato, eliminar o resetear sus verificaciones
        for (const contractDoc of contractsSnapshot.docs) {
            const brigadaRef = doc(db, "brigadas", contractDoc.id);
            await setDoc(brigadaRef, {
                jardineria: false,
                aseo: false,
                updatedAt: new Date().toISOString()
            });
        }

        // Recargar los contratos para actualizar la UI
        await loadContracts();
        
        console.log("Todas las verificaciones han sido limpiadas");
    } catch (error) {
        console.error("Error al limpiar las verificaciones:", error);
        throw error;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar contratos
    loadContracts();

    // Buscador en header
    const searchInput = document.getElementById('brigadas-search');
    const btnSearch = document.getElementById('btn-brigadas-search');

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
            loadContracts(searchInput.value || '');
        }, 300);
        searchInput.addEventListener('input', onSearch);
        searchInput.addEventListener('search', onSearch);
    }

    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const val = (searchInput && searchInput.value) ? searchInput.value : '';
            loadContracts(val);
        });
    }

    // Referencias a elementos del modal
    const btnMenuFab = document.getElementById('btn-menu-fab');
    const modalReset = document.getElementById('modal-reset');
    const btnCloseReset = document.getElementById('btn-close-reset-modal');
    const btnCancelReset = document.getElementById('btn-cancel-reset');
    const btnConfirmReset = document.getElementById('btn-confirm-reset');

    // Mostrar modal
    btnMenuFab.addEventListener('click', () => {
        modalReset.classList.remove('hidden');
    });

    // Cerrar modal
    const closeModal = () => {
        modalReset.classList.add('hidden');
    };

    btnCloseReset.addEventListener('click', closeModal);
    btnCancelReset.addEventListener('click', closeModal);

    // Confirmar reset
    btnConfirmReset.addEventListener('click', async () => {
        try {
            btnConfirmReset.disabled = true;
            btnConfirmReset.textContent = 'Limpiando...';
            
            await resetAllCheckboxes();
            closeModal();
        } catch (error) {
            console.error('Error al resetear:', error);
            alert('Hubo un error al limpiar las verificaciones. Por favor, intenta de nuevo.');
        } finally {
            btnConfirmReset.disabled = false;
            btnConfirmReset.textContent = 'Confirmar';
        }
    });
});