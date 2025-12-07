// js/dashboard.js - Chỉ dành riêng cho báo cáo
function showDashboard() {
    // Tạo module dashboard nếu chưa có
    let dashboard = document.getElementById('dashboard');
    if (!dashboard) {
        dashboard = document.createElement('div');
        dashboard.id = 'dashboard';
        dashboard.className = 'module-content';
        dashboard.innerHTML = `
            <h2>BÁO CÁO TỔNG HỢP</h2>
            <div class="stats-grid">
                <div class="stat-card"><h3>Tổng hợp đồng</h3><p id="totalContracts">0</p></div>
                <div class="stat-card"><h3>Tổng doanh thu phải thu</h3><p id="totalRevenue">0 ₫</p></div>
                <div class="stat-card"><h3>Tổng đã thu</h3><p id="totalPaid">0 ₫</p></div>
                <div class="stat-card"><h3>Công nợ còn lại</h3><p id="totalDebt">0 ₫</p></div>
                <div class="stat-card"><h3>Tổng chi phí nội bộ</h3><p id="totalInternalCost">0 ₫</p></div>
                <div class="stat-card"><h3>Lợi nhuận ước tính</h3><p id="estimatedProfit">0 ₫</p></div>
            </div>

            <h3>Top 5 khách hàng công nợ cao nhất</h3>
            <table class="table">
                <thead><tr><th>Khách hàng</th><th>Số HĐ</th><th>Công nợ</th></tr></thead>
                <tbody id="topDebtors"></tbody>
            </table>

            <button onclick="exportAllData()" class="btn-export">
                Xuất toàn bộ dữ liệu (Backup)
            </button>
        `;
        document.querySelector('.main-content').appendChild(dashboard);
    }

    showModule('dashboard');
    updateDashboard();
}

function updateDashboard() {
    if (!appData) return;

    document.getElementById('totalContracts').textContent = appData.contracts.length;

    const totalRevenue = appData.invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('vi-VN') + ' ₫';

    const totalPaid = appData.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    document.getElementById('totalPaid').textContent = totalPaid.toLocaleString('vi-VN') + ' ₫';

    const totalDebt = totalRevenue - totalPaid;
    document.getElementById('totalDebt').textContent = totalDebt.toLocaleString('vi-VN') + ' ₫';

    const totalInternalCost = appData.costs
        .filter(c => c.billToCustomer === 'Không')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
    document.getElementById('totalInternalCost').textContent = totalInternalCost.toLocaleString('vi-VN') + ' ₫';

    const profit = totalPaid - totalInternalCost;
    const profitEl = document.getElementById('estimatedProfit');
    profitEl.textContent = profit.toLocaleString('vi-VN') + ' ₫';
    profitEl.style.color = profit >= 0 ? '#27ae60' : '#e74c3c';

    // Top 5 công nợ
    const debtMap = {};
    appData.invoices.forEach(inv => {
        const contract = appData.contracts.find(c => c.id === inv.contractId);
        if (!contract) return;
        const customer = appData.customers.find(cus => cus.id === contract.customerId);
        if (!customer) return;

        const paid = appData.payments
            .filter(p => p.invoiceId && appData.invoices.find(i => i.id === p.invoiceId)?.contractId === inv.contractId)
            .reduce((s, p) => s + Number(p.amount), 0);

        const debt = inv.amount - paid;
        if (debt > 0) {
            debtMap[customer.name] = (debtMap[customer.name] || 0) + debt;
        }
    });

    const top5 = Object.entries(debtMap).sort((a,b) => b[1]-a[1]).slice(0,5);
    const tbody = document.getElementById('topDebtors');
    tbody.innerHTML = top5.length === 0 
        ? '<tr><td colspan="3" style="text-align:center;color:#27ae60;">Tất cả đã thanh toán!</td></tr>'
        : top5.map(([name, debt]) => `
            <tr>
                <td><strong>${name}</strong></td>
                <td>1+ HĐ</td>
                <td style="color:#e74c3c;font-weight:bold;">${debt.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `).join('');
}

// Tự động cập nhật khi mở dashboard
window.showDashboard = showDashboard;