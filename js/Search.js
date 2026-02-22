document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const moduleId = this.dataset.table;
        const tbody = document.querySelector(`#${moduleId} tbody`);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');

        if (query === '') {
            rows.forEach(row => row.style.display = '');
            return;
        }

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let match = false;

            cells.forEach(cell => {
                if (cell.querySelector('.btn-edit, .btn-delete')) return;

                const text = cell.textContent.toLowerCase();
                if (text.includes(query)) {
                    match = true;
                }
                if (cell.querySelector('img')) {
                    const alt = cell.querySelector('img').alt || '';
                    if (alt.toLowerCase().includes(query)) match = true;
                }
            });

            row.style.display = match ? '' : 'none';
        });
    });
});

function showModule(moduleId) {

    // Reset ô tìm kiếm khi chuyển tab
    const searchInput = document.querySelector(`.search-input[data-table="${moduleId}"]`);
    if (searchInput) searchInput.value = '';

    loadTableData(moduleId, appData[moduleId] || []);
}