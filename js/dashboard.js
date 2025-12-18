function showDashboard() {
    let dashboard = document.getElementById('dashboard');

    if (!dashboard) {
        dashboard = document.createElement('div');
        dashboard.id = 'dashboard';
        dashboard.className = 'module-content';

        dashboard.innerHTML = `
            <h2 style="text-align:center; margin-bottom:30px;">BÁO CÁO TỔNG HỢP</h2>

            <!-- Lọc theo năm -->
            <div style="text-align:center; margin:30px 0;">
                <label style="font-weight:bold; font-size:18px;">Năm báo cáo:</label>
                <select id="reportYear"
                    style="padding:12px 18px; font-size:17px; border-radius:8px;
                           border:2px solid #007bff; margin-left:15px;">
                    ${Array.from({ length: 6 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return `<option value="${y}" ${i === 0 ? 'selected' : ''}>${y}</option>`;
                    }).join('')}
                </select>

                <button id="btnRefreshReport"
                    style="margin-left:20px; padding:12px 25px;
                           background:#007bff; color:white; border:none;
                           border-radius:8px; font-size:17px; cursor:pointer;">
                    Xem báo cáo
                </button>
            </div>

            <!-- Các chỉ số chính -->
            <div class="stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px,1fr)); gap:20px; margin:40px 0;">
                <div class="stat-card" style="background:#e3f2fd; padding:20px; border-radius:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 10px; color:#1976d2;">Số hợp đồng</h3>
                    <p id="totalContracts" style="font-size:28px; font-weight:bold; margin:0; color:#1976d2;">0</p>
                </div>
                <div class="stat-card" style="background:#e8f5e8; padding:20px; border-radius:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 10px; color:#388e3c;">Doanh thu phải thu</h3>
                    <p id="totalRevenue" style="font-size:28px; font-weight:bold; margin:0; color:#388e3c;">0 ₫</p>
                </div>
                <div class="stat-card" style="background:#fff3e0; padding:20px; border-radius:12px; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin:0 0 10px; color:#f57c00;">Đã thu trong năm</h3>
                    <p id="totalPaid" style="font-size:28px; font-weight:bold; margin:0; color:#f57c00;">0 ₫</p>
                </div>
            </div>

            <!-- Top 5 công nợ -->
            <h3 style="text-align:center; margin:40px 0 20px;">
                Top 5 khách hàng công nợ cao nhất 
                (tính đến 31/12/<span id="currentYearDisplay">${new Date().getFullYear()}</span>)
            </h3>

            <table class="table" style="width:100%; border-collapse:collapse; background:white; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <thead style="background:#1976d2; color:white;">
                    <tr>
                        <th style="padding:15px; text-align:left;">Khách hàng</th>
                        <th style="padding:15px; text-align:center;">Số HĐ</th>
                        <th style="padding:15px; text-align:right;">Công nợ</th>
                    </tr>
                </thead>
                <tbody id="topDebtors" style="font-size:16px;"></tbody>
            </table>

            <div style="text-align:center; margin-top:40px;">
                <button onclick="exportAllData()"
                    style="padding:12px 30px; background:#66FFCC; border:none; border-radius:8px; 
                           font-size:16px; cursor:pointer; font-weight:bold;">
                    📥 Xuất toàn bộ dữ liệu (Backup)
                </button>
            </div>
        `;

        document.querySelector('.main-content').appendChild(dashboard);
    }

    if (window.showModule) {
        window.showModule('dashboard');
    }

    setTimeout(() => {
        const btnRefresh = document.getElementById('btnRefreshReport');
        if (btnRefresh) {
            btnRefresh.onclick = updateDashboard;
        }
        updateDashboard(); // Load ngay lần đầu
    }, 0);
}

function updateDashboard() {
    const appData = window.appData;
    if (!appData || !appData.invoices || !appData.contracts || !appData.customers) return;

    const year = parseInt(document.getElementById('reportYear').value);
    document.getElementById('currentYearDisplay').textContent = year;

    const startDate = new Date(year, 0, 1);       
    const endDate   = new Date(year + 1, 0, 1); 

 
    const contractsInYear = appData.contracts.filter(c => {
        if (!c.signDate) return false;
        const d = new Date(c.signDate);
        return d >= startDate && d < endDate;
    });

    const invoicesInYear = appData.invoices.filter(inv =>
        contractsInYear.some(c => c.id === inv.contractId)
    );

    const totalRevenue = invoicesInYear.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    let totalPaidInYear = 0;
    appData.invoices.forEach(inv => {
        if (!inv.payments || !Array.isArray(inv.payments)) return;
        inv.payments.forEach(p => {
            if (!p.time) return;
            const payDate = new Date(p.time);
            if (payDate >= startDate && payDate < endDate) {
                totalPaidInYear += Number(p.amount || 0);
            }
        });
    });

    document.getElementById('totalContracts').textContent = contractsInYear.length;
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('totalPaid').textContent = totalPaidInYear.toLocaleString('vi-VN') + ' ₫';

    const debtByCustomer = {};

    appData.invoices.forEach(inv => {
        const contract = appData.contracts.find(c => c.id === inv.contractId);
        if (!contract) return;

        const customer = appData.customers.find(cus => cus.id === contract.customerId);
        if (!customer) return;

        const totalPaid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
        const debt = Number(inv.amount || 0) - totalPaid;

        if (debt > 0) {
            if (!debtByCustomer[customer.name]) {
                debtByCustomer[customer.name] = { debt: 0, contractCount: 0 };
            }
            debtByCustomer[customer.name].debt += debt;
            debtByCustomer[customer.name].contractCount += 1;
        }
    });

    const top5 = Object.entries(debtByCustomer)
        .sort((a, b) => b[1].debt - a[1].debt)
        .slice(0, 5);

    const tbody = document.getElementById('topDebtors');
    if (top5.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; padding:40px; color:#4caf50; font-size:18px;">
                    🎉 Không có công nợ nào đến ngày 31/12/${year}!
                </td>
            </tr>`;
    } else {
        tbody.innerHTML = top5.map(([name, data]) => `
            <tr>
                <td style="padding:15px;"><strong>${name}</strong></td>
                <td style="padding:15px; text-align:center;">${data.contractCount}</td>
                <td style="padding:15px; text-align:right; color:#d32f2f; font-weight:bold;">
                    ${data.debt.toLocaleString('vi-VN')} ₫
                </td>
            </tr>
        `).join('');
    }
}

// Gắn ra ngoài để gọi từ menu
window.showDashboard = showDashboard;