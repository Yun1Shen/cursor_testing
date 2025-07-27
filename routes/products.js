const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, run } = require('../config/database');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = /\.(zip|rar|tar|gz|exe|msi|deb|rpm|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    if (allowedTypes.test(file.originalname)) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取所有产品
router.get('/', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({ error: '获取产品列表失败' });
  }
});

// 获取单个产品
router.get('/:id', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({ error: '获取产品详情失败' });
  }
});

// 创建产品
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { name, version, description } = req.body;
    
    if (!name || !version) {
      return res.status(400).json({ error: '产品名称和版本号不能为空' });
    }

    let fileInfo = {};
    if (req.file) {
      fileInfo = {
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size
      };
    }

    const result = await run(
      `INSERT INTO products (name, version, description, file_path, file_name, file_size) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, version, description || '', fileInfo.file_path || null, fileInfo.file_name || null, fileInfo.file_size || null]
    );

    res.status(201).json({
      id: result.id,
      name,
      version,
      description,
      ...fileInfo,
      message: '产品创建成功'
    });
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({ error: '创建产品失败' });
  }
});

// 更新产品
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { name, version, description } = req.body;
    const productId = req.params.id;

    // 检查产品是否存在
    const existingProducts = await query('SELECT * FROM products WHERE id = ?', [productId]);
    if (existingProducts.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    let updateQuery = 'UPDATE products SET name = ?, version = ?, description = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [name, version, description || ''];

    // 如果有新文件上传
    if (req.file) {
      // 删除旧文件
      const oldProduct = existingProducts[0];
      if (oldProduct.file_path && fs.existsSync(oldProduct.file_path)) {
        fs.unlinkSync(oldProduct.file_path);
      }

      updateQuery += ', file_path = ?, file_name = ?, file_size = ?';
      params.push(req.file.path, req.file.originalname, req.file.size);
    }

    updateQuery += ' WHERE id = ?';
    params.push(productId);

    await run(updateQuery, params);

    res.json({ message: '产品更新成功' });
  } catch (error) {
    console.error('更新产品失败:', error);
    res.status(500).json({ error: '更新产品失败' });
  }
});

// 删除产品
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // 获取产品信息以删除文件
    const products = await query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    const product = products[0];

    // 删除关联关系
    await run('DELETE FROM channel_products WHERE product_id = ?', [productId]);
    await run('DELETE FROM customer_products WHERE product_id = ?', [productId]);

    // 删除产品记录
    await run('DELETE FROM products WHERE id = ?', [productId]);

    // 删除文件
    if (product.file_path && fs.existsSync(product.file_path)) {
      fs.unlinkSync(product.file_path);
    }

    res.json({ message: '产品删除成功' });
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({ error: '删除产品失败' });
  }
});

// 下载产品文件
router.get('/:id/download', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    const product = products[0];
    if (!product.file_path || !fs.existsSync(product.file_path)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.download(product.file_path, product.file_name);
  } catch (error) {
    console.error('下载文件失败:', error);
    res.status(500).json({ error: '下载文件失败' });
  }
});

module.exports = router;