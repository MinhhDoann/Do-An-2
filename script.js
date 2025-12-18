// --- Quản lý Trạng thái ---
let editingContainerId = null; 
let editingCargoId = null; 
const DB = { containers: [], cargo: [], transports: [], docs: [], partners: [], staff: [], equip: [] };

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

// --- 2. Điều hướng (SPA Navigation) ---
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
    document.getElementById('sectionTitle').textContent = document.querySelector('[data-section="' + id + '"]')?.textContent || 'Tổng quan';
    renderAll(); 
}

// --- 3. Quản lý Container ---
document.getElementById('saveContainer').addEventListener('click', () => {
    const no = document.getElementById('cNumber').value.trim();
    if (!no) return alert('Nhập số hiệu');
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
    saveDB(); clearContainerForm();
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
    if(confirm('Xóa container này?')) { DB.containers = DB.containers.filter(c => c.id !== id); saveDB(); }
}

function clearContainerForm() { 
    ['cNumber', 'cLocation'].forEach(id => document.getElementById(id).value = ''); 
    editingContainerId = null; document.getElementById('saveContainer').textContent = 'Lưu';
}

// --- 4. Quản lý Hàng hóa (Cargo) ---
document.getElementById('saveCargo').addEventListener('click', () => {
    const desc = document.getElementById('gDesc').value.trim();
    if (!desc) return alert('Nhập mô tả hàng');
    const data = {
        desc,
        qty: document.getElementById('gQty').value,
        type: document.getElementById('gType').value,
        container: document.getElementById('gContainer').value
    };

    if (editingCargoId) {
        const idx = DB.cargo.findIndex(g => g.id === editingCargoId);
        if (idx !== -1) DB.cargo[idx] = { ...DB.cargo[idx], ...data };
        editingCargoId = null;
        document.getElementById('saveCargo').textContent = 'Lưu';
        if(document.getElementById('gFormTitle')) document.getElementById('gFormTitle').textContent = 'Thêm Lô hàng';
    } else {
        DB.cargo.unshift({ id: Date.now(), ...data });
    }
    saveDB(); clearCargoForm();
});

function editCargo(id) {
    const g = DB.cargo.find(item => item.id === id);
    if (!g) return;
    document.getElementById('gDesc').value = g.desc;
    document.getElementById('gQty').value = g.qty;
    document.getElementById('gType').value = g.type;
    document.getElementById('gContainer').value = g.container;
    editingCargoId = id;
    document.getElementById('saveCargo').textContent = 'Cập nhật';
    if(document.getElementById('gFormTitle')) document.getElementById('gFormTitle').textContent = 'Sửa Lô hàng';
    document.getElementById('gDesc').focus();
}

function removeCargo(id) {
    if(confirm('Xóa lô hàng này?')) { DB.cargo = DB.cargo.filter(g => g.id !== id); saveDB(); }
}

function clearCargoForm() {
    ['gDesc', 'gQty'].forEach(id => document.getElementById(id).value = '');
    editingCargoId = null; document.getElementById('saveCargo').textContent = 'Lưu';
    if(document.getElementById('gFormTitle')) document.getElementById('gFormTitle').textContent = 'Thêm Lô hàng';
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
        
        // Hiệu ứng màu sắc theo trạng thái
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
function populateContainerSelect() { 
    const selects = ['gContainer', 'fSelectContainer'];
    selects.forEach(sId => {
        const sel = document.getElementById(sId);
        if (sel) {
            const val = sel.value;
            sel.innerHTML = '<option value="">- Chọn container -</option>' + 
                DB.containers.map(c => `<option value="${c.no}">${c.no}</option>`).join('');
            sel.value = val;
        }
    });
}

function renderAll() {
    renderContainers();
    renderCargo();
    renderYard(); // Đã thêm lại vào đây
    populateContainerSelect();
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
                <button class="btn" onclick="editCargo(${g.id})" style="background:#f59e0b; padding:4px 8px">Sửa</button>
                <button class="btn" onclick="removeCargo(${g.id})" style="background:#ef4444; padding:4px 8px">Xóa</button>
            </td>
        </tr>`).join('');
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    loadDB(); 
    renderAll();
});