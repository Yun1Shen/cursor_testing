import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, message,
  Popconfirm, Tag, Card, Row, Col, Typography, Select
} from 'antd';
import {
  Plus, Edit, Trash2, Users, Phone, Mail
} from 'lucide-react';
import { channelApi, Channel } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [form] = Form.useForm();
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    loadChannels();
    loadAvailableOptions();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await channelApi.getAll();
      setChannels(data);
    } catch (error) {
      message.error('加载渠道列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const [customers, products] = await Promise.all([
        channelApi.getAvailableCustomers(),
        channelApi.getAvailableProducts()
      ]);
      setAvailableCustomers(customers);
      setAvailableProducts(products);
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingChannel(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (channel: Channel) => {
    try {
      const channelDetail = await channelApi.getById(channel.id);
      setEditingChannel(channelDetail);
      form.setFieldsValue({
        name: channelDetail.name,
        type: channelDetail.type,
        description: channelDetail.description,
        contact_person: channelDetail.contact_person,
        contact_phone: channelDetail.contact_phone,
        contact_email: channelDetail.contact_email,
        customer_ids: channelDetail.customers?.map(c => c.id) || [],
        product_ids: channelDetail.products?.map(p => p.id) || [],
      });
      setModalVisible(true);
    } catch (error) {
      message.error('加载渠道详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await channelApi.delete(id);
      message.success('渠道删除成功');
      loadChannels();
    } catch (error) {
      message.error('删除渠道失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingChannel) {
        await channelApi.update(editingChannel.id, values);
        message.success('渠道更新成功');
      } else {
        await channelApi.create(values);
        message.success('渠道创建成功');
      }

      setModalVisible(false);
      loadChannels();
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const channelTypes = [
    '区域代理',
    '直销渠道',
    '战略合作',
    '在线渠道',
    '分销商',
    '系统集成商',
    '其他'
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '渠道类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '联系人',
      key: 'contact',
      render: (record: Channel) => (
        <div>
          {record.contact_person && (
            <div>
              <Users size={12} style={{ marginRight: 4 }} />
              {record.contact_person}
            </div>
          )}
          {record.contact_phone && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              <Phone size={10} style={{ marginRight: 4 }} />
              {record.contact_phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '关联客户',
      dataIndex: 'customer_names',
      key: 'customer_names',
      ellipsis: true,
      render: (text: string) => (
        text ? (
          <Text ellipsis={{ tooltip: text }}>
            {text.split(',').length}个客户
          </Text>
        ) : (
          <Text type="secondary">暂无关联</Text>
        )
      ),
    },
    {
      title: '使用产品',
      dataIndex: 'product_names',
      key: 'product_names',
      ellipsis: true,
      render: (text: string) => (
        text ? (
          <Text ellipsis={{ tooltip: text }}>
            {text.split(',').length}个产品
          </Text>
        ) : (
          <Text type="secondary">暂无产品</Text>
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
      width: 150,
      render: (record: Channel) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个渠道吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<Trash2 size={14} />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          <Users size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          渠道管理
        </Title>
        <Text type="secondary">管理销售渠道和合作伙伴</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {channels.length}
              </div>
              <div style={{ color: '#8c8c8c' }}>渠道总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {channels.filter(c => c.customer_names).length}
              </div>
              <div style={{ color: '#8c8c8c' }}>有客户关联</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {channels.filter(c => c.product_names).length}
              </div>
              <div style={{ color: '#8c8c8c' }}>有产品关联</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {new Set(channelTypes.filter(type => 
                  channels.some(c => c.type === type)
                )).size}
              </div>
              <div style={{ color: '#8c8c8c' }}>渠道类型</div>
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
              新增渠道
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={channels}
          rowKey="id"
          loading={loading}
          pagination={{
            total: channels.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingChannel ? '编辑渠道' : '新增渠道'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="渠道名称"
                rules={[{ required: true, message: '请输入渠道名称' }]}
              >
                <Input placeholder="请输入渠道名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="渠道类型"
                rules={[{ required: true, message: '请选择渠道类型' }]}
              >
                <Select placeholder="请选择渠道类型">
                  {channelTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="渠道描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入渠道描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="contact_person"
                label="联系人"
              >
                <Input placeholder="联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="contact_phone"
                label="联系电话"
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="contact_email"
                label="联系邮箱"
              >
                <Input placeholder="联系邮箱" type="email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_ids"
                label="关联客户"
              >
                <Select
                  mode="multiple"
                  placeholder="选择关联的客户"
                  optionFilterProp="children"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableCustomers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_ids"
                label="使用产品"
              >
                <Select
                  mode="multiple"
                  placeholder="选择使用的产品"
                  optionFilterProp="children"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableProducts.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.name} v{product.version}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingChannel ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Channels;