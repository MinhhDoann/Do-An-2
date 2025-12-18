// --- Quản lý Trạng thái ---
let editingContainerId = null; 
let editingCargoId = null; 
let editingTransportId = null; 

const DB = { 
    containers: [], 
    cargo: [], 
    transports: [], 
    docs: [], 
    partners: [], 
    staff: [], 
    equip: [] 
};

// --- 1. Quản lý Lưu trữ ---
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

// --- 2. Điều hướng ---
document.getElementById('mainNav')?.addEventListener('click', e => {
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
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) titleEl.textContent = title || 'Tổng quan';
    renderAll(); 
}

// --- 3. Quản lý Vận tải ---
const btnSaveTransport = document.getElementById('saveTransport');
if (btnSaveTransport) {
    btnSaveTransport.addEventListener('click', () => {
        const ref = document.getElementById('tRef').value.trim();
        const container = document.getElementById('tContainer').value;
        const vehicle = document.getElementById('tVehicle').value.trim();
        const eta = document.getElementById('tETA').value;

        if (!ref || !container || !vehicle) {
            return alert('Vui lòng nhập Mã tham chiếu, Chọn Container và Số xe');
        }

        const data = {
            ref,
            container,
            vehicle, 
            eta
        };

        if (editingTransportId) {
            const idx = DB.transports.findIndex(t => t.id === editingTransportId);
            if (idx !== -1) DB.transports[idx] = { ...DB.transports[idx], ...data };
            editingTransportId = null;
            btnSaveTransport.textContent = 'Lưu';
        } else {
            DB.transports.unshift({ id: Date.now(), ...data });
        }
        saveDB();
        clearTransportForm();
    });
}

function renderTransport() {
    const tbody = document.querySelector('#tblTransport tbody');
    if (!tbody) return;

    if (DB.transports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có lịch trình</td></tr>';
        return;
    }

    tbody.innerHTML = DB.transports.map((t, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${t.ref}</strong></td>
            <td>${t.container}</td>
            <td>${t.vehicle}</td>
            <td>${t.eta || '-'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="editTransport(${t.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeTransport(${t.id})">Xóa</button>
            </td>
        </tr>`).join('');
}

function editTransport(id) {
    const t = DB.transports.find(item => item.id === id);
    if (!t) return;
    document.getElementById('tRef').value = t.ref;
    document.getElementById('tContainer').value = t.container;
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

// --- 4. Sơ đồ bãi (Yard Map) ---
function renderYard() {
    const yard = document.getElementById('yard');
    if (!yard) return;
    yard.innerHTML = '';
    
    for (let i = 0; i < 32; i++) {
        const cell = document.createElement('div');
        cell.className = 'card yard-cell';
        cell.style.cssText = 'padding:12px; text-align:center; cursor:pointer; min-height:60px; display:flex; flex-direction:column; align-items:center; justify-content:center; border: 1px solid #ddd; font-size: 12px;';
        
        const containerAtPos = DB.containers[i];
        cell.innerHTML = containerAtPos ? `<strong>${containerAtPos.no}</strong><br><small>${containerAtPos.type}</small>` : '<span style="color:#ccc">Trống</span>';
        
        if (containerAtPos) {
            cell.style.background = containerAtPos.status === 'Full' ? '#dcfce7' : '#fef9c3';
            cell.style.borderColor = '#10b981';
        }

        cell.addEventListener('click', () => {
            const currentNo = containerAtPos ? containerAtPos.no : '';
            const newNo = prompt('Nhập số hiệu container (Nhập "empty" để xóa):', currentNo);
            
            if (newNo === null) return;
            
            if (newNo.toLowerCase() === 'empty') {
                if (DB.containers[i]) {
                    DB.containers.splice(i, 1);
                    saveDB();
                }
            } else if (newNo.trim() !== "") {
                const rec = { id: Date.now(), no: newNo.toUpperCase(), type: '20DC', loc: 'Yard', status: 'Empty' };
                DB.containers[i] = rec;
                saveDB();
            }
        });
        yard.appendChild(cell);
    }
}

// --- 5. Các hàm Render khác & Tiện ích ---
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
                DB.containers.filter(c => c && c.no).map(c => `<option value="${c.no}">${c.no}</option>`).join('');
            el.value = currentVal;
        }
    });
}

function renderContainers() { 
    const tbody = document.querySelector('#tblContainers tbody'); 
    if (!tbody) return;
    tbody.innerHTML = DB.containers.filter(c => c && c.no).map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${c.no}</strong></td>
            <td>${c.type}</td>
            <td>${c.loc}</td>
            <td>${c.status}</td>
            <td>
                <button class="btn btn-edit" onclick="editContainer(${c.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeContainer(${c.id})">Xóa</button>
            </td>
        </tr>`).join('');
}

function renderCargo() {
    const tbody = document.querySelector('#tblCargo tbody');
    if (!tbody) return;
    tbody.innerHTML = DB.cargo.map((g, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${g.desc}</td>
            <td>${g.container || '-'}</td>
            <td>${g.qty}</td>
            <td>${g.type}</td>
            <td>
                <button class="btn btn-edit" onclick="editCargo(${g.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeCargo(${g.id})">Xóa</button>
            </td>
        </tr>`).join('');
}

function renderAll() {
    renderContainers();
    renderTransport();
    renderCargo();
    renderYard(); 
    populateAllSelects();
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    loadDB(); 
    renderAll();
});