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
            customers: { fields: ['id', 'name', 'email', 'phone'] },
            vehicles: {
                fields: ['id','vehicleType','licensePlate','image', 'capacity', 'status', 'description']
            },
            trips: { fields: ['id', 'voyageNumber', 'fromPortId', 'toPortId', 'etd', 'eta', 'vehicleId', 'status'] },  
            ports: { fields: ['id', 'name', 'code', 'location'] },                                                                  
            users: { fields: ['id', 'name', 'email', 'role', 'warehouseId', 'status'] },                               
            contracts: { fields: ['id', 'customerId', 'signDate', 'expiryDate', 'value'] },
            invoices: { fields: ['id', 'contractId', 'amount', 'issueDate', 'paidPercent'] },
            payments: { fields: ['id', 'invoiceId', 'amount', 'method', 'time'] },
            costs: { fields: ['id', 'contractId', 'costType', 'amount'] }
        };

        // ====== RÀNG BUỘC QUAN HỆ DỮ LIỆU ======
        const dataRelations = {
            containers: { warehouseId: 'warehouses', vehicleId: 'vehicles', customerId: 'customers', itemTypeId: 'itemTypes' },
            containerhistory: { containerId: 'containers' },
            trips: { fromPortId: 'ports', toPortId: 'ports', vehicleId: 'vehicles' },
            contracts: { customerId: 'customers' },
            invoices: { contractId: 'contracts' },
            payments: { invoiceId: 'invoices' },
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
                    else if (f === 'paidPercent') {
                        cell.textContent = (value ?? 0) + "%";
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
                { id: 'weight', label: 'Trọng lượng (kg)', type: 'number', min:'0', max:'10000' },
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
                { id: 'capacity', label: 'Sức chứa (tấn)', type: 'number', min:'0' },
                { id: 'location', label: 'Vị trí', type: 'text'},
                { id: 'manager', label: 'Người phụ trách', type: 'text' }
            ],
            customers: [
                { id: 'name', label: 'Tên khách hàng', type: 'text', required: true, pattern: '^[\\p{L}\\s]+$', maxLength: 50, title:'Vui lòng nhập tên khách hàng' },
                { id: 'email', label: 'Email', type: 'email', required: true, pattern:'^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$', title: 'Vui lòng nhập đúng gmail'},
                { id: 'phone', label: 'Số điện thoại', type: 'text', required: true, pattern: '^0\\d{9}$', title:"Vui lòng nhập đúng số điện thoại" }
            ],
            vehicles: [
                { id: 'vehicleType', label: 'Loại xe', type: 'select', options: ['Xe tải', 'Xe container', 'Xe khách', 'Xe đầu kéo'] },
                { id: 'licensePlate', label: 'Biển số xe', type: 'text' },
                { id: 'image', label: 'Hình ảnh', type: 'file' },
                { id: 'capacity', label: 'Tải trọng (tấn)', type: 'number' },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Đang hoạt động', 'Đang bảo trì', 'Đang vận chuyển', 'Ngừng sử dụng'] },
                { id: 'description', label: 'Mô tả chi tiết', type: 'textarea' }
            ],
            trips: [
                { id: 'voyageNumber', label: 'Mã chuyến', type: 'text' },
                { id: 'fromPortId', label: 'Cảng đi', type: 'number' },
                { id: 'toPortId', label: 'Cảng đến', type: 'number' },
                { id: 'etd', label: 'ETD', type: 'date' },
                { id: 'eta', label: 'ETA', type: 'date' },
                { id: 'vehicleId', label: 'Phương tiện', type: 'number' },
                { id: 'status', label: 'Trạng thái', type: 'select', options: ['Chuẩn bị', 'Đang chạy', 'Hoàn thành', 'Hủy'], disabled: true }
            ],
            ports: [ 
            { id: 'name', label: 'Tên cảng', type: 'text'},
            { id: 'code', label: 'Mã cảng', type: 'text'},
            { id: 'location', label: 'Vị trí', type: 'text'}
            ],
            contracts: [
                { id: 'customerId', label: 'Khách hàng', type: 'number' },
                { id: 'signDate', label: 'Ngày ký', type: 'date' },
                { id: 'expiryDate', label: 'Ngày hết hạn', type: 'date' },
                { id: 'value', label: 'Giá trị hợp đồng', type: 'number', min:'0' }
            ],
            invoices: [
                { id: 'contractId', label: 'Hợp đồng', type: 'number' },
                { id: 'amount', label: 'Số tiền', type: 'number', min:'0' },
                { id: 'issueDate', label: 'Ngày phát hành', type: 'date' },
                { id: 'paidPercent', label: 'Đã thanh toán (%)', type:'text', disabled: true }
            ],
            payments: [
                { id: 'invoiceId', label: 'Hóa đơn', type: 'number' },
                { id: 'amount', label: 'Số tiền', type: 'number', min:'0' },
                { id: 'method', label: 'Phương thức thanh toán', type: 'text' },
                { id: 'time', label: 'Thời gian', type: 'datetime-local' }
            ],
            costs: [
                { id: 'contractId', label: 'Hợp đồng', type: 'number' },
                { id: 'costType', label: 'Loại chi phí', type: 'text' },
                { id: 'amount', label: 'Số tiền', type: 'number', min:'0'},
                { id: 'billToCustomer', label: 'Thu khách hàng?', type: 'select', options: ['Có', 'Không'], defaultValue: 'Không' }
            ],
            users: [
            { id: 'name', label: 'Họ tên', type: 'text'},
            { id: 'email', label: 'Email', type: 'email'},
            { id: 'role', label: 'Vai trò', type: 'select', options: ['admin','quản lý kho','tài xế','kế toán'] },
            { id: 'warehouseId', label: 'Kho', type: 'number' },
            { id: 'status', label: 'Trạng thái', type: 'select', options: ['Hoạt động','Khóa'] }
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
        
            // Thông báo + refresh bảng liên quan
            alert(`Đã ghi lịch sử và cập nhật trạng thái!\nContainer ${container.id} → ${container.status}`);
        
            loadTableData('containers', appData.containers);
            loadTableData('vehicles', appData.vehicles);
            loadTableData('trips', appData.trips);
            loadTableData('containerhistory', appData.containerhistory);
        }
        
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
                        } else if (moduleId === 'payments') {
                            id = generatePaymentsID(appData.payments);
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
                            const prefix = moduleId === 'ports' ? 'PORT' : 
                                        moduleId === 'users' ? 'USER' : 
                                        moduleId.toUpperCase().slice(0,2);
                            id = `${prefix}${(appData[moduleId]?.length || 0) + 1}`;
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
                    if (isAdd) {
                        // === CÁC MODULE ĐẶC BIỆT ===
                        if (moduleId === 'containerhistory') {
                            addContainerHistory(newItem);
                        } 
                        else if (moduleId === 'payments') {
                            addPayment(newItem);
                        }
                        // === CHI PHÍ: XỬ LÝ RIÊNG, KHÔNG ĐỂ VÀO else BÊN DƯỚI ===
                        else if (moduleId === 'costs') {
                            appData.costs.push(newItem);
                            saveData('costs', appData.costs);

                            if (newItem.billToCustomer === 'Có') {
                                const invoice = appData.invoices.find(inv => inv.contractId === newItem.contractId);
                                if (!invoice) {
                                    alert("Không tìm thấy hóa đơn chính của hợp đồng này!");
                                    return;
                                }
                        
                                const addAmount = parseFloat(newItem.amount) || 0;
                                invoice.amount += addAmount; 
                        
                                updateInvoicePaidPercent(invoice.id);
                        
                                alert(`Đã cộng dồn ${addAmount.toLocaleString('vi-VN')} ₫ vào hóa đơn ${invoice.id}\n` +
                                      `Tổng tiền hóa đơn hiện tại: ${invoice.amount.toLocaleString('vi-VN')} ₫`);
                            } else {
                                alert(`Chi phí nội bộ đã ghi nhận: ${parseFloat(newItem.amount).toLocaleString('vi-VN')} ₫`);
                            }
                        
                            loadTableData('costs', appData.costs);
                            loadTableData('invoices', appData.invoices);
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
                            appData[moduleId][idx] = newItem;

                            if (moduleId === 'payments') {
                                updateInvoicePaidPercent(newItem.invoiceId);
                            }
                        }
                        saveData(moduleId, appData[moduleId]);
                    }

                    loadTableData(moduleId, appData[moduleId]);

                    // Refresh bảng hóa đơn nếu có thay đổi liên quan
                    if (['payments', 'costs', 'contracts', 'invoices'].includes(moduleId)) {
                        loadTableData('invoices', appData.invoices);
                    }

                    closeModal();
                });
            }

            // ====== KHỞI ĐỘNG ======
            updateDisplayMaps();
            showModule('containers');
        });

        // hàm tính ràng buộc của thanh toán vs hóa đơn
        function updateInvoicePaidPercent(invoiceId) {
            const invoice = appData.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) return;
        
            const listPayments = appData.payments.filter(p => p.invoiceId === invoiceId);
            const totalPaid = listPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
            const percent = invoice.amount > 0
                ? Math.min(100, Math.round((totalPaid / invoice.amount) * 100))
                : 0;
        
            invoice.paidPercent = percent;
        
            saveData("invoices", appData.invoices);
        }
        
        function addPayment(payment) {
            const invoice = appData.invoices.find(x => x.id === payment.invoiceId);
            if (!invoice) {
                alert("Không tìm thấy hóa đơn này!");
                return;
            }
        
            const paidBefore = appData.payments
                .filter(p => p.invoiceId === payment.invoiceId)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
            const newTotalPaid = paidBefore + Number(payment.amount || 0);
            const remaining = invoice.amount - paidBefore;
        
            if (newTotalPaid > invoice.amount) {
                alert(`Không thể thanh toán vượt quá công nợ!\n\n` +
                      `Hóa đơn ${invoice.id}\n` +
                      `Tổng tiền hóa đơn: ${invoice.amount.toLocaleString('vi-VN')} ₫\n` +
                      `Đã thu trước đó:   ${paidBefore.toLocaleString('vi-VN')} ₫\n` +
                      `Còn được thu:      ${remaining.toLocaleString('vi-VN')} ₫\n\n` +
                      `Số tiền bạn vừa nhập: ${Number(payment.amount).toLocaleString('vi-VN')} ₫ → Quá ${(newTotalPaid - invoice.amount).toLocaleString('vi-VN')} ₫`);
                return; 
            }
        
            payment.id = generatePaymentsID(appData.payments); 
            appData.payments.push(payment);
            saveData('payments', appData.payments);
        
            updateInvoicePaidPercent(payment.invoiceId);
        
            alert(`Đã ghi nhận thanh toán thành công!\n` +
                  `Hóa đơn: ${invoice.id}\n` +
                  `Số tiền: ${Number(payment.amount).toLocaleString('vi-VN')} ₫\n` +
                  `Còn lại: ${(invoice.amount - newTotalPaid).toLocaleString('vi-VN')} ₫`);
        
            loadTableData('payments', appData.payments);
            loadTableData('invoices', appData.invoices);
            closeModal();
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('menuToggle');
            const sidebar = document.querySelector('.sidebar');
          
            if (!toggleBtn || !sidebar) return;
          
            toggleBtn.addEventListener('click', () => {
              sidebar.classList.toggle('active');
            });
          });
          
        // ====== GẮN WINDOW (CHO HTML GỌI) ======
        window.addPayment = addPayment;
        window.showModule = showModule;
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.deleteItem = deleteItem;
        window.changePage = changePage;
        window.renderPagination = renderPagination;
        window.appData = appData;
