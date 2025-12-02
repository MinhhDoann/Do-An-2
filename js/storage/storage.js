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
    itemTypes: [
        { id: 'HH001', name: 'Hàng dễ vỡ',       description: 'Rượu, thủy tinh, đồ gốm sứ, cần đóng gói chống sốc' },
        { id: 'HH002', name: 'Hàng đông lạnh',   description: 'Cá, thịt, hải sản đông lạnh, yêu cầu nhiệt độ dưới -18°C' },
        { id: 'HH003', name: 'Hàng nguy hiểm',   description: 'Hóa chất, pin lithium, chất dễ cháy – cần giấy phép' },
        { id: 'HH004', name: 'Hàng cồng kềnh',   description: 'Máy móc lớn, thiết bị công nghiệp, cần xe chuyên dụng' }
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
    trips: [
        { id: 'VC001', voyageNumber: 'VCN-001', fromPortId: 'PORT001', toPortId: 'PORT002', etd: '2025-10-05', eta: '2025-10-07', vehicleId: 'XE001', status: 'Chuẩn bị' },
        { id: 'VC002', voyageNumber: 'VCN-002', fromPortId: 'PORT002', toPortId: 'PORT003', etd: '2025-10-06', eta: '2025-10-08', vehicleId: 'XE002', status: 'Đang chạy' },
        { id: 'VC003', voyageNumber: 'VCN-003', fromPortId: 'PORT003', toPortId: 'PORT001', etd: '2025-10-07', eta: '2025-10-09', vehicleId: 'XE003', status: 'Hoàn thành' }
    ],
    ports: [
        { id: 'PORT001', name: 'Cảng Sài Gòn', code: 'SGN', location: 'TP.HCM' },
        { id: 'PORT002', name: 'Cảng Hải Phòng', code: 'HPH', location: 'Hải Phòng' },
        { id: 'PORT003', name: 'Cảng Đà Nẵng', code: 'DAD', location: 'Đà Nẵng' }
    ],  
    costs: [
        { id: 'CP001', contractId: 'HD001', costType: 'Vận chuyển container CTN001', amount: 1000000 },
        { id: 'CP002', contractId: 'HD001', costType: 'Bảo trì container CTN001', amount: 500000 },
        { id: 'CP003', contractId: 'HD002', costType: 'Lưu kho container CTN002', amount: 2000000 },
        { id: 'CP004', contractId: 'HD002', costType: 'Vệ sinh container CTN002', amount: 1000000 },
        { id: 'CP005', contractId: 'HD003', costType: 'Phí hải quan container CTN003', amount: 4000000 },
        { id: 'CP006', contractId: 'HD003', costType: 'Phí vận tải quốc tế', amount: 21000000 }
    ],
    invoices: [
        { id: 'HDN001', contractId: 'HD001', amount: 1500000, issueDate: '2025-09-10' },
        { id: 'HDN002', contractId: 'HD002', amount: 3000000, issueDate: '2025-09-15' },
        { id: 'HDN003', contractId: 'HD003', amount: 25000000, issueDate: '2025-09-20' }
    ],

    payments: [
        { id: 'TT001', invoiceId: 'HDN001', amount: 1500000, method: 'Chuyển khoản', time: '2025-09-11T09:00' },
        { id: 'TT002', invoiceId: 'HDN002', amount: 3000000, method: 'Tiền mặt', time: '2025-09-16T12:00' },
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
    ],
    users: [
        { id: 'USER001', name: 'Admin Tổng', email: 'admin@company.com', role: 'admin', warehouseId: 'KHO001', status: 'Hoạt động' },
        { id: 'USER002', name: 'Nguyễn Văn tài', email: 'taixe@company.com', role: 'nhân viên kho', warehouseId: 'KHO001', status: 'Hoạt động' },
        { id: 'USER003', name: 'Hoàng La Thám', email: 'ketoan@company.com', role: 'nhân viên kho', warehouseId: 'KHO002', status: 'Hoạt động' },
        { id: 'USER004', name: 'Lê Văn Quý', email: 'quanly@company.com', role: 'Điều Phối', warehouseId: 'KHO003', status: 'Hoạt động' }
    ]
};

// ====== HÀM QUẢN LÝ LOCALSTORAGE ======
export function loadAllData() {
    const data = {};
    const allModules = [
        'customers', 'contracts', 'vehicles', 'containers','itemTypes', 'containerhistory',
        'warehouses', 'trips', 'ports', 'costs', 'invoices', 'payments',
        'sensors', 'alerts', 'users'
    ];
    
    allModules.forEach(module => {
        const stored = localStorage.getItem(module);
        if (stored) {
            data[module] = JSON.parse(stored);
        } else {
            data[module] = defaultData[module] || [];
            localStorage.setItem(module, JSON.stringify(data[module]));
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
export function exportAllData() {
    const allData = {};
    const allModules = [
        'customers', 'contracts', 'vehicles', 'containers', 'containerhistory',
        'warehouses', 'trips', 'ports', 'costs', 'invoices', 'payments',
        'sensor_logs', 'alerts', 'users'
    ];
    
    allModules.forEach(module => {
        allData[module] = JSON.parse(localStorage.getItem(module) || '[]');
    });
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function resetAllData() {
    const allModules = [
        'customers', 'contracts', 'vehicles', 'containers', 'containerhistory',
        'warehouses', 'trips', 'ports', 'costs', 'invoices', 'payments',
        'sensor_logs', 'alerts', 'users'
    ];
    
    allModules.forEach(module => {
        if (defaultData[module]) {
            localStorage.setItem(module, JSON.stringify(defaultData[module]));
        }
    });
    return loadAllData();
}