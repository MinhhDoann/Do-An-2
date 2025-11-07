// ====== IMPORT DỮ LIỆU ======
import { loadAllData, saveData } from './storage/storage.js';

// ====== KHỞI TẠO DỮ LIỆU ======
let appData = loadAllData();

// ====== CẬP NHẬT BẢN ĐỒ HIỂN THỊ ======
function getMap(source, keyName = 'id', valueName = 'name') {
    return Object.fromEntries(source.map(item => [item[keyName], item[valueName]]));
}

let displayMaps = {};   

function updateDisplayMaps() {
    displayMaps = {
        customers: getMap(appData.customers, 'id', 'name'),
        warehouses: getMap(appData.warehouses, 'id', 'name'),
        vehicles: getMap(appData.vehicles, 'id', 'licensePlate'),
        contracts: getMap(appData.contracts, 'id', 'id'),
        invoices: getMap(appData.invoices, 'id', 'id'),
        containers: getMap(appData.containers, 'id', 'id')
    };
}

function getDisplayValue(module, id) {
    return displayMaps[module]?.[id] || id || '';
}

// ====== HIỂN THỊ MODULE ======
function showModule(moduleId) {
    document.querySelectorAll('.module-content').forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
    });
    const active = document.getElementById(moduleId);
    if (active) {
        active.style.display = 'block';
        active.classList.add('active');
    }
    document.querySelectorAll('.sub-menu li a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`a[onclick="showModule('${moduleId}')"]`);
    if (activeLink) activeLink.classList.add('active');
    loadTableData(moduleId, appData[moduleId]);
}

// ====== CẤU HÌNH CÁC BẢNG ======
const tableConfigs = {
    containers: { fields: ['id', 'itemTypeId', 'weight', 'status', 'warehouseId', 'vehicleId', 'customerId'] },
    containerhistory: { fields: ['id', 'containerId', 'action', 'time', 'location'] },
    warehouses: { fields: ['id', 'name', 'capacity', 'location', 'manager'] },
    customers: { fields: ['id', 'name', 'email', 'phone'] },
    vehicles: {
        fields: ['id','vehicleType','licensePlate','image', 'capacity', 'status', 'description']
    },
    transports: { fields: ['id', 'fromPort', 'toPort', 'schedule', 'status', 'vehicleId'] },
    contracts: { fields: ['id', 'customerId', 'signDate', 'expiryDate', 'value'] },
    invoices: { fields: ['id', 'contractId', 'amount', 'issueDate'] },
    payments: { fields: ['id', 'invoiceId', 'amount', 'method', 'time'] },
    sensors: { fields: ['id', 'containerId', 'temperature', 'humidity', 'gps'] },
    alerts: { fields: ['id', 'containerId', 'alertType', 'time'] },
    costs: { fields: ['id', 'contractId', 'costType', 'amount'] }
};

// ====== RÀNG BUỘC QUAN HỆ DỮ LIỆU ======
const dataRelations = {
    containers: { warehouseId: 'warehouses', vehicleId: 'vehicles', customerId: 'customers' },
    containerhistory: { containerId: 'containers' },
    transports: { vehicleId: 'vehicles' },
    contracts: { customerId: 'customers' },
    invoices: { contractId: 'contracts' },
    payments: { invoiceId: 'invoices' },
    sensors: { containerId: 'containers' },
    alerts: { containerId: 'containers' },
    costs: { contractId: 'contracts' }
};

// ====== TẢI DỮ LIỆU RA BẢNG ======
function loadTableData(moduleId, data) {
    const tbody = document.querySelector(`#${moduleId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';

    const config = tableConfigs[moduleId];
    if (!config) return;

    if (!data || data.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="${config.fields.length + 1}" style="text-align:center;">Chưa có dữ liệu</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');

        config.fields.forEach(f => {
            const cell = document.createElement('td');
            const value = item[f];

            if (f === 'image') {
                const imgSrc = value?.startsWith('data:image') ? value : `./image/${value}`;
                cell.innerHTML = `<img src="${imgSrc}" alt="Hình xe" style="width:80px; height:auto; border-radius:8px;">`;
            }else if (f === 'description') {
                cell.innerHTML = `<div style="max-width:250px; white-space:normal;">${value}</div>`;
            } else {
                cell.textContent = value ?? '';
            }

            row.appendChild(cell);
        });

        // Cột hành động
        const actions = document.createElement('td');
        actions.innerHTML = `
            <button onclick="openModal('edit','${moduleId}','${item.id}')">Sửa</button>
            <button onclick="deleteItem('${moduleId}','${item.id}')">Xóa</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}


// ====== FORM MODAL ======
const formFields = {
    containers: [
        { id: 'itemTypeId', label: 'Loại hàng', type: 'text' },
        { id: 'weight', label: 'Trọng lượng (kg)', type: 'number' },
        { id: 'status', label: 'Trạng thái', type: 'text' },
        { id: 'warehouseId', label: 'Kho', type: 'number' },
        { id: 'vehicleId', label: 'Phương tiện', type: 'number' },
        { id: 'customerId', label: 'Khách hàng', type: 'number' }
    ],
    containerhistory: [
        { id: 'containerId', label: 'Container', type: 'number' },
        { id: 'action', label: 'Hành động', type: 'text' },
        { id: 'time', label: 'Thời gian', type: 'datetime-local' },
        { id: 'location', label: 'Vị trí', type: 'text' }
    ],
    warehouses: [
        { id: 'name', label: 'Tên kho', type: 'text'},
        { id: 'capacity', label: 'Sức chứa (tấn)', type: 'number', min:'0' },
        { id: 'location', label: 'Vị trí', type: 'text' },
        { id: 'manager', label: 'Người phụ trách', type: 'text' }
    ],
    customers: [
        { id: 'name', label: 'Tên khách hàng', type: 'text',required: true, pattern: '^[\\p{L}\\s]+$', maxLength: 50, title:'Vui lòng nhập tên khách hàng' },
        { id: 'email', label: 'Email', type: 'email', required: true, pattern:'^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$', title: 'Vui lòng nhập đúng gmail'},
        { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, pattern: '^0\\d{9}$', title:"Vui lòng nhập đúng số điện thoại" }
    ],
    vehicles: [
        { id: 'vehicleType', label: 'Loại xe', type: 'select', options: ['Xe tải', 'Xe container', 'Xe khách', 'Xe đầu kéo'] },
        { id: 'licensePlate', label: 'Biển số xe', type: 'text' },
        { id: 'image', label: 'Hình ảnh', type: 'file' },
        { id: 'capacity', label: 'Tải trọng (tấn)', type: 'number' },
        { id: 'status', label: 'Trạng thái', type: 'select', options: ['Đang hoạt động', 'Đang sửa chữa', 'Đang vận chuyển', 'Ngừng sử dụng'] },
        { id: 'description', label: 'Mô tả chi tiết', type: 'textarea' }
    ],
    transports: [
        { id: 'fromPort', label: 'Cảng đi', type: 'text' },
        { id: 'toPort', label: 'Cảng đến', type: 'text' },
        { id: 'schedule', label: 'Lịch trình', type: 'date' },
        { id: 'status', label: 'Trạng thái', type: 'text' },
        { id: 'vehicleId', label: 'Phương tiện', type: 'number' }
    ],
    contracts: [
        { id: 'customerId', label: 'Khách hàng', type: 'number' },
        { id: 'signDate', label: 'Ngày ký', type: 'date' },
        { id: 'expiryDate', label: 'Ngày hết hạn', type: 'date' },
        { id: 'value', label: 'Giá trị hợp đồng', type: 'number' }
    ],
    invoices: [
        { id: 'contractId', label: 'Hợp đồng', type: 'number' },
        { id: 'amount', label: 'Số tiền', type: 'number' },
        { id: 'issueDate', label: 'Ngày phát hành', type: 'date' }
    ],
    payments: [
        { id: 'invoiceId', label: 'Hóa đơn', type: 'number' },
        { id: 'amount', label: 'Số tiền', type: 'number' },
        { id: 'method', label: 'Phương thức thanh toán', type: 'text' },
        { id: 'time', label: 'Thời gian', type: 'datetime-local' }
    ],
    sensors: [
        { id: 'containerId', label: 'Container', type: 'number' },
        { id: 'temperature', label: 'Nhiệt độ (°C)', type: 'number' },
        { id: 'humidity', label: 'Độ ẩm (%)', type: 'number' },
        { id: 'gps', label: 'Tọa độ GPS', type: 'text' }
    ],
    alerts: [
        { id: 'containerId', label: 'Container', type: 'number' },
        { id: 'alertType', label: 'Loại cảnh báo', type: 'text' },
        { id: 'time', label: 'Thời gian', type: 'datetime-local' }
    ],
    costs: [
        { id: 'contractId', label: 'Hợp đồng', type: 'number' },
        { id: 'costType', label: 'Loại chi phí', type: 'text' },
        { id: 'amount', label: 'Số tiền', type: 'number' }
    ]
};

// ====== HÀM MỞ / ĐÓNG MODAL ======
function openModal(action, moduleId, id = null) {
    const modal = document.getElementById('dynamicModal');
    const modalTitle = document.getElementById('modalTitle');
    const formFieldsDiv = document.getElementById('formFields');
    const entityId = document.getElementById('entityId');

    modal.style.display = 'block';
    modalTitle.textContent = action === 'add' ? `Thêm ${moduleId}` : `Sửa ${moduleId}`;
    entityId.value = id || '';
    formFieldsDiv.innerHTML = '';

    const fields = formFields[moduleId];
    if (!fields) return;

    const existingItem = id ? appData[moduleId].find(i => i.id === id) : null;

    fields.forEach(f => {
        const label = document.createElement('label');
        label.textContent = f.label;
    
        let input;
    
        // 🔹 Nếu là khóa ngoại — chuyển sang dropdown
        const relation = dataRelations[moduleId]?.[f.id];
        if (relation) {
            input = document.createElement('select');
            const relatedList = appData[relation] || [];
    
            // Thêm option rỗng đầu tiên
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '-- Chọn --';
            input.appendChild(emptyOpt);
    
            relatedList.forEach(item => {
                const option = document.createElement('option');
                // Ưu tiên hiển thị tên (hoặc biển số nếu là vehicle)
                const display =
                    item.name || item.licensePlate || item.id;
                option.value = item.id;
                option.textContent = `${item.id} - ${display}`;
                input.appendChild(option);
            });
        }
    
        // 🔹 Nếu là select, textarea, file như cũ
        else if (f.type === 'select') {
            input = document.createElement('select');
            f.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
        } else if (f.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else if (f.type === 'file') {
            input = document.createElement('input');
            input.type = 'file';
            input.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        input.dataset.preview = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        } else {
            input = document.createElement('input');
            input.type = f.type;
        }
    
        input.id = f.id;
        input.name = f.id;
 
        if (f.required) input.required = true;
        if (f.pattern) input.pattern = f.pattern;
        if (f.title) input.title = f.title;
        if (f.maxLength) input.maxLength = f.maxLength;
        if (f.min) input.min = f.min;
        if (f.max) input.max = f.max;

        // Gán giá trị khi sửa
        if (existingItem && f.type !== 'file') {
            input.value = existingItem[f.id] || '';
        }
    
        formFieldsDiv.append(label, input);
    });
}    

function closeModal() {
    const modal = document.getElementById('dynamicModal');
    modal.style.display = 'none';
}

// ====== XÓA DỮ LIỆU ======
function deleteItem(moduleId, id) {
    if (!confirm('Xác nhận xóa?')) return;
    appData[moduleId] = appData[moduleId].filter(i => i.id !== id);
    saveData(moduleId, appData[moduleId]);
    loadTableData(moduleId, appData[moduleId]);
}

// ====== CHẠY SAU KHI DOM SẴN SÀNG ======
function generateContainerID(existingContainers) {
    let max = 0;
    existingContainers.forEach(c => {
        const match = c.id.match(/^CTN(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "CTN" + (max + 1).toString().padStart(3, "0");
}
function generateHistoryID(existingHistories) {
    let max = 0;
    existingHistories.forEach(h => {
        const match = h.id.match(/^LS(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "LS" + (max + 1).toString().padStart(3, "0");
}
function generateWarhousesID(existingwarehouses) {
    let max = 0;
    existingwarehouses.forEach(h => {
        const match = h.id.match(/^KHO(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "KHO" + (max + 1).toString().padStart(3, "0");
}
function generateCustomersID(existingcustomers) {
    let max = 0;
    existingcustomers.forEach(h => {
        const match = h.id.match(/^KH(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "KH" + (max + 1).toString().padStart(3, "0");
}
function generateVehiclesID(existingvehicles) {
    let max = 0;
    existingvehicles.forEach(h => {
        const match = h.id.match(/^XE(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "XE" + (max + 1).toString().padStart(3, "0");
}
function generateTransportsID(existingtransports) {
    let max = 0;
    existingtransports.forEach(h => {
        const match = h.id.match(/^VC(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "VC" + (max + 1).toString().padStart(3, "0");
}
function generateContractsID(existingcontracts) {
    let max = 0;
    existingcontracts.forEach(h => {
        const match = h.id.match(/^HD(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "HD" + (max + 1).toString().padStart(3, "0");
}
function generateInvoicesID(existinginvoices) {
    let max = 0;
    existinginvoices.forEach(h => {
        const match = h.id.match(/^HDN(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "HDN" + (max + 1).toString().padStart(3, "0");
}
function generatePaymentsID(existingpayments) {
    let max = 0;
    existingpayments.forEach(h => {
        const match = h.id.match(/^TT(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "TT" + (max + 1).toString().padStart(3, "0");
}
function generateSensorsID(existingsensors) {
    let max = 0;
    existingsensors.forEach(h => {
        const match = h.id.match(/^CB(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "CB" + (max + 1).toString().padStart(3, "0");
}
function generateAlertsID(existingalerts) {
    let max = 0;
    existingalerts.forEach(h => {
        const match = h.id.match(/^CBao(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "CBao" + (max + 1).toString().padStart(3, "0");
}
function generateCostsID(existingcosts) {
    let max = 0;
    existingcosts.forEach(h => {
        const match = h.id.match(/^CP(\d+)$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > max) max = num;
        }
    });
    return "CP" + (max + 1).toString().padStart(3, "0");
}


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dynamicForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const modalTitle = document.getElementById('modalTitle').textContent;
            const isAdd = modalTitle.includes('Thêm');
            const moduleId = modalTitle.replace('Thêm ', '').replace('Sửa ', '').trim();
            const fields = formFields[moduleId];
            let id = document.getElementById('entityId').value;
            if (!id) {
                if (moduleId === 'containers') {
                    id = generateContainerID(appData.containers);
                } else if (moduleId === 'containerhistory') {
                    id = generateHistoryID(appData.containerhistory);
                } else if (moduleId === 'warehouses') {
                    id = generateWarhousesID(appData.warehouses);
                } else if (moduleId === 'customers') {
                    id = generateCustomersID(appData.customers);
                } else if (moduleId === 'vehicles') {
                    id = generateVehiclesID(appData.vehicles);
                } else if (moduleId === 'transports') {
                    id = generateTransportsID(appData.transports);
                } else if (moduleId === 'contracts') {
                    id = generateContractsID(appData.contracts);
                } else if (moduleId === 'invoices') {
                    id = generateInvoicesID(appData.invoices);
                } else if (moduleId === 'payments') {
                    id = generatePaymentsID(appData.payments);
                } else if (moduleId === 'sensors') {
                    id = generateSensorsID(appData.sensors);
                } else if (moduleId === 'alerts') {
                    id = generateAlertsID(appData.alerts);
                } else if (moduleId === 'costs') {
                    id = generateCostsID(appData.costs);
                } else {
                    id = `${moduleId.toUpperCase()}${appData[moduleId].length + 1}`;
                }
            }
        
            const newItem = { id };
            fields.forEach(f => {
                const el = document.getElementById(f.id);
                if (f.type === 'file') {
                    newItem[f.id] = el.dataset.preview || '';
                } else {
                    newItem[f.id] = el.value.trim();
                }
            });

            // KIỂM TRA RÀNG BUỘC GIỮA CÁC MODULE
            const relation = dataRelations[moduleId];
            if (relation) {
                for (const [field, targetModule] of Object.entries(relation)) {
                    const targetList = appData[targetModule];
                    const exists = targetList.some(t => t.id === newItem[field]);
                    if (!exists) {
                        alert(`❌ Giá trị "${field}" (${newItem[field]}) không tồn tại trong ${targetModule}!`);
                        return;
                    }
                }
            }

            if (isAdd) appData[moduleId].push(newItem);
            else {
                const idx = appData[moduleId].findIndex(i => i.id === id);
                if (idx >= 0) appData[moduleId][idx] = newItem;
            }
            if (moduleId === 'costs') {
                const contractId = newItem.contractId;
                // Tìm hóa đơn có cùng hợp đồng
                const relatedInvoices = appData.invoices.filter(inv => inv.contractId === contractId);
                if (relatedInvoices.length > 0) {
                    relatedInvoices.forEach(inv => {
                        inv.amount = (parseFloat(inv.amount) || 0) + parseFloat(newItem.amount || 0);
                    });
                    saveData('invoices', appData.invoices);
                }
            }

            saveData(moduleId, appData[moduleId]);
            loadTableData(moduleId, appData[moduleId]);
            closeModal();
        });
    }

    // ====== KHỞI ĐỘNG ======
    updateDisplayMaps();
    showModule('containers');
});

// ====== GẮN WINDOW (CHO HTML GỌI) ======
window.showModule = showModule;
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteItem = deleteItem;
