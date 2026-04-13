// Supabase config is loaded from `supabase-config.js`
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const EQUIPMENT_SPEC_FIELDS = {
    'Máy tính bàn': [
        { key: 'main_code', label: 'Mã main' },
        { key: 'chip', label: 'Chip' },
        { key: 'ram', label: 'RAM' },
        { key: 'hard_drive', label: 'Ổ cứng' },
        { key: 'monitor', label: 'Màn hình' },
        { key: 'keyboard', label: 'Bàn phím' },
        { key: 'mouse', label: 'Chuột' },
    ],
    'Laptop': [
        { key: 'main_code', label: 'Mã main' },
        { key: 'chip', label: 'Chip' },
        { key: 'ram', label: 'RAM' },
        { key: 'hard_drive', label: 'Ổ cứng' },
        { key: 'monitor', label: 'Màn hình' },
        { key: 'keyboard', label: 'Bàn phím' },
        { key: 'mouse', label: 'Chuột' },
    ],
    'Máy in': [
        { key: 'ip_address', label: 'IP' },
        { key: 'printer_model', label: 'Loại máy' },
    ],
};

let equipmentCache = [];
let departmentCache = [];
let logCache = [];

// Utility functions
async function fetchAPI(endpoint, method = 'GET', data = null) {
    if (!supabaseClient) {
        console.error('Supabase client is not configured.');
        return null;
    }

    const path = endpoint.split('?')[0].replace(/^\//, '');
    const match = path.match(/^(departments|equipments|logs)(?:\/(\d+))?$/);
    if (!match) {
        console.error('Unsupported endpoint:', endpoint);
        return null;
    }

    const table = match[1] === 'logs' ? 'it_logs' : match[1];
    const rowId = match[2] ? parseInt(match[2], 10) : null;

    try {
        if (method === 'GET') {
            let query = supabaseClient.from(table).select('*');
            if (table === 'logs') {
                query = query.order('date', { ascending: false });
            } else {
                query = query.order('id', { ascending: true });
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }

        if (method === 'POST') {
            const { data: result, error } = await supabaseClient.from(table).insert([data]).select('*').single();
            if (error) throw error;
            return result;
        }

        if (method === 'PUT') {
            if (!rowId) throw new Error('Missing row id');
            const { data: result, error } = await supabaseClient.from(table).update(data).eq('id', rowId).select('*').single();
            if (error) throw error;
            return result;
        }

        if (method === 'DELETE') {
            if (!rowId) throw new Error('Missing row id');
            const { error } = await supabaseClient.from(table).delete().eq('id', rowId);
            if (error) throw error;
            return { ok: true };
        }

        throw new Error(`Unsupported method: ${method}`);
    } catch (error) {
        console.error('Supabase Error:', error);
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

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getDepartmentName(id) {
    return departmentCache.find(item => item.id === id)?.name || 'N/A';
}

function getEquipmentSpecPanelKey(type) {
    if (type === 'Máy tính bàn' || type === 'Laptop') return 'computer';
    if (type === 'Máy in') return 'printer';
    return 'other';
}

function setEquipmentType(type) {
    const typeSelect = document.getElementById('eq-type');
    if (typeSelect) typeSelect.value = type;

    document.querySelectorAll('[data-equipment-type]').forEach(button => {
        button.classList.toggle('is-active', button.dataset.equipmentType === type);
    });

    syncEquipmentSpecPanels(type);
}

function clearEquipmentSpecInputs() {
    getEquipmentSpecFields('Máy tính bàn').forEach(field => {
        const input = document.getElementById(`eq-spec-${field.key}`);
        if (input) input.value = '';
    });
    getEquipmentSpecFields('Laptop').forEach(field => {
        const input = document.getElementById(`eq-spec-${field.key}`);
        if (input) input.value = '';
    });
    getEquipmentSpecFields('Máy in').forEach(field => {
        const input = document.getElementById(`eq-spec-${field.key}`);
        if (input) input.value = '';
    });
}

function populateEquipmentSpecInputs(type, specs = {}) {
    getEquipmentSpecFields(type).forEach(field => {
        const input = document.getElementById(`eq-spec-${field.key}`);
        if (input) input.value = specs[field.key] || '';
    });
}

function resetEquipmentModal() {
    const form = document.getElementById('form-equipment');
    if (form) form.reset();
    const hiddenId = document.getElementById('eq-id');
    if (hiddenId) hiddenId.value = '';
    const title = document.getElementById('equipment-modal-title');
    if (title) title.textContent = 'Thêm thiết bị mới';
    const submitBtn = document.getElementById('equipment-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Lưu';
    clearEquipmentSpecInputs();
    setEquipmentType('Máy tính bàn');
}

function openEquipmentModal(equipment = null, departmentId = null) {
    resetEquipmentModal();

    if (equipment) {
        const hiddenId = document.getElementById('eq-id');
        if (hiddenId) hiddenId.value = equipment.id;

        const title = document.getElementById('equipment-modal-title');
        if (title) title.textContent = 'Sửa thiết bị';

        const submitBtn = document.getElementById('equipment-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Cập nhật';

        document.getElementById('eq-name').value = equipment.name || '';
        document.getElementById('eq-status').value = equipment.status || 'Đang sử dụng';
        document.getElementById('eq-user').value = equipment.user_assigned || '';
        document.getElementById('eq-department').value = equipment.department_id ? String(equipment.department_id) : '';

        setEquipmentType(equipment.type || 'Máy tính bàn');
        populateEquipmentSpecInputs(equipment.type || 'Máy tính bàn', equipment.specs || {});
    } else if (departmentId) {
        const departmentSelect = document.getElementById('eq-department');
        if (departmentSelect) departmentSelect.value = String(departmentId);
    }

    openModal('modal-equipment');
}

function getEquipmentSpecFields(type) {
    return EQUIPMENT_SPEC_FIELDS[type] || [];
}

function syncEquipmentSpecPanels(type) {
    const activePanel = getEquipmentSpecPanelKey(type);
    document.querySelectorAll('[data-equipment-spec-panel]').forEach(panel => {
        panel.classList.toggle('is-hidden', panel.dataset.equipmentSpecPanel !== activePanel);
    });
}

function collectEquipmentSpecs(type) {
    const fields = getEquipmentSpecFields(type);
    if (fields.length === 0) return null;

    const specs = {};
    fields.forEach(field => {
        const input = document.getElementById(`eq-spec-${field.key}`);
        const value = input?.value.trim();
        if (value) specs[field.key] = value;
    });

    return Object.keys(specs).length > 0 ? specs : null;
}

function formatEquipmentSpecs(type, specs) {
    if (!specs) return '-';

    const fields = getEquipmentSpecFields(type);
    if (fields.length === 0) {
        return Object.values(specs).join(' | ') || '-';
    }

    return fields
        .map(field => specs[field.key] ? `${field.label}: ${specs[field.key]}` : null)
        .filter(Boolean)
        .join(' | ') || '-';
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
                            <h3 style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0;">${escapeHtml(type)}</h3>
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
        const deptId = document.getElementById('dept-id').value;
        const name = document.getElementById('dept-name').value.trim();
        const description = document.getElementById('dept-desc').value;

        if (deptId && !departmentCache.find(item => item.id === parseInt(deptId))) {
            alert('Phòng ban này không còn tồn tại. Vui lòng tải lại trang và thử lại.');
            await loadDepartments();
            return;
        }
        
        const payload = { name, description };
        const endpoint = deptId ? `/departments/${deptId}` : '/departments';
        const method = deptId ? 'PUT' : 'POST';
        const res = await fetchAPI(endpoint, method, payload);
        if (res) {
            closeModal('modal-department');
            resetDepartmentModal();
            await loadDepartments();
        } else {
            alert('Không thể lưu phòng ban. Hãy kiểm tra tên phòng ban có bị trùng hoặc để trống không.');
        }
    });

    const modal = document.getElementById('modal-department');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('modal-department');
        }
    });
}

function resetDepartmentModal() {
    const form = document.getElementById('form-department');
    if (form) form.reset();
    const hiddenId = document.getElementById('dept-id');
    if (hiddenId) hiddenId.value = '';
    const title = document.getElementById('department-modal-title');
    if (title) title.textContent = 'Thêm phòng ban mới';
    const submitBtn = document.getElementById('department-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Lưu';
}

function openDepartmentModal(department = null) {
    resetDepartmentModal();

    if (department) {
        const hiddenId = document.getElementById('dept-id');
        if (hiddenId) hiddenId.value = department.id;

        const title = document.getElementById('department-modal-title');
        if (title) title.textContent = 'Sửa phòng ban';

        const submitBtn = document.getElementById('department-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Cập nhật';

        document.getElementById('dept-name').value = department.name || '';
        document.getElementById('dept-desc').value = department.description || '';
    }

    openModal('modal-department');
}

function setLogDepartment(departmentId) {
    const select = document.getElementById('log-department-id');
    if (select) select.value = departmentId ? String(departmentId) : '';
}

function resetLogModal() {
    const form = document.getElementById('form-log');
    if (form) form.reset();
    const hiddenId = document.getElementById('log-id');
    if (hiddenId) hiddenId.value = '';
    setLogDepartment(null);
    const title = document.getElementById('log-modal-title');
    if (title) title.textContent = 'Ghi log công việc mới';
    const submitBtn = document.getElementById('log-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Lưu Log';
}

function openLogModal(log = null, departmentId = null) {
    resetLogModal();

    if (log) {
        const hiddenId = document.getElementById('log-id');
        if (hiddenId) hiddenId.value = log.id;

        const title = document.getElementById('log-modal-title');
        if (title) title.textContent = 'Sửa log công việc';

        const submitBtn = document.getElementById('log-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Cập nhật';

        document.getElementById('log-personnel').value = log.it_personnel || '';
        document.getElementById('log-desc').value = log.description || '';
        document.getElementById('log-status').value = log.status || 'Đã hoàn thành';
        document.getElementById('log-equipment').value = log.equipment_id ? String(log.equipment_id) : '';
        setLogDepartment(log.department_id || log.department?.id || null);
    } else if (departmentId) {
        setLogDepartment(departmentId);
    }

    openModal('modal-log');
}

async function loadDepartments() {
    const departments = await fetchAPI('/departments');
    departmentCache = Array.isArray(departments) ? departments : [];
    const tbody = document.getElementById('departments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (departments && departments.length > 0) {
        departments.forEach(dept => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dept.id}</td>
                <td>${escapeHtml(dept.name)}</td>
                <td>${escapeHtml(dept.description || '')}</td>
                <td>
                    <button class="btn btn-primary" style="margin-right: 8px;" onclick="addEquipmentToDepartment(${dept.id})">+ Thiết bị</button>
                    <button class="btn btn-primary" style="margin-right: 8px;" onclick="addLogToDepartment(${dept.id})">+ Log IT</button>
                </td>
                <td>
                    <button class="btn btn-primary" style="margin-right: 8px;" onclick="editDepartment(${dept.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteDepartment(${dept.id})">Thùng rác</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}

function editDepartment(id) {
    const department = departmentCache.find(item => item.id === id);
    if (!department) return;
    openDepartmentModal(department);
}

function addEquipmentToDepartment(id) {
    window.location.href = `equipments.html?dept=${id}`;
}

function addLogToDepartment(id) {
    window.location.href = `logs.html?dept=${id}`;
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

    const typeSelect = document.getElementById('eq-type');
    setEquipmentType(typeSelect?.value || 'Máy tính bàn');
    typeSelect?.addEventListener('change', (e) => setEquipmentType(e.target.value));

    document.querySelectorAll('[data-equipment-type]').forEach(button => {
        button.addEventListener('click', () => setEquipmentType(button.dataset.equipmentType));
    });

    const modal = document.getElementById('modal-equipment');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('modal-equipment');
        }
    });

    document.getElementById('form-equipment').addEventListener('submit', async (e) => {
        e.preventDefault();
        const eqId = document.getElementById('eq-id').value;
        const name = document.getElementById('eq-name').value;
        const type = document.getElementById('eq-type').value;
        const status = document.getElementById('eq-status').value;
        const user_assigned = document.getElementById('eq-user').value;
        const dept_val = document.getElementById('eq-department').value;
        const department_id = dept_val ? parseInt(dept_val) : null;
        const specs = collectEquipmentSpecs(type);

        const payload = { name, type, status, user_assigned, department_id, specs };
        const endpoint = eqId ? `/equipments/${eqId}` : '/equipments';
        const method = eqId ? 'PUT' : 'POST';
        
        const res = await fetchAPI(endpoint, method, payload);
        
        if (res) {
            closeModal('modal-equipment');
            resetEquipmentModal();
            await loadEquipments();
        }
    });

    const deptId = new URLSearchParams(window.location.search).get('dept');
    if (deptId) {
        openEquipmentModal(null, parseInt(deptId));
    }
}

async function loadEquipments() {
    const equipments = await fetchAPI('/equipments');
    equipmentCache = Array.isArray(equipments) ? equipments : [];
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
                <td>${escapeHtml(eq.name)}</td>
                <td>${escapeHtml(eq.type)}</td>
                <td>${escapeHtml(formatEquipmentSpecs(eq.type, eq.specs))}</td>
                <td>${escapeHtml(eq.status)}</td>
                <td>${escapeHtml(getDeptName(eq.department_id))}</td>
                <td>${escapeHtml(eq.user_assigned || '')}</td>
                <td>
                    <button class="btn btn-primary" style="margin-right: 8px;" onclick="editEquipment(${eq.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteEquipment(${eq.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}

function editEquipment(id) {
    const equipment = equipmentCache.find(item => item.id === id);
    if (!equipment) return;
    openEquipmentModal(equipment);
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
    
    const departments = await fetchAPI('/departments');
    departmentCache = Array.isArray(departments) ? departments : departmentCache;
    const departmentSelect = document.getElementById('log-department-id');
    if (departmentSelect) {
        departmentSelect.innerHTML = '<option value="">-- Chọn phòng ban --</option>';
        departmentCache.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.id;
            opt.textContent = dept.name;
            departmentSelect.appendChild(opt);
        });
    }

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

    const modal = document.getElementById('modal-log');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal('modal-log');
        }
    });

    document.getElementById('form-log').addEventListener('submit', async (e) => {
        e.preventDefault();
        const logId = document.getElementById('log-id').value;
        const it_personnel = document.getElementById('log-personnel').value;
        const description = document.getElementById('log-desc').value;
        const status = document.getElementById('log-status').value;
        const eq_val = document.getElementById('log-equipment').value;
        const equipment_id = eq_val ? parseInt(eq_val) : null;
        const department_val = document.getElementById('log-department-id').value;
        const department_id = department_val ? parseInt(department_val) : null;

        const payload = { it_personnel, description, status, equipment_id, department_id };
        const endpoint = logId ? `/logs/${logId}` : '/logs';
        const method = logId ? 'PUT' : 'POST';
        const res = await fetchAPI(endpoint, method, payload);
        
        if (res) {
            closeModal('modal-log');
            resetLogModal();
            await loadLogs();
        }
    });

    const deptId = new URLSearchParams(window.location.search).get('dept');
    if (deptId) {
        openLogModal(null, parseInt(deptId));
    }
}

async function loadLogs() {
    const logs = await fetchAPI('/logs');
    logCache = Array.isArray(logs) ? logs : [];
    const equipments = await fetchAPI('/equipments');
    const departments = await fetchAPI('/departments');
    departmentCache = Array.isArray(departments) ? departments : departmentCache;
    const getEqName = (id) => equipments?.find(e => e.id === id)?.name || '-';

    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (logs && logs.length > 0) {
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(log.date).toLocaleString()}</td>
                <td>${escapeHtml(log.it_personnel)}</td>
                <td>${escapeHtml(log.description)}</td>
                <td>${escapeHtml(getEqName(log.equipment_id))}</td>
                <td>${escapeHtml(getDepartmentName(log.department_id || log.department?.id))}</td>
                <td>${escapeHtml(log.status)}</td>
                <td>
                    <button class="btn btn-primary" style="margin-right: 8px;" onclick="editLog(${log.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteLog(${log.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có dữ liệu</td></tr>';
    }
}

function editLog(id) {
    const log = logCache.find(item => item.id === id);
    if (!log) return;
    openLogModal(log);
}

async function deleteLog(id) {
    if (confirm('Bạn có chắc chắn muốn xóa log này?')) {
        await fetchAPI(`/logs/${id}`, 'DELETE');
        await loadLogs();
    }
}
