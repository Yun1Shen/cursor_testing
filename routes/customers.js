const express = require('express');
const { query, run } = require('../config/database');

const router = express.Router();

// 获取所有客户
router.get('/', async (req, res) => {
  try {
    const customers = await query(`
      SELECT c.*, 
             GROUP_CONCAT(DISTINCT ch.name) as channel_names,
             GROUP_CONCAT(DISTINCT p.name || ' v' || p.version) as product_names,
             COUNT(DISTINCT l.id) as license_count
      FROM customers c
      LEFT JOIN channel_customers cc ON c.id = cc.customer_id
      LEFT JOIN channels ch ON cc.channel_id = ch.id
      LEFT JOIN customer_products cp ON c.id = cp.customer_id
      LEFT JOIN products p ON cp.product_id = p.id
      LEFT JOIN licenses l ON c.id = l.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

// 获取单个客户详情
router.get('/:id', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    const customer = customers[0];

    // 获取关联的渠道
    const channels = await query(`
      SELECT ch.* FROM channels ch
      JOIN channel_customers cc ON ch.id = cc.channel_id
      WHERE cc.customer_id = ?
    `, [req.params.id]);

    // 获取关联的产品
    const products = await query(`
      SELECT p.* FROM products p
      JOIN customer_products cp ON p.id = cp.product_id
      WHERE cp.customer_id = ?
    `, [req.params.id]);

    // 获取关联的许可
    const licenses = await query(`
      SELECT * FROM licenses WHERE customer_id = ? ORDER BY created_at DESC
    `, [req.params.id]);

    res.json({
      ...customer,
      channels,
      products,
      licenses
    });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

// 创建客户
router.post('/', async (req, res) => {
  try {
    const { 
      name, industry, contact_person, contact_phone, contact_email, 
      address, delivery_person, deployment_plan, channel_ids = [], product_ids = [] 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '客户名称不能为空' });
    }

    const result = await run(
      `INSERT INTO customers (name, industry, contact_person, contact_phone, contact_email, address, delivery_person, deployment_plan) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, industry || '', contact_person || '', contact_phone || '', contact_email || '', address || '', delivery_person || '', deployment_plan || '']
    );

    const customerId = result.id;

    // 添加渠道关联
    for (const channelId of channel_ids) {
      await run(
        'INSERT INTO channel_customers (channel_id, customer_id) VALUES (?, ?)',
        [channelId, customerId]
      );
    }

    // 添加产品关联
    for (const productId of product_ids) {
      await run(
        'INSERT INTO customer_products (customer_id, product_id) VALUES (?, ?)',
        [customerId, productId]
      );
    }

    res.status(201).json({
      id: customerId,
      message: '客户创建成功'
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({ error: '创建客户失败' });
  }
});

// 更新客户
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, industry, contact_person, contact_phone, contact_email, 
      address, delivery_person, deployment_plan, channel_ids = [], product_ids = [] 
    } = req.body;
    const customerId = req.params.id;

    // 检查客户是否存在
    const existingCustomers = await query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (existingCustomers.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    // 更新客户基本信息
    await run(
      `UPDATE customers SET name = ?, industry = ?, contact_person = ?, contact_phone = ?, 
       contact_email = ?, address = ?, delivery_person = ?, deployment_plan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, industry || '', contact_person || '', contact_phone || '', contact_email || '', address || '', delivery_person || '', deployment_plan || '', customerId]
    );

    // 更新渠道关联（先删除再添加）
    await run('DELETE FROM channel_customers WHERE customer_id = ?', [customerId]);
    for (const channelId of channel_ids) {
      await run(
        'INSERT INTO channel_customers (channel_id, customer_id) VALUES (?, ?)',
        [channelId, customerId]
      );
    }

    // 更新产品关联
    await run('DELETE FROM customer_products WHERE customer_id = ?', [customerId]);
    for (const productId of product_ids) {
      await run(
        'INSERT INTO customer_products (customer_id, product_id) VALUES (?, ?)',
        [customerId, productId]
      );
    }

    res.json({ message: '客户更新成功' });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(500).json({ error: '更新客户失败' });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  try {
    const customerId = req.params.id;

    // 检查客户是否存在
    const existingCustomers = await query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (existingCustomers.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    // 删除关联关系
    await run('DELETE FROM channel_customers WHERE customer_id = ?', [customerId]);
    await run('DELETE FROM customer_products WHERE customer_id = ?', [customerId]);
    await run('DELETE FROM licenses WHERE customer_id = ?', [customerId]);

    // 删除客户
    await run('DELETE FROM customers WHERE id = ?', [customerId]);

    res.json({ message: '客户删除成功' });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({ error: '删除客户失败' });
  }
});

// 获取可用的渠道列表（用于客户关联）
router.get('/available/channels', async (req, res) => {
  try {
    const channels = await query('SELECT id, name, type FROM channels ORDER BY name');
    res.json(channels);
  } catch (error) {
    console.error('获取渠道列表失败:', error);
    res.status(500).json({ error: '获取渠道列表失败' });
  }
});

// 获取可用的产品列表（用于客户关联）
router.get('/available/products', async (req, res) => {
  try {
    const products = await query('SELECT id, name, version FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

module.exports = router;