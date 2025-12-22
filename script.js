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
        case 'contracts': renderContracts(); break;
        case 'finance':
        setTimeout(populateFinanceContainerSelect, 100); 
        break;
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
    contracts: [],
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
    const status = document.getElementById('cStatus').value;

    const mainLoc = document.getElementById('cLocationMain')?.value || '';
    let loc = mainLoc;
    let yardPosition = null; 

    if (mainLoc === 'Depot') {
        const port = document.getElementById('cDepotPort')?.value || '';
        loc = port ? `Depot - ${port}` : 'Depot';
    } else if (mainLoc === 'Onboard') {
        const vessel = document.getElementById('cOnboardVessel')?.value?.trim() || '';
        loc = vessel ? `Onboard - ${vessel}` : 'Onboard';
    } else if (mainLoc === 'Yard') {
        loc = 'Yard';
        const usedPositions = DB.containers
            .filter(c => c.loc === 'Yard' && c.yardPosition != null)
            .map(c => c.yardPosition);
        yardPosition = usedPositions.length < 32 ? usedPositions.length : 0;
    }

    if (editingContainerId) {
        const isDuplicate = DB.containers.some(c => c.no === no && c.id !== editingContainerId);
        if (isDuplicate) return alert('Số container đã tồn tại!');

        const container = DB.containers.find(c => c.id === editingContainerId);
        if (container) {
            container.no = no;
            container.type = type;
            container.loc = loc;
            container.status = status;
            if (yardPosition !== null) {
                container.yardPosition = yardPosition;
            } else {
                delete container.yardPosition;
            }
            saveDB();
            alert('✅ Cập nhật container thành công!');
        }
    } else {
        if (DB.containers.some(c => c.no === no)) {
            return alert('Số container đã tồn tại!');
        }
        const newContainer = { id: Date.now(), no, type, loc, status };
        if (yardPosition !== null) {
            newContainer.yardPosition = yardPosition;
        }
        DB.containers.unshift(newContainer);
        saveDB();
        alert('✅ Thêm container thành công!');
    }

    clearContainerForm();
    renderContainers();
    if (document.getElementById('depot')?.style.display !== 'none') {
        renderYard();
    }
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

// --- Contracts ---
document.getElementById('saveContract')?.addEventListener('click', () => {
    const ref = document.getElementById('ctRef').value.trim();
    if (!ref) return alert('Nhập số hợp đồng!');

    const customer = {
        name: document.getElementById('ctCustomerName').value.trim(),
        phone: document.getElementById('ctCustomerPhone').value.trim(),
        email: document.getElementById('ctCustomerEmail').value.trim(),
        addr: document.getElementById('ctCustomerAddr').value.trim()
    };

    if (!customer.name) return alert('Nhập tên khách hàng!');

    const dateIn = document.getElementById('ctDateIn').value;
    const dateOut = document.getElementById('ctDateOut').value;
    if (!dateIn || !dateOut) return alert('Chọn ngày nhập và ngày lấy!');

    const containerNo = document.getElementById('ctContainerNo').value.trim();
    if (!containerNo) return alert('Nhập số container!');

    const containerType = document.getElementById('ctContainerType').value.trim() || '20DC';

    // 1. Tự động thêm đối tác (nếu chưa có)
    let partner = DB.partners.find(p => p.name === customer.name);
    if (!partner) {
        partner = {
            id: Date.now(),
            name: customer.name,
            type: 'Shipper',
            contact: customer.phone || customer.email || ''
        };
        DB.partners.unshift(partner);
    }

    // 2. Tự động thêm container (vào Yard)
    const container = {
        id: Date.now() + 1,
        no: containerNo,
        type: containerType,
        loc: 'Yard',
        status: 'Full',
        yardPosition: DB.containers.filter(c => c.loc === 'Yard').length % 32
    };
    DB.containers.unshift(container);

    // 3. Tự động thêm hàng
    const cargoDesc = document.getElementById('ctCargoDesc').value.trim();
    if (cargoDesc) {
        DB.cargo.unshift({
            id: Date.now() + 2,
            desc: cargoDesc,
            qty: document.getElementById('ctCargoQty').value || 'N/A',
            type: document.getElementById('ctCargoType').value,
            container: containerNo
        });
    }

    // 4. Lưu hợp đồng
    DB.contracts.unshift({
        id: Date.now(),
        ref,
        customer,
        dateIn,
        dateOut,
        containerNo,
        cargoDesc,
        status: 'Active'
    });

    saveDB();
    alert('✅ Hợp đồng đã được lưu!\n→ Container, hàng, đối tác đã được tạo tự động.');
    
    // Làm sạch form
    ['ctRef', 'ctCustomerName', 'ctCustomerPhone', 'ctCustomerEmail', 'ctCustomerAddr',
     'ctContainerNo', 'ctContainerType', 'ctCargoDesc', 'ctCargoQty'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('ctDateIn').value = '';
    document.getElementById('ctDateOut').value = '';
    document.getElementById('ctCargoType').value = 'General';

    showSection('contracts');
});

function renderContracts() {
    const tbody = document.querySelector('#tblContracts tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    DB.contracts.forEach((ct, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${ct.ref}</td>
            <td>${ct.customer.name}</td>
            <td>${ct.dateIn}</td>
            <td>${ct.status}</td>
            <td>
                <button class="btn-sm" onclick="viewContract(${ct.id})">Xem</button>
                <button class="btn-sm" onclick="deleteContract(${ct.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewContract(id) {
    const ct = DB.contracts.find(c => c.id === id);
    if (!ct) return;
    alert(`
        HỢP ĐỒNG: ${ct.ref}
        Khách hàng: ${ct.customer.name}
        SĐT: ${ct.customer.phone}
        Email: ${ct.customer.email}
        Địa chỉ: ${ct.customer.addr}
        Ngày nhập bãi: ${ct.dateIn}
        Ngày lấy: ${ct.dateOut}
        Container: ${ct.containerNo}
        Hàng: ${ct.cargoDesc || 'Không có'}
    `.trim());
}

function deleteContract(id) {
    if (!confirm('Xóa hợp đồng này?')) return;
    DB.contracts = DB.contracts.filter(c => c.id !== id);
    saveDB();
    renderContracts();
    alert('🗑️ Đã xóa hợp đồng.');
}
// HÀM XỬ LÝ LƯU HỢP ĐỒNG
function handleSaveContract() {
    const ref = document.getElementById('ctRef')?.value.trim();
    if (!ref) return alert('Nhập số hợp đồng!');

    const customerName = document.getElementById('ctCustomerName')?.value.trim();
    if (!customerName) return alert('Nhập tên khách hàng!');

    const dateIn = document.getElementById('ctDateIn')?.value;
    const dateOut = document.getElementById('ctDateOut')?.value;
    if (!dateIn || !dateOut) return alert('Chọn ngày nhập và ngày lấy!');

    const containerNo = document.getElementById('ctContainerNo')?.value.trim();
    if (!containerNo) return alert('Nhập số container!');

    // Thêm hợp đồng
    DB.contracts.unshift({
        id: Date.now(),
        ref,
        customer: { name: customerName },
        dateIn,
        dateOut,
        containerNo,
        cargoDesc: document.getElementById('ctCargoDesc')?.value.trim() || 'N/A',
        status: 'Active'
    });

    saveDB();
    alert('Hợp đồng đã được lưu!');
    renderContracts();
    
    // Làm sạch form
    document.getElementById('ctRef').value = '';
    document.getElementById('ctCustomerName').value = '';
    document.getElementById('ctDateIn').value = '';
    document.getElementById('ctDateOut').value = '';
    document.getElementById('ctContainerNo').value = '';
    document.getElementById('ctCargoDesc').value = '';
}

// finance
document.getElementById('saveCost')?.addEventListener('click', function() {
    if (!window.tempCostData) return alert('Không có dữ liệu để lưu!');

    const contract = DB.contracts.find(ct => ct.containerNo === window.tempCostData.containerNo);
    if (!contract) {
        return alert('Không tìm thấy hợp đồng cho container này!');
    }

    contract.cost = window.tempCostData;
    saveDB();
    alert('✅ Đã lưu chi phí vào hợp đồng ' + contract.ref);
});
// Điền danh sách container vào dropdown
function populateFinanceContainerSelect() {
    const sel = document.getElementById('fContainerSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn container --</option>';
    DB.containers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.no;
        opt.textContent = `${c.no} • ${c.type} • ${c.loc}`;
        sel.appendChild(opt);
    });
}

// HÀM TÍNH CHI PHÍ CHI TIẾT
function calculateCost() {
    const containerNo = document.getElementById('fContainerSelect')?.value;
    const dateInStr = document.getElementById('fDateIn')?.value;
    const dateOutStr = document.getElementById('fDateOut')?.value;
    const freeDays = parseInt(document.getElementById('fFreeDays')?.value) || 7;

    if (!containerNo || !dateInStr || !dateOutStr) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    const dateIn = new Date(dateInStr);
    const dateOut = new Date(dateOutStr);
    
    if (dateOut < dateIn) {
        alert('Ngày lấy không được sớm hơn ngày nhập!');
        return;
    }

    // Tính số ngày bãi
    const totalDays = Math.ceil((dateOut - dateIn) / (1000 * 60 * 60 * 24));
    const overDays = Math.max(0, totalDays - freeDays);

    // BẢNG GIÁ MẪU (điều chỉnh theo thực tế)
    const RATE = {
        base: 200000,      // Phí cơ bản/ngày
        over: 300000,      // Phạt quá hạn/ngày
        handling: 150000   // Phí xếp dỡ
    };

    // Tính chi phí
    const baseCost = totalDays * RATE.base;
    const overCost = overDays * RATE.over;
    const total = baseCost + overCost + RATE.handling;

    // Hiển thị kết quả chi tiết
    const breakdown = `
        <div style="background:#f8fafc;padding:12px;border-radius:8px">
            <h4 style="margin:0 0 10px;font-size:16px">📦 Container: ${containerNo}</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div><strong>Ngày nhập:</strong> ${dateInStr}</div>
                <div><strong>Ngày lấy:</strong> ${dateOutStr}</div>
                <div><strong>Tổng ngày bãi:</strong> ${totalDays} ngày</div>
                <div><strong>Ngày miễn phí:</strong> ${freeDays} ngày</div>
                <div><strong>Ngày quá hạn:</strong> <span style="color:#ef4444">${overDays}</span> ngày</div>
            </div>
        </div>
        <div style="margin-top:16px">
            <h4 style="margin:0 0 10px;font-size:16px">📊 Chi tiết chi phí</h4>
            <ul style="padding-left:20px;line-height:1.6">
                <li>Phí bãi cơ bản (${totalDays} ngày × ${RATE.base.toLocaleString()} VND): 
                    <strong>${baseCost.toLocaleString()} VND</strong></li>
                <li>Phạt quá hạn (${overDays} ngày × ${RATE.over.toLocaleString()} VND): 
                    <strong style="color:#ef4444">${overCost.toLocaleString()} VND</strong></li>
                <li>Phí xếp dỡ: <strong>${RATE.handling.toLocaleString()} VND</strong></li>
            </ul>
        </div>
    `;

    document.getElementById('costBreakdown').innerHTML = breakdown;
    document.getElementById('totalAmount').textContent = total.toLocaleString();
    document.getElementById('saveCost').style.display = 'inline-block';

    // Lưu tạm dữ liệu để lưu vào hợp đồng
    window.tempCostData = {
        containerNo,
        dateIn: dateInStr,
        dateOut: dateOutStr,
        freeDays,
        totalDays,
        overDays,
        baseCost,
        overCost,
        handling: RATE.handling,
        total
    };
}

// Làm lại form
function clearCostForm() {
    document.getElementById('fContainerSelect').value = '';
    document.getElementById('fDateIn').value = '';
    document.getElementById('fDateOut').value = '';
    document.getElementById('fFreeDays').value = '7';
    document.getElementById('costBreakdown').innerHTML = '<p>→ Nhập thông tin để tính chi phí</p>';
    document.getElementById('totalAmount').textContent = '0';
    document.getElementById('saveCost').style.display = 'none';
    delete window.tempCostData;
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
            <td>
                <button class="btn-sm" onclick="editPartner(${p.id})">Sửa</button>
                <button class="btn-sm" onclick="removePartner(${p.id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editPartner(id) {
    const partner = DB.partners.find(p => p.id === id);
    if (!partner) return alert('Không tìm thấy đối tác!');

    // Điền dữ liệu vào form
    document.getElementById('pName').value = partner.name;
    document.getElementById('pType').value = partner.type;
    document.getElementById('pContact').value = partner.contact;

    // Chuyển nút "Lưu" → "Cập nhật"
    const saveBtn = document.getElementById('savePartner');
    saveBtn.textContent = 'Cập nhật';

    // Gắn lại sự kiện cho nút (để xử lý cập nhật)
    saveBtn.onclick = function() {
        updatePartner(id);
    };

    // Cuộn lên form (tuỳ chọn)
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePartner(id) {
    const name = document.getElementById('pName').value.trim();
    if (!name) return alert('Nhập tên đối tác!');

    const partner = DB.partners.find(p => p.id === id);
    if (!partner) return alert('Đối tác không tồn tại!');

    // Cập nhật dữ liệu
    partner.name = name;
    partner.type = document.getElementById('pType').value;
    partner.contact = document.getElementById('pContact').value;

    saveDB();
    alert('✅ Cập nhật đối tác thành công!');

    // Reset form về chế độ "Thêm mới"
    document.getElementById('pName').value = '';
    document.getElementById('pContact').value = '';
    document.getElementById('pType').value = 'Shipper';
    document.getElementById('savePartner').textContent = 'Lưu';
    document.getElementById('savePartner').onclick = function() {
        // Gắn lại sự kiện gốc (thêm mới)
        const name = document.getElementById('pName').value.trim();
        if (!name) return alert('Nhập tên!');
        DB.partners.unshift({
            id: Date.now(),
            name,
            type: document.getElementById('pType').value,
            contact: document.getElementById('pContact').value || 'N/A'
        });
        saveDB();
        alert('✅ Thêm đối tác thành công!');
        renderPartners();
    };

    renderPartners();
}

// XÓA ĐỐI TÁC
function removePartner(id) {
    if (!confirm('Xóa đối tác này? Hành động không thể hoàn tác!')) return;
    DB.partners = DB.partners.filter(p => p.id !== id);
    saveDB();
    renderPartners();
    alert('🗑️ Đã xóa đối tác.');
}

// SỬA ĐỐI TÁC
function editPartner(id) {
    const partner = DB.partners.find(p => p.id === id);
    if (!partner) return alert('Không tìm thấy đối tác!');

    // Điền dữ liệu
    document.getElementById('pName').value = partner.name;
    document.getElementById('pType').value = partner.type; // ✅ Cần value trong option
    document.getElementById('pContact').value = partner.contact;

    // Đổi nút → Cập nhật
    const btn = document.getElementById('savePartner');
    btn.textContent = 'Cập nhật';
    btn.onclick = () => updatePartner(id);
    
    // Cuộn lên
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// CẬP NHẬT ĐỐI TÁC
function updatePartner(id) {
    const name = document.getElementById('pName').value.trim();
    const type = document.getElementById('pType').value;
    const contact = document.getElementById('pContact').value.trim();

    if (!name) return alert('Vui lòng nhập tên!');

    const partner = DB.partners.find(p => p.id === id);
    if (!partner) return alert('Đối tác không tồn tại!');

    partner.name = name;
    partner.type = type;
    partner.contact = contact;

    saveDB();
    alert('✅ Cập nhật thành công!');
    clearPartnerForm(); // reset form
    renderPartners();
}

// RESET FORM
function clearPartnerForm() {
    document.getElementById('pName').value = '';
    document.getElementById('pContact').value = '';
    document.getElementById('pType').value = 'Shipper'; // ✅ Đặt lại giá trị mặc định
    const btn = document.getElementById('savePartner');
    btn.textContent = 'Lưu';
    // Gắn lại sự kiện gốc (thêm mới)
    btn.onclick = function() {
        const name = document.getElementById('pName').value.trim();
        if (!name) return alert('Nhập tên!');
        DB.partners.unshift({
            id: Date.now(),
            name,
            type: document.getElementById('pType').value,
            contact: document.getElementById('pContact').value || 'N/A'
        });
        saveDB();
        alert('✅ Thêm đối tác thành công!');
        clearPartnerForm();
        renderPartners();
    };
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
    document.getElementById('stat-docs').textContent = DB.contracts.length;
    const statLabel = document.querySelector('#stat-docs').closest('.stat').querySelector('.small');
    if (statLabel) statLabel.textContent = 'Hợp đồng';

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
    DB.contracts.slice(0, 6).forEach((ct, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${ct.ref}</td>
            <td>Hợp đồng</td>
            <td>${ct.status}</td>
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

    DB.contracts = [
    { 
        id: 1001, 
        ref: "HD-2025-001", 
        customer: { name: "Công ty TNHH ABC Logistics", phone: "0909 123 456", email: "abc@logistics.vn" },
        dateIn: "2025-12-01",
        dateOut: "2025-12-05",
        containerNo: "TGHU1234567",
        cargoDesc: "Máy lạnh Daikin",
        status: "Active"
    },
    { 
        id: 1002, 
        ref: "HD-2025-002", 
        customer: { name: "Xuất khẩu Nông sản Miền Tây", phone: "0933 789 012" },
        dateIn: "2025-12-03",
        dateOut: "2025-12-08",
        containerNo: "MSKU7890123",
        cargoDesc: "Hải sản đông lạnh",
        status: "Active"
    }
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
        { selector: '#tblContracts tbody tr', cols: [1, 2, 3] },
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

    renderContracts(); 
    document.getElementById('saveContract')?.addEventListener('click', handleSaveContract);

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

    // Cập nhật dropdown container khi vào finance
    if (document.getElementById('finance').style.display !== 'none' || 
        document.getElementById('sectionTitle').textContent.includes('Tài chính')) {
        populateFinanceContainerSelect();
    }
    // Tự động điền ngày khi chọn container (tuỳ chọn)
    document.getElementById('fContainerSelect')?.addEventListener('change', function() {
        if (this.value) {
        }
    });
    // Xử lý tính chi phí
    document.getElementById('calcCost')?.addEventListener('click', calculateCost);
    document.getElementById('clearCost')?.addEventListener('click', clearCostForm);

    logoutBtn?.addEventListener("click", () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            window.location.href = 'index.html';
        }
    });
});