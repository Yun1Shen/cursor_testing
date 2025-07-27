import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Upload, message,
  Popconfirm, Tag, Card, Row, Col, Typography, Tooltip
} from 'antd';
import {
  Plus, Download, Edit, Trash2, Upload as UploadIcon,
  FileText, Package, Clock
} from 'lucide-react';
import { productApi, Product } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      message.error('加载产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      version: product.version,
      description: product.description,
    });
    setFileList(product.file_name ? [{
      uid: '-1',
      name: product.file_name,
      status: 'done',
      url: `/api/products/${product.id}/download`,
    }] : []);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id);
      message.success('产品删除成功');
      loadProducts();
    } catch (error) {
      message.error('删除产品失败');
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const response = await productApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('文件下载失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('version', values.version);
      formData.append('description', values.description || '');
      
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }

      if (editingProduct) {
        await productApi.update(editingProduct.id, formData);
        message.success('产品更新成功');
      } else {
        await productApi.create(formData);
        message.success('产品创建成功');
      }

      setModalVisible(false);
      loadProducts();
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const uploadProps = {
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    accept: '.zip,.rar,.tar,.gz,.exe,.msi,.deb,.rpm,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => (
        <Tag color="blue">{version}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Text type="secondary" ellipsis={{ tooltip: text }}>
          {text || '暂无描述'}
        </Text>
      ),
    },
    {
      title: '文件',
      key: 'file',
      render: (record: Product) => (
        record.file_name ? (
          <Tooltip title={`文件大小: ${(record.file_size! / 1024 / 1024).toFixed(2)} MB`}>
            <Tag 
              icon={<FileText size={12} />} 
              color="green"
              style={{ cursor: 'pointer' }}
              onClick={() => handleDownload(record.id, record.file_name!)}
            >
              {record.file_name}
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">无文件</Text>
        )
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text type="secondary">
          {new Date(date).toLocaleString()}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: Product) => (
        <Space size="small">
          {record.file_name && (
            <Tooltip title="下载文件">
              <Button
                type="link"
                size="small"
                icon={<Download size={14} />}
                onClick={() => handleDownload(record.id, record.file_name!)}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个产品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<Trash2 size={14} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          <Package size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          产品管理
        </Title>
        <Text type="secondary">管理产品组件和版本信息</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {products.length}
              </div>
              <div style={{ color: '#8c8c8c' }}>产品总数</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {products.filter(p => p.file_name).length}
              </div>
              <div style={{ color: '#8c8c8c' }}>已上传文件</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {products.reduce((total, p) => total + (p.file_size || 0), 0) / 1024 / 1024 / 1024}
              </div>
              <div style={{ color: '#8c8c8c' }}>总文件大小(GB)</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreate}
            >
              新增产品
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            total: products.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>

          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如: v1.0.0" />
          </Form.Item>

          <Form.Item
            name="description"
            label="产品描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入产品描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="file"
            label="产品文件"
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadIcon size={48} style={{ color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 ZIP、RAR、TAR、EXE、MSI、PDF、DOC、XLS、PPT 等格式
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;