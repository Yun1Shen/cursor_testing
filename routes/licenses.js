const express = require('express');
const { query, run } = require('../config/database');

const router = express.Router();

// 获取所有许可
router.get('/', async (req, res) => {
  try {
    const licenses = await query(`
      SELECT l.*, c.name as customer_name, c.industry as customer_industry
      FROM licenses l
      LEFT JOIN customers c ON l.customer_id = c.id
      ORDER BY l.created_at DESC
    `);
    res.json(licenses);
  } catch (error) {
    console.error('获取许可列表失败:', error);
    res.status(500).json({ error: '获取许可列表失败' });
  }
});

// 获取单个许可详情
router.get('/:id', async (req, res) => {
  try {
    const licenses = await query(`
      SELECT l.*, c.name as customer_name, c.industry as customer_industry,
             c.contact_person, c.contact_phone, c.contact_email
      FROM licenses l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.id = ?
    `, [req.params.id]);
    
    if (licenses.length === 0) {
      return res.status(404).json({ error: '许可不存在' });
    }

    res.json(licenses[0]);
  } catch (error) {
    console.error('获取许可详情失败:', error);
    res.status(500).json({ error: '获取许可详情失败' });
  }
});

// 根据客户ID获取许可
router.get('/customer/:customerId', async (req, res) => {
  try {
    const licenses = await query(`
      SELECT l.*, c.name as customer_name
      FROM licenses l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.customer_id = ?
      ORDER BY l.created_at DESC
    `, [req.params.customerId]);
    
    res.json(licenses);
  } catch (error) {
    console.error('获取客户许可失败:', error);
    res.status(500).json({ error: '获取客户许可失败' });
  }
});

// 创建许可
router.post('/', async (req, res) => {
  try {
    const { 
      customer_id, license_object, start_date, end_date, 
      feature_code, valid_points, description 
    } = req.body;
    
    if (!customer_id || !license_object || !start_date || !end_date) {
      return res.status(400).json({ error: '客户、许可对象、开始时间和结束时间不能为空' });
    }

    // 验证客户是否存在
    const customers = await query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(400).json({ error: '客户不存在' });
    }

    // 验证日期格式
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return res.status(400).json({ error: '结束时间必须大于开始时间' });
    }

    const result = await run(
      `INSERT INTO licenses (customer_id, license_object, start_date, end_date, feature_code, valid_points, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, license_object, start_date, end_date, feature_code || '', parseInt(valid_points) || 0, description || '']
    );

    res.status(201).json({
      id: result.id,
      message: '许可创建成功'
    });
  } catch (error) {
    console.error('创建许可失败:', error);
    res.status(500).json({ error: '创建许可失败' });
  }
});

// 更新许可
router.put('/:id', async (req, res) => {
  try {
    const { 
      customer_id, license_object, start_date, end_date, 
      feature_code, valid_points, description 
    } = req.body;
    const licenseId = req.params.id;

    // 检查许可是否存在
    const existingLicenses = await query('SELECT * FROM licenses WHERE id = ?', [licenseId]);
    if (existingLicenses.length === 0) {
      return res.status(404).json({ error: '许可不存在' });
    }

    // 验证客户是否存在
    const customers = await query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(400).json({ error: '客户不存在' });
    }

    // 验证日期格式
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return res.status(400).json({ error: '结束时间必须大于开始时间' });
    }

    await run(
      `UPDATE licenses SET customer_id = ?, license_object = ?, start_date = ?, end_date = ?, 
       feature_code = ?, valid_points = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [customer_id, license_object, start_date, end_date, feature_code || '', parseInt(valid_points) || 0, description || '', licenseId]
    );

    res.json({ message: '许可更新成功' });
  } catch (error) {
    console.error('更新许可失败:', error);
    res.status(500).json({ error: '更新许可失败' });
  }
});

// 删除许可
router.delete('/:id', async (req, res) => {
  try {
    const licenseId = req.params.id;

    // 检查许可是否存在
    const existingLicenses = await query('SELECT * FROM licenses WHERE id = ?', [licenseId]);
    if (existingLicenses.length === 0) {
      return res.status(404).json({ error: '许可不存在' });
    }

    await run('DELETE FROM licenses WHERE id = ?', [licenseId]);

    res.json({ message: '许可删除成功' });
  } catch (error) {
    console.error('删除许可失败:', error);
    res.status(500).json({ error: '删除许可失败' });
  }
});

// 获取即将到期的许可（30天内）
router.get('/expiring/soon', async (req, res) => {
  try {
    const licenses = await query(`
      SELECT l.*, c.name as customer_name, c.contact_person, c.contact_phone
      FROM licenses l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.end_date <= date('now', '+30 days') AND l.end_date >= date('now')
      ORDER BY l.end_date ASC
    `);
    res.json(licenses);
  } catch (error) {
    console.error('获取即将到期许可失败:', error);
    res.status(500).json({ error: '获取即将到期许可失败' });
  }
});

// 获取已过期的许可
router.get('/expired/all', async (req, res) => {
  try {
    const licenses = await query(`
      SELECT l.*, c.name as customer_name, c.contact_person, c.contact_phone
      FROM licenses l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.end_date < date('now')
      ORDER BY l.end_date DESC
    `);
    res.json(licenses);
  } catch (error) {
    console.error('获取已过期许可失败:', error);
    res.status(500).json({ error: '获取已过期许可失败' });
  }
});

// 获取可用的客户列表（用于许可关联）
router.get('/available/customers', async (req, res) => {
  try {
    const customers = await query('SELECT id, name, industry FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

module.exports = router;