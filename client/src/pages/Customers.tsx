import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, message,
  Popconfirm, Tag, Card, Row, Col, Typography, Select, Drawer, Descriptions
} from 'antd';
import {
  Plus, Edit, Trash2, UserCheck, Phone, Mail, MapPin, User, Eye
} from 'lucide-react';
import { customerApi, Customer } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
    loadAvailableOptions();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const [channels, products] = await Promise.all([
        customerApi.getAvailableChannels(),
        customerApi.getAvailableProducts()
      ]);
      setAvailableChannels(channels);
      setAvailableProducts(products);
    } catch (error) {
      console.error('加载选项失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (customer: Customer) => {
    try {
      const customerDetail = await customerApi.getById(customer.id);
      setEditingCustomer(customerDetail);
      form.setFieldsValue({
        name: customerDetail.name,
        industry: customerDetail.industry,
        contact_person: customerDetail.contact_person,
        contact_phone: customerDetail.contact_phone,
        contact_email: customerDetail.contact_email,
        address: customerDetail.address,
        delivery_person: customerDetail.delivery_person,
        deployment_plan: customerDetail.deployment_plan,
        channel_ids: customerDetail.channels?.map(c => c.id) || [],
        product_ids: customerDetail.products?.map(p => p.id) || [],
      });
      setModalVisible(true);
    } catch (error) {
      message.error('加载客户详情失败');
    }
  };

  const handleView = async (customer: Customer) => {
    try {
      const customerDetail = await customerApi.getById(customer.id);
      setViewingCustomer(customerDetail);
      setDrawerVisible(true);
    } catch (error) {
      message.error('加载客户详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await customerApi.delete(id);
      message.success('客户删除成功');
      loadCustomers();
    } catch (error) {
      message.error('删除客户失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, values);
        message.success('客户更新成功');
      } else {
        await customerApi.create(values);
        message.success('客户创建成功');
      }

      setModalVisible(false);
      loadCustomers();
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const industries = [
    'IT服务',
    '制造业',
    '金融服务',
    '医疗健康',
    '教育培训',
    '电子商务',
    '物流运输',
    '房地产',
    '零售业',
    '政府机构',
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
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry: string) => (
        industry ? <Tag color="green">{industry}</Tag> : <Text type="secondary">未分类</Text>
      ),
    },
    {
      title: '联系人',
      key: 'contact',
      render: (record: Customer) => (
        <div>
          {record.contact_person && (
            <div>
              <User size={12} style={{ marginRight: 4 }} />
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
      title: '交付人员',
      dataIndex: 'delivery_person',
      key: 'delivery_person',
      render: (text: string) => text || <Text type="secondary">未分配</Text>,
    },
    {
      title: '关联渠道',
      dataIndex: 'channel_names',
      key: 'channel_names',
      ellipsis: true,
      render: (text: string) => (
        text ? (
          <Text ellipsis={{ tooltip: text }}>
            {text.split(',').length}个渠道
          </Text>
        ) : (
          <Text type="secondary">暂无关联</Text>
        )
      ),
    },
    {
      title: '许可数量',
      dataIndex: 'license_count',
      key: 'license_count',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count || 0}个许可
        </Tag>
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
      render: (record: Customer) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个客户吗？"
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
          <UserCheck size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          客户管理
        </Title>
        <Text type="secondary">管理客户信息和关系</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {customers.length}
              </div>
              <div style={{ color: '#8c8c8c' }}>客户总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {customers.filter(c => c.license_count && c.license_count > 0).length}
              </div>
              <div style={{ color: '#8c8c8c' }}>已授权客户</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {customers.filter(c => c.delivery_person).length}
              </div>
              <div style={{ color: '#8c8c8c' }}>已分配交付</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                {new Set(customers.map(c => c.industry).filter(Boolean)).size}
              </div>
              <div style={{ color: '#8c8c8c' }}>覆盖行业</div>
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
              新增客户
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: customers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
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
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="所属行业"
              >
                <Select placeholder="请选择所属行业">
                  {industries.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

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

          <Form.Item
            name="address"
            label="客户地址"
          >
            <Input placeholder="请输入客户地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="delivery_person"
                label="交付人员"
              >
                <Input placeholder="负责交付的人员" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="deployment_plan"
            label="部署计划"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入部署计划"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="channel_ids"
                label="关联渠道"
              >
                <Select
                  mode="multiple"
                  placeholder="选择关联的渠道"
                  optionFilterProp="children"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableChannels.map(channel => (
                    <Option key={channel.id} value={channel.id}>
                      {channel.name} ({channel.type})
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
                {editingCustomer ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {viewingCustomer && (
          <div>
            <Descriptions title="基本信息" bordered column={1}>
              <Descriptions.Item label="客户名称">{viewingCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="所属行业">
                {viewingCustomer.industry ? (
                  <Tag color="green">{viewingCustomer.industry}</Tag>
                ) : (
                  <Text type="secondary">未分类</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{viewingCustomer.contact_person || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{viewingCustomer.contact_phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱">{viewingCustomer.contact_email || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="客户地址">{viewingCustomer.address || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="交付人员">{viewingCustomer.delivery_person || '未分配'}</Descriptions.Item>
            </Descriptions>

            {viewingCustomer.deployment_plan && (
              <Descriptions title="部署计划" bordered column={1} style={{ marginTop: 16 }}>
                <Descriptions.Item label="计划内容">
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {viewingCustomer.deployment_plan}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}

            {viewingCustomer.channels && viewingCustomer.channels.length > 0 && (
              <Card title="关联渠道" style={{ marginTop: 16 }}>
                {viewingCustomer.channels.map(channel => (
                  <Tag key={channel.id} color="blue" style={{ margin: 4 }}>
                    {channel.name} ({channel.type})
                  </Tag>
                ))}
              </Card>
            )}

            {viewingCustomer.products && viewingCustomer.products.length > 0 && (
              <Card title="使用产品" style={{ marginTop: 16 }}>
                {viewingCustomer.products.map(product => (
                  <Tag key={product.id} color="green" style={{ margin: 4 }}>
                    {product.name} v{product.version}
                  </Tag>
                ))}
              </Card>
            )}

            {viewingCustomer.licenses && viewingCustomer.licenses.length > 0 && (
              <Card title="许可信息" style={{ marginTop: 16 }}>
                {viewingCustomer.licenses.map(license => (
                  <div key={license.id} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    <div><strong>{license.license_object}</strong></div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {license.start_date} ~ {license.end_date}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      有效点数: {license.valid_points}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Customers;