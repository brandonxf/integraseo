let contracts = []
let currentContractId = null
let currentView = "contracts"
let currentMonth = new Date().getMonth()
let currentYear = new Date().getFullYear()

// Load data from localStorage
function loadData() {
  const savedContracts = localStorage.getItem("contracts")
  if (savedContracts) {
    contracts = JSON.parse(savedContracts)
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("contracts", JSON.stringify(contracts))
}

// Initialize app
function init() {
  loadData()
  renderContracts()
  setupEventListeners()
  renderCalendar()
  renderReminders()
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view
      switchView(view)
    })
  })

  // Add contract button
  document.getElementById("btn-add-contract").addEventListener("click", () => {
    if (currentView === "contracts") {
      openContractModal()
    } else if (currentView === "calendar") {
      openEventModal()
    } else if (currentView === "reminders") {
      openReminderModal()
    }
  })

  // Contract form
  document.getElementById("form-contract").addEventListener("submit", handleContractSubmit)
  document.getElementById("btn-cancel-contract").addEventListener("click", closeContractModal)
  document.getElementById("btn-close-contract-modal").addEventListener("click", closeContractModal)

  // Back button
  document.getElementById("btn-back-detail").addEventListener("click", () => {
    switchView("contracts")
  })

  // Edit contract button
  document.getElementById("btn-edit-contract").addEventListener("click", () => {
    openContractModal(currentContractId)
  })

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab
      switchTab(tabName)
    })
  })

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

// Switch view
function switchView(view) {
  currentView = view

  // Update navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view)
  })

  // Update views
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.add("hidden")
  })

  if (view === "contracts") {
    document.getElementById("contracts-view").classList.remove("hidden")
    document.getElementById("header-title").textContent = "Contratos"
    document.getElementById("btn-add-contract").style.display = "flex"
  } else if (view === "calendar") {
    document.getElementById("calendar-view").classList.remove("hidden")
    document.getElementById("header-title").textContent = "Calendario"
    document.getElementById("btn-add-contract").style.display = "flex"
    renderCalendar()
  } else if (view === "reminders") {
    document.getElementById("reminders-view").classList.remove("hidden")
    document.getElementById("header-title").textContent = "Recordatorios"
    document.getElementById("btn-add-contract").style.display = "flex"
    renderReminders()
  }
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
function renderContracts() {
  const contractsList = document.getElementById("contracts-list")

  if (contracts.length === 0) {
    contractsList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <h3>No hay contratos</h3>
                <p>Añade tu primer contrato para comenzar</p>
            </div>
        `
    return
  }

  contractsList.innerHTML = contracts
    .map((contract) => {
      const initials = contract.name.substring(0, 2).toUpperCase()
      const lastNote =
        contract.notes && contract.notes.length > 0
          ? contract.notes[contract.notes.length - 1].content
          : contract.client

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
function showContractDetail(id) {
  currentContractId = id
  const contract = contracts.find((c) => c.id === id)

  if (!contract) return

  document.getElementById("detail-title").textContent = contract.name
  document.getElementById("detail-subtitle").textContent = contract.client

  renderContractInfo(contract)
  renderNotes(contract)
  renderWorkers(contract)

  document.getElementById("contracts-view").classList.add("hidden")
  document.getElementById("contract-detail-view").classList.remove("hidden")
  document.getElementById("btn-add-contract").style.display = "none"
}

// Render contract info
function renderContractInfo(contract) {
  const infoSection = document.getElementById("contract-info")

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
            <span class="info-label">Valor</span>
            <span class="info-value">${contract.value || "No especificado"}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Fecha de Inicio</span>
            <span class="info-value">${formatDate(contract.startDate)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Fecha de Fin</span>
            <span class="info-value">${formatDate(contract.endDate)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Estado</span>
            <span class="contract-status ${contract.status}">${getStatusText(contract.status)}</span>
        </div>
    `
}

// Render notes
function renderNotes(contract) {
  const notesList = document.getElementById("notes-list")

  if (!contract.notes || contract.notes.length === 0) {
    notesList.innerHTML = `
            <div class="empty-state">
                <h3>No hay notas</h3>
                <p>Añade una nota para este contrato</p>
            </div>
        `
    return
  }

  notesList.innerHTML = contract.notes
    .map(
      (note) => `
        <div class="note-item">
            <div class="note-header">
                <span class="note-datetime">${formatDate(note.date)} - ${note.time}</span>
                <button class="btn-delete" onclick="deleteNote('${contract.id}', '${note.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div class="note-content">${note.content}</div>
        </div>
    `,
    )
    .join("")
}

// Render workers
function renderWorkers(contract) {
  const workersList = document.getElementById("workers-list")

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
function openContractModal(id = null) {
  const modal = document.getElementById("modal-contract")
  const form = document.getElementById("form-contract")
  const title = document.getElementById("modal-contract-title")

  form.reset()

  if (id) {
    const contract = contracts.find((c) => c.id === id)
    if (contract) {
      title.textContent = "Editar Contrato"
      document.getElementById("contract-name").value = contract.name
      document.getElementById("contract-client").value = contract.client
      document.getElementById("contract-location").value = contract.location || ""
      document.getElementById("contract-value").value = contract.value || ""
      document.getElementById("contract-start").value = contract.startDate
      document.getElementById("contract-end").value = contract.endDate
      document.getElementById("contract-status").value = contract.status
      form.dataset.editId = id
    }
  } else {
    title.textContent = "Nuevo Contrato"
    delete form.dataset.editId
  }

  modal.classList.remove("hidden")
}

function closeContractModal() {
  document.getElementById("modal-contract").classList.add("hidden")
}

function handleContractSubmit(e) {
  e.preventDefault()

  const form = e.target
  const editId = form.dataset.editId

  const contractData = {
    name: document.getElementById("contract-name").value,
    client: document.getElementById("contract-client").value,
    location: document.getElementById("contract-location").value,
    value: document.getElementById("contract-value").value,
    startDate: document.getElementById("contract-start").value,
    endDate: document.getElementById("contract-end").value,
    status: document.getElementById("contract-status").value,
  }

  if (editId) {
    const index = contracts.findIndex((c) => c.id === editId)
    contracts[index] = { ...contracts[index], ...contractData }
    showContractDetail(editId)
  } else {
    const newContract = {
      id: Date.now().toString(),
      ...contractData,
      notes: [],
      workers: [],
    }
    contracts.push(newContract)
    renderContracts()
  }

  saveData()
  closeContractModal()
}

// Note modal
function openNoteModal() {
  const modal = document.getElementById("modal-note")
  const form = document.getElementById("form-note")

  form.reset()

  // Set current date and time
  const now = new Date()
  document.getElementById("note-date").value = now.toISOString().split("T")[0]
  document.getElementById("note-time").value = now.toTimeString().slice(0, 5)

  modal.classList.remove("hidden")
}

function closeNoteModal() {
  document.getElementById("modal-note").classList.add("hidden")
}

function handleNoteSubmit(e) {
  e.preventDefault()

  const contract = contracts.find((c) => c.id === currentContractId)
  if (!contract) return

  const note = {
    id: Date.now().toString(),
    date: document.getElementById("note-date").value,
    time: document.getElementById("note-time").value,
    content: document.getElementById("note-content").value,
  }

  if (!contract.notes) {
    contract.notes = []
  }

  contract.notes.push(note)
  saveData()
  renderNotes(contract)
  renderContracts()
  closeNoteModal()
}

function deleteNote(contractId, noteId) {
  const contract = contracts.find((c) => c.id === contractId)
  if (!contract) return

  contract.notes = contract.notes.filter((n) => n.id !== noteId)
  saveData()
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

function handleWorkerSubmit(e) {
  e.preventDefault()

  const contract = contracts.find((c) => c.id === currentContractId)
  if (!contract) return

  const worker = {
    id: Date.now().toString(),
    name: document.getElementById("worker-name").value,
    position: document.getElementById("worker-position").value,
    phone: document.getElementById("worker-phone").value,
  }

  if (!contract.workers) {
    contract.workers = []
  }

  contract.workers.push(worker)
  saveData()
  renderWorkers(contract)
  closeWorkerModal()
}

function deleteWorker(contractId, workerId) {
  const contract = contracts.find((c) => c.id === contractId)
  if (!contract) return

  contract.workers = contract.workers.filter((w) => w.id !== workerId)
  saveData()
  renderWorkers(contract)
}

// Calendar
function renderCalendar() {
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
  renderEvents()
}

function checkDateHasNotes(dateStr) {
  return contracts.some((contract) => contract.notes && contract.notes.some((note) => note.date === dateStr))
}

function renderEvents() {
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
  const events = JSON.parse(localStorage.getItem("events") || "[]")
  return events.filter((event) => {
    const eventDate = new Date(event.date)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  })
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

function handleEventSubmit(e) {
  e.preventDefault()

  const events = JSON.parse(localStorage.getItem("events") || "[]")

  const event = {
    id: Date.now().toString(),
    title: document.getElementById("event-title").value,
    date: document.getElementById("event-date").value,
    time: document.getElementById("event-time").value,
    description: document.getElementById("event-description").value,
  }

  events.push(event)
  localStorage.setItem("events", JSON.stringify(events))

  renderCalendar()
  closeEventModal()

  // Schedule notification
  scheduleNotification(event)
}

function deleteEvent(eventId) {
  const events = JSON.parse(localStorage.getItem("events") || "[]")
  const filtered = events.filter((e) => e.id !== eventId)
  localStorage.setItem("events", JSON.stringify(filtered))
  renderEvents()
}

// Reminders
function renderReminders() {
  const remindersList = document.getElementById("reminders-list")
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]")

  if (reminders.length === 0) {
    remindersList.innerHTML = `
            <div class="empty-state">
                <h3>No hay recordatorios</h3>
                <p>Añade recordatorios para no olvidar tareas importantes</p>
            </div>
        `
    return
  }

  remindersList.innerHTML = reminders
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

function toggleReminder(reminderId) {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]")
  const reminder = reminders.find((r) => r.id === reminderId)
  if (reminder) {
    reminder.completed = !reminder.completed
    localStorage.setItem("reminders", JSON.stringify(reminders))
    renderReminders()
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

function handleReminderSubmit(e) {
  e.preventDefault()

  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]")

  const reminder = {
    id: Date.now().toString(),
    title: document.getElementById("reminder-title").value,
    date: document.getElementById("reminder-date").value,
    time: document.getElementById("reminder-time").value,
    description: document.getElementById("reminder-description").value,
    completed: false,
  }

  reminders.push(reminder)
  localStorage.setItem("reminders", JSON.stringify(reminders))

  renderReminders()
  closeReminderModal()

  // Schedule notification
  scheduleNotification(reminder)
}

function deleteReminder(reminderId) {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]")
  const filtered = reminders.filter((r) => r.id !== reminderId)
  localStorage.setItem("reminders", JSON.stringify(filtered))
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

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", init)
