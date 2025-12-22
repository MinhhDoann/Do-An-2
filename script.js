// --- Simple SPA nav with submenu toggle ---
const sections = document.querySelectorAll('.card-section');
const mainNav = document.getElementById('mainNav');

mainNav.addEventListener('click', e => {
    if (e.target.matches('button')) {
        const target = e.target;

        if (target.classList.contains('submenu-toggle')) {
            const parentLi = target.closest('li.has-submenu');
            const isActive = parentLi.classList.toggle('active');
            
            document.querySelectorAll('.nav .has-submenu').forEach(li => {
                if (li !== parentLi) {
                    li.classList.remove('active');
                }
            });
            return;
        }

        if (target.dataset.section) {
            const s = target.dataset.section;
            
            document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            document.querySelectorAll('.nav .has-submenu').forEach(li => li.classList.remove('active'));
            
            showSection(s);
        }
    }
});

function showSection(id) {
    sections.forEach(sec => sec.style.display = sec.id === id ? '' : 'none');
    document.getElementById('sectionTitle').textContent = 
        document.querySelector(`[data-section="${id}"]`)?.textContent || 'Tổng quan';
    
    // Gọi render riêng cho section cần thiết
    switch(id) {
        case 'dashboard': renderAll(); break;
        case 'containers': renderContainers(); populateContainerSelect(); break;
        case 'cargo': renderCargo(); populateContainerSelect(); break;
        case 'transport': renderTransport(); break;
        case 'depot': renderYard(); break;
        case 'docs': renderDocs(); break;
        case 'finance':  break;
        case 'partners': renderPartners(); break;
        case 'staff': renderStaff(); break;
        case 'equipment': renderEquip(); break;
        default: renderAll();
    }
}

// --- Storage utilities ---
const DB = {
    containers: [],
    cargo: [],
    transports: [],
    docs: [],
    partners: [],
    staff: [],
    equip: []
};

// BIẾN MỚI: hỗ trợ chế độ sửa
let editingContainerId = null;

function loadDB() {
    try {
        const raw = localStorage.getItem('cl_db');
        if (raw) Object.assign(DB, JSON.parse(raw));
    } catch (e) {
        console.warn("Lỗi load DB:", e);
    }
}

function saveDB() {
    localStorage.setItem('cl_db', JSON.stringify(DB));
}

// --- Containers ---
document.getElementById('saveContainer').addEventListener('click', function() {
    const no = document.getElementById('cNumber').value.trim();
    if (!no) return alert('Nhập số container');

    const type = document.getElementById('cType').value;
   // Lấy vị trí theo hệ thống mới
    const mainLoc = document.getElementById('cLocationMain')?.value || '';
    let loc = mainLoc;

    if (mainLoc === 'Depot') {
        const port = document.getElementById('cDepotPort')?.value || '';
        loc = port ? `Depot - ${port}` : 'Depot';
    } else if (mainLoc === 'Onboard') {
        const vessel = document.getElementById('cOnboardVessel')?.value?.trim() || '';
        loc = vessel ? `Onboard - ${vessel}` : 'Onboard';
    }
    const status = document.getElementById('cStatus').value;

    if (editingContainerId) {
        const isDuplicate = DB.containers.some(c => c.no === no && c.id !== editingContainerId);
        if (isDuplicate) return alert('Số container đã tồn tại!');
        
        const container = DB.containers.find(c => c.id === editingContainerId);
        if (container) {
            container.no = no;
            container.type = type;
            container.loc = loc;
            container.status = status;
            saveDB();
            alert('✅ Cập nhật container thành công!');
        }
    } else {
        if (DB.containers.some(c => c.no === no)) {
            return alert('Số container đã tồn tại!');
        }
        DB.containers.unshift({
            id: Date.now(),
            no,
            type,
            loc,
            status
        });
        saveDB();
        alert('✅ Thêm container thành công!');
    }

    clearContainerForm();
    renderContainers();
});

function clearContainerForm() {
    const fields = ['cNumber', 'cOnboardVessel'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const selects = ['cType', 'cStatus', 'cLocationMain', 'cDepotPort'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.options[0]?.value || '';
    });

    document.getElementById('depotPortRow').style.display = 'none';
    document.getElementById('onboardVesselRow').style.display = 'none';

    editingContainerId = null;
    document.getElementById('saveContainer').textContent = 'Lưu';
    document.getElementById('cType').value = '20DC';
    editingContainerId = null;
    document.getElementById('saveContainer').textContent = 'Lưu';
}

function renderContainers() {
    const tbody = document.querySelector('#tblContainers tbody');
    tbody.innerHTML = '';
    const q = document.getElementById('cFilter').value.toLowerCase();

    DB.containers.forEach((c, i) => {
        if (q && !(c.no || '').toLowerCase().includes(q) &&
            !(c.type || '').toLowerCase().includes(q) &&
            !(c.loc || '').toLowerCase().includes(q)) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${c.no}</td>
            <td>${c.type}</td>
            <td>${c.loc}</td>
            <td>${c.status}</td>
            <td>
                <button class="btn-sm" onclick="editContainer(${c.id})">Sửa</button>
                <button class="btn-sm" onclick="removeContainer(${c.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    populateContainerSelect();
}

function removeContainer(id) {
    if (!confirm('Xóa container này? Hành động không thể hoàn tác!')) return;
    DB.containers = DB.containers.filter(c => c.id !== id);
    saveDB();
    renderContainers();
    alert('🗑️ Đã xóa container.');
}

// HÀM MỚI: Sửa container
function editContainer(id) {
    const container = DB.containers.find(c => c.id === id);
    if (!container) {
        alert('Không tìm thấy container!');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('cNumber').value = container.no;
    document.getElementById('cType').value = container.type;
    const loc = container.loc || '';
    const mainSelect = document.getElementById('cLocationMain');
    const depotRow = document.getElementById('depotPortRow');
    const onboardRow = document.getElementById('onboardVesselRow');
    // Ẩn hết
    depotRow.style.display = 'none';
    onboardRow.style.display = 'none';

    if (loc === 'Yard') {
        mainSelect.value = 'Yard';
    } else if (loc.startsWith('Depot')) {
        mainSelect.value = 'Depot';
        const port = loc.split(' - ')[1] || '';
        document.getElementById('cDepotPort').value = port;
        depotRow.style.display = 'block';
    } else if (loc.startsWith('Onboard')) {
        mainSelect.value = 'Onboard';
        const vessel = loc.split(' - ')[1] || '';
        document.getElementById('cOnboardVessel').value = vessel;
        onboardRow.style.display = 'block';
    } else {
        mainSelect.value = '';
    }

    // Kích hoạt sự kiện để đồng bộ
    mainSelect.dispatchEvent(new Event('change'));
    document.getElementById('cStatus').value = container.status;

    // Chuyển sang chế độ sửa
    editingContainerId = id;
    document.getElementById('saveContainer').textContent = 'Cập nhật';

    // Cuộn lên form (tuỳ chọn)
    const content = document.querySelector('.content');
    if (content) {
        content.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Xử lý ẩn/hiện phần phụ khi chọn vị trí
const locMain = document.getElementById('cLocationMain');
if (locMain) {
    locMain.addEventListener('change', function() {
        const depotRow = document.getElementById('depotPortRow');
        const onboardRow = document.getElementById('onboardVesselRow');
        depotRow.style.display = 'none';
        onboardRow.style.display = 'none';
        if (this.value === 'Depot') {
            depotRow.style.display = 'block';
        } else if (this.value === 'Onboard') {
            onboardRow.style.display = 'block';
        }
    });
}
// --- Cargo ---
document.getElementById('saveCargo').addEventListener('click', () => {
    const desc = document.getElementById('gDesc').value.trim();
    if (!desc) return alert('Nhập mô tả hàng');

    const containerNo = document.getElementById('gContainer').value;
    if (!containerNo) return alert('Chọn container');

    const rec = {
        id: Date.now(),
        desc,
        qty: document.getElementById('gQty').value || 'N/A',
        type: document.getElementById('gType').value,
        container: containerNo
    };
    DB.cargo.unshift(rec);
    saveDB();
    clearCargoForm();
    showSection('cargo');
});

function clearCargoForm() {
    ['gDesc', 'gQty'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('gType').value = 'General';
    document.getElementById('gContainer').value = '';
    
    // Reset chế độ sửa & nút
    editingCargoId = null;
    const saveBtn = document.getElementById('saveCargo');
    saveBtn.textContent = 'Lưu';
    // Khôi phục hành vi gốc
    saveBtn.onclick = function() {
        const desc = document.getElementById('gDesc').value.trim();
        if (!desc) return alert('Nhập mô tả hàng');
        const containerNo = document.getElementById('gContainer').value;
        if (!containerNo) return alert('Chọn container');
        const rec = {
            id: Date.now(),
            desc,
            qty: document.getElementById('gQty').value || 'N/A',
            type: document.getElementById('gType').value,
            container: containerNo
        };
        DB.cargo.unshift(rec);
        saveDB();
        clearCargoForm();
        renderCargo();
    };
}

function renderCargo() {
    const tbody = document.querySelector('#tblCargo tbody');
    tbody.innerHTML = '';
    DB.cargo.forEach((g, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${g.desc}</td>
            <td>${g.container || '-'}</td>
            <td>${g.qty}</td>
            <td>${g.type}</td>
            <td>
                <button class="btn-sm" onclick="editCargo(${g.id})">Sửa</button>
                <button class="btn-sm" onclick="removeCargo(${g.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- BIẾN TOÀN CỤC CHO CARGO ---
let editingCargoId = null;

// XÓA HÀNG
function removeCargo(id) {
    if (!confirm('Xóa lô hàng này?')) return;
    DB.cargo = DB.cargo.filter(g => g.id !== id);
    saveDB();
    renderCargo();
    alert('🗑️ Đã xóa lô hàng.');
}

// SỬA HÀNG
function editCargo(id) {
    const cargo = DB.cargo.find(g => g.id === id);
    if (!cargo) {
        alert('Không tìm thấy lô hàng!');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('gDesc').value = cargo.desc;
    document.getElementById('gQty').value = cargo.qty;
    document.getElementById('gType').value = cargo.type;
    document.getElementById('gContainer').value = cargo.container || '';

    // Chuyển sang chế độ sửa
    editingCargoId = id;
    const saveBtn = document.getElementById('saveCargo');
    saveBtn.textContent = 'Cập nhật';
    saveBtn.onclick = () => updateCargo(id);
}

// CẬP NHẬT HÀNG
function updateCargo(id) {
    const desc = document.getElementById('gDesc').value.trim();
    if (!desc) return alert('Nhập mô tả hàng');

    const containerNo = document.getElementById('gContainer').value;
    if (!containerNo) return alert('Chọn container');

    const cargo = DB.cargo.find(g => g.id === id);
    if (!cargo) return alert('Lô hàng không tồn tại!');

    // Cập nhật
    cargo.desc = desc;
    cargo.qty = document.getElementById('gQty').value || 'N/A';
    cargo.type = document.getElementById('gType').value;
    cargo.container = containerNo;

    saveDB();
    alert('✅ Cập nhật lô hàng thành công!');
    clearCargoForm(); 
    renderCargo();    
}
// --- Transport ---
document.getElementById('saveTransport').addEventListener('click', () => {
    const ref = document.getElementById('tRef').value.trim();
    if (!ref) return alert('Nhập ref');

    const rec = {
        id: Date.now(),
        ref,
        type: document.getElementById('tType').value,
        vehicle: document.getElementById('tVehicle').value || 'N/A',
        eta: document.getElementById('tETA').value || ''
    };
    DB.transports.unshift(rec);
    saveDB();
    clearTransportForm();
    showSection('transport');
});

function clearTransportForm() {
    ['tRef', 'tVehicle'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('tType').value = 'Trucking';
    document.getElementById('tETA').value = '';
    
    // Reset nút & chế độ
    editingTransportId = null;
    const saveBtn = document.getElementById('saveTransport');
    saveBtn.textContent = 'Lưu';
    // Khôi phục hành vi gốc
    saveBtn.onclick = function() {
        const ref = document.getElementById('tRef').value.trim();
        if (!ref) return alert('Nhập ref');
        const rec = {
            id: Date.now(),
            ref,
            type: document.getElementById('tType').value,
            vehicle: document.getElementById('tVehicle').value || 'N/A',
            eta: document.getElementById('tETA').value || ''
        };
        DB.transports.unshift(rec);
        saveDB();
        clearTransportForm();
        renderTransport();
    };
}
function renderTransport() {
    const tbody = document.querySelector('#tblTransport tbody');
    tbody.innerHTML = '';
    DB.transports.forEach((t, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${t.ref}</td>
            <td>${t.type}</td>
            <td>${t.vehicle}</td>
            <td>${t.eta || '-'}</td>
            <td>
                <button class="btn-sm" onclick="editTransport(${t.id})">Sửa</button>
                <button class="btn-sm" onclick="removeTransport(${t.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- BIẾN TOÀN CỤC CHO TRANSPORT ---
let editingTransportId = null;

// XÓA LỊCH TRÌNH
function removeTransport(id) {
    if (!confirm('Xóa lịch trình này?')) return;
    DB.transports = DB.transports.filter(t => t.id !== id);
    saveDB();
    renderTransport();
    alert('🗑️ Đã xóa lịch trình.');
}

// SỬA LỊCH TRÌNH
function editTransport(id) {
    const transport = DB.transports.find(t => t.id === id);
    if (!transport) {
        alert('Không tìm thấy lịch trình!');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('tRef').value = transport.ref;
    document.getElementById('tType').value = transport.type;
    document.getElementById('tVehicle').value = transport.vehicle || '';
    document.getElementById('tETA').value = transport.eta || '';

    // Chuyển sang chế độ sửa
    editingTransportId = id;
    const saveBtn = document.getElementById('saveTransport');
    saveBtn.textContent = 'Cập nhật';
    saveBtn.onclick = () => updateTransport(id);
}

// CẬP NHẬT LỊCH TRÌNH
function updateTransport(id) {
    const ref = document.getElementById('tRef').value.trim();
    if (!ref) return alert('Nhập ref');

    const transport = DB.transports.find(t => t.id === id);
    if (!transport) return alert('Lịch trình không tồn tại!');

    // Cập nhật
    transport.ref = ref;
    transport.type = document.getElementById('tType').value;
    transport.vehicle = document.getElementById('tVehicle').value || 'N/A';
    transport.eta = document.getElementById('tETA').value || '';

    saveDB();
    alert('✅ Cập nhật lịch trình thành công!');
    clearTransportForm();
    renderTransport();
}

// --- Yard (depot)
function renderYard() {
    const yard = document.getElementById('yard');
    yard.innerHTML = '';
    
    for (let i = 0; i < 32; i++) {
        const cell = document.createElement('div');
        cell.className = 'card';
        cell.style.padding = '12px';
        cell.style.textAlign = 'center';
        cell.style.cursor = 'pointer';
        cell.dataset.idx = i;

        const containerHere = DB.containers.find(c => 
            c.loc === 'Yard' && c.yardPosition == i
        );

        cell.textContent = containerHere ? containerHere.no : 'Empty';
        if (containerHere) cell.style.backgroundColor = '#e0f2fe';

        cell.addEventListener('click', () => {
            const currentNo = containerHere ? containerHere.no : '';
            const no = prompt('Nhập số container (để trống để xóa):', currentNo);
            if (no === null) return;

            const trimmed = no.trim();

            if (trimmed === '') {
                if (containerHere) {
                    DB.containers = DB.containers.filter(c => c.id !== containerHere.id);
                }
            } else {
                if (DB.containers.some(c => c.no === trimmed && c.id !== (containerHere?.id || -1))) {
                    alert('Số container đã tồn tại!');
                    return;
                }

                if (containerHere) {
                    containerHere.no = trimmed;
                } else {
                    DB.containers.push({
                        id: Date.now(),
                        no: trimmed,
                        type: '20DC',
                        loc: 'Yard',
                        status: 'Empty',
                        yardPosition: i
                    });
                }
            }
            saveDB();
            renderYard();
        });

        yard.appendChild(cell);
    }
}

// --- Docs ---
document.getElementById('saveDoc').addEventListener('click', () => {
    const r = document.getElementById('docRef').value.trim();
    if (!r) return alert('Nhập ref');

    const doc = {
        id: Date.now(),
        ref: r,
        type: document.getElementById('docType').value,
        status: 'Pending'
    };
    DB.docs.unshift(doc);
    saveDB();
    document.getElementById('docRef').value = '';
    showSection('docs');
});

document.getElementById('fileDoc').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    DB.docs.unshift({
        id: Date.now(),
        ref: f.name,
        type: 'File',
        status: 'Uploaded'
    });
    saveDB();
    e.target.value = '';
});

function renderDocs() {
    const tbody = document.querySelector('#tblDocs tbody');
    tbody.innerHTML = '';
    DB.docs.forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.ref}</td>
            <td>${d.type}</td>
            <td>${d.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Finance ---
document.getElementById('calcCost').addEventListener('click', () => {
    const base = parseFloat(document.getElementById('fBase').value) || 0;
    const dem = parseFloat(document.getElementById('fDemDet').value) || 0;
    const local = parseFloat(document.getElementById('fLocal').value) || 0;
    
    if (isNaN(base) || isNaN(dem) || isNaN(local)) {
        return alert('Vui lòng nhập số hợp lệ.');
    }

    const total = base + dem + local;
    document.getElementById('costResult').textContent = 
        `Tổng: ${total.toLocaleString('vi-VN')} VND`;
});

function downloadReport() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report_cl_db.json';
    a.click();
    URL.revokeObjectURL(url);
}

// --- Partners ---
document.getElementById('savePartner').addEventListener('click', () => {
    const name = document.getElementById('pName').value.trim();
    if (!name) return alert('Nhập tên');

    DB.partners.unshift({
        id: Date.now(),
        name,
        type: document.getElementById('pType').value,
        contact: document.getElementById('pContact').value || 'N/A'
    });
    saveDB();
    document.getElementById('pName').value = '';
    document.getElementById('pContact').value = '';
    showSection('partners');
});

function renderPartners() {
    const tbody = document.querySelector('#tblPartners tbody');
    tbody.innerHTML = '';
    DB.partners.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${p.name}</td>
            <td>${p.type}</td>
            <td>${p.contact}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Staff & Equip ---
function renderStaff() {
    const tbody = document.querySelector('#tblStaff tbody');
    tbody.innerHTML = '';
    DB.staff.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td>${s.phone}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEquip() {
    const tbody = document.querySelector('#tblEquip tbody');
    tbody.innerHTML = '';
    DB.equip.forEach((q, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${q.name}</td>
            <td>${q.type}</td>
            <td>${q.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Misc UI ---
function populateContainerSelect() {
    const sel = document.getElementById('gContainer');
    sel.innerHTML = '<option value="">- Chọn container -</option>';
    DB.containers.forEach(c => {
        const o = document.createElement('option');
        o.value = c.no;
        o.textContent = `${c.no} • ${c.type}`;
        sel.appendChild(o);
    });
}

// --- Render All Stats & Recent Lists ---
function renderAll() {
    loadDB();

    document.getElementById('stat-containers').textContent = DB.containers.length;
    document.getElementById('stat-intransit').textContent = 
        DB.containers.filter(c => c.status === 'In Transit').length;
    document.getElementById('stat-docs').textContent = 
        DB.docs.filter(d => d.status === 'Pending').length;

    const rc = document.querySelector('#recentContainers tbody');
    rc.innerHTML = '';
    DB.containers.slice(0, 6).forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${c.no}</td>
            <td>${c.type}</td>
            <td>${c.loc}</td>
            <td>${c.status}</td>
        `;
        rc.appendChild(tr);
    });

    const rd = document.querySelector('#recentDocs tbody');
    rd.innerHTML = '';
    DB.docs.slice(0, 6).forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.ref}</td>
            <td>${d.type}</td>
            <td>${d.status}</td>
        `;
        rd.appendChild(tr);
    });
}

// --- Mock Data ---
function initMockData() {
    if (DB.containers.length > 0) return;

    DB.containers = [
        { id: 1, no: "TGHU1234567", type: "40HC", loc: "Cảng Cái Mép", status: "In Transit" },
        { id: 2, no: "MSKU7890123", type: "20DC", loc: "Depot Tân Cảng", status: "Full", yardPosition: 12 },
        { id: 3, no: "CMAU4567890", type: "REEFER", loc: "Yard", status: "Empty", yardPosition: 3 },
        { id: 4, no: "HLCU2468135", type: "40HC", loc: "Onboard Vessel VN123", status: "In Transit" },
        { id: 5, no: "OOLU1357924", type: "20DC", loc: "Depot SITC", status: "Maintenance" }
    ];

    DB.cargo = [
        { id: 101, desc: "Máy lạnh Daikin", qty: "20 units", type: "General", container: "TGHU1234567" },
        { id: 102, desc: "Hải sản đông lạnh", qty: "15 tons", type: "Reefer", container: "CMAU4567890" },
        { id: 103, desc: "Pin lithium", qty: "5 pallets", type: "Dangerous (DG)", container: "MSKU7890123" }
    ];

    DB.transports = [
        { id: 201, ref: "BK-2025-001", type: "Trucking", vehicle: "88C-123.45", eta: "2025-12-07" },
        { id: 202, ref: "BK-2025-002", type: "Feeder", vehicle: "MV SEA VIP", eta: "2025-12-10" }
    ];

    DB.docs = [
        { id: 301, ref: "HLCU2468135-BL", type: "BL", status: "Pending" },
        { id: 302, ref: "INV-DEC2025", type: "Invoice", status: "Approved" },
        { id: 303, ref: "PL-MSKU789", type: "Packing List", status: "Pending" },
        { id: 304, ref: "CO-VN-2025", type: "CO", status: "Issued" }
    ];

    DB.partners = [
        { id: 401, name: "Công ty TNHH ABC Logistics", type: "Forwarder", contact: "abc@logistics.vn" },
        { id: 402, name: "Cảng vụ Hàng hải TP.HCM", type: "Carrier", contact: "port@vietnam.vn" },
        { id: 403, name: "Xuất khẩu Nông sản Miền Tây", type: "Shipper", contact: "xuatkhau@agri.vn" }
    ];

    DB.staff = [
        { id: 501, name: "Nguyễn Văn A", role: "Quản lý điều độ", phone: "0909 123 456" },
        { id: 502, name: "Trần Thị B", role: "Nhân viên chứng từ", phone: "0933 789 012" },
        { id: 503, name: "Lê Văn C", role: "Tài xế xe đầu kéo", phone: "0977 456 789" }
    ];

    DB.equip = [
        { id: 601, name: "Xe nâng 10T - #XN001", type: "Forklift", status: "Available" },
        { id: 602, name: "Container Handler - #CH002", type: "Reach Stacker", status: "In Use" },
        { id: 603, name: "Xe đầu kéo - #XD003", type: "Tractor", status: "Maintenance" }
    ];

    saveDB();
    console.log("✅ Đã khởi tạo dữ liệu mẫu.");
}

// --- Global Search ---
function performGlobalSearch() {
    const query = document.getElementById('globalSearch').value.trim().toLowerCase();
    if (!query) {
        document.querySelectorAll('mark.search-highlight').forEach(el => {
            el.outerHTML = el.textContent; 
        });
        return;
    }

    document.querySelectorAll('mark.search-highlight').forEach(el => {
        el.outerHTML = el.textContent;
    });

    let found = false;

    const highlightInCell = (cell, term) => {
        const text = cell.textContent || '';
        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        if (lowerText.includes(lowerTerm)) {
            const escaped = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(${escaped})`, 'gi');
            cell.innerHTML = text.replace(re, '<mark class="search-highlight">$1</mark>');
            found = true;
        }
    };

    const tables = [
        { selector: '#tblContainers tbody tr', cols: [1, 2, 3, 4] },
        { selector: '#tblCargo tbody tr', cols: [1, 2, 4] },
        { selector: '#tblTransport tbody tr', cols: [1, 2, 3] },
        { selector: '#tblDocs tbody tr', cols: [1, 2, 3] },
        { selector: '#tblPartners tbody tr', cols: [1, 2, 3] },
        { selector: '#tblStaff tbody tr', cols: [1, 2, 3] },
        { selector: '#tblEquip tbody tr', cols: [1, 2, 3] },
        { selector: '#recentContainers tbody tr', cols: [1, 2, 3, 4] },
        { selector: '#recentDocs tbody tr', cols: [1, 2, 3] }
    ];

    tables.forEach(table => {
        document.querySelectorAll(table.selector).forEach(row => {
            table.cols.forEach(colIndex => {
                const cell = row.cells[colIndex];
                if (cell) highlightInCell(cell, query);
            });
        });
    });

    if (!found) {
        alert(`Không tìm thấy "${query}"`);
    }
}

document.getElementById('searchBtn')?.addEventListener('click', performGlobalSearch);
document.getElementById('globalSearch')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') performGlobalSearch();
});

// --- Init App ---
document.addEventListener("DOMContentLoaded", () => {
    loadDB();
    initMockData();
    renderAll();

    const userIcon = document.getElementById("userIcon");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    if (userIcon && userDropdown) {
        userIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.style.display = 
                userDropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = "none";
            }
        });
    }

    logoutBtn?.addEventListener("click", () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            window.location.href = 'index.html';
        }
    });
});