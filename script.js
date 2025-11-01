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

