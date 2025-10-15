// 基础API路径
const API_BASE_URL = '';

// DOM元素
const tableListEl = document.getElementById('tableList');
const tableContentEl = document.getElementById('tableContent');
const createTableBtn = document.getElementById('createTableBtn');
const createTableModal = document.getElementById('createTableModal');
const closeCreateTableModal = document.getElementById('closeCreateTableModal');
const cancelCreateTable = document.getElementById('cancelCreateTable');
const createTableForm = document.getElementById('createTableForm');
const addColumnBtn = document.getElementById('addColumnBtn');
const columnsContainer = document.getElementById('columnsContainer');
const tableSearch = document.getElementById('tableSearch');
const recordModal = document.getElementById('recordModal');
const closeRecordModal = document.getElementById('closeRecordModal');
const cancelRecord = document.getElementById('cancelRecord');
const recordForm = document.getElementById('recordForm');
const recordModalTitle = document.getElementById('recordModalTitle');
const recordFieldsContainer = document.getElementById('recordFieldsContainer');
const currentTableNameInput = document.getElementById('currentTableName');
const currentRecordIdInput = document.getElementById('currentRecordId');

// SQL编辑器元素
const sqlQueryEl = document.getElementById('sqlQuery');
const executeSqlBtn = document.getElementById('executeSqlBtn');
const clearSqlBtn = document.getElementById('clearSqlBtn');
const formatSqlBtn = document.getElementById('formatSqlBtn');
const sqlResultEl = document.getElementById('sqlResult');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    setupEventListeners();
    // 初始化第一个字段行的多选下拉框
    initMultiSelect(columnsContainer.querySelector('.multi-select-dropdown'));
});

// 设置事件监听器
function setupEventListeners() {
    // 创建表相关
    createTableBtn.addEventListener('click', () => {
        createTableModal.classList.remove('hidden');
        document.getElementById('tableName').value = '';
    });

    closeCreateTableModal.addEventListener('click', () => {
        createTableModal.classList.add('hidden');
    });

    cancelCreateTable.addEventListener('click', () => {
        createTableModal.classList.add('hidden');
    });

    addColumnBtn.addEventListener('click', addNewColumn);

    createTableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCreateTable();
    });

    // 记录相关
    closeRecordModal.addEventListener('click', () => {
        recordModal.classList.add('hidden');
    });

    cancelRecord.addEventListener('click', () => {
        recordModal.classList.add('hidden');
    });

    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveRecord();
    });

    // 表搜索
    tableSearch.addEventListener('input', debounce(handleTableSearch, 300));

    // 点击页面其他地方关闭下拉框
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select-dropdown')) {
            document.querySelectorAll('.multi-select-options.open').forEach(el => {
                el.classList.remove('open');
            });
        }
    });

    // SQL编辑器事件
    executeSqlBtn.addEventListener('click', executeSql);
    clearSqlBtn.addEventListener('click', () => {
        sqlQueryEl.value = '';
        sqlResultEl.innerHTML = '<div class="text-gray-500 italic">执行结果将显示在这里</div>';
    });
    formatSqlBtn.addEventListener('click', formatSql);
}

// 初始化多选下拉框
function initMultiSelect(dropdownEl) {
    if (!dropdownEl) return;

    const selectedTags = dropdownEl.querySelector('.selected-tags');
    const optionsContainer = dropdownEl.querySelector('.multi-select-options');
    const hiddenInput = dropdownEl.querySelector('input[name="columnConstraints[]"]');
    const checkboxes = dropdownEl.querySelectorAll('input[type="checkbox"]');
    const placeholder = dropdownEl.querySelector('.placeholder');
    const customInputContainer = dropdownEl.closest('.column-row').querySelector('.custom-constraint-input');
    const customInput = dropdownEl.closest('.column-row').querySelector('.custom-constraint-text');

    // 切换下拉框显示/隐藏
    selectedTags.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsContainer.classList.toggle('open');
    });

    // 处理复选框变化
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // 特殊处理自定义约束
            if (checkbox.value === 'CUSTOM') {
                if (checkbox.checked) {
                    customInputContainer.classList.remove('hidden');
                } else {
                    customInputContainer.classList.add('hidden');
                }
            }
            
            updateSelectedTags();
        });
    });

    // 处理自定义约束输入变化
    if (customInput) {
        customInput.addEventListener('input', updateSelectedTags);
    }

    // 更新选中的标签和隐藏输入值
    function updateSelectedTags() {
        // 清除现有标签（保留占位符）
        Array.from(selectedTags.children).forEach(child => {
            if (!child.classList.contains('placeholder')) {
                child.remove();
            }
        });

        // 收集选中的值
        const selectedValues = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked && checkbox.value !== 'CUSTOM')
            .map(checkbox => checkbox.value);

        // 添加自定义约束（如果有）
        if (Array.from(checkboxes).find(cb => cb.value === 'CUSTOM' && cb.checked) && 
            customInput && customInput.value.trim()) {
            selectedValues.push(customInput.value.trim());
        }

        // 更新隐藏输入值
        hiddenInput.value = selectedValues.join(' ');

        // 显示/隐藏占位符
        if (selectedValues.length > 0) {
            placeholder.style.display = 'none';
            
            // 添加选中的标签
            selectedValues.forEach(value => {
                const tag = document.createElement('span');
                tag.className = 'selected-tag';
                
                // 为标签添加文本和删除按钮
                let displayText = value;
                // 映射到显示名称
                const displayMap = {
                    'PRIMARY KEY': '主键',
                    'NOT NULL': '非空',
                    'UNIQUE': '唯一',
                    'AUTOINCREMENT': '自增',
                    'DEFAULT 0': '默认0',
                    'DEFAULT \'\'': '默认空',
                    'DEFAULT CURRENT_TIMESTAMP': '默认当前时间'
                };
                
                if (displayMap[value]) {
                    displayText = `${value} (${displayMap[value]})`;
                }
                
                tag.innerHTML = `
                    ${displayText}
                    <button type="button" class="ml-1 text-primary hover:text-primary/80">
                        <i class="fa fa-times-circle"></i>
                    </button>
                `;
                
                // 删除标签事件
                tag.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // 如果是自定义约束
                    if (!Object.keys(displayMap).includes(value)) {
                        const customCheckbox = Array.from(checkboxes).find(cb => cb.value === 'CUSTOM');
                        if (customCheckbox) {
                            customCheckbox.checked = false;
                            customInputContainer.classList.add('hidden');
                            if (customInput) customInput.value = '';
                        }
                    } else {
                        // 普通约束
                        const correspondingCheckbox = Array.from(checkboxes).find(cb => cb.value === value);
                        if (correspondingCheckbox) {
                            correspondingCheckbox.checked = false;
                        }
                    }
                    
                    updateSelectedTags();
                });
                
                selectedTags.appendChild(tag);
            });
        } else {
            placeholder.style.display = 'inline';
        }
    }
}

// 添加新的表字段输入行
function addNewColumn() {
    const columnRows = document.querySelectorAll('.column-row');
    const newRow = document.createElement('div');
    newRow.className = 'grid grid-cols-12 gap-3 items-end p-3 border rounded-md mb-2 bg-gray-50 column-row';
    newRow.innerHTML = `
        <div class="col-span-3">
            <label class="block text-sm text-gray-600 mb-1">字段名</label>
            <input type="text" name="columnName[]" required
                class="w-full px-2 py-1 border rounded text-sm">
        </div>
        <div class="col-span-2">
            <label class="block text-sm text-gray-600 mb-1">数据类型</label>
            <select name="columnType[]" class="w-full px-2 py-1 border rounded text-sm">
                <option value="TEXT">TEXT</option>
                <option value="INTEGER">INTEGER</option>
                <option value="REAL">REAL</option>
                <option value="BLOB">BLOB</option>
            </select>
        </div>
        <div class="col-span-4">
            <label class="block text-sm text-gray-600 mb-1">约束条件（可多选）</label>
            <div class="multi-select-dropdown w-full">
                <div class="selected-tags border rounded px-2 py-1 min-h-[28px] cursor-pointer flex items-center">
                    <span class="placeholder text-gray-400 text-sm">选择约束...</span>
                </div>
                <div class="multi-select-options border-x border-b rounded-b mt-[-1px] bg-white absolute w-full z-10">
                    <div class="p-1">
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="PRIMARY KEY" class="mr-2">
                            <span>PRIMARY KEY（主键）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="NOT NULL" class="mr-2">
                            <span>NOT NULL（非空）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="UNIQUE" class="mr-2">
                            <span>UNIQUE（唯一）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="AUTOINCREMENT" class="mr-2">
                            <span>AUTOINCREMENT（自增）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="DEFAULT 0" class="mr-2">
                            <span>DEFAULT 0（默认0）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="DEFAULT ''" class="mr-2">
                            <span>DEFAULT ''（默认空字符串）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="DEFAULT CURRENT_TIMESTAMP" class="mr-2">
                            <span>DEFAULT CURRENT_TIMESTAMP（默认当前时间）</span>
                        </label>
                        <label class="flex items-center p-1 hover:bg-gray-100 rounded cursor-pointer">
                            <input type="checkbox" value="CUSTOM" class="mr-2">
                            <span>自定义约束...</span>
                        </label>
                    </div>
                </div>
                <input type="hidden" name="columnConstraints[]">
            </div>
        </div>
        <div class="col-span-4 hidden custom-constraint-input">
            <label class="block text-sm text-gray-600 mb-1">自定义约束</label>
            <input type="text" placeholder="例如: CHECK(age>0), FOREIGN KEY..."
                class="w-full px-2 py-1 border rounded text-sm custom-constraint-text">
        </div>
        <div class="col-span-1">
            <button type="button" class="removeColumnBtn text-danger px-2 py-1 opacity-70 hover:opacity-100">
                <i class="fa fa-trash"></i>
            </button>
        </div>
    `;
    
    columnsContainer.appendChild(newRow);
    
    // 初始化新行的多选下拉框
    initMultiSelect(newRow.querySelector('.multi-select-dropdown'));
    
    // 为删除按钮添加事件
    newRow.querySelector('.removeColumnBtn').addEventListener('click', function() {
        newRow.remove();
        updateRemoveButtons();
    });
    
    // 更新删除按钮状态
    updateRemoveButtons();
}

// 更新删除按钮状态
function updateRemoveButtons() {
    const columnRows = document.querySelectorAll('.column-row');
    const removeButtons = document.querySelectorAll('.removeColumnBtn');
    
    removeButtons.forEach((btn, index) => {
        if (columnRows.length <= 1) {
            btn.disabled = true;
            btn.classList.add('opacity-50');
            btn.classList.remove('opacity-70');
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-50');
            btn.classList.add('opacity-70');
        }
    });
}

// 加载所有表
async function loadTables() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables`);
        if (!response.ok) throw new Error('加载表失败');
        
        const data = await response.json();
        if (data.ok) {
            renderTableList(data.data);
        } else {
            showError(data.message || '加载表失败');
        }
    } catch (error) {
        showError(error.message);
        tableListEl.innerHTML = `<li class="text-danger text-center py-4">加载表失败: ${error.message}</li>`;
    }
}

// 渲染表列表 - 添加删除表按钮
function renderTableList(tables) {
    if (tables.length === 0) {
        tableListEl.innerHTML = `<li class="text-gray-500 italic text-center py-4">没有表，请创建新表</li>`;
        return;
    }
    
    tableListEl.innerHTML = '';
    tables.forEach(tableName => {
        const li = document.createElement('li');
        li.className = 'p-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center group';
        li.innerHTML = `
            <span class="flex items-center">
                <i class="fa fa-table text-primary mr-2"></i>
                ${tableName}
            </span>
            <button class="delete-table-btn text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition" 
                    data-table="${tableName}">
                <i class="fa fa-trash"></i> 删除
            </button>
        `;
        
        li.addEventListener('click', (e) => {
            // 避免点击删除按钮时触发查看表内容
            if (!e.target.closest('.delete-table-btn')) {
                loadTableData(tableName);
            }
        });
        
        // 删除表按钮事件
        li.querySelector('.delete-table-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`确定要删除表 "${tableName}" 吗？此操作不可恢复，表中所有数据都将丢失！`)) {
                await deleteTable(tableName);
            }
        });
        
        tableListEl.appendChild(li);
    });
}

// 加载表数据
async function loadTableData(tableName) {
    try {
        // 高亮选中的表
        document.querySelectorAll('#tableList li').forEach(li => {
            // 移除所有高亮
            li.classList.remove('bg-primary/10', 'font-medium');
            li.classList.add('hover:bg-gray-100');
            
            // 检查当前li是否包含目标表名
            const textContent = li.textContent.trim();
            if (textContent.includes(tableName)) {
                li.classList.add('bg-primary/10', 'font-medium');
                li.classList.remove('hover:bg-gray-100');
            }
        });
        
        // 加载表结构
        const structureResponse = await fetch(`${API_BASE_URL}/api/tables/${tableName}/structure`);
        if (!structureResponse.ok) throw new Error('加载表结构失败');
        const structureData = await structureResponse.json();
        
        // 加载表记录
        const recordsResponse = await fetch(`${API_BASE_URL}/api/tables/${tableName}/records`);
        if (!recordsResponse.ok) throw new Error('加载表数据失败');
        const recordsData = await recordsResponse.json();
        
        if (structureData.ok && recordsData.ok) {
            renderTableContent(tableName, structureData.data, recordsData.data);
        } else {
            showError('加载表数据失败');
        }
    } catch (error) {
        showError(error.message);
        tableContentEl.innerHTML = `<div class="text-center py-12 text-danger">加载表数据失败: ${error.message}</div>`;
    }
}

// 渲染表内容
function renderTableContent(tableName, structure, records) {
    // 获取主键列
    const primaryKeyColumn = structure.find(col => col.pk === 1)?.name;
    
    // 提取列名
    const columns = structure.map(col => col.name);
    
    tableContentEl.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold flex items-center">
                <i class="fa fa-table text-primary mr-2"></i>
                ${tableName}
            </h2>
            <button id="addRecordBtn" class="bg-success text-white px-3 py-1 rounded text-sm hover:bg-success/90 transition flex items-center"
                    data-table="${tableName}">
                <i class="fa fa-plus mr-1"></i> 添加记录
            </button>
        </div>
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 table-shadow">
                <thead class="bg-gray-50">
                    <tr>
                        ${columns.map(col => `
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ${col} ${structure.find(c => c.name === col && c.pk === 1) ? '<span class="ml-1 text-danger">(主键)</span>' : ''}
                            </th>
                        `).join('')}
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${records.length > 0 ? records.map(record => `
                        <tr>
                            ${columns.map(col => `
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${record[col] !== null ? record[col] : '<span class="text-gray-300">NULL</span>'}
                                </td>
                            `).join('')}
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button class="edit-record text-primary hover:text-primary/80 mr-3"
                                        data-table="${tableName}"
                                        data-id="${primaryKeyColumn ? record[primaryKeyColumn] : ''}">
                                    编辑
                                </button>
                                <button class="delete-record text-danger hover:text-danger/80"
                                        data-table="${tableName}"
                                        data-id="${primaryKeyColumn ? record[primaryKeyColumn] : ''}">
                                    删除
                                </button>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="${columns.length + 1}" class="px-6 py-8 text-center text-gray-500">
                                表中没有记录
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
        
        ${records.length > 0 ? `<div class="mt-4 text-sm text-gray-500">共 ${records.length} 条记录</div>` : ''}
    `;
    
    // 添加记录按钮事件
    document.getElementById('addRecordBtn').addEventListener('click', () => {
        openRecordModal(tableName, null, structure);
    });
    
    // 编辑记录按钮事件
    document.querySelectorAll('.edit-record').forEach(btn => {
        btn.addEventListener('click', async () => {
            const table = btn.getAttribute('data-table');
            const id = btn.getAttribute('data-id');
            await openEditRecordModal(table, id, structure, primaryKeyColumn);
        });
    });
    
    // 删除记录按钮事件
    document.querySelectorAll('.delete-record').forEach(btn => {
        btn.addEventListener('click', async () => {
            const table = btn.getAttribute('data-table');
            const id = btn.getAttribute('data-id');
            if (confirm('确定要删除这条记录吗？')) {
                await deleteRecord(table, id, primaryKeyColumn);
            }
        });
    });
}

// 打开记录模态框（添加或编辑）
function openRecordModal(tableName, record, structure) {
    currentTableNameInput.value = tableName;
    currentRecordIdInput.value = record ? record[structure.find(col => col.pk === 1)?.name] : '';
    
    recordModalTitle.textContent = record ? '编辑记录' : '添加记录';
    recordFieldsContainer.innerHTML = '';
    
    // 生成字段输入框
    structure.forEach(col => {
        // 主键在编辑模式下不可修改
        const isPrimaryKey = col.pk === 1;
        const isReadOnly = isPrimaryKey && record;
        
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'mb-4';
        
        fieldContainer.innerHTML = `
            <label for="field-${col.name}" class="block text-gray-700 mb-1">
                ${col.name} ${isPrimaryKey ? '<span class="text-danger">(主键)</span>' : ''}
                ${col.notnull === 1 ? '<span class="text-gray-500">*</span>' : ''}
            </label>
            <input type="${getInputTypeBySqlType(col.type)}" 
                   id="field-${col.name}" 
                   name="${col.name}" 
                   ${col.notnull === 1 && !isPrimaryKey ? 'required' : ''}
                   ${isReadOnly ? 'readonly' : ''}
                   value="${record ? (record[col.name] || '') : ''}"
                   class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${isReadOnly ? 'bg-gray-50' : ''}">
        `;
        
        recordFieldsContainer.appendChild(fieldContainer);
    });
    
    recordModal.classList.remove('hidden');
}

// 根据SQL类型获取输入框类型
function getInputTypeBySqlType(sqlType) {
    if (sqlType.includes('INT')) return 'number';
    if (sqlType.includes('REAL') || sqlType.includes('FLOAT')) return 'number';
    return 'text';
}

// 打开编辑记录模态框
async function openEditRecordModal(tableName, id, structure, primaryKeyColumn) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableName}/records?${primaryKeyColumn}=${id}`);
        if (!response.ok) throw new Error('获取记录失败');
        
        const data = await response.json();
        if (data.ok && data.data.length > 0) {
            openRecordModal(tableName, data.data[0], structure);
        } else {
            showError('未找到记录');
        }
    } catch (error) {
        showError(error.message);
    }
}

// 处理创建表
async function handleCreateTable() {
    const tableName = document.getElementById('tableName').value.trim();
    if (!tableName) {
        showError('请输入表名');
        return;
    }
    
    // 收集字段信息
    const columnNames = Array.from(document.getElementsByName('columnName[]')).map(input => input.value.trim());
    const columnTypes = Array.from(document.getElementsByName('columnType[]')).map(input => input.value);
    const columnConstraints = Array.from(document.getElementsByName('columnConstraints[]')).map(input => input.value.trim());
    
    // 验证字段
    for (let i = 0; i < columnNames.length; i++) {
        if (!columnNames[i]) {
            showError(`第 ${i+1} 个字段名不能为空`);
            return;
        }
    }
    
    // 构建字段数组
    const columns = columnNames.map((name, index) => ({
        name,
        type: columnTypes[index],
        constraints: columnConstraints[index]
    }));
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tableName,
                columns
            })
        });
        
        const data = await response.json();
        if (data.ok) {
            showSuccess(`表 "${tableName}" 创建成功`);
            createTableModal.classList.add('hidden');
            loadTables();
        } else {
            showError(data.message || '创建表失败');
        }
    } catch (error) {
        showError(error.message);
    }
}

// 处理保存记录
async function handleSaveRecord() {
    const tableName = currentTableNameInput.value;
    const recordId = currentRecordIdInput.value;
    const isEditMode = !!recordId;
    
    // 收集记录数据
    const formData = new FormData(recordForm);
    const recordData = {};
    
    formData.forEach((value, key) => {
        // 处理空值
        recordData[key] = value.trim() || null;
    });
    
    try {
        let response;
        
        if (isEditMode) {
            // 编辑记录 - 获取主键列
            const structureResponse = await fetch(`${API_BASE_URL}/api/tables/${tableName}/structure`);
            const structureData = await structureResponse.json();
            const primaryKeyColumn = structureData.data.find(col => col.pk === 1)?.name;
            
            response = await fetch(`${API_BASE_URL}/api/tables/${tableName}/records`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    where: { [primaryKeyColumn]: recordId },
                    data: recordData
                })
            });
        } else {
            // 添加新记录
            response = await fetch(`${API_BASE_URL}/api/tables/${tableName}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recordData)
            });
        }
        
        const data = await response.json();
        if (data.ok) {
            showSuccess(isEditMode ? '记录更新成功' : '记录添加成功');
            recordModal.classList.add('hidden');
            loadTableData(tableName);
        } else {
            showError(data.message || (isEditMode ? '更新记录失败' : '添加记录失败'));
        }
    } catch (error) {
        showError(error.message);
    }
}

// 删除表
async function deleteTable(tableName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableName}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.ok) {
            showSuccess(`表 "${tableName}" 已删除`);
            loadTables();
            tableContentEl.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fa fa-table text-5xl mb-4 opacity-30"></i>
                    <p>请从左侧选择一个表进行操作</p>
                </div>
            `;
        } else {
            showError(data.message || '删除表失败');
        }
    } catch (error) {
        showError(error.message);
    }
}

// 删除记录
async function deleteRecord(tableName, id, primaryKeyColumn) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tables/${tableName}/records`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                where: { [primaryKeyColumn]: id }
            })
        });
        
        const data = await response.json();
        if (data.ok) {
            showSuccess('记录已删除');
            loadTableData(tableName);
        } else {
            showError(data.message || '删除记录失败');
        }
    } catch (error) {
        showError(error.message);
    }
}

// 处理表搜索
async function handleTableSearch() {
    const searchTerm = tableSearch.value.trim().toLowerCase();
    const tableItems = document.querySelectorAll('#tableList li');
    
    if (!searchTerm) {
        tableItems.forEach(item => item.classList.remove('hidden'));
        return;
    }
    
    tableItems.forEach(item => {
        const tableName = item.textContent.trim().toLowerCase();
        if (tableName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// SQL编辑器功能 - 执行SQL语句
async function executeSql() {
    const sql = sqlQueryEl.value.trim();
    if (!sql) {
        showError('请输入SQL语句');
        return;
    }
    
    // 显示加载状态
    sqlResultEl.innerHTML = '<div class="text-gray-500"><i class="fa fa-spinner fa-spin mr-2"></i> 正在执行...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            // 成功处理
            if (data.data && data.data.rows) {
                // 显示查询结果表格
                const columns = Object.keys(data.data.rows[0] || {});
                sqlResultEl.innerHTML = `
                    <div class="mb-2 text-success">
                        <i class="fa fa-check-circle mr-1"></i> 执行成功，返回 ${data.data.rows.length} 条记录
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    ${columns.map(col => `<th class="px-3 py-2 text-left">${col}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.data.rows.map(row => `
                                    <tr>
                                        ${columns.map(col => `<td class="px-3 py-2">${row[col] !== null ? row[col] : '<span class="text-gray-300">NULL</span>'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                // 显示执行结果（非查询语句）
                sqlResultEl.innerHTML = `
                    <div class="text-success">
                        <i class="fa fa-check-circle mr-1"></i> 执行成功
                    </div>
                    <div class="mt-2 text-gray-700">
                        ${data.message || '操作已完成'}
                    </div>
                `;
            }
            
            // 如果是影响表结构的操作，刷新表列表
            const ddlCommands = ['CREATE', 'ALTER', 'DROP', 'TRUNCATE'];
            if (ddlCommands.some(cmd => sql.trim().toUpperCase().startsWith(cmd))) {
                loadTables();
            }
        } else {
            // 显示错误信息
            sqlResultEl.innerHTML = `
                <div class="text-danger">
                    <i class="fa fa-exclamation-circle mr-1"></i> 执行失败
                </div>
                <div class="mt-2 text-gray-700">
                    ${data.message || 'SQL语句执行出错'}
                </div>
            `;
        }
    } catch (error) {
        sqlResultEl.innerHTML = `
            <div class="text-danger">
                <i class="fa fa-exclamation-circle mr-1"></i> 执行出错
            </div>
            <div class="mt-2 text-gray-700">
                ${error.message}
            </div>
        `;
    }
}

// SQL格式化（简单实现）
function formatSql() {
    let sql = sqlQueryEl.value.trim();
    if (!sql) return;
    
    // 简单格式化规则
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'ADD', 'DROP', 'PRIMARY', 'KEY', 'UNIQUE', 'NOT', 'NULL'];
    
    // 将关键字转换为大写并添加换行
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        sql = sql.replace(regex, match => `\n${match.toUpperCase()}`);
    });
    
    // 处理逗号后的空格
    sql = sql.replace(/,/g, ', ');
    
    // 去除多余空行
    sql = sql.replace(/\n+/g, '\n').trim();
    
    sqlQueryEl.value = sql;
}

// 显示成功消息
function showSuccess(message) {
    // 创建临时通知元素
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-success text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center';
    notification.innerHTML = `<i class="fa fa-check-circle mr-2"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 显示错误消息
function showError(message) {
    // 创建临时通知元素
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-danger text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center';
    notification.innerHTML = `<i class="fa fa-exclamation-circle mr-2"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // 5秒后移除
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 添加包含选择器的polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        let el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
    