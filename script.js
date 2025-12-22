// --- Quản lý Trạng thái ---
let editingContainerId = null; 
let editingCargoId = null; 
let editingTransportId = null; 

let editingContractId = null;
let editingInvoiceId = null;
const DB = { 
    containers: [], 
    cargo: [], 
    transports: [], 
    docs: [], 
    partners: [], 
    staff: [], 
    contracts: [],
    invoices: [],
    finance: [],
};

// --- 1. Quản lý Lưu trữ ---
function loadDB() {
 
    try { 
        const raw = localStorage.getItem('cl_db'); 
        if (raw) Object.assign(DB, JSON.parse(raw)); 
    } catch (e) { console.warn("Lỗi nạp dữ liệu:", e); } 
}

function normalizeDB() {
    // Bảo vệ tương thích dữ liệu cũ trong localStorage
    if (!Array.isArray(DB.containers)) DB.containers = [];
    if (!Array.isArray(DB.cargo)) DB.cargo = [];
    if (!Array.isArray(DB.transports)) DB.transports = [];
    if (!Array.isArray(DB.docs)) DB.docs = [];
    if (!Array.isArray(DB.partners)) DB.partners = [];
    if (!Array.isArray(DB.staff)) DB.staff = [];
    if (!Array.isArray(DB.contracts)) DB.contracts = [];
    if (!Array.isArray(DB.invoices)) DB.invoices = [];
    if (!Array.isArray(DB.finance)) DB.finance = [];
}

function normalizeContractStatus(raw) {
    const s = (raw ?? '').toString().trim();
    if (!s) return 'Chờ ký';
    const signedSet = new Set(['Đã ký','Da ky','Signed','signed','Hiệu lực','Hieu luc','Active','active']);
    if (signedSet.has(s)) return 'Đã ký';
    return 'Chờ ký';
}

function migrateContractsStatus() {
    if (!Array.isArray(DB.contracts)) DB.contracts = [];
    let changed = false;
    DB.contracts.forEach(c => {
        const fixed = normalizeContractStatus(c.status);
        if (c.status !== fixed) { c.status = fixed; changed = true; }
    });
    if (changed) saveDB();
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

// --- Tìm kiếm toàn cục trong bảng đang mở ---
function getVisibleSectionId() {
    const visible = Array.from(document.querySelectorAll('.card-section'))
        .find(sec => sec.style.display !== 'none');
    return visible?.id || 'dashboard';
}

function applyGlobalSearch(term) {
    term = (term || '').toLowerCase().trim();
    const secId = getVisibleSectionId();
    const sec = document.getElementById(secId);
    if (!sec) return;

    const tables = sec.querySelectorAll('table');
    tables.forEach(tbl => {
        const rows = tbl.querySelectorAll('tbody tr');
        rows.forEach(r => {
            const text = r.textContent?.toLowerCase() || '';
            // không ẩn dòng placeholder "chưa có ..."
            const isPlaceholder = r.querySelectorAll('td').length === 1;
            if (!term) {
                r.style.display = '';
            } else {
                r.style.display = (isPlaceholder || text.includes(term)) ? '' : 'none';
            }
        });
    });
}

// --- Export JSON ---
function exportJSON() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'container_logistics_db.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

//---Quản lý Container---
const btnSaveContainer = document.getElementById('saveContainer');
if (btnSaveContainer) {
  btnSaveContainer.addEventListener('click', () => {
    const no = document.getElementById('cNumber').value.trim().toUpperCase();
    const type = document.getElementById('cType').value;
    const loc = document.getElementById('cLocation').value.trim();
    const status = document.getElementById('cStatus').value;

    if (!no) return alert('Vui lòng nhập Container No');

    const data = { no, type, loc, status };

    if (editingContainerId) {
      const idx = DB.containers.findIndex(c => c && c.id === editingContainerId);
      if (idx !== -1) DB.containers[idx] = { ...DB.containers[idx], ...data };
      editingContainerId = null;
      btnSaveContainer.textContent = 'Lưu';
    } else {
      DB.containers.unshift({ id: Date.now(), ...data });
    }

    saveDB();
    clearContainerForm();
  });
}

function editContainer(id) {
  const c = DB.containers.find(item => item && item.id === id);
  if (!c) return;

  document.getElementById('cNumber').value = c.no || '';
  document.getElementById('cType').value = c.type || '20DC';
  document.getElementById('cLocation').value = c.loc || '';
  document.getElementById('cStatus').value = c.status || 'Rỗng';

  editingContainerId = id;
  document.getElementById('saveContainer').textContent = 'Cập nhật';
}

function removeContainer(id) {
  if (!confirm('Xóa container này?')) return;

  DB.containers = DB.containers.filter(c => !(c && c.id === id));
  saveDB();

  // nếu đang sửa đúng container bị xóa
  if (editingContainerId === id) clearContainerForm();
}

function clearContainerForm() {
  ['cNumber', 'cLocation'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  document.getElementById('cType').value = '20DC';
  document.getElementById('cStatus').value = 'Rỗng';

  editingContainerId = null;
  document.getElementById('saveContainer').textContent = 'Lưu';
}

// --- 5. Các hàm Render khác & Tiện ích ---
function populateAllSelects() { 
    const selects = [
        { id: 'gContainer', label: '- Chọn container chứa hàng -' },
        { id: 'tContainer', label: '-- Chọn container trên xe --' },
        { id: 'fSelectContainer', label: '- Chọn Container cần tính -' },
        { id: 'iContainer', label: '- Chọn container của hóa đơn -' }
    ];

    // Select Hợp đồng cho Hóa đơn
    const contractSel = document.getElementById('iContract');
    if (contractSel) {
        const cur = contractSel.value;
        contractSel.innerHTML = '<option value="" disabled selected>Chọn hợp đồng</option>' +
            (DB.contracts || []).map(c => `<option value="${escapeHtml(c.no)}">${escapeHtml(c.no)}${c.partner ? ' - ' + escapeHtml(c.partner) : ''}</option>`).join('');
        // giữ lại lựa chọn nếu còn tồn tại
        if ((DB.contracts || []).some(c => c.no === cur)) contractSel.value = cur;
    }

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



// ---Quản lý Lô hàng (Cargo) ---
const btnSaveCargo = document.getElementById('saveCargo');
if (btnSaveCargo) {
    btnSaveCargo.addEventListener('click', () => {
        const desc = document.getElementById('gDesc')?.value.trim();
        const container = document.getElementById('gContainer')?.value;
        const qty = document.getElementById('gQty')?.value.trim();
        const type = document.getElementById('gType')?.value;

        if (!desc || !container || !qty) {
            return alert('Vui lòng nhập Mô tả, Chọn Container và Số lượng');
        }

        const data = { desc, container, qty, type };

        if (editingCargoId) {
            const idx = DB.cargo.findIndex(g => g.id === editingCargoId);
            if (idx !== -1) DB.cargo[idx] = { ...DB.cargo[idx], ...data };
            editingCargoId = null;
            btnSaveCargo.textContent = 'Lưu';
        } else {
            DB.cargo.unshift({ id: Date.now(), ...data });
        }

        saveDB();
        clearCargoForm();
    });
}

function editCargo(id) {
    const g = DB.cargo.find(item => item.id === id);
    if (!g) return;
    const elDesc = document.getElementById('gDesc');
    const elContainer = document.getElementById('gContainer');
    const elQty = document.getElementById('gQty');
    const elType = document.getElementById('gType');

    if (elDesc) elDesc.value = g.desc || '';
    if (elContainer) elContainer.value = g.container || '';
    if (elQty) elQty.value = g.qty || '';
    if (elType) elType.value = g.type || '';

    editingCargoId = id;
    document.getElementById('saveCargo').textContent = 'Cập nhật';
}

function removeCargo(id) {
    if(confirm('Xóa lô hàng này?')) {
        DB.cargo = DB.cargo.filter(g => g.id !== id);
        saveDB();
    }
}

function clearCargoForm() {
    ['gDesc', 'gQty', 'gType', 'gContainer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    editingCargoId = null;
    const btn = document.getElementById('saveCargo');
    if (btn) btn.textContent = 'Lưu';
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



// --- Đối tác / Khách hàng ---
const btnSavePartner = document.getElementById('savePartner');
const btnClearPartner = document.getElementById('clearPartner');

function normalizePartnerStatus(raw) {
    const s = (raw ?? '').toString().trim().toLowerCase();
    if (!s) return 'Hoạt động';
    const inactiveSet = new Set(['tạm ngưng','tam ngung','ngừng','ngung','inactive','disabled','disable','off']);
    return inactiveSet.has(s) ? 'Tạm ngưng' : 'Hoạt động';
}

function clearPartnerForm() {
    const n = document.getElementById('pName');
    const t = document.getElementById('pType');
    const c = document.getElementById('pContact');
    const st = document.getElementById('pStatus');

    if (n) n.value = '';
    if (t) t.selectedIndex = 0;
    if (c) c.value = '';
    if (st) st.value = 'Hoạt động';
}

function getPartnerFormData() {
    const name = document.getElementById('pName')?.value?.trim() || '';
    const type = document.getElementById('pType')?.value || '';
    const contact = document.getElementById('pContact')?.value?.trim() || '';
    const status = normalizePartnerStatus(document.getElementById('pStatus')?.value);
    return { name, type, contact, status };
}

if (btnClearPartner) btnClearPartner.addEventListener('click', (e) => {
    e.preventDefault();
    clearPartnerForm();
});

if (btnSavePartner) {
    btnSavePartner.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getPartnerFormData();
        if (!data.name) return alert('Vui lòng nhập Tên đối tác/khách hàng');

        DB.partners = DB.partners || [];
        const dup = DB.partners.some(p =>
            (p?.name || '').toLowerCase() === data.name.toLowerCase() &&
            (p?.contact || '').toLowerCase() === (data.contact || '').toLowerCase()
        );
        if (dup) return alert('Đối tác/khách hàng này đã tồn tại');

        DB.partners.unshift({ id: Date.now(), ...data });
        saveDB();
        clearPartnerForm();
        renderPartners();
    });
}

function togglePartnerStatus(id) {
    const p = (DB.partners || []).find(x => x.id === id);
    if (!p) return;
    const cur = normalizePartnerStatus(p.status);
    p.status = (cur === 'Tạm ngưng') ? 'Hoạt động' : 'Tạm ngưng';
    saveDB();
    renderPartners();
}

function renderPartners() {
    const tbody = document.querySelector('#tblPartners tbody');
    if (!tbody) return;

    const list = (DB.partners || []);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666">Chưa có đối tác/khách hàng</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(p.name || '')}</td>
            <td>${escapeHtml(p.type || '')}</td>
            <td>${escapeHtml(p.contact || '')}</td>
            <td>
                <button class="btn btn-secondary" onclick="togglePartnerStatus(${p.id})">${escapeHtml(normalizePartnerStatus(p.status))}</button>
            </td>
        </tr>
    `).join('');
}

// --- Nhân sự ---
const btnSaveStaff = document.getElementById('saveStaff');
const btnClearStaff = document.getElementById('clearStaff');

function normalizeStaffStatus(raw) {
    const s = (raw ?? '').toString().trim().toLowerCase();
    if (!s) return 'Hoạt động';
    const inactiveSet = new Set(['tạm ngưng','tam ngung','ngừng','ngung','inactive','disabled','disable','off']);
    return inactiveSet.has(s) ? 'Tạm ngưng' : 'Hoạt động';
}

function clearStaffForm() {
    const n = document.getElementById('sName');
    const r = document.getElementById('sRole');
    const c = document.getElementById('sContact');
    const st = document.getElementById('sStatus');

    if (n) n.value = '';
    if (r) r.value = '';
    if (c) c.value = '';
    if (st) st.value = 'Hoạt động';
}

if (btnClearStaff) btnClearStaff.addEventListener('click', (e) => {
    e.preventDefault();
    clearStaffForm();
});

if (btnSaveStaff) {
    btnSaveStaff.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('sName')?.value?.trim() || '';
        const role = document.getElementById('sRole')?.value || '';
        const contact = document.getElementById('sContact')?.value?.trim() || '';
        const status = normalizeStaffStatus(document.getElementById('sStatus')?.value);

        if (!name || !role || !contact) {
            return alert('Vui lòng nhập Tên, Vai trò và SĐT/Email');
        }

        DB.staff = DB.staff || [];
        const dup = DB.staff.some(s =>
            (s?.name || '').toLowerCase() === name.toLowerCase() &&
            (s?.contact || '').toLowerCase() === contact.toLowerCase()
        );
        if (dup) return alert('Nhân sự này đã tồn tại');

        DB.staff.unshift({ id: Date.now(), name, role, contact, status });
        saveDB();
        clearStaffForm();
        renderStaff();
    });
}

function toggleStaffStatus(id) {
    const s = (DB.staff || []).find(x => x.id === id);
    if (!s) return;
    const cur = normalizeStaffStatus(s.status);
    s.status = (cur === 'Tạm ngưng') ? 'Hoạt động' : 'Tạm ngưng';
    saveDB();
    renderStaff();
}

function renderStaff() {
    const tbody = document.querySelector('#tblStaff tbody');
    if (!tbody) return;

    const list = (DB.staff || []);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Chưa có nhân sự</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.role)}</td>
            <td>${escapeHtml(s.contact)}</td>
            <td>
                <button class="btn btn-secondary" onclick="toggleStaffStatus(${s.id})">${escapeHtml(normalizeStaffStatus(s.status))}</button>
            </td>
        </tr>
    `).join('');
}

// --- Hợp đồng ---
const btnSaveContract = document.getElementById('saveContract');
if (btnSaveContract) {
    btnSaveContract.addEventListener('click', () => {
        const data = getContractFormData();
        if (!data.no) return alert('Vui lòng nhập Số hợp đồng');
        if (!data.partner) return alert('Vui lòng nhập Đối tác');

        // tránh trùng số hợp đồng khi thêm mới
        if (!editingContractId && (DB.contracts || []).some(c => c.no === data.no)) {
            return alert('Số hợp đồng đã tồn tại');
        }

        if (editingContractId) {
            const idx = (DB.contracts || []).findIndex(c => c.id === editingContractId);
            if (idx >= 0) DB.contracts[idx] = { ...DB.contracts[idx], ...data };
        } else {
            DB.contracts.unshift({ id: Date.now(), ...data });
        }

        saveDB();
        clearContractForm();
        renderContracts();
        populateAllSelects();
        renderInvoices(); // vì hóa đơn có phụ thuộc hợp đồng
    });
}

document.getElementById('clearContract')?.addEventListener('click', clearContractForm);
document.getElementById('deleteContract')?.addEventListener('click', () => {
    if (!editingContractId) return;
    if (!confirm('Xóa hợp đồng này?')) return;
    DB.contracts = (DB.contracts || []).filter(c => c.id !== editingContractId);
    saveDB();
    clearContractForm();
    renderContracts();
    populateAllSelects();
    renderInvoices();
});

function getContractFormData() {
    const no = document.getElementById('cNo')?.value?.trim() || '';
    const partner = document.getElementById('cPartner')?.value?.trim() || '';
    const start = document.getElementById('cStart')?.value || '';
    const end = document.getElementById('cEnd')?.value || '';
    const value = Number(document.getElementById('cValue')?.value || 0);
    const status = document.getElementById('contractStatus')?.value?.trim() || 'Chờ ký';
    const note = document.getElementById('cNote')?.value?.trim() || '';
    return { no, partner, start, end, value, status, note };
}

function clearContractForm() {
    const ids = ['cNo','cPartner','cStart','cEnd','cValue','contractStatus','cNote'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const st = document.getElementById('contractStatus');
    if (st) st.value = 'Chờ ký';
editingContractId = null;
    const t = document.getElementById('contractFormTitle');
    if (t) t.textContent = 'Thêm hợp đồng';
    const del = document.getElementById('deleteContract');
    if (del) del.style.display = 'none';
}

function editContract(id) {
    const c = (DB.contracts || []).find(x => x.id === id);
    if (!c) return;

    document.getElementById('cNo').value = c.no || '';
    document.getElementById('cPartner').value = c.partner || '';
    document.getElementById('cStart').value = c.start || '';
    document.getElementById('cEnd').value = c.end || '';
    document.getElementById('cValue').value = Number(c.value || 0);
    document.getElementById('contractStatus').value = normalizeContractStatus(c.status);
    document.getElementById('cNote').value = c.note || '';

    editingContractId = id;
    const t = document.getElementById('contractFormTitle');
    if (t) t.textContent = 'Sửa hợp đồng';
    const del = document.getElementById('deleteContract');
    if (del) del.style.display = '';
}

function removeContract(id) {
    if (!confirm('Xóa hợp đồng này?')) return;
    DB.contracts = (DB.contracts || []).filter(c => c.id !== id);
    saveDB();
    if (editingContractId === id) clearContractForm();
    renderContracts();
    populateAllSelects();
    renderInvoices();
}

function renderContracts() {
    const tbody = document.querySelector('#tblContracts tbody');
    if (!tbody) return;

    const list = (DB.contracts || []);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8">Chưa có hợp đồng</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(c.no)}</strong></td>
            <td>${escapeHtml(c.partner)}</td>
            <td>${fmtDateRange(c.start, c.end)}</td>
            <td>${fmtVND(c.value)}</td>
            <td>${escapeHtml(normalizeContractStatus(c.status))}</td>
            <td>
                <button class="btn btn-edit" onclick="editContract(${c.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeContract(${c.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

// --- Hóa đơn ---
const btnSaveInvoice = document.getElementById('saveInvoice');
if (btnSaveInvoice) {
    btnSaveInvoice.addEventListener('click', (e) => {
        e.preventDefault();
        const data = getInvoiceFormData();
        if (!data.no) return alert('Vui lòng nhập Số hóa đơn');
        if (!data.contractNo) return alert('Vui lòng chọn Hợp đồng');
        if (!data.containerNo) return alert('Vui lòng chọn Container');

        if (!editingInvoiceId && (DB.invoices || []).some(i => i.no === data.no)) {
            return alert('Số hóa đơn đã tồn tại');
        }

        if (editingInvoiceId) {
            const idx = (DB.invoices || []).findIndex(i => i.id === editingInvoiceId);
            if (idx >= 0) DB.invoices[idx] = { ...DB.invoices[idx], ...data };
        } else {
            DB.invoices = DB.invoices || [];
            DB.invoices.unshift({ id: Date.now(), ...data });
        }

        saveDB();
        clearInvoiceForm();
        renderInvoices();
    });
}

document.getElementById('clearInvoice')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearInvoiceForm();
});

document.getElementById('deleteInvoice')?.addEventListener('click', () => {
    if (!editingInvoiceId) return;
    if (!confirm('Xóa hóa đơn này?')) return;
    DB.invoices = (DB.invoices || []).filter(i => i.id !== editingInvoiceId);
    saveDB();
    clearInvoiceForm();
    renderInvoices();
});

document.getElementById('iContract')?.addEventListener('change', () => {
    const contractNo = document.getElementById('iContract')?.value || '';
    const c = (DB.contracts || []).find(x => x.no === contractNo);
    const partnerEl = document.getElementById('iPartner');
    if (partnerEl) partnerEl.value = c?.partner || '';
});

function recalcInvoiceTotal() {
    const amount = Number(document.getElementById('iAmount')?.value || 0);
    const vat = Number(document.getElementById('iVat')?.value || 0);
    const total = Math.round(amount + amount * (vat / 100));
    const totalEl = document.getElementById('iTotal');
    if (totalEl) totalEl.value = total ? String(total) : '';
}

document.getElementById('iAmount')?.addEventListener('input', recalcInvoiceTotal);
document.getElementById('iVat')?.addEventListener('input', recalcInvoiceTotal);

document.getElementById('iPaid')?.addEventListener('change', () => {
    const paid = document.getElementById('iPaid')?.value;
    const paidDate = document.getElementById('iPaidDate');
    if (!paidDate) return;
    if (paid === 'Đã thanh toán' && !paidDate.value) {
        paidDate.value = new Date().toISOString().slice(0, 10);
    }
});

function getInvoiceFormData() {
    const no = document.getElementById('iNo')?.value?.trim() || '';
    const contractNo = document.getElementById('iContract')?.value || '';
    const containerNo = document.getElementById('iContainer')?.value || '';

    const c = (DB.contracts || []).find(x => x.no === contractNo);
    const partner = c?.partner || (document.getElementById('iPartner')?.value?.trim() || '');

    const issue = document.getElementById('iIssue')?.value || '';
    const due = document.getElementById('iDue')?.value || '';
    const amount = Number(document.getElementById('iAmount')?.value || 0);
    const vat = Number(document.getElementById('iVat')?.value || 0);
    const total = Math.round(amount + amount * (vat / 100));
    const paid = document.getElementById('iPaid')?.value || 'Chưa thanh toán';
    const paidDate = document.getElementById('iPaidDate')?.value || '';
    const note = document.getElementById('iNote')?.value?.trim() || '';
    return { no, contractNo, containerNo, partner, issue, due, amount, vat, total, paid, paidDate, note };
}

function clearInvoiceForm() {
    const ids = ['iNo','iIssue','iDue','iAmount','iVat','iTotal','iPaidDate','iNote'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    const contractEl = document.getElementById('iContract');
    if (contractEl) contractEl.value = '';

    const containerEl = document.getElementById('iContainer');
    if (containerEl) containerEl.value = '';

    const partnerEl = document.getElementById('iPartner');
    if (partnerEl) partnerEl.value = '';

    const paidEl = document.getElementById('iPaid');
    if (paidEl) paidEl.value = 'Chưa thanh toán';

    editingInvoiceId = null;
    const t = document.getElementById('invoiceFormTitle');
    if (t) t.textContent = 'Thêm hóa đơn';
    const del = document.getElementById('deleteInvoice');
    if (del) del.style.display = 'none';
}

function editInvoice(id) {
    const inv = (DB.invoices || []).find(x => x.id === id);
    if (!inv) return;

    document.getElementById('iNo').value = inv.no || '';
    document.getElementById('iIssue').value = inv.issue || '';
    document.getElementById('iDue').value = inv.due || '';
    document.getElementById('iAmount').value = Number(inv.amount || 0);
    document.getElementById('iVat').value = Number(inv.vat || 0);
    document.getElementById('iTotal').value = Number(inv.total || 0);
    document.getElementById('iPaid').value = inv.paid || 'Chưa thanh toán';
    document.getElementById('iPaidDate').value = inv.paidDate || '';
    document.getElementById('iNote').value = inv.note || '';

    const contractEl = document.getElementById('iContract');
    if (contractEl) contractEl.value = inv.contractNo || '';

    const containerEl = document.getElementById('iContainer');
    if (containerEl) containerEl.value = inv.containerNo || '';

    const partnerEl = document.getElementById('iPartner');
    if (partnerEl) partnerEl.value = inv.partner || '';

    editingInvoiceId = id;
    const t = document.getElementById('invoiceFormTitle');
    if (t) t.textContent = 'Sửa hóa đơn';
    const del = document.getElementById('deleteInvoice');
    if (del) del.style.display = '';
}

function removeInvoice(id) {
    if (!confirm('Xóa hóa đơn này?')) return;
    DB.invoices = (DB.invoices || []).filter(i => i.id !== id);
    saveDB();
    if (editingInvoiceId === id) clearInvoiceForm();
    renderInvoices();
}

function invoiceDisplayStatus(inv) {
    if ((inv.paid || '') === 'Đã thanh toán') return 'Đã thanh toán';
    const due = inv.due ? new Date(inv.due) : null;
    if (due && !isNaN(due.getTime())) {
        const today = new Date();
        today.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        if (due < today) return 'Quá hạn';
    }
    return 'Chưa thanh toán';
}

function renderInvoices() {
    const tbody = document.querySelector('#tblInvoices tbody');
    if (!tbody) return;

    const list = (DB.invoices || []);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#94a3b8">Chưa có hóa đơn</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((inv, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(inv.no)}</strong></td>
            <td>${escapeHtml(inv.contractNo)}</td>
            <td>${escapeHtml(inv.containerNo || '')}</td>
            <td>${escapeHtml(inv.partner)}</td>
            <td>${fmtDate(inv.issue)}</td>
            <td>${fmtDate(inv.due)}</td>
            <td>${fmtVND(inv.total)}</td>
            <td>${invoiceDisplayStatus(inv)}</td>
            <td>
                <button class="btn btn-edit" onclick="editInvoice(${inv.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeInvoice(${inv.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

// --- Tài chính & Chi phí ---
function calcFinanceTotal(base, demdet, local, extra) {
    const b = Number(base || 0);
    const d = Number(demdet || 0);
    const l = Number(local || 0);
    const e = Number(extra || 0);
    return Math.round(b + d + l + e);
}

function updateFinanceDetail() {
    const sel = document.getElementById('fSelectContainer');
    if (!sel) return;
    const container = sel.value || '';

    const box = document.getElementById('costResult');
    if (!container) {
        if (box) box.textContent = '';
        ['fBase', 'fDemDet', 'fLocal', 'fExtra'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        return;
    }

    const rec = (DB.finance || []).find(x => x && x.container === container);
    const baseEl = document.getElementById('fBase');
    const demEl = document.getElementById('fDemDet');
    const localEl = document.getElementById('fLocal');
    const extraEl = document.getElementById('fExtra');

    if (baseEl) baseEl.value = rec ? (rec.base ?? '') : '';
    if (demEl) demEl.value = rec ? (rec.demdet ?? '') : '';
    if (localEl) localEl.value = rec ? (rec.local ?? '') : '';
    if (extraEl) extraEl.value = rec ? (rec.extra ?? '') : '';

    const total = calcFinanceTotal(baseEl?.value, demEl?.value, localEl?.value, extraEl?.value);
    if (box) box.textContent = total ? ('Tổng phí: ' + fmtVND(total)) : '';
}

function saveFinance() {
    const container = document.getElementById('fSelectContainer')?.value || '';
    if (!container) return alert('Vui lòng chọn Container cần tính');

    const base = Number(document.getElementById('fBase')?.value || 0);
    const demdet = Number(document.getElementById('fDemDet')?.value || 0);
    const local = Number(document.getElementById('fLocal')?.value || 0);
    const extra = Number(document.getElementById('fExtra')?.value || 0);
    const total = calcFinanceTotal(base, demdet, local, extra);

    DB.finance = DB.finance || [];
    const idx = DB.finance.findIndex(x => x && x.container === container);
    const data = { id: Date.now(), container, base, demdet, local, extra, total };

    if (idx >= 0) {
        // giữ id cũ để nút xóa ổn định
        data.id = DB.finance[idx].id ?? data.id;
        DB.finance[idx] = { ...DB.finance[idx], ...data };
    } else {
        DB.finance.unshift(data);
    }

    saveDB();
    updateFinanceDetail();
}

function removeFinance(id) {
    if (!confirm('Xóa dòng chi phí này?')) return;
    DB.finance = (DB.finance || []).filter(x => x && x.id !== id);
    saveDB();
    updateFinanceDetail();
}

function renderFinance() {
    const tbody = document.getElementById('tblFinanceBody');
    if (!tbody) return;

    const list = (DB.finance || []).filter(x => x && x.container);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((x) => `
        <tr>
            <td><strong>${escapeHtml(x.container)}</strong></td>
            <td>${fmtVND(x.base)}</td>
            <td>${fmtVND(x.demdet)}</td>
            <td>${fmtVND(x.local)}</td>
            <td>${fmtVND(x.extra)}</td>
            <td><strong>${fmtVND(x.total)}</strong></td>
            <td><button class="btn btn-delete" onclick="removeFinance(${x.id})">Xóa</button></td>
        </tr>
    `).join('');
}

// --- Helpers ---
function fmtVND(val) {
    const n = Number(val || 0);
    if (!n) return '';
    return n.toLocaleString('vi-VN') + ' đ';
}
function fmtDate(d) {
    if (!d) return '';
    // d dạng yyyy-mm-dd
    return d;
}
function fmtDateRange(a, b) {
    const sa = fmtDate(a);
    const sb = fmtDate(b);
    if (!sa && !sb) return '';
    if (sa && sb) return `${sa} → ${sb}`;
    return sa || sb;
}
function escapeHtml(input) {
    return String(input ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function renderAll() {
    renderContainers();
    renderTransport();
    renderCargo();
    populateAllSelects();
    renderPartners();
    renderStaff();
    renderContracts();
    renderInvoices();
    renderFinance();
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    normalizeDB();
    migrateContractsStatus();
    renderAll();
    renderContracts();
    renderInvoices();
    populateAllSelects();

    // Search & Export
    const s = document.getElementById('globalSearch');
    if (s) s.addEventListener('input', () => applyGlobalSearch(s.value));
    document.getElementById('exportBtn')?.addEventListener('click', exportJSON);

    ['fBase','fDemDet','fLocal','fExtra'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateFinanceDetail);
    });
});