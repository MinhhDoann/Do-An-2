// --- Chuyển trang tương ứng khi click chọn trong menu ---
const sections = document.querySelectorAll('.card-section');
document.getElementById('mainNav').addEventListener('click', e => {
    if (e.target.matches('button')) {
        const s = e.target.dataset.section; 
        document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active')); 
        e.target.classList.add('active'); 
        showSection(s);
    }
});
function showSection(id) { 
    sections.forEach(sec => sec.style.display = sec.id === id ? '' : 'none'); 
    document.getElementById('sectionTitle').textContent = document.querySelector('[data-section="' + id + '"]')?.textContent || 'Tổng quan';
    renderAll(); }

// --- Lưu trữ ---
const DB = { containers: [], cargo: [], transports: [], docs: [], partners: [], staff: [], equip: [] };
function loadDB() { 
    try { const raw = localStorage.getItem('cl_db'); 
    if (raw) Object.assign(DB, JSON.parse(raw)); } 
    catch (e) { console.warn(e) } }
function saveDB() { localStorage.setItem('cl_db', JSON.stringify(DB)); renderAll(); }

// --- Containers ---
document.getElementById('saveContainer').addEventListener('click', () => {
    const no = document.getElementById('cNumber').value.trim(); if (!no) return alert('Nhập số container');
    const rec = {   id: Date.now(), no, 
                    type: document.getElementById('cType').value, 
                    loc: document.getElementById('cLocation').value, 
                    status: document.getElementById('cStatus').value };
    DB.containers.unshift(rec); saveDB(); clearContainerForm(); showSection('containers');
});
function clearContainerForm() { ['cNumber', 'cLocation'].forEach(id => document.getElementById(id).value = ''); } //Clear ô nhập thông tin container
function renderContainers() {   const tbody = document.querySelector('#tblContainers tbody'); tbody.innerHTML = ''; 
                                const q = document.getElementById('cFilter').value.toLowerCase(); DB.containers.forEach((c, i) => { if (q && !(c.no || '').toLowerCase().includes(q) && !(c.type || '').toLowerCase().includes(q) && !(c.loc || '').toLowerCase().includes(q)) return; 
                                const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${c.no}</td><td>${c.type}</td><td>${c.loc}</td><td>${c.status}</td><td><button onclick="removeContainer(${c.id})">Xóa</button></td>`; tbody.appendChild(tr); }); populateContainerSelect(); }
function removeContainer(id) { DB.containers = DB.containers.filter(c => c.id !== id); saveDB(); }

// --- Hàng trong container ---
document.getElementById('saveCargo').addEventListener('click', () => {
    const desc = document.getElementById('gDesc').value.trim(); if (!desc) return alert('Nhập mô tả');
    const rec = {   id: Date.now(), desc, 
                    qty: document.getElementById('gQty').value, 
                    type: document.getElementById('gType').value, 
                    container: document.getElementById('gContainer').value };
    DB.cargo.unshift(rec); saveDB(); clearCargoForm(); showSection('cargo');
});
function clearCargoForm() { ['gDesc', 'gQty'].forEach(id => document.getElementById(id).value = ''); }
function renderCargo() {    const tbody = document.querySelector('#tblCargo tbody'); tbody.innerHTML = ''; 
                            DB.cargo.forEach((g, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${g.desc}</td><td>${g.container || '-'}</td><td>${g.qty}</td><td>${g.type}</td>`; 
                            tbody.appendChild(tr); }); }

// --- Vận tải ---
document.getElementById('saveTransport').addEventListener('click', () => {
    const ref = document.getElementById('tRef').value.trim(); if (!ref) return alert('Nhập ref');
    const rec = { id: Date.now(), ref, type: document.getElementById('tType').value, vehicle: document.getElementById('tVehicle').value, eta: document.getElementById('tETA').value };
    DB.transports.unshift(rec); saveDB(); clearTransportForm(); showSection('transport');
});
function clearTransportForm() { ['tRef', 'tVehicle', 'tETA'].forEach(id => document.getElementById(id).value = ''); }
function renderTransport() { const tbody = document.querySelector('#tblTransport tbody'); tbody.innerHTML = ''; DB.transports.forEach((t, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${t.ref}</td><td>${t.type}</td><td>${t.vehicle}</td><td>${t.eta || '-'}</td>`; tbody.appendChild(tr); }); }

// --- Sân bãi (depot) ---
function renderYard() {
    const yard = document.getElementById('yard'); yard.innerHTML = ''; for (let i = 0; i < 32; i++) {
        const cell = document.createElement('div'); cell.className = 'card'; cell.style.padding = '12px'; cell.style.textAlign = 'center'; cell.style.cursor = 'pointer'; cell.dataset.idx = i; cell.textContent = (DB.containers[i] && DB.containers[i].no) || 'Empty'; cell.addEventListener('click', () => {
            const c = prompt('Nhập số container cho ô này (empty để xóa):', cell.textContent); if (c === null) return; if (c.toLowerCase() === 'empty') { // clear
                if (DB.containers[i]) DB.containers.splice(i, 1); saveDB(); renderYard(); return;
            }
            const rec = { id: Date.now(), no: c, type: '20DC', loc: 'Yard', status: 'Empty' }; DB.containers[i] = rec; saveDB(); renderYard();
        }); yard.appendChild(cell);
    }
}