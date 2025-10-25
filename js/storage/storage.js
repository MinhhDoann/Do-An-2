// ====== DỮ LIỆU MẪU MẶC ĐỊNH ======
export const defaultData = {
    customers: [
        { id: 1, name: 'Công ty A', email: 'contact@a.com', phone: '0901234567' },
        { id: 2, name: 'Công ty B', email: 'contact@b.com', phone: '0902345678' },
        { id: 3, name: 'Công ty C', email: 'contact@c.com', phone: '0903456789' }
    ],
    contracts: [
        { id: 1, customerId: 1, signDate: '2025-01-01', expiryDate: '2025-12-31', value: 50000000 },
        { id: 2, customerId: 2, signDate: '2025-02-01', expiryDate: '2025-12-31', value: 75000000 },
        { id: 3, customerId: 3, signDate: '2025-03-01', expiryDate: '2025-12-31', value: 60000000 }
    ],
    vehicles: [
        {
            id: 1,
            vehicleType: 'Xe tải',
            licensePlate: '51H-12345',
            image: 'car-white.jpg',
            capacity: 10,
            status: 'Đang hoạt động',
            description: 'Xe tải 10 tấn chuyên chở hàng hóa nội thành TP.HCM.'
        },
        {
            id: 2,
            vehicleType: 'Xe container',
            licensePlate: '51H-67890',
            image: 'car-orange.jpg',
            capacity: 15,
            status: 'Đang vận chuyển',
            description: 'Xe container 15 tấn đang vận chuyển hàng tuyến Bắc - Nam.'
        },
        {
            id: 3,
            vehicleType: 'Xe tải nhỏ',
            licensePlate: '51H-54321',
            image: 'car-yellow.jpg',
            capacity: 8,
            status: 'Đang sửa chữa',
            description: 'Xe tải 8 tấn đang được bảo trì tại xưởng trung tâm.'
        }
    ],  
    containers: [
        { id: 1, itemTypeId: 1, weight: 5000, status: 'Lưu kho', warehouseId: 1, vehicleId: 1, customerId: 1 },
        { id: 2, itemTypeId: 2, weight: 3000, status: 'Đang vận chuyển', warehouseId: 1, vehicleId: 2, customerId: 2 },
        { id: 3, itemTypeId: 3, weight: 4000, status: 'Lưu kho', warehouseId: 2, vehicleId: 3, customerId: 3 }
    ],
    containerhistory: [
        { id: 1, containerId: 1, action: 'Nhập kho', time: '2025-10-01 08:00', location: 'Kho HCM' },
        { id: 2, containerId: 2, action: 'Vận chuyển', time: '2025-10-02 09:00', location: 'Cảng HN' }
    ],
    warehouses: [
        { id: 1, name: 'Kho HCM', capacity: 1000, location: 'TP.HCM', manager: 'Nguyễn Văn A' },
        { id: 2, name: 'Kho HN', capacity: 800, location: 'Hà Nội', manager: 'Trần Thị B' },
        { id: 3, name: 'Kho DN', capacity: 600, location: 'Đà Nẵng', manager: 'Lê Văn C' }
    ],
    transports: [
        { id: 1, fromPort: 'Cảng HCM', toPort: 'Cảng HN', schedule: '2025-10-05', status: 'Lên kế hoạch', vehicleId: 1 },
        { id: 2, fromPort: 'Cảng HN', toPort: 'Cảng ĐN', schedule: '2025-10-06', status: 'Đang thực hiện', vehicleId: 2 },
        { id: 3, fromPort: 'Cảng ĐN', toPort: 'Cảng HCM', schedule: '2025-10-07', status: 'Hoàn thành', vehicleId: 3 }
    ],
    costs: [
        { id: 1, contractId: 1, costType: 'Vận chuyển container C001', amount: 1000000 },
        { id: 2, contractId: 1, costType: 'Bảo trì container C001', amount: 500000 },
        { id: 3, contractId: 2, costType: 'Lưu kho container C002', amount: 300000 }
    ],
    invoices: [
        { id: 1, contractId: 1, amount: 1500000, issueDate: '2025-09-10' },
        { id: 2, contractId: 2, amount: 300000, issueDate: '2025-09-15' },
        { id: 3, contractId: 3, amount: 25000000, issueDate: '2025-09-20' }
    ],
    payments: [
        { id: 1, invoiceId: 1, amount: 1500000, method: 'Chuyển khoản', time: '2025-09-11T09:00' },
        { id: 2, invoiceId: 2, amount: 300000, method: 'Tiền mặt', time: '2025-09-16T12:00' },
        { id: 3, invoiceId: 3, amount: 25000000, method: 'Chuyển khoản', time: '2025-09-21T15:00' }
    ],
    sensors: [
        { id: 1, containerId: 1, temperature: 25, humidity: 60, gps: '10.7769, 106.7009' },
        { id: 2, containerId: 2, temperature: 5, humidity: 70, gps: '21.0285, 105.8542' },
        { id: 3, containerId: 3, temperature: 30, humidity: 50, gps: '16.0544, 108.2022' }
    ],
    alerts: [
        { id: 1, containerId: 1, alertType: 'Nhiệt độ cao', time: '2025-09-01T09:00' },
        { id: 2, containerId: 2, alertType: 'Độ ẩm bất thường', time: '2025-09-02T12:00' },
        { id: 3, containerId: 3, alertType: 'Vị trí bất thường', time: '2025-09-03T15:00' }
    ]
};

// ====== HÀM QUẢN LÝ LOCALSTORAGE ======
export function loadAllData() {
    const data = {};
    Object.keys(defaultData).forEach(module => {
        const stored = localStorage.getItem(module);
        if (stored) data[module] = JSON.parse(stored);
        else {
            data[module] = defaultData[module];
            localStorage.setItem(module, JSON.stringify(defaultData[module]));
        }
    });
    return data;
}

export function saveData(module, dataArray) {
    localStorage.setItem(module, JSON.stringify(dataArray));
}

export function resetModuleData(module) {
    if (defaultData[module]) {
        localStorage.setItem(module, JSON.stringify(defaultData[module]));
        return defaultData[module];
    }
    return null;
}

// ====== HỖ TRỢ XUẤT / NHẬP DỮ LIỆU ======
export function exportData(module) {
    const data = localStorage.getItem(module);
    if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}.json`;
        a.click();
    }
}

export function importData(module, fileContent) {
    try {
        const imported = JSON.parse(fileContent);
        localStorage.setItem(module, JSON.stringify(imported));
        return imported;
    } catch (error) {
        console.error('Import failed:', error);
        return null;
    }
}
