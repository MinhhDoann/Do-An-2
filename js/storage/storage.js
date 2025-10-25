// ====== DỮ LIỆU MẪU MẶC ĐỊNH ======
export const defaultData = {
    customers: [
        { id: 'KH001', name: 'Công ty A', email: 'contact@a.com', phone: '0901234567' },
        { id: 'KH002', name: 'Công ty B', email: 'contact@b.com', phone: '0902345678' },
        { id: 'KH003', name: 'Công ty C', email: 'contact@c.com', phone: '0903456789' }
    ],
    contracts: [
        { id: 'HD001', customerId: 'KH001', signDate: '2025-01-01', expiryDate: '2025-12-31', value: 50000000 },
        { id: 'HD002', customerId: 'KH002', signDate: '2025-02-01', expiryDate: '2025-12-31', value: 75000000 },
        { id: 'HD003', customerId: 'KH003', signDate: '2025-03-01', expiryDate: '2025-12-31', value: 60000000 }
    ],
    vehicles: [
        {
            id: 'XE001',
            vehicleType: 'Xe tải',
            licensePlate: '51H-12345',
            image: 'car-white.jpg',
            capacity: 10,
            status: 'Đang hoạt động',
            description: 'Xe tải 10 tấn chuyên chở hàng hóa nội thành TP.HCM.'
        },
        {
            id: 'XE002',
            vehicleType: 'Xe container',
            licensePlate: '51H-67890',
            image: 'car-orange.jpg',
            capacity: 15,
            status: 'Đang vận chuyển',
            description: 'Xe container 15 tấn đang vận chuyển hàng tuyến Bắc - Nam.'
        },
        {
            id: 'XE003',
            vehicleType: 'Xe tải nhỏ',
            licensePlate: '51H-54321',
            image: 'car-yellow.jpg',
            capacity: 8,
            status: 'Đang sửa chữa',
            description: 'Xe tải 8 tấn đang được bảo trì tại xưởng trung tâm.'
        }
    ],
    containers: [
        { id: 'CTN001', itemTypeId: 'HH001', weight: 5000, status: 'Lưu kho', warehouseId: 'KHO001', vehicleId: 'XE001', customerId: 'KH001' },
        { id: 'CTN002', itemTypeId: 'HH002', weight: 3000, status: 'Đang vận chuyển', warehouseId: 'KHO001', vehicleId: 'XE002', customerId: 'KH002' },
        { id: 'CTN003', itemTypeId: 'HH003', weight: 4000, status: 'Lưu kho', warehouseId: 'KHO002', vehicleId: 'XE003', customerId: 'KH003' }
    ],
    containerhistory: [
        { id: 'LS001', containerId: 'CTN001', action: 'Nhập kho', time: '2025-10-01 08:00', location: 'Kho HCM' },
        { id: 'LS002', containerId: 'CTN002', action: 'Vận chuyển', time: '2025-10-02 09:00', location: 'Cảng HN' }
    ],
    warehouses: [
        { id: 'KHO001', name: 'Kho HCM', capacity: 1000, location: 'TP.HCM', manager: 'Nguyễn Văn A' },
        { id: 'KHO002', name: 'Kho HN', capacity: 800, location: 'Hà Nội', manager: 'Trần Thị B' },
        { id: 'KHO003', name: 'Kho DN', capacity: 600, location: 'Đà Nẵng', manager: 'Lê Văn C' }
    ],
    transports: [
        { id: 'VC001', fromPort: 'Cảng HCM', toPort: 'Cảng HN', schedule: '2025-10-05', status: 'Lên kế hoạch', vehicleId: 'XE001' },
        { id: 'VC002', fromPort: 'Cảng HN', toPort: 'Cảng ĐN', schedule: '2025-10-06', status: 'Đang thực hiện', vehicleId: 'XE002' },
        { id: 'VC003', fromPort: 'Cảng ĐN', toPort: 'Cảng HCM', schedule: '2025-10-07', status: 'Hoàn thành', vehicleId: 'XE003' }
    ],
    costs: [
        { id: 'CP001', contractId: 'HD001', costType: 'Vận chuyển container CTN001', amount: 1000000 },
        { id: 'CP002', contractId: 'HD001', costType: 'Bảo trì container CTN001', amount: 500000 },
        { id: 'CP003', contractId: 'HD002', costType: 'Lưu kho container CTN002', amount: 300000 }
    ],
    invoices: [
        { id: 'HDN001', contractId: 'HD001', amount: 1500000, issueDate: '2025-09-10' },
        { id: 'HDN002', contractId: 'HD002', amount: 300000, issueDate: '2025-09-15' },
        { id: 'HDN003', contractId: 'HD003', amount: 25000000, issueDate: '2025-09-20' }
    ],
    payments: [
        { id: 'TT001', invoiceId: 'HDN001', amount: 1500000, method: 'Chuyển khoản', time: '2025-09-11T09:00' },
        { id: 'TT002', invoiceId: 'HDN002', amount: 300000, method: 'Tiền mặt', time: '2025-09-16T12:00' },
        { id: 'TT003', invoiceId: 'HDN003', amount: 25000000, method: 'Chuyển khoản', time: '2025-09-21T15:00' }
    ],
    sensors: [
        { id: 'CB001', containerId: 'CTN001', temperature: 25, humidity: 60, gps: '10.7769, 106.7009' },
        { id: 'CB002', containerId: 'CTN002', temperature: 5, humidity: 70, gps: '21.0285, 105.8542' },
        { id: 'CB003', containerId: 'CTN003', temperature: 30, humidity: 50, gps: '16.0544, 108.2022' }
    ],
    alerts: [
        { id: 'CBao001', containerId: 'CTN001', alertType: 'Nhiệt độ cao', time: '2025-09-01T09:00' },
        { id: 'CBao002', containerId: 'CTN002', alertType: 'Độ ẩm bất thường', time: '2025-09-02T12:00' },
        { id: 'CBao003', containerId: 'CTN003', alertType: 'Vị trí bất thường', time: '2025-09-03T15:00' }
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
