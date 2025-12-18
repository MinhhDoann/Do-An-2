// --- Quản lý Trạng thái ---
let editingContainerId = null; 
let editingCargoId = null; 
let editingTransportId = null; // Quản lý trạng thái sửa vận tải

const DB = { 
    containers: [], 
    cargo: [], 
    transports: [], 
    docs: [], 
    partners: [], 
    staff: [], 
    equip: [] 
};

// --- 1. Quản lý Lưu trữ (LocalStorage) ---
function loadDB() { 
    try { 
        const raw = localStorage.getItem('cl_db'); 
        if (raw) Object.assign(DB, JSON.parse(raw)); 
    } catch (e) { console.warn("Lỗi nạp dữ liệu:", e); } 
}

function saveDB() { 
    localStorage.setItem('cl_db', JSON.stringify(DB)); 
    renderAll(); 
}

// --- 2. Điều hướng (Navigation) ---
document.getElementById('mainNav').addEventListener('click', e => {
    if (e.target.matches('button')) {
        const s = e.target.dataset.section; 
        document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active')); 
        e.target.classList.add('active'); 
        showSection(s);
    }
});

function showSection(id) { 
    document.querySelectorAll('.card-section').forEach(sec => sec.style.display = sec.id === id ? '' : 'none'); 
    const title = document.querySelector('[data-section="' + id + '"]')?.textContent;
    document.getElementById('sectionTitle').textContent = title || 'Tổng quan';
    renderAll(); 
}

// --- 3. Quản lý Container ---
document.getElementById('saveContainer').addEventListener('click', () => {
    const no = document.getElementById('cNumber').value.trim();
    if (!no) return alert('Nhập số hiệu container');

    const data = {
        no,
        type: document.getElementById('cType').value,
        loc: document.getElementById('cLocation').value,
        status: document.getElementById('cStatus').value
    };

    if (editingContainerId) {
        const idx = DB.containers.findIndex(c => c.id === editingContainerId);
        if (idx !== -1) DB.containers[idx] = { ...DB.containers[idx], ...data };
        editingContainerId = null;
        document.getElementById('saveContainer').textContent = 'Lưu';
    } else {
        if (DB.containers.some(c => c.no.toLowerCase() === no.toLowerCase())) return alert('Số hiệu đã tồn tại');
        DB.containers.unshift({ id: Date.now(), ...data });
    }
    saveDB(); 
    clearContainerForm();
});

function editContainer(id) {
    const c = DB.containers.find(item => item.id === id);
    if (!c) return;
    document.getElementById('cNumber').value = c.no;
    document.getElementById('cType').value = c.type;
    document.getElementById('cLocation').value = c.loc;
    document.getElementById('cStatus').value = c.status;
    editingContainerId = id;
    document.getElementById('saveContainer').textContent = 'Cập nhật';
}

function removeContainer(id) {
    if(confirm('Xóa container này?')) { 
        DB.containers = DB.containers.filter(c => c.id !== id); 
        saveDB(); 
    }
}

function clearContainerForm() { 
    ['cNumber', 'cLocation'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    editingContainerId = null; 
    document.getElementById('saveContainer').textContent = 'Lưu';
}

// --- 4. Quản lý Vận tải (Sửa/Xóa/Liên kết Container) ---
document.getElementById('saveTransport').addEventListener('click', () => {
    const ref = document.getElementById('tRef').value.trim();
    const container = document.getElementById('tContainer').value;
    const vehicle = document.getElementById('tVehicle').value.trim();

    if (!ref || !container || !vehicle) return alert('Vui lòng nhập Mã Booking, Chọn Container và Số xe');

    const data = {
        ref,
        container,
        type: document.getElementById('tType').value,
        vehicle,
        eta: document.getElementById('tETA').value
    };

    if (editingTransportId) {
        const idx = DB.transports.findIndex(t => t.id === editingTransportId);
        if (idx !== -1) DB.transports[idx] = { ...DB.transports[idx], ...data };
        editingTransportId = null;
        document.getElementById('saveTransport').textContent = 'Lưu';
    } else {
        DB.transports.unshift({ id: Date.now(), ...data });
    }
    saveDB();
    clearTransportForm();
});

function editTransport(id) {
    const t = DB.transports.find(item => item.id === id);
    if (!t) return;
    document.getElementById('tRef').value = t.ref;
    document.getElementById('tContainer').value = t.container;
    document.getElementById('tType').value = t.type;
    document.getElementById('tVehicle').value = t.vehicle;
    document.getElementById('tETA').value = t.eta;
    
    editingTransportId = id;
    document.getElementById('saveTransport').textContent = 'Cập nhật';
}

function removeTransport(id) {
    if(confirm('Xóa lịch trình vận tải này?')) {
        DB.transports = DB.transports.filter(t => t.id !== id);
        saveDB();
    }
}

function clearTransportForm() {
    ['tRef', 'tVehicle', 'tETA', 'tContainer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    editingTransportId = null;
    document.getElementById('saveTransport').textContent = 'Lưu';
}

// --- 5. Sơ đồ bãi (Yard Map) ---
function renderYard() {
    const yard = document.getElementById('yard');
    if (!yard) return;
    yard.innerHTML = '';
    
    // Hiển thị 32 ô bãi
    for (let i = 0; i < 32; i++) {
        const cell = document.createElement('div');
        cell.className = 'card';
        cell.style.cssText = 'padding:12px; text-align:center; cursor:pointer; min-height:60px; display:flex; align-items:center; justify-content:center; border: 1px solid #ddd;';
        
        const containerAtPos = DB.containers[i];
        cell.innerHTML = containerAtPos ? `<b>${containerAtPos.no}</b>` : '<span style="color:#ccc">Trống</span>';
        
        if (containerAtPos) {
            cell.style.background = containerAtPos.status === 'Full' ? '#dcfce7' : '#fef9c3';
        }

        cell.addEventListener('click', () => {
            const currentNo = containerAtPos ? containerAtPos.no : 'empty';
            const newNo = prompt('Nhập số container cho ô này (nhập "empty" để xóa):', currentNo);
            
            if (newNo === null) return;
            
            if (newNo.toLowerCase() === 'empty') {
                if (DB.containers[i]) {
                    DB.containers.splice(i, 1);
                    saveDB();
                }
            } else {
                const rec = { id: Date.now(), no: newNo, type: '20DC', loc: 'Yard', status: 'Empty' };
                DB.containers[i] = rec;
                saveDB();
            }
        });
        yard.appendChild(cell);
    }
}

// --- 6. Tiện ích & Render ---
function populateAllSelects() { 
    const selects = [
        { id: 'gContainer', label: '- Chọn container chứa hàng -' },
        { id: 'tContainer', label: '-- Chọn container trên xe --' }
    ];

    selects.forEach(selConfig => {
        const el = document.getElementById(selConfig.id);
        if (el) {
            const currentVal = el.value;
            el.innerHTML = `<option value="">${selConfig.label}</option>` + 
                DB.containers.map(c => `<option value="${c.no}">${c.no} (${c.type})</option>`).join('');
            el.value = currentVal;
        }
    });
}

function renderContainers() { 
    const tbody = document.querySelector('#tblContainers tbody'); 
    if (!tbody) return;
    tbody.innerHTML = DB.containers.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${c.no}</strong></td>
            <td>${c.type}</td>
            <td>${c.loc}</td>
            <td>${c.status}</td>
            <td>
                <button class="btn" onclick="editContainer(${c.id})" style="background:#f59e0b; padding:4px 8px">Sửa</button>
                <button class="btn" onclick="removeContainer(${c.id})" style="background:#ef4444; padding:4px 8px">Xóa</button>
            </td>
        </tr>`).join('');
}

function renderTransport() {
    const tbody = document.querySelector('#tblTransport tbody');
    if (!tbody) return;
    tbody.innerHTML = DB.transports.map((t, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${t.ref}</strong></td>
            <td>${t.container}</td>
            <td>${t.type}</td>
            <td>${t.vehicle}</td>
            <td>${t.eta || '-'}</td>
            <td>
                <button class="btn" onclick="editTransport(${t.id})" style="background:#f59e0b; padding:4px 8px; margin-right:4px">Sửa</button>
                <button class="btn" onclick="removeTransport(${t.id})" style="background:#ef4444; padding:4px 8px">Xóa</button>
            </td>
        </tr>`).join('');
}

function renderAll() {
    renderContainers();
    renderTransport();
    renderYard(); 
    populateAllSelects();
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    loadDB(); 
    renderAll();
});