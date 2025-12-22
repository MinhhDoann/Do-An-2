// --- Quản lý Trạng thái ---
let editingContainerId = null; 
let editingCargoId = null; 
let editingTransportId = null; 

let editingStaffId = null;
let editingContractId = null;
let editingInvoiceId = null;

let editingPartnerId = null;
let editingPartnerGroup = null;

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
        { id: 'iContainer', label: '- Chọn container -' },
        { id: 'fSelectContainer', label: '- Chọn Container cần tính -' }
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
// --- 6. Tài chính & Chi phí ---
function calcFinanceTotal(base, demdet, local, extra) {
    return Number(base || 0) + Number(demdet || 0) + Number(local || 0) + Number(extra || 0);
}

function getFinanceFormData() {
    const container = document.getElementById('fSelectContainer')?.value || '';
    const base = Number(document.getElementById('fBase')?.value || 0);
    const demdet = Number(document.getElementById('fDemDet')?.value || 0);
    const local = Number(document.getElementById('fLocal')?.value || 0);
    const extra = Number(document.getElementById('fExtra')?.value || 0);
    const total = calcFinanceTotal(base, demdet, local, extra);
    return { container, base, demdet, local, extra, total };
}

function renderFinanceDetailRow(rec) {
    const tbody = document.getElementById('tblFinanceBody');
    if (!tbody) return;

    if (!rec) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Chưa có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td><strong>${escapeHtml(rec.container)}</strong></td>
            <td>${fmtVND(rec.base)}</td>
            <td>${fmtVND(rec.demdet)}</td>
            <td>${fmtVND(rec.local)}</td>
            <td>${fmtVND(rec.extra)}</td>
            <td><strong>${fmtVND(rec.total)}</strong></td>
            <td><button class="btn btn-edit" onclick="loadFinanceToForm(${JSON.stringify(rec.container)})">Sửa</button></td>
        </tr>
    `;
}

function loadFinanceToForm(containerNo) {
    const rec = (DB.finance || []).find(x => x.container === containerNo);
    if (!rec) return;

    const sel = document.getElementById('fSelectContainer');
    if (sel) sel.value = containerNo;

    const b = document.getElementById('fBase'); if (b) b.value = String(rec.base || 0);
    const d = document.getElementById('fDemDet'); if (d) d.value = String(rec.demdet || 0);
    const l = document.getElementById('fLocal'); if (l) l.value = String(rec.local || 0);
    const e = document.getElementById('fExtra'); if (e) e.value = String(rec.extra || 0);

    const r = document.getElementById('costResult');
    if (r) r.textContent = rec.total ? ('Tổng phí: ' + fmtVND(rec.total)) : '';
    renderFinanceDetailRow(rec);
}

// onchange="updateFinanceDetail()" trong HTML
function updateFinanceDetail() {
    const containerNo = document.getElementById('fSelectContainer')?.value || '';
    if (!containerNo) {
        renderFinanceDetailRow(null);
        const r = document.getElementById('costResult');
        if (r) r.textContent = '';
        return;
    }

    const rec = (DB.finance || []).find(x => x.container === containerNo) || null;
    renderFinanceDetailRow(rec);

    const r = document.getElementById('costResult');
    if (r) r.textContent = rec?.total ? ('Tổng phí: ' + fmtVND(rec.total)) : 'Chưa có chi phí cho container này';
}

function clearFinanceForm(keepContainer = true) {
    const ids = ['fBase', 'fDemDet', 'fLocal', 'fExtra'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (!keepContainer) {
        const sel = document.getElementById('fSelectContainer');
        if (sel) sel.value = '';
    }
}

// onclick="saveFinance()" trong HTML
function saveFinance() {
    const data = getFinanceFormData();
    if (!data.container) return alert('Vui lòng chọn Container cần tính');

    // 1 container = 1 bản ghi chi phí (upsert)
    DB.finance = DB.finance || [];
    const idx = DB.finance.findIndex(x => x.container === data.container);
    if (idx >= 0) {
        DB.finance[idx] = { ...DB.finance[idx], ...data, updatedAt: Date.now() };
    } else {
        DB.finance.unshift({ id: Date.now(), ...data, updatedAt: Date.now() });
    }

    saveDB(); // sẽ renderAll()
    clearFinanceForm(true);

    // update UI ngay
    const rec = (DB.finance || []).find(x => x.container === data.container) || null;
    const r = document.getElementById('costResult');
    if (r) r.textContent = rec?.total ? ('Tổng phí: ' + fmtVND(rec.total)) : '';
    renderFinanceDetailRow(rec);
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


// --- Nhân sự ---
const btnSaveStaff = document.getElementById('saveStaff');
const btnClearStaff = document.getElementById('clearStaff');
const staffFormTitle = document.getElementById('staffFormTitle');

function setStaffFormMode(isEdit) {
    if (staffFormTitle) staffFormTitle.textContent = isEdit ? 'Cập nhật nhân sự' : 'Thêm nhân sự';
    if (btnSaveStaff) btnSaveStaff.textContent = isEdit ? 'Cập nhật' : 'Lưu';
}

function clearStaffForm() {
  const n = document.getElementById('sName');
  const r = document.getElementById('sRole');
  const c = document.getElementById('sContact');
  const st = document.getElementById('sStatus');

  if (n) n.value = '';
  if (r) r.value = '';
  if (c) c.value = '';
  if (st) st.value = 'Đang làm';

  editingStaffId = null;
  setStaffFormMode(false);
}


if (btnClearStaff) btnClearStaff.addEventListener('click', clearStaffForm);

if (btnSaveStaff) {
    btnSaveStaff.addEventListener('click', () => {
        const name = document.getElementById('sName')?.value.trim();
        const role = document.getElementById('sRole')?.value;
        const contact = document.getElementById('sContact')?.value.trim();
        const status = document.getElementById('sStatus')?.value || 'Đang làm';

        if (!name || !role || !contact) {
            return alert('Vui lòng nhập Tên, Vai trò và SĐT/Email');
        }

        const data = { name, role, contact, status };

        if (editingStaffId) {
            const idx = (DB.staff || []).findIndex(s => s.id === editingStaffId);
            if (idx !== -1) DB.staff[idx] = { ...DB.staff[idx], ...data };
        } else {
            DB.staff = DB.staff || [];
            DB.staff.unshift({ id: Date.now(), ...data });
        }

        saveDB();
        clearStaffForm();
    });
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
        <tr style="cursor:pointer" onclick="editStaff(${s.id})">
            <td>${i + 1}</td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.role)}</td>
            <td>${escapeHtml(s.contact)}</td>
            <td>${escapeHtml(s.status || 'Đang làm')}</td>
        </tr>
    `).join('');
}

function editStaff(id) {
    const s = (DB.staff || []).find(x => x.id === id);
    if (!s) return;

    const n = document.getElementById('sName');
    const r = document.getElementById('sRole');
    const c = document.getElementById('sContact');
    const st = document.getElementById('sStatus');
    if (n) n.value = s.name || '';
    if (r) r.value = s.role || '';
    if (c) c.value = s.contact || '';
    if (st) st.value = s.status || 'Đang làm';

    editingStaffId = id;
    setStaffFormMode(true);
}


// --- Đối tác / Khách hàng ---
const btnSavePartner = document.getElementById('savePartner');
const btnClearPartner = document.getElementById('clearPartner');
function setPartnerFormMode(isEdit) {
    const groupSel = document.getElementById('pGroup');
    const group = groupSel?.value || 'Đối tác';
    const title = document.getElementById('partnerFormTitle');
    const btn = document.getElementById('savePartner');

    if (title) title.textContent = isEdit ? `Cập nhật ${group.toLowerCase()}` : `Thêm ${group.toLowerCase()}`;
    if (btn) btn.textContent = isEdit ? 'Cập nhật' : 'Lưu';

    // Khi đang sửa thì khoá chọn Nhóm để tránh đổi nhầm
    if (groupSel) groupSel.disabled = !!isEdit;
}


function getPartnerForm() {
    return {
        group: document.getElementById('pGroup'),
        name: document.getElementById('pName'),
        type: document.getElementById('pType'),
        contact: document.getElementById('pContact'),
        status: document.getElementById('pStatus'),
    };
}


function clearPartnerForms() {
    const f = getPartnerForm();

    if (f.group) { f.group.value = 'Đối tác'; f.group.disabled = false; }
    if (f.name) f.name.value = '';
    if (f.contact) f.contact.value = '';

    // reset về option đầu (Vai trò)
    if (f.type) f.type.selectedIndex = 0;

    // reset trạng thái
    if (f.status) f.status.value = 'Hoạt động';

    editingPartnerId = null;
    editingPartnerGroup = null;
    setPartnerFormMode(false);
}


function savePartnerCustomer() {
    const f = getPartnerForm();
    const group = f.group?.value || 'Đối tác';
    const name = (f.name?.value || '').trim();
    const type = f.type?.value || '';
    const contact = (f.contact?.value || '').trim();
    const status = f.status?.value || 'Hoạt động';

    if (!name || !contact) return alert('Vui lòng nhập Tên và Liên hệ');

    const data = { group, name, type, contact, status };

    if (editingPartnerId) {
        const idx = (DB.partners || []).findIndex(x => x.id === editingPartnerId);
        if (idx !== -1) DB.partners[idx] = { ...DB.partners[idx], ...data };
    } else {
        DB.partners = DB.partners || [];
        DB.partners.unshift({ id: Date.now(), ...data });
    }

    saveDB();
    clearPartnerForms();
    renderPartners();
}


if (btnClearPartner) btnClearPartner.addEventListener('click', clearPartnerForms);
if (btnSavePartner) btnSavePartner.addEventListener('click', savePartnerCustomer);

// đổi nhóm sẽ cập nhật tiêu đề khi chưa ở chế độ sửa
const pGroupSel = document.getElementById('pGroup');
if (pGroupSel) pGroupSel.addEventListener('change', () => {
    if (!editingPartnerId) setPartnerFormMode(false);
});

function renderPartners() {
    const tbody = document.querySelector('#tblPartners tbody');
    if (!tbody) return;

    const list = (DB.partners || []);
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Chưa có đối tác/khách hàng</td></tr>';
        return;
    }

    tbody.innerHTML = list.map((p, i) => `
        <tr style="cursor:pointer" onclick="editPartner(${p.id})">
            <td>${i + 1}</td>
            <td>${escapeHtml(p.group || '')}</td>
            <td>${escapeHtml(p.name || '')}</td>
            <td>${escapeHtml(p.type || '')}</td>
            <td>${escapeHtml(p.contact || '')}</td>
            <td>${escapeHtml(p.status || 'Hoạt động')}</td>
        </tr>
    `).join('');
}

function editPartner(id) {
    const p = (DB.partners || []).find(x => x.id === id);
    if (!p) return;

    const f = getPartnerForm();

    if (f.group) f.group.value = p.group || 'Đối tác';
    if (f.name) f.name.value = p.name || '';
    if (f.type) f.type.value = p.type || '';
    if (f.contact) f.contact.value = p.contact || '';
    if (f.status) f.status.value = p.status || 'Hoạt động';

    editingPartnerId = id;
    editingPartnerGroup = p.group || 'Đối tác';
    setPartnerFormMode(true);
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
    const status = document.getElementById('cStatus')?.value?.trim() || 'Chờ ký';
    const note = document.getElementById('cNote')?.value?.trim() || '';
    return { no, partner, start, end, value, status, note };
}

function clearContractForm() {
  const ids = ['cNo','cPartner','cStart','cEnd','cValue','cNote'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  const st = document.getElementById('cStatus');
  if (st) st.value = 'Chờ ký';   // ✅ mặc định

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
    document.getElementById('cStatus').value = c.status || '';
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
            <td>${escapeHtml(c.status)}</td>
            <td>
                <button class="btn btn-edit" onclick="editContract(${c.id})">Sửa</button>
                <button class="btn btn-delete" onclick="removeContract(${c.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}


function setContainerOnboard(containerNo) {
    if (!containerNo) return;
    const c = (DB.containers || []).find(x => x && x.no === containerNo);
    if (!c) return;
    c.loc = 'Onboard';
    // nếu không phải bảo trì thì gợi ý trạng thái đang vận chuyển
    if (c.status && c.status !== 'Bảo trì') c.status = 'Đang vận chuyển';
}

// --- Hóa đơn ---
const btnSaveInvoice = document.getElementById('saveInvoice');
if (btnSaveInvoice) {
    btnSaveInvoice.addEventListener('click', () => {
        const data = getInvoiceFormData();
        if (!data.no) return alert('Vui lòng nhập Số hóa đơn');
        if (!data.contractNo) return alert('Vui lòng chọn Hợp đồng');

        if (!editingInvoiceId && (DB.invoices || []).some(i => i.no === data.no)) {
            return alert('Số hóa đơn đã tồn tại');
        }

        if (editingInvoiceId) {
            const idx = (DB.invoices || []).findIndex(i => i.id === editingInvoiceId);
            if (idx >= 0) DB.invoices[idx] = { ...DB.invoices[idx], ...data };
        } else {
            DB.invoices.unshift({ id: Date.now(), ...data });
        }

        // Nếu hóa đơn có container -> chuyển trạng thái/địa điểm container thành Onboard
        if (data.container) setContainerOnboard(data.container);

        saveDB();
        clearInvoiceForm();
        renderInvoices();
    });
}

document.getElementById('clearInvoice')?.addEventListener('click', clearInvoiceForm);
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
    // nếu đã thanh toán mà chưa có ngày, gợi ý hôm nay
    if (paid === 'Đã thanh toán' && !paidDate.value) {
        paidDate.value = new Date().toISOString().slice(0, 10);
    }
});

function getInvoiceFormData() {
    const no = document.getElementById('iNo')?.value?.trim() || '';
    const contractNo = document.getElementById('iContract')?.value || '';
    const c = (DB.contracts || []).find(x => x.no === contractNo);
    const partner = c?.partner || (document.getElementById('iPartner')?.value?.trim() || '');
    const issue = document.getElementById('iIssue')?.value || '';
    const due = document.getElementById('iDue')?.value || '';
    const amount = Number(document.getElementById('iAmount')?.value || 0);
    const vat = Number(document.getElementById('iVat')?.value || 0);
    const total = Math.round(amount + amount * (vat / 100));
    const paid = document.getElementById('iPaid')?.value || 'Chưa thanh toán';
    const paidDate = document.getElementById('iPaidDate')?.value || '';
    const container = document.getElementById('iContainer')?.value || '';
    const note = document.getElementById('iNote')?.value?.trim() || '';
    return { no, contractNo, partner, container, issue, due, amount, vat, total, paid, paidDate, note };
}

function clearInvoiceForm() {
    const ids = ['iNo','iIssue','iDue','iAmount','iVat','iTotal','iPaidDate','iNote'];
    const contEl = document.getElementById('iContainer');
    if (contEl) contEl.value = '';
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const contractEl = document.getElementById('iContract');
    if (contractEl) contractEl.value = '';
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
    const partnerEl = document.getElementById('iPartner');
    if (partnerEl) partnerEl.value = inv.partner || '';
    const contEl = document.getElementById('iContainer');
    if (contEl) contEl.value = inv.container || '';

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
            <td>${escapeHtml(inv.partner)}</td>
            <td>${escapeHtml(inv.container || '')}</td>
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
    updateFinanceDetail();

    // Đối tác / Khách hàng
    renderPartners();

    // Nhân sự
    renderStaff();

    // Hợp đồng & Hóa đơn
    renderContracts();
    renderInvoices();
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    normalizeDB();
    renderAll();
    renderContracts();
    renderInvoices();
    populateAllSelects();

    // Search & Export
    const s = document.getElementById('globalSearch');
    if (s) s.addEventListener('input', () => applyGlobalSearch(s.value));
    document.getElementById('exportBtn')?.addEventListener('click', exportJSON);
});