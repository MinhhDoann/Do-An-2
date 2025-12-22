        // ====== IMPORT DỮ LIỆU ======
        import { loadAllData, saveData } from './storage/storage.js';

        // ====== KHỞI TẠO DỮ LIỆU ======
        let appData = loadAllData();

        // ====== CẬP NHẬT BẢN ĐỒ HIỂN THỊ ======
        function getMap(source = [], keyName = 'id', valueName = 'name') {
            if (!Array.isArray(source)) return {};
            return Object.fromEntries(
                source.map(item => [item[keyName], item[valueName] || item[keyName]])
            );
        }
        let currentModuleId;

        let displayMaps = {};   

        function updateDisplayMaps() {
            displayMaps = {
                customers: getMap(appData.customers, 'id', 'name'),
                warehouses: getMap(appData.warehouses, 'id', 'name'),
                vehicles: getMap(appData.vehicles, 'id', 'licensePlate'),
                contracts: getMap(appData.contracts, 'id', 'id'),
                invoices: getMap(appData.invoices, 'id', 'id'),
                containers: getMap(appData.containers, 'id', 'id'),
                itemTypes: getMap(appData.itemTypes, 'id', 'name'),
                ports: getMap(appData.ports, 'id', 'name'),           
                trips: getMap(appData.trips, 'id', 'voyageNumber'),   
                users: getMap(appData.users, 'id', 'name')  
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
            loadTableData(moduleId, appData[moduleId] || []);
        }

        // ====== CẤU HÌNH CÁC BẢNG ======
        const tableConfigs = {
            containers: { fields: ['id', 'itemTypeId', 'weight', 'status', 'warehouseId', 'vehicleId', 'customerId'] },
            itemTypes: { fields: ['id', 'name', 'description','category'] },
            containerhistory: { fields: ['id', 'containerId', 'action', 'time', 'location'] },
            warehouses: { fields: ['id', 'name', 'capacity', 'location', 'manager'] },
            customers: { fields: ['id', 'name', 'email', 'phone','address'] },
            vehicles: {
                fields: ['id','vehicleType','licensePlate','image', 'capacity', 'status', 'description']
            },
            trips: { fields: ['id', 'voyageNumber', 'fromPortId', 'toPortId', 'etd', 'eta', 'vehicleId', 'status'] },  
            ports: { fields: ['id', 'name', 'code', 'location'] },                                                                  
            users: { fields: ['id', 'name', 'email', 'role', 'password', 'warehouseId', 'status'] },                               
            contracts: { fields: ['id', 'customerId', 'signDate', 'expiryDate', 'value'] },
            invoices: { fields: ['id', 'contractId', 'amount', 'issueDate', 'payments'] },
            costs: { fields: ['id', 'contractId', 'costType', 'amount'] }
        };

        // ====== RÀNG BUỘC QUAN HỆ DỮ LIỆU ======
        const dataRelations = {
            containers: { warehouseId: 'warehouses', vehicleId: 'vehicles', customerId: 'customers', itemTypeId: 'itemTypes' },
            containerhistory: { containerId: 'containers' },
            trips: { fromPortId: 'ports', toPortId: 'ports', vehicleId: 'vehicles' },
            contracts: { customerId: 'customers' },
            invoices: { contractId: 'contracts' },
            costs: { contractId: 'contracts' },
            users: { warehouseId: 'warehouses' }  
        };

        const paginationState = {}
        const itemsPerPageDefault = 9;

        // ====== TẢI DỮ LIỆU RA BẢNG ======
        function loadTableData(moduleId, data) {
            if (!paginationState[moduleId]) paginationState[moduleId] = 1;
            const currentPage = paginationState[moduleId];

            const itemsPerPage = (moduleId === "vehicles") ? 5 : 9;
            const tbody = document.querySelector(`#${moduleId} tbody`);
            if (!tbody) return;
            tbody.innerHTML = '';

            const totalItems = data.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                paginationState[moduleId] = 1;
            }
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageData = data.slice(start, end);

            const config = tableConfigs[moduleId];
            if (!config) return;

            if (totalItems === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="${config.fields.length + 1}" style="text-align:center; padding:20px;">📭 Chưa có dữ liệu</td>`;
                tbody.appendChild(emptyRow);
                renderPagination(moduleId, 1);
                return;
            }

            pageData.forEach(item => {
                const row = document.createElement('tr');

                config.fields.forEach(f => {
                    const cell = document.createElement('td');
                    let value = item[f];
                
                    if (f === 'description') {
                        cell.innerHTML = `<div style="max-width:300px; white-space:normal; line-height:1.5; color:#555;">${value || '-'}</div>`;
                    }
                    else if (f === 'image') {
                        const imgSrc = value?.startsWith('data:image') ? value : `./image/${value}`;
                        cell.innerHTML = `<img src="${imgSrc}" style="width:80px; height:55px; border-radius:8px; object-fit:cover;">`;
                    }
                    else if (f.endsWith('Id') || f === 'fromPortId' || f === 'toPortId') {
                        let relModule = f.replace('Id', '').toLowerCase() + 's';
                        if (f === 'itemTypeId') relModule = 'itemTypes';
                
                        const displayName = getDisplayValue(relModule, value);
                        cell.textContent = displayName || '-';
                    }
                    else if (f === 'payments') {
                        const payments = item.payments || [];
                        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                        const amount = item.amount || 0;
                        const percent = amount > 0 ? Math.round((totalPaid / amount) * 100) : 0;
                        const remaining = amount - totalPaid;

                        // Danh sách các lần thanh toán ngắn gọn (hiển thị trực tiếp trong bảng)
                        let paymentsList = '';
                        if (payments.length === 0) {
                            paymentsList = '<em style="color:#999; font-style:italic;">Chưa có thanh toán</em>';
                        } else {
                            paymentsList = '<ul style="margin:6px 0; padding-left:20px; font-size:13px; max-height:120px; overflow-y:auto; list-style:none;">';
                            payments.forEach(p => {
                                const time = p.time ? new Date(p.time).toLocaleString('vi-VN') : 'Không rõ thời gian';
                                paymentsList += `
                                    <li style="margin:4px 0; padding-left:4px; border-left:3px solid #ddd;">
                                        <strong>${Number(p.amount).toLocaleString('vi-VN')} ₫</strong><br>
                                        <small style="color:#555;">
                                            ${p.method || 'Không ghi chú'} • ${time}
                                        </small>
                                    </li>`;
                            });
                            paymentsList += '</ul>';
                        }

                        cell.innerHTML = `
                            <div style="line-height:1.6; min-width:250px; font-size:14px;">
                                <!-- Tổng tiền đã thu / tổng hóa đơn -->
                                <div style="font-weight:bold; font-size:16px; margin-bottom:4px;">
                                    ${totalPaid.toLocaleString('vi-VN')} ₫ 
                                    <span style="color:#777; font-weight:normal;">/ ${amount.toLocaleString('vi-VN')} ₫</span>
                                </div>

                                <!-- Phần trăm thanh toán với màu sắc -->
                                <div style="font-weight:bold; margin-bottom:8px; color:${
                                    percent >= 100 ? '#27ae60' : 
                                    percent >= 70 ? '#f39c12' : 
                                    percent >= 30 ? '#e67e22' : '#e74c3c'
                                };">
                                    ${percent}% đã thanh toán
                                    ${percent < 100 ? 
                                        `<span style="font-weight:normal; color:#555; font-size:13px;"> 
                                            (còn ${remaining.toLocaleString('vi-VN')} ₫)
                                        </span>` : 
                                        ' <span style="font-size:13px;">✅</span>'
                                    }
                                </div>

                                <!-- Nút hành động -->
                                <div style="margin:10px 0;">
                                    <button class="btn-small" onclick="openPaymentModal('${item.id}', 'add')"
                                            style="background:#27ae60; color:white; padding:6px 12px; font-size:13px; border:none; border-radius:5px; cursor:pointer; margin-right:6px;">
                                        + Thêm thanh toán
                                    </button>
                                    <button class="btn-small" onclick="openPaymentModal('${item.id}', 'list')"
                                            style="background:#3498db; color:white; padding:6px 12px; font-size:13px; border:none; border-radius:5px; cursor:pointer;">
                                        ${payments.length > 0 ? 'Quản lý (' + payments.length + ')' : 'Xem chi tiết'}
                                    </button>
                                </div>

                                <!-- Danh sách thanh toán ngắn gọn -->
                                <div style="border-top:1px dashed #ccc; padding-top:8px; margin-top:8px;">
                                    ${paymentsList}
                                </div>
                            </div>
                        `;
                    }
                    else {
                        cell.textContent = value ?? '-';
                    }
                
                    row.appendChild(cell);
                });            

                // Cột hành động
                const actions = document.createElement('td');
                if (moduleId === 'containerhistory') {
                    actions.innerHTML = `
                        <button class="btn-edit" onclick="openModal('edit','${moduleId}','${item.id}')">Sửa</button>
                        <button class="btn-delete" disabled 
                            title="Dữ liệu lịch sử không được xóa"
                            style="opacity:0.4; cursor:not-allowed">
                            Xóa
                        </button>
                    `;
                } else {
                    actions.innerHTML = `
                        <button class="btn-edit" onclick="openModal('edit','${moduleId}','${item.id}')">Sửa</button>
                        <button class="btn-delete" onclick="deleteItem('${moduleId}','${item.id}')">Xóa</button>
                    `;
                }
                row.appendChild(actions);
                tbody.appendChild(row);
            
            });
            renderPagination(moduleId, totalPages)
        }


        // ====== FORM MODAL ======
        const formFields = {
            containers: [
                { id: 'itemTypeId', label: 'Loại hàng', type: 'select', required: true },
                { id: 'weight', label: 'Trọng lượng (kg)', type: 'number', min:'0.1', max:'20' },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Rỗng', 'Đã đóng hàng', 'Đang vận chuyển', 'Cần bảo trì', 'Đã Giao'], defaultValue:"Rỗng"},
                { id: 'warehouseId', label: 'Kho', type: 'number' },
                { id: 'vehicleId', label: 'Phương tiện', type: 'number' },
                { id: 'customerId', label: 'Khách hàng', type: 'number' }
            ],
            itemTypes: [
                { id: 'name',        label: 'Tên loại hàng',    type: 'text',      required: true, options:"" },
                { id: 'description', label: 'Mô tả chi tiết',   type: 'textarea',  required: true, rows: 4 },
                {
                    id: 'category',
                    label: 'Danh mục',
                    type: 'select',
                    options: ['Dễ vỡ', 'Nguy hiểm', 'Đông lạnh', 'Cồng kềnh', 'Khác'],
                    required: true
                }
            ],
            containerhistory: [
                { id: 'containerId', label: 'Container', type: 'number' },
                { id: 'action', label: 'Hành động', type: 'select', options: ['Nhập container', 'Đóng hàng', 'Xuất kho', 'Giao hàng', "Kiểm tra container"] },
                { id: 'time', label: 'Thời gian', type: 'datetime-local' },
                { id: 'location', label: 'Vị trí', type: 'text' }
            ],
            warehouses: [
                { id: 'name', label: 'Tên kho', type: 'text'},
                { id: 'capacity', label: 'Sức chứa (tấn)', type: 'number', min:'1' },
                { id: 'location', label: 'Vị trí', type: 'text'},
                { id: 'manager', label: 'Người phụ trách', type: 'text' }
            ],
            customers: [
                { id: 'name', label: 'Tên khách hàng', type: 'text', required: true, pattern: '^[\\p{L}\\s]+$', maxLength: 50, title:'Vui lòng nhập tên khách hàng' },
                { id: 'email', label: 'Email', type: 'email', required: true, pattern:'^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$', title: 'Vui lòng nhập đúng gmail'},
                { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, pattern: '^0\\d{9}$', title:"Vui lòng nhập đúng số điện thoại" },
                { id: 'address', label: 'Địa chỉ', type: 'text', required: true}
            ],
            vehicles: [
                { id: 'vehicleType', label: 'Loại xe', type: 'select', options: ['Xe tải', 'Xe container', 'Xe khách', 'Xe đầu kéo'] },
                { id: 'licensePlate', label: 'Biển số xe', type: 'text', required: true, minLength: 5, pattern: '^[0-9]{2}[A-Z]{1,2}-[0-9]{3}(\\.[0-9]{2})?$', title: 'Ví dụ: 51A-123.45 hoặc 29H-56789'},
                { id: 'image', label: 'Hình ảnh', type: 'file' },
                { id: 'capacity', label: 'Tải trọng (tấn)', type: 'number' , min: '0.1', max: '20', required: true },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Đang hoạt động', 'Đang bảo trì', 'Đang vận chuyển', 'Ngừng sử dụng'], defaultValue: 'Đang hoạt động' },
                { id: 'description', label: 'Mô tả chi tiết', type: 'textarea' }
            ],
            trips: [
                {id: 'voyageNumber', label: 'Mã chuyến', type: 'text', required: true },
                { id: 'fromPortId', label: 'Cảng đi', type: 'number', required: true },
                { id: 'toPortId', label: 'Cảng đến', type: 'number', required: true },
                { id: 'etd', label: 'ETD (Ngày khởi hành)', type: 'date', required: true, min: new Date().toISOString().split('T')[0] },
                { id: 'eta', label: 'ETA (Ngày đến)', type: 'date', required: true },
                { id: 'vehicleId', label: 'Phương tiện', type: 'number', required: true },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Chuẩn bị', 'Đang chạy', 'Hoàn thành', 'Hủy'], disabled: true }
            ],
            ports: [ 
            { id: 'name', label: 'Tên cảng', type: 'text'},
            { id: 'code', label: 'Mã cảng', type: 'text'},
            { id: 'location', label: 'Vị trí', type: 'text'}
            ],
            contracts: [
                { id: 'customerId', label: 'Khách hàng', type: 'number', required: true },
                { id: 'signDate', label: 'Ngày ký', type: 'date', required: true },
                { id: 'expiryDate', label: 'Ngày hết hạn', type: 'date', required: true },
                { id: 'value', label: 'Giá trị hợp đồng (VND)', type: 'number', min: '100000', required: true }
            ],
            invoices: [
                { id: 'contractId', label: 'Hợp đồng', type: 'number' },
                { id: 'amount', label: 'Số tiền (VND)', type: 'number', min: '100000', required: true },
                { id: 'issueDate', label: 'Ngày phát hành', type: 'date' },
            ],
            costs: [
                { id: 'contractId', label: 'Hợp đồng', type: 'number' },
                { id: 'costType', label: 'Loại chi phí', type: 'text' },
                { id: 'amount', label: 'Số tiền', type: 'number', min:'0'},
                { id: 'billToCustomer', label: 'Thu khách hàng?', type: 'select', options: ['Có', 'Không'], defaultValue: 'Không' }
            ],
            users: [
                { id: 'name', label: 'Họ tên', type: 'text', required: true },
                { id: 'email', label: 'Email', type: 'email', required: true },
                { id: 'role', label: 'Vai trò', type: 'select', options: ['admin', 'quản lý kho', 'Điều Phối'], required: true },
                { id: 'password', label: 'Mật khẩu', type: 'password', minLength: 6, required: true },
                { id: 'warehouseId', label: 'Kho', type: 'number' },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Hoạt động', 'Khóa'], defaultValue: 'Hoạt động' }
            ]
        };

        const ACTION_EFFECTS = {
            'Nhập container':     { container: 'Rỗng',           vehicle: 'Đang hoạt động',   trip: null },
            'Đóng hàng':          { container: 'Đã đóng hàng',   vehicle: 'Đang hoạt động',   trip: null },
            'Xuất kho':           { container: 'Đang vận chuyển',vehicle: 'Đang vận chuyển',  trip: 'Đang chạy' }, 
            'Giao hàng':          { container: 'Rỗng',           vehicle: 'Đang hoạt động',   trip: 'Hoàn thành' },
            'Kiểm tra container': { container: 'Cần bảo trì',vehicle: 'Đang bảo trì',     trip: null }
        };
        
        function updateRelatedStatus(history) {
            const container = appData.containers.find(c => c.id === history.containerId);
            if (!container) return;
        
            const effect = ACTION_EFFECTS[history.action];
            if (!effect) return;
        
            container.status = effect.container;
   
            if (container.vehicleId) {
                const vehicle = appData.vehicles.find(v => v.id === container.vehicleId);
                if (vehicle && effect.vehicle) {
                    vehicle.status = effect.vehicle;
                }
            }
        
            if (effect.trip && container.vehicleId) {
                const activeTrip = appData.trips.find(t => 
                    t.vehicleId === container.vehicleId && 
                    (t.status === 'Chuẩn bị' || t.status === 'Đang chạy')
                );
        
                if (activeTrip) {
                    if (history.action === 'Giao hàng') {
                        const allContainersEmpty = appData.containers
                            .filter(c => c.vehicleId === container.vehicleId)
                            .every(c => c.status === 'Rỗng');
        
                        activeTrip.status = allContainersEmpty ? 'Hoàn thành' : 'Đang chạy';
                    } else {
                        activeTrip.status = effect.trip;
                    }
                }
            }
        
            // Lưu tất cả thay đổi
            saveData('containers', appData.containers);
            saveData('vehicles', appData.vehicles);
            saveData('trips', appData.trips);
        }
        
        function addContainerHistory(history) {
            const container = appData.containers.find(c => c.id === history.containerId);
            if (!container) {
                return alert(`Không tìm thấy container ${history.containerId}`);
            }
        
            // Thêm lịch sử
            appData.containerhistory.push(history);
            saveData('containerhistory', appData.containerhistory);
        
            // TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI CONTAINER + XE + CHUYẾN
            updateRelatedStatus(history);
        
            if (history.action === 'Xuất kho' && container.vehicleId) {
                const vehicleId = container.vehicleId;
                const vehicle = appData.vehicles.find(v => v.id === vehicleId);
        
                // Kiểm tra xem xe đã có chuyến active chưa
                const hasActiveTrip = appData.trips.some(t => 
                    t.vehicleId === vehicleId && 
                    ['Chuẩn bị', 'Đang chạy'].includes(t.status)
                );
        
                if (!hasActiveTrip) {
                    // Tạo chuyến đi mới tự động
                    const newTripId = generateTransportsID(appData.trips);
        
                    const newTrip = {
                        id: newTripId,
                        voyageNumber: newTripId,
                        fromPortId: '',
                        toPortId: '',
                        etd: new Date().toISOString().split('T')[0],  // hôm nay làm ETD mặc định
                        eta: '',
                        vehicleId: vehicleId,
                        status: 'Đang chạy'  // vì đã xuất kho rồi
                    };
        
                    appData.trips.push(newTrip);
                    saveData('trips', appData.trips);
        
                    alert(`✅ Đã ghi lịch sử "${history.action}"!\n\n` +
                          `Container: ${container.id} → Đang vận chuyển\n` +
                          `Xe: ${vehicle.licensePlate || vehicleId} → Đang vận chuyển\n` +
                          `ĐÃ TỰ ĐỘNG TẠO CHUYẾN ĐI MỚI: ${newTripId}\n\n` +
                          `Vui lòng vào mục Chuyến đi để bổ sung cảng đi/đến và ETA.`);
                } else {
                    alert(`✅ Đã ghi lịch sử "${history.action}"!\n\n` +
                          `Trạng thái đã cập nhật.\nChuyến đi hiện tại của xe đã được chuyển sang "Đang chạy".`);
                }
            } else {
                alert(`Đã ghi lịch sử và cập nhật trạng thái!\nContainer ${container.id} → ${container.status}`);
            }
        
            loadTableData('containers', appData.containers);
            loadTableData('vehicles', appData.vehicles);
            loadTableData('trips', appData.trips);
            loadTableData('containerhistory', appData.containerhistory);
        }
        
        // ====== HÀM MỞ / ĐÓNG MODAL ======
        function openModal(action, moduleId, id = null) {
            currentModuleId = moduleId;
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
            
                    // Thêm option rỗng đầu tiên
                    const emptyOpt = document.createElement('option');
                    emptyOpt.value = '';
                    emptyOpt.textContent = '-- Chọn --';
                    input.appendChild(emptyOpt);

                    const relatedList = appData[relation] || [];
                    
                    relatedList.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.id;
                    
                        const displayName = item.name || item.licensePlate || item.voyageNumber || item.id;
                        opt.textContent = item.id;                   
                        opt.dataset.label = displayName;  
                    
                        if (existingItem && existingItem[f.id] == item.id) {
                            opt.selected = true;
                            input.value = item.id;   
                        }
                        input.appendChild(opt);
                    });
                    if (existingItem && existingItem[f.id]) {
                        const selectedId = existingItem[f.id];
                        const selectedItem = relatedList.find(it => it.id === selectedId);
                        if (selectedItem) {
                            input.value = selectedId;
                            const selectedOption = Array.from(input.options).find(o => o.value === selectedId);
                            if (selectedOption) {
                                selectedOption.textContent = selectedItem.name || selectedItem.licensePlate || selectedId;
                            }
                        }
                    }
                }
            
                // 🔹 Nếu là select, textarea, file như cũ
                else if (f.type === 'select') {
                    input = document.createElement('select');
                
                    const emptyOpt = document.createElement('option');
                    emptyOpt.value = '';
                    emptyOpt.textContent = '-- Chọn --';
                    input.appendChild(emptyOpt);
                
                    // Chỉ xử lý mảng options tĩnh (string hoặc object)
                    const options = Array.isArray(f.options) ? f.options : [];
                    options.forEach(opt => {
                        const o = document.createElement('option');
                        const value = typeof opt === 'string' ? opt : (opt.value ?? opt);
                        const label = typeof opt === 'string' ? opt : (opt.label ?? opt);
                
                        o.value = value;
                        o.textContent = label;
                
                        if (f.defaultValue !== undefined && f.defaultValue == value) {
                            o.selected = true;
                        }
                        input.appendChild(o);
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

                if (f.defaultValue !== undefined && f.defaultValue !== null) {
                    input.value = f.defaultValue;  
                }

                if (f.required) input.required = true;
                if (f.pattern) input.pattern = f.pattern;
                if (f.title) input.title = f.title;
                if (f.maxLength) input.maxLength = f.maxLength;
                if (f.min) input.min = f.min;
                if (f.max) input.max = f.max;
                if (f.minLength) input.minLength = f.minLength;
                if (f.disabled) input.disabled = true;
                if (f.placeholder) input.placeholder = f.placeholder; 
                if (f.defaultValue !== undefined) {
                    input.value = f.defaultValue;                   
                }
                if (f.rows && f.type === 'textarea') {
                    input.rows = f.rows;                            
                }
                if (f.options && f.type === 'select') {
                }
                
                if (existingItem && f.type !== 'file') {
                    input.value = existingItem[f.id] || '';
                }
                if (
                    action === 'edit' &&
                    moduleId === 'containerhistory' &&
                    (f.id === 'status' || f.id === 'action')
                ) {
                    input.disabled = true;
                    input.title = "Lịch sử đã ghi nhận không được chỉnh sửa";
                }
                
                if (f.id === "status" && moduleId === "containers") {
                    input.disabled = true;
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

        // thêm nút phân trang
        function renderPagination(moduleId, totalPages) {

            let container = document.querySelector(`#${moduleId} .pagination-wrapper`);        

            if (!container) {
                const moduleDiv = document.getElementById(moduleId);
                if (!moduleDiv) return;
        
                container = document.createElement("div");
                container.className = "pagination-wrapper";
                moduleDiv.appendChild(container);
            }
        
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.marginTop = '20px';
            container.style.gap = '10px';

            const current = paginationState[moduleId] || 1;

            let html = '';

            // Nút Prev
            if (current <= 1) {
                html += `<button disabled>← Prev</button>`;
            } else {
                html += `<button onclick="changePage(${current - 1}, '${moduleId}')">← Prev</button>`;
            }

            let pages = [];
            if (totalPages <= 3) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else if (current <= 2) {
                pages = [1, 2, 3];
            } else if (current >= totalPages - 1) {
                pages = [totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [current - 1, current, current + 1];
            }

            pages.forEach(p => {
                if (p === current) {
                    html += `<button class="active">${p}</button>`;
                } else {
                    html += `<button onclick="changePage(${p}, '${moduleId}')">${p}</button>`;
                }
            });

            // Nút Next
            if (current >= totalPages) {
                html += `<button disabled>Next →</button>`;
            } else {
                html += `<button onclick="changePage(${current + 1}, '${moduleId}')">Next →</button>`;
            }

            container.innerHTML = html;
        }

        function changePage(page, moduleId) {
            paginationState[moduleId] = page; 
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
        function isLicensePlateTaken(licensePlate, excludeId = null) {
            if (!licensePlate || licensePlate.trim() === '') return false;
            
            return appData.vehicles.some(vehicle => {
                if (excludeId && vehicle.id === excludeId) return false;
                return (vehicle.licensePlate || '').trim().toUpperCase() === licensePlate.trim().toUpperCase();
            });
        }


        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('dynamicForm');
            if (form) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    const modalTitle = document.getElementById('modalTitle').textContent;
                    const isAdd = modalTitle.includes('Thêm');
                    const moduleId = currentModuleId;
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
                        }else if (moduleId === 'trips') {
                            id = generateTransportsID(appData.trips);
                        } else if (moduleId === 'ports') {
                            id = "PORT" + (appData.ports?.length + 1 || 1).toString().padStart(3, "0");  
                        } else if (moduleId === 'users') {
                            id = "USER" + (appData.users?.length + 1 || 1).toString().padStart(3, "0"); 
                        } else if (moduleId === 'contracts') {
                            id = generateContractsID(appData.contracts);
                        } else if (moduleId === 'invoices') {
                            id = generateInvoicesID(appData.invoices);
                        }else if (moduleId === 'itemTypes') {
                            let max = 0;
                            appData.itemTypes.forEach(item => {
                                const match = item.id.match(/^HH(\d+)$/);
                                if (match) {
                                    const num = parseInt(match[1]);
                                    if (num > max) max = num;
                                }
                            });
                            id = "HH" + String(max + 1).padStart(3, "0");
                        }
                        else if (moduleId === 'costs') {
                            id = generateCostsID(appData.costs);
                        }
                        else {
                            if (!moduleId) {
                                console.error('❌ moduleId undefined → không tạo ID');
                                return;
                            }
                            
                            const prefix = moduleId === 'ports' ? 'PORT' :
                                           moduleId === 'users' ? 'USER' :
                                           moduleId.toUpperCase().slice(0, 2);
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
                            if (newItem[field]) {
                                const exists = appData[targetModule].some(t => t.id === newItem[field]);
                                if (!exists) {
                                    alert(`❌ Giá trị "${field}" (${newItem[field]}) không tồn tại trong ${targetModule}!`);
                                    return;
                                }
                            }
                        }
                    }
                    if (moduleId === 'vehicles') {
                        const licensePlate = newItem.licensePlate?.trim();
                        
                        if (!licensePlate) {
                            alert('Vui lòng nhập biển số xe!');
                            return; 
                        }
                    
                        const isTaken = isLicensePlateTaken(licensePlate, isAdd ? null : id);
                        
                        if (isTaken) {
                            alert(`Biển số "${licensePlate}" đã được sử dụng bởi xe khác!\nVui lòng nhập biển số mới.`);
                            return; 
                        }
                    }

                    if (moduleId === 'containers') {
                        const vehicleId = newItem.vehicleId;
                        const currentStatus = newItem.status;
                
                        if (currentStatus === 'Đang vận chuyển' && !vehicleId) {
                            alert('Container đang vận chuyển phải được gắn vào một phương tiện!');
                            return;
                        }
                
                        if (vehicleId) {
                            const vehicle = appData.vehicles.find(v => v.id === vehicleId);
                            if (!vehicle) {
                                alert('Phương tiện không tồn tại!');
                                return;
                            }
                
                            const currentContainer = isAdd ? null : appData.containers.find(c => c.id === id);
                
                            const busyContainer = getContainerOnVehicle(vehicleId);
                            if (busyContainer && (!currentContainer || busyContainer.id !== currentContainer.id)) {
                                alert(`Xe ${vehicle.licensePlate || vehicleId} đang chở container ${busyContainer.id} (Đang vận chuyển).\nKhông thể gắn thêm container khác!`);
                                return;
                            }
                        }
                
                        if (!vehicleId && currentStatus === 'Đang vận chuyển') {
                            alert('Không thể để trạng thái "Đang vận chuyển" khi không có phương tiện!');
                            return;
                        }
                    }
                
                    else if (moduleId === 'trips') {
                        const vehicleId = newItem.vehicleId;
                    
                        if (!vehicleId) {
                            alert('Chuyến đi phải được gắn với một phương tiện!');
                            return;
                        }
                    
                        const vehicle = appData.vehicles.find(v => v.id === vehicleId);
                        if (!vehicle) {
                            alert('Phương tiện không tồn tại!');
                            return;
                        }
                    
                        const currentTrip = isAdd ? null : appData.trips.find(t => t.id === id);
                    
                        const activeTrip = appData.trips.find(t => 
                            t.vehicleId === vehicleId && 
                            ['Chuẩn bị', 'Đang chạy'].includes(t.status) &&
                            (!currentTrip || t.id !== currentTrip.id)
                        );
                    
                        if (activeTrip) {
                            alert(`Xe ${vehicle.licensePlate || vehicleId} đang thực hiện chuyến ${activeTrip.voyageNumber} (trạng thái: ${activeTrip.status}).\nKhông thể tạo/sửa chuyến mới!`);
                            return;
                        }
                    
                        const containersOnVehicle = appData.containers.filter(c => c.vehicleId === vehicleId);

                        if (containersOnVehicle.length === 0) {
                            alert(`Xe ${vehicle.licensePlate || vehicleId} chưa được gắn container nào.\nKhông thể tạo chuyến đi!`);
                            return;
                        }

                        const hasLoadedContainer = containersOnVehicle.some(c => c.status === 'Đã đóng hàng');

                        if (!hasLoadedContainer) {
                            const containerIds = containersOnVehicle.map(c => c.id).join(', ');
                            const statuses = [...new Set(containersOnVehicle.map(c => c.status))].join(', ');
                            
                            alert(`❌ Không thể tạo chuyến đi!\n\n` +
                                `Xe ${vehicle.licensePlate || vehicleId} đang gắn container: ${containerIds}\n` +
                                `Trạng thái hiện tại: ${statuses}\n\n` +
                                `Yêu cầu: Phải có ít nhất 1 container ở trạng thái "Đã đóng hàng".\n` +
                                `Vui lòng đóng hàng cho container trước (qua mục Lịch sử container → hành động "Đóng hàng").`);
                            return;
                        }
                    }
                    if (isAdd) {
                        // === CÁC MODULE ĐẶC BIỆT ===
                        if (moduleId === 'containerhistory') {
                            addContainerHistory(newItem);
                        } 
                        else if (moduleId === 'costs') {
                            appData.costs.push(newItem);
                            saveData('costs', appData.costs);
                        
                            let message = '';
                        
                            if (newItem.billToCustomer === 'Có') {
                                const invoice = appData.invoices.find(inv => inv.contractId === newItem.contractId);
                                if (!invoice) {
                                    message = "Chi phí đã lưu nhưng KHÔNG tìm thấy hóa đơn để cộng tiền (hợp đồng không tồn tại hoặc chưa có hóa đơn)!";
                                } else {
                                    const addAmount = parseFloat(newItem.amount || 0);
                                    const oldAmount = invoice.amount;
                                    invoice.amount += addAmount;
                        
                                    const totalPaid = (invoice.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
                                    invoice.paidPercent = invoice.amount > 0 
                                        ? Math.min(100, Math.round((totalPaid / invoice.amount) * 100)) 
                                        : 0;
                        
                                    saveData('invoices', appData.invoices);
                        
                                    message = `Đã cộng ${addAmount.toLocaleString('vi-VN')} ₫ vào hóa đơn ${invoice.id}\n` +
                                              `Tổng hóa đơn: ${oldAmount.toLocaleString('vi-VN')} ₫ → ${invoice.amount.toLocaleString('vi-VN')} ₫\n` +
                                              `Tỷ lệ thanh toán hiện tại: ${invoice.paidPercent}%`;
                                }
                            } else {
                                message = `Đã ghi nhận chi phí nội bộ: ${parseFloat(newItem.amount || 0).toLocaleString('vi-VN')} ₫\n` +
                                          `Loại chi phí: ${newItem.costType || 'Không ghi chú'}`;
                            }
                        
                            loadTableData('costs', appData.costs);
                            loadTableData('invoices', appData.invoices);
                        
                            alert("✅ Thành công!\n\n" + message);
                            closeModal();
                        
                            return;
                        }
                
                        else if (moduleId === 'contracts') {
                            appData.contracts.push(newItem);
                            saveData('contracts', appData.contracts);

                            const mainInvoiceId = generateInvoicesID(appData.invoices);
                            const mainInvoice = {
                                id: mainInvoiceId,
                                contractId: newItem.id,
                                amount: parseFloat(newItem.value) || 0,
                                issueDate: newItem.signDate || new Date().toISOString().split('T')[0],
                                paidPercent: 0,
                                payments: [],                 
                                note: 'Hóa đơn chính từ hợp đồng',
                                originalAmount: parseFloat(newItem.value) || 0
                            };
                            appData.invoices.push(mainInvoice);
                            saveData('invoices', appData.invoices);

                            alert(`Tạo hợp đồng + hóa đơn duy nhất ${mainInvoiceId}`);
                        }
                        else if (moduleId === 'invoices') {
                            const contractId = newItem.contractId;
                    
                            const exists = appData.invoices.some(inv => inv.contractId === contractId);
                    
                            if (exists) {
                                alert(`Hợp đồng ${contractId} ĐÃ CÓ HÓA ĐƠN rồi!\n\n` +
                                      `→ Nếu có phát sinh: vào mục "Chi phí" để ghi nhận (sẽ tự động cộng vào hóa đơn này)\n` +
                                      `→ Nếu khách thanh toán: vào mục "Thanh toán" để ghi thu`);
                                closeModal();
                                return;
                            }
                            
                            newItem.payments = [];
                            newItem.paidPercent = 0;
                            appData.invoices.push(newItem);
                            saveData('invoices', appData.invoices);
                    
                            alert(`Tạo hóa đơn thủ công thành công: ${newItem.id}`);
                        }
  
                        else {
                            appData[moduleId].push(newItem);
                            saveData(moduleId, appData[moduleId]);
                        }
                    }
                    else {
                        const idx = appData[moduleId].findIndex(i => i.id === id);
                        if (idx >= 0) {
                            appData[moduleId][idx] = { ...appData[moduleId][idx], ...newItem };
                            saveData(moduleId, appData[moduleId]);
                        }
                    }

                    loadTableData(moduleId, appData[moduleId]);

                    if (['costs', 'contracts', 'invoices', 'containers', 'trips'].includes(moduleId)) {
                        loadTableData('invoices', appData.invoices);
                        loadTableData('containers', appData.containers);
                        loadTableData('vehicles', appData.vehicles);
                        loadTableData('trips', appData.trips);
                    }
                    alert(isAdd ? 'Thêm thành công!' : 'Cập nhật thành công!');
                    closeModal();
                });
            }

            // ====== KHỞI ĐỘNG ======
            updateDisplayMaps();
            showModule('containers');
        });
        // ktra có đang trở k 
        function isVehicleBusy(vehicleId) {
            return appData.containers.some(c => 
                c.vehicleId === vehicleId && 
                ['Đang vận chuyển'].includes(c.status)
            );
        }
        // ktra đã có chuyến chưa
        function hasActiveTrip(vehicleId) {
            return appData.trips.some(t => 
                t.vehicleId === vehicleId && 
                ['Chuẩn bị', 'Đang chạy'].includes(t.status)
            );
        }
        //kiểm tra đang bận k 
        function isVehicleInUse(vehicleId) {
            return isVehicleBusy(vehicleId) || hasActiveTrip(vehicleId);
        }
        //container đang gắn với xe k 
        function getContainerOnVehicle(vehicleId) {
            return appData.containers.find(c => 
                c.vehicleId === vehicleId && c.status === 'Đang vận chuyển'
            );
        }
        document.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('menuToggle');
            const sidebar = document.querySelector('.sidebar');
          
            if (!toggleBtn || !sidebar) return;
          
            toggleBtn.addEventListener('click', () => {
              sidebar.classList.toggle('active');
            });
          });
          function openPaymentModal(invoiceId, mode = 'add') {
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) {
                alert("Không tìm thấy hóa đơn!");
                return;
            }
        
            const modal = document.getElementById('dynamicModal');
            const modalTitle = document.getElementById('modalTitle');
            const formFieldsDiv = document.getElementById('formFields');
            formFieldsDiv.innerHTML = '';
            modal.style.display = 'block';
        
            const payments = invoice.payments || [];
            const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
            const remaining = invoice.amount - totalPaid;
        
            // Thông tin hóa đơn
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'background:#f0f8ff; padding:15px; border-radius:8px; margin-bottom:20px; border-left:5px solid #3498db; font-size:15px;';
            infoDiv.innerHTML = `
                <strong style="font-size:17px; display:block; margin-bottom:8px;">Hóa đơn: ${invoice.id}</strong>
                <strong>Tổng tiền:</strong> ${Number(invoice.amount).toLocaleString('vi-VN')} ₫<br>
                <strong>Đã thu:</strong> ${totalPaid.toLocaleString('vi-VN')} ₫<br>
                <strong style="color:${remaining <= 0 ? '#27ae60' : '#e74c3c'};">
                    Còn lại: ${remaining.toLocaleString('vi-VN')} ₫
                </strong>
            `;
            formFieldsDiv.appendChild(infoDiv);
        
            if (mode === 'add') {
                modalTitle.textContent = `Thêm thanh toán – Hóa đơn ${invoiceId}`;
        
                const fields = [
                    { id: 'amount', label: 'Số tiền thanh toán (₫)', type: 'number', min: '1', required: true },
                    { id: 'method', label: 'Phương thức', type: 'text', placeholder: 'Tiền mặt, chuyển khoản...' },
                    { id: 'time', label: 'Thời gian', type: 'datetime-local', required: true }
                ];
        
                fields.forEach(f => {
                    const label = document.createElement('label');
                    label.textContent = f.label;
                    label.style.cssText = 'display:block; margin-top:10px; font-weight:600;';
        
                    const input = document.createElement('input');
                    input.type = f.type;
                    input.id = f.id;
                    input.style.cssText = 'width:100%; padding:10px; box-sizing:border-box; border-radius:6px; border:1px solid #ccc;';
                    if (f.min) input.min = f.min;
                    if (f.required) input.required = true;
                    if (f.placeholder) input.placeholder = f.placeholder;
                    if (f.type === 'datetime-local') input.value = new Date().toISOString().slice(0, 16);
        
                    formFieldsDiv.appendChild(label);
                    formFieldsDiv.appendChild(input);
                });
        
            } else if (mode === 'list') {
                modalTitle.textContent = `Quản lý thanh toán – Hóa đơn ${invoiceId}`;
        
                if (payments.length === 0) {
                    formFieldsDiv.innerHTML += '<p style="text-align:center; color:#999; padding:30px;">Chưa có thanh toán nào.</p>';
                } else {
                    const list = document.createElement('div');
                    list.style.cssText = 'max-height:400px; overflow-y:auto; border:1px solid #ddd; border-radius:8px; padding:10px;';
        
                    payments.forEach((p, idx) => {
                        const timeStr = p.time ? new Date(p.time).toLocaleString('vi-VN') : 'Không rõ';
                        const item = document.createElement('div');
                        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;';
                        item.innerHTML = `
                            <div>
                                <strong style="font-size:16px;">${Number(p.amount).toLocaleString('vi-VN')} ₫</strong><br>
                                <small style="color:#555;">${p.method || 'Không ghi chú'}</small><br>
                                <small style="color:#888;">${timeStr}</small>
                            </div>
                            <button onclick="deletePayment('${invoiceId}', ${idx})"
                                    style="background:#e74c3c; color:white; padding:8px 14px; border:none; border-radius:5px; cursor:pointer;">
                                Xóa
                            </button>
                        `;
                        list.appendChild(item);
                    });
                    formFieldsDiv.appendChild(list);
                }
        
                const addBtn = document.createElement('button');
                addBtn.textContent = '+ Thêm thanh toán mới';
                addBtn.style.cssText = 'margin-top:20px; width:100%; padding:12px; background:#27ae60; color:white; border:none; border-radius:6px; font-size:15px; cursor:pointer;';
                addBtn.onclick = () => openPaymentModal(invoiceId, 'add');
                formFieldsDiv.appendChild(addBtn);
            }
        
            // Xử lý submit khi thêm thanh toán
            const form = document.getElementById('dynamicForm');
            const oldSubmit = form.onsubmit;
        
            if (mode === 'add') {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    const amount = Number(document.getElementById('amount').value);
                    if (!amount || amount <= 0) return alert("Số tiền không hợp lệ!");
        
                    if (totalPaid + amount > invoice.amount) {
                        return alert(`Không được thu quá công nợ!\nCòn được thu: ${(invoice.amount - totalPaid).toLocaleString('vi-VN')} ₫`);
                    }
        
                    const payment = {
                        amount,
                        method: document.getElementById('method').value.trim() || 'Không ghi chú',
                        time: document.getElementById('time').value
                    };
        
                    if (!invoice.payments) invoice.payments = [];
                    invoice.payments.push(payment);
        
                    const newTotal = invoice.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
                    invoice.paidPercent = Math.min(100, Math.round((newTotal / invoice.amount) * 100));
        
                    saveData('invoices', appData.invoices);
                    alert(`Thanh toán ${amount.toLocaleString('vi-VN')} ₫ thành công!`);
                    loadTableData('invoices', appData.invoices);
                    closeModal();
                    form.onsubmit = oldSubmit;
                };
            } else {
                form.onsubmit = e => e.preventDefault();
            }
        }
        
        function deletePayment(invoiceId, index) {
            if (!confirm('Xóa lần thanh toán này? Không thể khôi phục!')) return;
        
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (!invoice || !invoice.payments) return;
        
            invoice.payments.splice(index, 1);
        
            const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
            invoice.paidPercent = invoice.amount > 0 ? Math.round((totalPaid / invoice.amount) * 100) : 0;
        
            saveData('invoices', appData.invoices);
            alert('Đã xóa thanh toán!');
            loadTableData('invoices', appData.invoices);
            closeModal();
            openPaymentModal(invoiceId, 'list');
        }  
        // ====== GẮN WINDOW ======
        window.openPaymentModal = openPaymentModal;
        window.deletePayment = deletePayment;
        window.showModule = showModule;
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.deleteItem = deleteItem;
        window.changePage = changePage;
        window.renderPagination = renderPagination;
        window.appData = appData;
