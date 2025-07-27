const express = require('express');
const { query, run } = require('../config/database');

const router = express.Router();

// 获取所有渠道
router.get('/', async (req, res) => {
  try {
    const channels = await query(`
      SELECT c.*, 
             GROUP_CONCAT(DISTINCT cu.name) as customer_names,
             GROUP_CONCAT(DISTINCT p.name || ' v' || p.version) as product_names
      FROM channels c
      LEFT JOIN channel_customers cc ON c.id = cc.channel_id
      LEFT JOIN customers cu ON cc.customer_id = cu.id
      LEFT JOIN channel_products cp ON c.id = cp.channel_id
      LEFT JOIN products p ON cp.product_id = p.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(channels);
  } catch (error) {
    console.error('获取渠道列表失败:', error);
    res.status(500).json({ error: '获取渠道列表失败' });
  }
});

// 获取单个渠道详情
router.get('/:id', async (req, res) => {
  try {
    const channels = await query('SELECT * FROM channels WHERE id = ?', [req.params.id]);
    if (channels.length === 0) {
      return res.status(404).json({ error: '渠道不存在' });
    }

    const channel = channels[0];

    // 获取关联的客户
    const customers = await query(`
      SELECT cu.* FROM customers cu
      JOIN channel_customers cc ON cu.id = cc.customer_id
      WHERE cc.channel_id = ?
    `, [req.params.id]);

    // 获取关联的产品
    const products = await query(`
      SELECT p.* FROM products p
      JOIN channel_products cp ON p.id = cp.product_id
      WHERE cp.channel_id = ?
    `, [req.params.id]);

    res.json({
      ...channel,
      customers,
      products
    });
  } catch (error) {
    console.error('获取渠道详情失败:', error);
    res.status(500).json({ error: '获取渠道详情失败' });
  }
});

// 创建渠道
router.post('/', async (req, res) => {
  try {
    const { name, type, description, contact_person, contact_phone, contact_email, customer_ids = [], product_ids = [] } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: '渠道名称和类型不能为空' });
    }

    const result = await run(
      `INSERT INTO channels (name, type, description, contact_person, contact_phone, contact_email) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, description || '', contact_person || '', contact_phone || '', contact_email || '']
    );

    const channelId = result.id;

    // 添加客户关联
    for (const customerId of customer_ids) {
      await run(
        'INSERT INTO channel_customers (channel_id, customer_id) VALUES (?, ?)',
        [channelId, customerId]
      );
    }

    // 添加产品关联
    for (const productId of product_ids) {
      await run(
        'INSERT INTO channel_products (channel_id, product_id) VALUES (?, ?)',
        [channelId, productId]
      );
    }

    res.status(201).json({
      id: channelId,
      message: '渠道创建成功'
    });
  } catch (error) {
    console.error('创建渠道失败:', error);
    res.status(500).json({ error: '创建渠道失败' });
  }
});

// 更新渠道
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description, contact_person, contact_phone, contact_email, customer_ids = [], product_ids = [] } = req.body;
    const channelId = req.params.id;

    // 检查渠道是否存在
    const existingChannels = await query('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (existingChannels.length === 0) {
      return res.status(404).json({ error: '渠道不存在' });
    }

    // 更新渠道基本信息
    await run(
      `UPDATE channels SET name = ?, type = ?, description = ?, contact_person = ?, 
       contact_phone = ?, contact_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, type, description || '', contact_person || '', contact_phone || '', contact_email || '', channelId]
    );

    // 更新客户关联
    await run('DELETE FROM channel_customers WHERE channel_id = ?', [channelId]);
    for (const customerId of customer_ids) {
      await run(
        'INSERT INTO channel_customers (channel_id, customer_id) VALUES (?, ?)',
        [channelId, customerId]
      );
    }

    // 更新产品关联
    await run('DELETE FROM channel_products WHERE channel_id = ?', [channelId]);
    for (const productId of product_ids) {
      await run(
        'INSERT INTO channel_products (channel_id, product_id) VALUES (?, ?)',
        [channelId, productId]
      );
    }

    res.json({ message: '渠道更新成功' });
  } catch (error) {
    console.error('更新渠道失败:', error);
    res.status(500).json({ error: '更新渠道失败' });
  }
});

// 删除渠道
router.delete('/:id', async (req, res) => {
  try {
    const channelId = req.params.id;

    // 检查渠道是否存在
    const existingChannels = await query('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (existingChannels.length === 0) {
      return res.status(404).json({ error: '渠道不存在' });
    }

    // 删除关联关系
    await run('DELETE FROM channel_customers WHERE channel_id = ?', [channelId]);
    await run('DELETE FROM channel_products WHERE channel_id = ?', [channelId]);

    // 删除渠道
    await run('DELETE FROM channels WHERE id = ?', [channelId]);

    res.json({ message: '渠道删除成功' });
  } catch (error) {
    console.error('删除渠道失败:', error);
    res.status(500).json({ error: '删除渠道失败' });
  }
});

// 获取可用的客户列表（用于渠道关联）
router.get('/available/customers', async (req, res) => {
  try {
    const customers = await query('SELECT id, name FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({ error: '获取客户列表失败' });
  }
});

// 获取可用的产品列表（用于渠道关联）
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