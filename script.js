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
