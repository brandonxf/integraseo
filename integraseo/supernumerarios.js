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

// Referencia a la lista de supernumerarios
const supernumerariosList = document.getElementById('supernumerarios-list');

// Función para mostrar notificaciones tipo toast
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Función para obtener los supernumerarios de un contrato
async function getContractSupernumerarios(contractId) {
    try {
        const supernumerarioRef = doc(db, "supernumerarios", contractId);
        const supernumerarioDoc = await getDoc(supernumerarioRef);
        if (supernumerarioDoc.exists()) {
            return supernumerarioDoc.data();
        }
        return { supernumerarios: [] };
    } catch (error) {
        console.error("Error getting supernumerarios:", error);
        return { supernumerarios: [] };
    }
}

// Función para eliminar un supernumerario
async function deleteSupernumerario(contractId, index) {
    try {
        const supRef = doc(db, "supernumerarios", contractId);
        const supDoc = await getDoc(supRef);
        
        if (supDoc.exists()) {
            let supernumerarios = supDoc.data().supernumerarios || [];
            supernumerarios.splice(index, 1);
            
            await setDoc(supRef, { supernumerarios }, { merge: true });
            
            // Recargar la lista
            loadSupernumerarios();
            showToast('Supernumerario eliminado correctamente', 'success');
        }
    } catch (error) {
        console.error("Error deleting supernumerario:", error);
        showToast('Error al eliminar el supernumerario', 'error');
    }
}

// Variables globales para el modal de eliminación
let deleteContractId = null;
let deleteIndex = null;

// Función para obtener todos los contratos
async function loadContratos(selectId = '#sup-contrato') {
    try {
        const contractsCollection = collection(db, "contracts");
        const contractsSnapshot = await getDocs(contractsCollection);
        const selectContrato = document.querySelector(selectId);
        
        // Limpiar las opciones anteriores (excepto la primera)
        while (selectContrato.options.length > 1) {
            selectContrato.remove(1);
        }
        
        contractsSnapshot.forEach(contractDoc => {
            const contractData = contractDoc.data();
            const option = document.createElement('option');
            option.value = contractDoc.id;
            option.textContent = contractData.name || contractData.nombreContratista || 'Sin nombre';
            selectContrato.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading contratos:", error);
    }
}

// Función para guardar supernumerario
async function saveSupernumerario(e) {
    e.preventDefault();
    
    const fecha = document.getElementById('sup-fecha').value;
    const nombre = document.getElementById('sup-nombre').value;
    const trabajo = document.getElementById('sup-trabajo').value;
    const contratoId = document.getElementById('sup-contrato').value;
    
    if (!fecha || !nombre || !trabajo || !contratoId) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        const supernumerarioData = {
            fecha,
            nombre,
            trabajo,
            contratoId,
            createdAt: new Date()
        };
        
        // Obtener referencia al documento de supernumerarios del contrato
        const supRef = doc(db, "supernumerarios", contratoId);
        const supDoc = await getDoc(supRef);
        
        let supernumerarios = [];
        if (supDoc.exists()) {
            supernumerarios = supDoc.data().supernumerarios || [];
        }
        
        supernumerarios.push(supernumerarioData);
        
        await setDoc(supRef, { supernumerarios }, { merge: true });
        
        // Cerrar modal y limpiar formulario
        document.getElementById('modal-supernumerario').classList.add('hidden');
        document.getElementById('form-supernumerario').reset();
        
        // Recargar la lista
        loadSupernumerarios();
    } catch (error) {
        console.error("Error saving supernumerario:", error);
        showToast('Error al guardar el supernumerario', 'error');
    }
}

// Función para obtener todos los contratos y mostrar los que tienen supernumerarios
async function loadSupernumerarios() {
    try {
        const contractsCollection = collection(db, "contracts");
        const contractsSnapshot = await getDocs(contractsCollection);
        
        supernumerariosList.innerHTML = '';
        let hasSupernumerarios = false;

        for (const contractDoc of contractsSnapshot.docs) {
            const contractData = contractDoc.data();
            const supernumerariosData = await getContractSupernumerarios(contractDoc.id);
            
            if (supernumerariosData.supernumerarios && supernumerariosData.supernumerarios.length > 0) {
                hasSupernumerarios = true;
                
                supernumerariosData.supernumerarios.forEach((sup, index) => {
                    const supElement = document.createElement('div');
                    supElement.className = 'supernumerario-item';
                    
                    // Formato de fecha
                    const fechaFormato = sup.fecha ? new Date(sup.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
                    
                    const contratoNombre = contractData.name || contractData.nombreContratista || 'Sin nombre';
                    
                    supElement.innerHTML = `
                        <div class="supernumerario-row">
                            <div class="supernumerario-content">
                                <div class="supernumerario-title">${sup.nombre || 'Sin nombre'}</div>
                                <div class="supernumerario-datetime">${fechaFormato}</div>
                                <div class="supernumerario-contract">Contrato: ${contratoNombre}</div>
                            </div>
                            <div class="supernumerario-actions">
                                <button class="btn-edit-supernumerario" data-contract-id="${contractDoc.id}" data-index="${index}" title="Editar">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="btn-delete-supernumerario" data-contract-id="${contractDoc.id}" data-index="${index}" title="Eliminar">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="supernumerario-description">${sup.trabajo || 'Sin descripción'}</div>
                    `;
                    
                    // Agregar event listener para editar
                    const editBtn = supElement.querySelector('.btn-edit-supernumerario');
                    editBtn.addEventListener('click', async () => {
                        await openEditModal(contractDoc.id, index, sup);
                    });
                    
                    // Agregar event listener para eliminar
                    const deleteBtn = supElement.querySelector('.btn-delete-supernumerario');
                    deleteBtn.addEventListener('click', async () => {
                        openConfirmDeleteModal(contractDoc.id, index);
                    });
                    
                    supernumerariosList.appendChild(supElement);
                });
            }
        }

        if (!hasSupernumerarios) {
            supernumerariosList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M16 11h6"></path>
                    </svg>
                    <h3>No hay supernumerarios registrados</h3>
                    <p>Los supernumerarios asignados aparecerán aquí</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading supernumerarios:", error);
        supernumerariosList.innerHTML = `
            <div class="empty-state">
                <p>Error al cargar los supernumerarios</p>
            </div>
        `;
    }
}

// Función para abrir modal de edición
async function openEditModal(contractId, index, supData) {
    // Llenar los campos del formulario de edición
    document.getElementById('edit-sup-fecha').value = supData.fecha || '';
    document.getElementById('edit-sup-nombre').value = supData.nombre || '';
    document.getElementById('edit-sup-trabajo').value = supData.trabajo || '';
    
    // Cargar contratos en el select de edición
    await loadContratos('#edit-sup-contrato');
    document.getElementById('edit-sup-contrato').value = contractId || '';
    
    // Guardar los datos para usar en el guardado
    document.getElementById('form-edit-supernumerario').dataset.contractId = contractId;
    document.getElementById('form-edit-supernumerario').dataset.index = index;
    
    document.getElementById('modal-edit-supernumerario').classList.remove('hidden');
}

// Función para guardar cambios en supernumerario
async function editSupernumerario(e) {
    e.preventDefault();
    
    const contractId = document.getElementById('form-edit-supernumerario').dataset.contractId;
    const index = parseInt(document.getElementById('form-edit-supernumerario').dataset.index);
    
    const fecha = document.getElementById('edit-sup-fecha').value;
    const nombre = document.getElementById('edit-sup-nombre').value;
    const trabajo = document.getElementById('edit-sup-trabajo').value;
    
    if (!fecha || !nombre || !trabajo) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        const supRef = doc(db, "supernumerarios", contractId);
        const supDoc = await getDoc(supRef);
        
        if (supDoc.exists()) {
            let supernumerarios = supDoc.data().supernumerarios || [];
            supernumerarios[index] = {
                fecha,
                nombre,
                trabajo,
                contratoId: contractId,
                updatedAt: new Date()
            };
            
            await setDoc(supRef, { supernumerarios }, { merge: true });
            
            // Cerrar modal y limpiar
            document.getElementById('modal-edit-supernumerario').classList.add('hidden');
            document.getElementById('form-edit-supernumerario').reset();
            
            // Recargar la lista
            loadSupernumerarios();
            showToast('Supernumerario actualizado correctamente', 'success');
        }
    } catch (error) {
        console.error("Error updating supernumerario:", error);
        showToast('Error al actualizar el supernumerario', 'error');
    }
}

// Función para abrir modal de confirmación de eliminación
function openConfirmDeleteModal(contractId, index) {
    deleteContractId = contractId;
    deleteIndex = index;
    document.getElementById('modal-confirm-delete').classList.remove('hidden');
}

// Función para cerrar modal de confirmación de eliminación
function closeConfirmDeleteModal() {
    document.getElementById('modal-confirm-delete').classList.add('hidden');
    deleteContractId = null;
    deleteIndex = null;
}

// Función para confirmar y ejecutar eliminación
async function confirmDelete() {
    if (deleteContractId !== null && deleteIndex !== null) {
        await deleteSupernumerario(deleteContractId, deleteIndex);
        closeConfirmDeleteModal();
    }
}

// Función para buscar supernumerarios
function searchSupernumerarios(query) {
    const items = document.querySelectorAll('.contract-item');
    query = query.toLowerCase();

    items.forEach(item => {
        const contractName = item.querySelector('h3').textContent.toLowerCase();
        const supernumerarios = Array.from(item.querySelectorAll('.supernumerario-item'))
            .map(sup => sup.textContent.toLowerCase());
        
        const matches = contractName.includes(query) || 
                        supernumerarios.some(sup => sup.includes(query));
        
        item.style.display = matches ? 'block' : 'none';
    });
}

// Event listeners
document.getElementById('btn-supernumerarios-search').addEventListener('click', () => {
    const query = document.getElementById('supernumerarios-search').value;
    searchSupernumerarios(query);
});

document.getElementById('supernumerarios-search').addEventListener('keyup', (e) => {
    searchSupernumerarios(e.target.value);
});

// Menú FAB
document.getElementById('btn-menu-fab').addEventListener('click', () => {
    document.getElementById('modal-supernumerario').classList.remove('hidden');
    loadContratos();
});

// Cerrar modal
document.getElementById('btn-close-supernumerario-modal').addEventListener('click', () => {
    document.getElementById('modal-supernumerario').classList.add('hidden');
});

document.getElementById('btn-cancel-supernumerario').addEventListener('click', () => {
    document.getElementById('modal-supernumerario').classList.add('hidden');
});

// Guardar supernumerario
document.getElementById('form-supernumerario').addEventListener('submit', saveSupernumerario);

// Event listeners para modal de edición
document.getElementById('btn-close-edit-supernumerario-modal').addEventListener('click', () => {
    document.getElementById('modal-edit-supernumerario').classList.add('hidden');
});

document.getElementById('btn-cancel-edit-supernumerario').addEventListener('click', () => {
    document.getElementById('modal-edit-supernumerario').classList.add('hidden');
});

document.getElementById('form-edit-supernumerario').addEventListener('submit', editSupernumerario);

// Event listeners para modal de confirmación de eliminación
document.getElementById('btn-cancel-delete').addEventListener('click', closeConfirmDeleteModal);

document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);

// Función para exportar a Excel
async function exportToExcel() {
    try {
        console.log('Iniciando exportación...');
        console.log('window.XLSX disponible:', !!window.XLSX);
        
        if (!window.XLSX) {
            showToast('La librería de Excel no está disponible. Por favor recarga la página.', 'error');
            return;
        }
        
        const contractsCollection = collection(db, "contracts");
        const contractsSnapshot = await getDocs(contractsCollection);
        console.log('Contratos obtenidos:', contractsSnapshot.size);
        
        let allSupernumerarios = [];
        let contractsMap = {}; // Mapeo de ID de contrato a nombre
        
        // Obtener todos los contratos y sus supernumerarios
        for (const contractDoc of contractsSnapshot.docs) {
            const contractData = contractDoc.data();
            contractsMap[contractDoc.id] = contractData.name || contractData.nombreContratista || 'Sin nombre';
            
            const supernumerariosData = await getContractSupernumerarios(contractDoc.id);
            
            if (supernumerariosData.supernumerarios && supernumerariosData.supernumerarios.length > 0) {
                supernumerariosData.supernumerarios.forEach(sup => {
                    allSupernumerarios.push({
                        Fecha: sup.fecha ? new Date(sup.fecha).toLocaleDateString('es-ES') : '',
                        'Nombre del Operario': sup.nombre || '',
                        'Trabajo Realizado': sup.trabajo || '',
                        'Contrato': contractsMap[contractDoc.id] || 'Sin contrato'
                    });
                });
            }
        }
        
        console.log('Total de supernumerarios:', allSupernumerarios.length);
        
        if (allSupernumerarios.length === 0) {
            showToast('No hay supernumerarios para exportar', 'error');
            return;
        }
        
        // Crear workbook con SheetJS
        const ws = window.XLSX.utils.json_to_sheet(allSupernumerarios);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Supernumerarios");
        
        // Ajustar el ancho de las columnas
        ws['!cols'] = [
            { wch: 15 }, // Fecha
            { wch: 25 }, // Nombre del Operario
            { wch: 40 }, // Trabajo Realizado
            { wch: 20 }  // Contrato
        ];
        
        console.log('Descargando archivo...');
        
        // Descargar archivo
        window.XLSX.writeFile(wb, `Supernumerarios_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`);
        
        console.log('Archivo descargado exitosamente');
        showToast('Archivo exportado exitosamente', 'success');
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        showToast('Error al exportar los datos: ' + error.message, 'error');
    }
}

// Event listener para botón de exportación
document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);// Actualizar navegación activa
document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === 'supernumerarios.html') {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});

// Cargar supernumerarios al iniciar
loadSupernumerarios();
