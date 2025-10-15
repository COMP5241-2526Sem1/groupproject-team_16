const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.resolve(__dirname, 'polyuClass_database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('成功连接到数据库');
    }
});

// 封装数据库操作，返回Promise
const dbQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

/**
 * SQL构建工具
 */
const sqlBuilder = {
    /**
     * 构建创建表的SQL语句
     * @param {string} tableName 表名
     * @param {Array} columns 列定义数组
     * @returns {string} SQL语句
     */
    buildCreateTable: (tableName, columns) => {
        const columnDefinitions = columns.map(col => {
            let def = `${col.name} ${col.type}`;
            if (col.constraints) {
                def += ` ${col.constraints}`;
            }
            return def;
        }).join(', ');
        
        return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
    },
    
    /**
     * 构建插入记录的SQL语句
     * @param {string} tableName 表名
     * @param {Array} columns 列名数组
     * @returns {string} SQL语句
     */
    buildInsert: (tableName, columns) => {
        const placeholders = columns.map(() => '?').join(', ');
        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    },
    
    /**
     * 构建更新记录的SQL语句
     * @param {string} tableName 表名
     * @param {Array} columns 列名数组
     * @param {string} whereClause WHERE子句
     * @returns {string} SQL语句
     */
    buildUpdate: (tableName, columns, whereClause) => {
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        return `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    },
    
    /**
     * 构建删除记录的SQL语句
     * @param {string} tableName 表名
     * @param {string} whereClause WHERE子句
     * @returns {string} SQL语句
     */
    buildDelete: (tableName, whereClause) => {
        return `DELETE FROM ${tableName} WHERE ${whereClause}`;
    },
    
    /**
     * 构建查询记录的SQL语句
     * @param {string} tableName 表名
     * @param {Array} columns 列名数组
     * @param {string} whereClause WHERE子句
     * @returns {string} SQL语句
     */
    buildSelect: (tableName, columns = ['*'], whereClause = '') => {
        let sql = `SELECT ${columns.join(', ')} FROM ${tableName}`;
        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }
        return sql;
    },
    
    /**
     * 构建删除表的SQL语句
     * @param {string} tableName 表名
     * @returns {string} SQL语句
     */
    buildDropTable: (tableName) => {
        return `DROP TABLE IF EXISTS ${tableName}`;
    }
};

/**
 * 表管理工具
 */
const tableManager = {
    /**
     * 获取所有表名
     * @returns {Promise<Array>} 表名数组
     */
    getAllTables: async () => {
        const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
        const rows = await dbQuery(sql);
        return rows.map(row => row.name);
    },
    
    /**
     * 创建新表
     * @param {string} tableName 表名
     * @param {Array} columns 列定义数组
     * @returns {Promise}
     */
    createTable: async (tableName, columns) => {
        // 验证表名
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error('无效的表名，只能包含字母、数字和下划线，且不能以数字开头');
        }
        
        // 验证列定义
        columns.forEach(col => {
            if (!col.name || !col.type) {
                throw new Error('字段必须包含名称和类型');
            }
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name)) {
                throw new Error(`无效的字段名: ${col.name}，只能包含字母、数字和下划线，且不能以数字开头`);
            }
        });
        
        const sql = sqlBuilder.buildCreateTable(tableName, columns);
        return await dbRun(sql);
    },
    
    /**
     * 删除表
     * @param {string} tableName 表名
     * @returns {Promise}
     */
    dropTable: async (tableName) => {
        const sql = sqlBuilder.buildDropTable(tableName);
        return await dbRun(sql);
    },
    
    /**
     * 获取表结构
     * @param {string} tableName 表名
     * @returns {Promise<Array>} 表结构信息
     */
    getTableStructure: async (tableName) => {
        const sql = `PRAGMA table_info(${tableName})`;
        return await dbQuery(sql);
    },
    
    /**
     * 检查表是否存在
     * @param {string} tableName 表名
     * @returns {Promise<boolean>} 是否存在
     */
    tableExists: async (tableName) => {
        const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name = ?";
        const row = await dbGet(sql, [tableName]);
        return !!row;
    }
};

/**
 * 记录管理工具
 */
const recordManager = {
    /**
     * 插入记录
     * @param {string} tableName 表名
     * @param {Object} data 记录数据
     * @returns {Promise}
     */
    insertRecord: async (tableName, data) => {
        const columns = Object.keys(data);
        const values = Object.values(data);
        
        // 替换空字符串为null
        const processedValues = values.map(v => v === '' ? null : v);
        
        const sql = sqlBuilder.buildInsert(tableName, columns);
        return await dbRun(sql, processedValues);
    },
    
    /**
     * 更新记录
     * @param {string} tableName 表名
     * @param {Object} data 要更新的数据
     * @param {Object} where 条件
     * @returns {Promise}
     */
    updateRecords: async (tableName, data, where) => {
        const columns = Object.keys(data);
        const values = Object.values(data);
        
        // 处理where条件
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
        
        // 替换空字符串为null
        const processedValues = values.map(v => v === '' ? null : v);
        
        const sql = sqlBuilder.buildUpdate(tableName, columns, whereClause);
        return await dbRun(sql, [...processedValues, ...whereValues]);
    },
    
    /**
     * 删除记录
     * @param {string} tableName 表名
     * @param {Object} where 条件
     * @returns {Promise}
     */
    deleteRecords: async (tableName, where) => {
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
        
        const sql = sqlBuilder.buildDelete(tableName, whereClause);
        return await dbRun(sql, whereValues);
    },
    
    /**
     * 查询记录
     * @param {string} tableName 表名
     * @param {Object} options 查询选项
     * @returns {Promise<Array>} 查询结果
     */
    queryRecords: async (tableName, options = {}) => {
        const {
            columns = ['*'],
            where = {}
        } = options;
        
        // 处理where条件
        let whereClause = '';
        let whereValues = [];
        
        if (Object.keys(where).length > 0) {
            whereKeys = Object.keys(where);
            whereValues = Object.values(where);
            whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
        }
        
        const sql = sqlBuilder.buildSelect(tableName, columns, whereClause);
        return await dbQuery(sql, whereValues);
    }
};

// 导出模块
module.exports = {
    // 基础数据库操作
    dbQuery,
    dbGet,
    dbRun,
    
    // SQL构建工具
    sqlBuilder,
    
    // 表管理
    tableManager,
    
    // 记录管理
    recordManager,
    
    // 数据库连接
    db
};
    