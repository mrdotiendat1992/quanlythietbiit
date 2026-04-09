// API Base
const API_URL = '/api';

// Utility functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Global initialization based on page
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on by an ID on the body or main element
    const pageId = document.body.id;
    
    if (pageId === 'page-dashboard') {
        initDashboard();
    } else if (pageId === 'page-departments') {
        initDepartments();
    } else if (pageId === 'page-equipments') {
        initEquipments();
    } else if (pageId === 'page-logs') {
        initLogs();
    }
});

// --- Dashboard ---
async function initDashboard() {
    const departments = await fetchAPI('/departments');
    const equipments = await fetchAPI('/equipments');
    
    if(departments) document.getElementById('stat-departments').innerText = departments.length;
    if(equipments) {
        document.getElementById('stat-equipments').innerText = equipments.length;
        
        // Group equipments by type
        const typeCounts = {};
        equipments.forEach(eq => {
            const eqType = eq.type && eq.type.trim() !== '' ? eq.type : 'Khác';
            typeCounts[eqType] = (typeCounts[eqType] || 0) + 1;
        });

        const container = document.getElementById('equipment-types-container');
        if (container) {
            container.innerHTML = '';
            const typesKeys = Object.keys(typeCounts);
            
            if (typesKeys.length === 0) {
                container.innerHTML = '<p style="color: var(--text-light); grid-column: 1 / -1;">Chưa có dữ liệu phân loại thiết bị.</p>';
            } else {
                for (const type of typesKeys) {
                    const count = typeCounts[type];
                    container.innerHTML += `
                        <div class="stat-card" style="padding: 15px;">
                            <h3 style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0;">${type}</h3>
                            <div class="value" style="font-size: 1.5rem; margin-top: 5px; color: var(--primary-color);">${count}</div>
                        </div>
                    `;
                }
            }
        }
    }
}

// --- Departments ---
async function initDepartments() {
    await loadDepartments();
    
    document.getElementById('form-department').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('dept-name').value;
        const description = document.getElementById('dept-desc').value;
        
        const res = await fetchAPI('/departments', 'POST', { name, description });
        if (res) {
            closeModal('modal-department');
            e.target.reset();
            await loadDepartments();
        }
    });
}

async function loadDepartments() {
    const departments = await fetchAPI('/departments');
    const tbody = document.getElementById('departments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (departments && departments.length > 0) {
        departments.forEach(dept => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dept.id}</td>
                <td>${dept.name}</td>
                <td>${dept.description || ''}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteDepartment(${dept.id})">Thùng rác</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}

async function deleteDepartment(id) {
    if (confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
        await fetchAPI(`/departments/${id}`, 'DELETE');
        await loadDepartments();
    }
}

// --- Equipments ---
async function initEquipments() {
    await loadEquipments();
    
    // Load departments for select dropdown
    const departments = await fetchAPI('/departments');
    const select = document.getElementById('eq-department');
    if (departments && select) {
        departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.id;
            opt.textContent = dept.name;
            select.appendChild(opt);
        });
    }

    document.getElementById('form-equipment').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('eq-name').value;
        const type = document.getElementById('eq-type').value;
        const status = document.getElementById('eq-status').value;
        const user_assigned = document.getElementById('eq-user').value;
        const dept_val = document.getElementById('eq-department').value;
        const department_id = dept_val ? parseInt(dept_val) : null;
        
        const res = await fetchAPI('/equipments', 'POST', { 
            name, type, status, user_assigned, department_id 
        });
        
        if (res) {
            closeModal('modal-equipment');
            e.target.reset();
            await loadEquipments();
        }
    });
}

async function loadEquipments() {
    const equipments = await fetchAPI('/equipments');
    // We also need departments to show the name
    const departments = await fetchAPI('/departments');
    const getDeptName = (id) => departments?.find(d => d.id === id)?.name || 'N/A';

    const tbody = document.getElementById('equipments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (equipments && equipments.length > 0) {
        equipments.forEach(eq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${eq.id}</td>
                <td>${eq.name}</td>
                <td>${eq.type}</td>
                <td>${eq.status}</td>
                <td>${getDeptName(eq.department_id)}</td>
                <td>${eq.user_assigned || ''}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteEquipment(${eq.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}

async function deleteEquipment(id) {
    if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
        await fetchAPI(`/equipments/${id}`, 'DELETE');
        await loadEquipments();
    }
}

// --- IT Logs ---
async function initLogs() {
    await loadLogs();
    
    // Load equipments for select dropdown
    const equipments = await fetchAPI('/equipments');
    const select = document.getElementById('log-equipment');
    if (equipments && select) {
        equipments.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.id;
            opt.textContent = eq.name;
            select.appendChild(opt);
        });
    }

    document.getElementById('form-log').addEventListener('submit', async (e) => {
        e.preventDefault();
        const it_personnel = document.getElementById('log-personnel').value;
        const description = document.getElementById('log-desc').value;
        const status = document.getElementById('log-status').value;
        const eq_val = document.getElementById('log-equipment').value;
        const equipment_id = eq_val ? parseInt(eq_val) : null;
        
        const res = await fetchAPI('/logs', 'POST', { 
            it_personnel, description, status, equipment_id 
        });
        
        if (res) {
            closeModal('modal-log');
            e.target.reset();
            await loadLogs();
        }
    });
}

async function loadLogs() {
    const logs = await fetchAPI('/logs');
    const equipments = await fetchAPI('/equipments');
    const getEqName = (id) => equipments?.find(e => e.id === id)?.name || '-';

    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (logs && logs.length > 0) {
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(log.date).toLocaleString()}</td>
                <td>${log.it_personnel}</td>
                <td>${log.description}</td>
                <td>${getEqName(log.equipment_id)}</td>
                <td>${log.status}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}
