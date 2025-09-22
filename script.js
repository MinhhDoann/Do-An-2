// --- Simple SPA nav ---
const sections = document.querySelectorAll('.card-section');
document.getElementById('mainNav').addEventListener('click', e => {
    if (e.target.matches('button')) {
        const s = e.target.dataset.section; document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); showSection(s);
    }
});
function showSection(id) { sections.forEach(sec => sec.style.display = sec.id === id ? '' : 'none'); document.getElementById('sectionTitle').textContent = document.querySelector('[data-section="' + id + '"]')?.textContent || 'Tổng quan'; renderAll(); }

// --- Storage utilities ---
const DB = { containers: [], cargo: [], transports: [], docs: [], partners: [], staff: [], equip: [] };
function loadDB() { try { const raw = localStorage.getItem('cl_db'); if (raw) Object.assign(DB, JSON.parse(raw)); } catch (e) { console.warn(e) } }
function saveDB() { localStorage.setItem('cl_db', JSON.stringify(DB)); renderAll(); }

// --- Containers ---
document.getElementById('saveContainer').addEventListener('click', () => {
    const no = document.getElementById('cNumber').value.trim(); if (!no) return alert('Nhập số container');
    const rec = { id: Date.now(), no, type: document.getElementById('cType').value, loc: document.getElementById('cLocation').value, status: document.getElementById('cStatus').value };
    DB.containers.unshift(rec); saveDB(); clearContainerForm(); showSection('containers');
});
function clearContainerForm() { ['cNumber', 'cLocation'].forEach(id => document.getElementById(id).value = ''); }
function renderContainers() { const tbody = document.querySelector('#tblContainers tbody'); tbody.innerHTML = ''; const q = document.getElementById('cFilter').value.toLowerCase(); DB.containers.forEach((c, i) => { if (q && !(c.no || '').toLowerCase().includes(q) && !(c.type || '').toLowerCase().includes(q) && !(c.loc || '').toLowerCase().includes(q)) return; const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${c.no}</td><td>${c.type}</td><td>${c.loc}</td><td>${c.status}</td><td><button onclick="removeContainer(${c.id})">Xóa</button></td>`; tbody.appendChild(tr); }); populateContainerSelect(); }
function removeContainer(id) { DB.containers = DB.containers.filter(c => c.id !== id); saveDB(); }

// --- Cargo ---
document.getElementById('saveCargo').addEventListener('click', () => {
    const desc = document.getElementById('gDesc').value.trim(); if (!desc) return alert('Nhập mô tả');
    const rec = { id: Date.now(), desc, qty: document.getElementById('gQty').value, type: document.getElementById('gType').value, container: document.getElementById('gContainer').value };
    DB.cargo.unshift(rec); saveDB(); clearCargoForm(); showSection('cargo');
});
function clearCargoForm() { ['gDesc', 'gQty'].forEach(id => document.getElementById(id).value = ''); }
function renderCargo() { const tbody = document.querySelector('#tblCargo tbody'); tbody.innerHTML = ''; DB.cargo.forEach((g, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${g.desc}</td><td>${g.container || '-'}</td><td>${g.qty}</td><td>${g.type}</td>`; tbody.appendChild(tr); }); }

// --- Transport ---
document.getElementById('saveTransport').addEventListener('click', () => {
    const ref = document.getElementById('tRef').value.trim(); if (!ref) return alert('Nhập ref');
    const rec = { id: Date.now(), ref, type: document.getElementById('tType').value, vehicle: document.getElementById('tVehicle').value, eta: document.getElementById('tETA').value };
    DB.transports.unshift(rec); saveDB(); clearTransportForm(); showSection('transport');
});
function clearTransportForm() { ['tRef', 'tVehicle', 'tETA'].forEach(id => document.getElementById(id).value = ''); }
function renderTransport() { const tbody = document.querySelector('#tblTransport tbody'); tbody.innerHTML = ''; DB.transports.forEach((t, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${t.ref}</td><td>${t.type}</td><td>${t.vehicle}</td><td>${t.eta || '-'}</td>`; tbody.appendChild(tr); }); }

// --- Yard (depot) ---
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

// --- Docs ---
document.getElementById('saveDoc').addEventListener('click', () => {
    const r = document.getElementById('docRef').value.trim(); if (!r) return alert('Nhập ref');
    const doc = { id: Date.now(), ref: r, type: document.getElementById('docType').value, status: 'Pending' }; DB.docs.unshift(doc); saveDB(); document.getElementById('docRef').value = ''; showSection('docs');
});
document.getElementById('fileDoc').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return; DB.docs.unshift({ id: Date.now(), ref: f.name, type: 'File', status: 'Uploaded' }); saveDB();
});
function renderDocs() { const tbody = document.querySelector('#tblDocs tbody'); tbody.innerHTML = ''; DB.docs.forEach((d, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${d.ref}</td><td>${d.type}</td><td>${d.status}</td>`; tbody.appendChild(tr); }); }

// --- Finance ---
document.getElementById('calcCost').addEventListener('click', () => {
    const base = Number(document.getElementById('fBase').value) || 0; const dem = Number(document.getElementById('fDemDet').value) || 0; const local = Number(document.getElementById('fLocal').value) || 0; const total = base + dem + local; document.getElementById('costResult').textContent = 'Tổng: ' + total.toLocaleString();
});
function downloadReport() { const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'report_cl_db.json'; a.click(); URL.revokeObjectURL(url); }

// --- Partners ---
document.getElementById('savePartner').addEventListener('click', () => {
    const name = document.getElementById('pName').value.trim(); if (!name) return alert('Nhập tên'); DB.partners.unshift({ id: Date.now(), name, type: document.getElementById('pType').value, contact: document.getElementById('pContact').value }); saveDB(); document.getElementById('pName').value = '';
});
function renderPartners() { const tbody = document.querySelector('#tblPartners tbody'); tbody.innerHTML = ''; DB.partners.forEach((p, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${p.name}</td><td>${p.type}</td><td>${p.contact}</td>`; tbody.appendChild(tr); }); }

// --- Staff & Equip ---
function renderStaff() { const tbody = document.querySelector('#tblStaff tbody'); tbody.innerHTML = ''; DB.staff.forEach((s, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${s.name}</td><td>${s.role}</td><td>${s.phone}</td>`; tbody.appendChild(tr); }); }
function renderEquip() { const tbody = document.querySelector('#tblEquip tbody'); tbody.innerHTML = ''; DB.equip.forEach((q, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${q.name}</td><td>${q.type}</td><td>${q.status}</td>`; tbody.appendChild(tr); }); }

// --- IT ---
document.getElementById('saveIt').addEventListener('click', () => { localStorage.setItem('cl_api_base', document.getElementById('apiBase').value); alert('Lưu cấu hình'); });

// --- Misc UI ---
document.getElementById('exportBtn').addEventListener('click', () => { downloadReport(); });
document.getElementById('globalSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase(); // basic search across names
    // filter recent lists
    renderAll(q);
});

function populateContainerSelect() { const sel = document.getElementById('gContainer'); sel.innerHTML = '<option value="">- Chọn container -</option>'; DB.containers.forEach(c => { const o = document.createElement('option'); o.value = c.no; o.textContent = c.no + ' • ' + c.type; sel.appendChild(o); }); }

function renderAll(q) { // q optional
    loadDB(); document.getElementById('stat-containers').textContent = DB.containers.length;
    document.getElementById('stat-intransit').textContent = DB.containers.filter(c => c.status === 'In Transit').length;
    document.getElementById('stat-docs').textContent = DB.docs.filter(d => d.status === 'Pending').length;
    // recent tables
    const rc = document.querySelector('#recentContainers tbody'); rc.innerHTML = ''; DB.containers.slice(0, 6).forEach((c, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${c.no}</td><td>${c.type}</td><td>${c.loc}</td><td>${c.status}</td>`; rc.appendChild(tr); });
    const rd = document.querySelector('#recentDocs tbody'); rd.innerHTML = ''; DB.docs.slice(0, 6).forEach((d, i) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${i + 1}</td><td>${d.ref}</td><td>${d.type}</td><td>${d.status}</td>`; rd.appendChild(tr); });

    renderContainers(); renderCargo(); renderTransport(); renderDocs(); renderPartners(); renderStaff(); renderEquip(); renderYard();
}


document.addEventListener("DOMContentLoaded", () => {
    const userIcon = document.getElementById("userIcon");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    if (userIcon && userDropdown) {
        // Toggle khi click vào icon
        userIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.style.display =
                userDropdown.style.display === "block" ? "none" : "block";
        });

        // Click ra ngoài -> ẩn menu
        document.addEventListener("click", (e) => {
            if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = "none";
            }
        });
    }

    // Logout
    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("cl_db");
        window.location.href = "index.html";
    });
});


