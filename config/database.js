const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 数据库初始化
const init = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 产品表
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        description TEXT,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 渠道表
      db.run(`CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        contact_person VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 客户表
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        contact_person VARCHAR(255),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        address TEXT,
        delivery_person VARCHAR(255),
        deployment_plan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 许可表
      db.run(`CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        license_object VARCHAR(255),
        start_date DATE,
        end_date DATE,
        feature_code VARCHAR(255),
        valid_points INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )`);

      // 渠道-客户关联表
      db.run(`CREATE TABLE IF NOT EXISTS channel_customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER,
        customer_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id),
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      )`);

      // 渠道-产品组件关联表
      db.run(`CREATE TABLE IF NOT EXISTS channel_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER,
        product_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`);

      // 客户-产品组件关联表
      db.run(`CREATE TABLE IF NOT EXISTS customer_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        product_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`);

      // 插入示例数据
      db.run(`INSERT OR IGNORE INTO products (id, name, version, description) VALUES 
        (1, '核心业务系统', 'v2.1.0', '企业核心业务处理系统'),
        (2, '数据分析模块', 'v1.5.2', '实时数据分析和报表生成'),
        (3, '安全认证组件', 'v3.0.1', '多因子身份认证系统')`);

      db.run(`INSERT OR IGNORE INTO channels (id, name, type, contact_person, contact_phone) VALUES 
        (1, '华东区域代理', '区域代理', '张经理', '13800138001'),
        (2, '在线直销', '直销渠道', '李经理', '13800138002'),
        (3, '合作伙伴A', '战略合作', '王经理', '13800138003')`);

      db.run(`INSERT OR IGNORE INTO customers (id, name, industry, contact_person, contact_phone, delivery_person) VALUES 
        (1, '上海科技有限公司', 'IT服务', '赵总', '13800138011', '技术团队A'),
        (2, '北京制造集团', '制造业', '钱总', '13800138012', '技术团队B'),
        (3, '广州金融公司', '金融服务', '孙总', '13800138013', '技术团队C')`);

      db.run(`INSERT OR IGNORE INTO licenses (id, customer_id, license_object, start_date, end_date, feature_code, valid_points) VALUES 
        (1, 1, '核心系统许可', '2024-01-01', '2024-12-31', 'CORE_2024_001', 1000),
        (2, 2, '数据分析许可', '2024-01-01', '2025-01-01', 'DATA_2024_002', 500),
        (3, 3, '安全认证许可', '2024-01-01', '2024-06-30', 'AUTH_2024_003', 800)`);

      resolve();
    });
  });
};

// 数据库查询方法
const query = (sql, params = []) => {
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

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

module.exports = {
  db,
  init,
  query,
  run
};