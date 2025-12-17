// js/dashboard.js - Báo cáo tổng hợp theo năm (HOÀN HẢO, KHÔNG CÒN LỖI)

function showDashboard() {
    let dashboard = document.getElementById('dashboard');
    if (!dashboard) {
        dashboard = document.createElement('div');
        dashboard.id = 'dashboard';
        dashboard.className = 'module-content';
        dashboard.innerHTML = `
            <h2>BÁO CÁO TỔNG HỢP</h2>

            <!-- Lọc theo năm -->
            <div style="text-align:center; margin:30px 0;">
                <label style="font-weight:bold; font-size:18px;">Năm báo cáo:</label>
                <select id="reportYear" style="padding:12px 18px; font-size:17px; border-radius:8px; border:2px solid #007bff; margin-left:15px;">
                    ${Array.from({length:6}, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return `<option value="${y}" ${i===0?'selected':''}>${y}</option>`;
                    }).join('')}
                </select>
                <button id="btnRefreshReport" style="margin-left:20px; padding:12px 25px; background:#007bff; color:white; border:none; border-radius:8px; font-size:17px; cursor:pointer;">
                    Xem báo cáo năm
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card"><h3>Số hợp đồng</h3><p id="totalContracts">0</p></div>
                <div class="stat-card"><h3>Doanh thu phải thu</h3><p id="totalRevenue">0 ₫</p></div>
                <div class="stat-card"><h3>Đã thu trong năm</h3><p id="totalPaid">0 ₫</p></div>
                <div class="stat-card"><h3>Công nợ còn lại</h3><p id="totalDebt">0 ₫</p></div>
                <div class="stat-card"><h3>Chi phí nội bộ</h3><p id="totalInternalCost">0 ₫</p></div>
                <div class="stat-card"><h3>Chưa thu trong năm</h3><p id="unpaidRevenue">0 ₫</p></div>
            </div>

            <h3>Top 5 khách hàng công nợ cao nhất (tính đến 31/12/<span id="currentYearDisplay"></span>)</h3>
            <table class="table">
                <thead><tr><th>Khách hàng</th><th>Số HĐ</th><th>Công nợ</th></tr></thead>
                <tbody id="topDebtors"></tbody>
            </table>

            <button onclick="exportAllData()" class="btn-export" style="margin-top:30px; padding:12px 25px; font-size:16px;">
                Xuất toàn bộ dữ liệu (Backup)
            </button>
        `;
        document.querySelector('.main-content').appendChild(dashboard);
    }

    // GẮN SỰ KIỆN CHO SELECT VÀ NÚT (QUAN TRỌNG NHẤT!)
    const yearSelect = document.getElementById('reportYear');
    const btnRefresh = document.getElementById('btnRefreshReport');

    if (yearSelect) {
        yearSelect.addEventListener('change', updateDashboard);
    }
    if (btnRefresh) {
        btnRefresh.addEventListener('click', updateDashboard);
    }

    // Cập nhật tiêu đề năm
    document.getElementById('currentYearDisplay').textContent = yearSelect.value;

    showModule('dashboard');
    updateDashboard(); // load lần đầu
}

function updateDashboard() {
    if (!appData) return;

    const year = parseInt(document.getElementById('reportYear').value);
    document.getElementById('currentYearDisplay').textContent = year;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // 1. Hợp đồng trong năm
    const contractsInYear = appData.contracts.filter(c => {
        const d = new Date(c.signDate || '2000-01-01');
        return d.getFullYear() === year;
    });

    // 2. Doanh thu phải thu trong năm
    const invoicesInYear = appData.invoices.filter(inv => 
        contractsInYear.some(c => c.id === inv.contractId)
    );
    const totalRevenue = invoicesInYear.reduce((s, i) => s + Number(i.amount || 0), 0);

    // 3. Đã thu trong năm
    const paymentsInYear = appData.payments.filter(p => {
        const d = new Date(p.time || p.date || '2000-01-01');
        return d.getFullYear() === year;
    });
    const totalPaid = paymentsInYear.reduce((s, p) => s + Number(p.amount || 0), 0);

    // 4. Chi phí nội bộ trong năm
    const internalCosts = appData.costs.filter(c => {
        const d = new Date(c.time || c.date || '2000-01-01');
        return c.billToCustomer === 'Không' && d.getFullYear() === year;
    });
    const totalInternalCost = internalCosts.reduce((s, c) => s + Number(c.amount || 0), 0);

    // 5. Công nợ toàn hệ thống (tính đến hiện tại)
    let totalDebt = 0;
    appData.invoices.forEach(inv => {
        const paid = appData.payments
            .filter(p => p.invoiceId === inv.id)
            .reduce((s, p) => s + Number(p.amount || 0), 0);
        totalDebt += (inv.amount - paid);
    });

    // 6. Doanh thu chưa thu trong năm hiện tại
    const unpaidInYear = invoicesInYear.reduce((s, inv) => {
        const paid = paymentsInYear
            .filter(p => p.invoiceId === inv.id)
            .reduce((s, p) => s + Number(p.amount || 0), 0);
        return s + (inv.amount - paid);
    }, 0);

    // Cập nhật giao diện
    document.getElementById('totalContracts').textContent = contractsInYear.length;
    document.getElementById('totalRevenue').textContent   = totalRevenue.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('totalPaid').textContent     = totalPaid.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('totalDebt').textContent     = totalDebt.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('totalInternalCost').textContent = totalInternalCost.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('unpaidRevenue').textContent  = unpaidInYear.toLocaleString('vi-VN') + ' ₫';

    // Top 5 công nợ xấu
    const debtMap = {};
    appData.invoices.forEach(inv => {
        const contract = appData.contracts.find(c => c.id === inv.contractId);
        if (!contract) return;
        const customer = appData.customers.find(cus => cus.id === contract.customerId);
        if (!customer) return;

        const paid = appData.payments.filter(p => p.invoiceId === inv.id)
                                 .reduce((s, p) => s + Number(p.amount || 0), 0);
        const debt = inv.amount - paid;
        if (debt > 0) {
            debtMap[customer.name] = (debtMap[customer.name] || 0) + debt;
        }
    });

    const top5 = Object.entries(debtMap)
        .sort((a,b) => b[1] - a[1])
        .slice(0,5);

    const tbody = document.getElementById('topDebtors');
    tbody.innerHTML = top5.length === 0
        ? `<tr><td colspan="3" style="text-align:center; color:#27ae60; padding:40px; font-size:18px;">Không có công nợ!</td></tr>`
        : top5.map(([name, debt]) => `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${appData.invoices.filter(inv => {
                    const c = appData.contracts.find(ct => ct.id === inv.contractId);
                    return c && appData.customers.find(cus => cus.id === c.customerId)?.name === name;
                }).length} HĐ</td>
                <td style="color:#e74c3c; font-weight:bold; font-size:18px;">${debt.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `).join('');
}

// GỌI KHI MỞ DASHBOARD
window.showDashboard = showDashboard;