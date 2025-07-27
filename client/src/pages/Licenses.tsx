import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, message, DatePicker,
  Popconfirm, Tag, Card, Row, Col, Typography, Select, InputNumber, Tabs, Alert
} from 'antd';
import {
  Plus, Edit, Trash2, FileText, AlertTriangle, Clock, CheckCircle
} from 'lucide-react';
import { licenseApi, License } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<License[]>([]);
  const [expired, setExpired] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [form] = Form.useForm();
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadLicenses();
    loadSpecialLicenses();
    loadAvailableCustomers();
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await licenseApi.getAll();
      setLicenses(data);
    } catch (error) {
      message.error('加载许可列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialLicenses = async () => {
    try {
      const [expiringData, expiredData] = await Promise.all([
        licenseApi.getExpiringSoon(),
        licenseApi.getExpired()
      ]);
      setExpiringSoon(expiringData);
      setExpired(expiredData);
    } catch (error) {
      console.error('加载特殊许可列表失败:', error);
    }
  };

  const loadAvailableCustomers = async () => {
    try {
      const customers = await licenseApi.getAvailableCustomers();
      setAvailableCustomers(customers);
    } catch (error) {
      console.error('加载客户列表失败:', error);
    }
  };

  const handleCreate = () => {
    setEditingLicense(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    form.setFieldsValue({
      customer_id: license.customer_id,
      license_object: license.license_object,
      date_range: [dayjs(license.start_date), dayjs(license.end_date)],
      feature_code: license.feature_code,
      valid_points: license.valid_points,
      description: license.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await licenseApi.delete(id);
      message.success('许可删除成功');
      loadLicenses();
      loadSpecialLicenses();
    } catch (error) {
      message.error('删除许可失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        customer_id: values.customer_id,
        license_object: values.license_object,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        feature_code: values.feature_code || '',
        valid_points: values.valid_points || 0,
        description: values.description || '',
      };

      if (editingLicense) {
        await licenseApi.update(editingLicense.id, submitData);
        message.success('许可更新成功');
      } else {
        await licenseApi.create(submitData);
        message.success('许可创建成功');
      }

      setModalVisible(false);
      loadLicenses();
      loadSpecialLicenses();
    } catch (error: any) {
      message.error(error.error || '操作失败');
    }
  };

  const getLicenseStatus = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', text: '已过期', color: '#ff4d4f' };
    } else if (daysLeft <= 7) {
      return { status: 'critical', text: `${daysLeft}天后过期`, color: '#ff4d4f' };
    } else if (daysLeft <= 30) {
      return { status: 'warning', text: `${daysLeft}天后过期`, color: '#faad14' };
    } else {
      return { status: 'normal', text: `${daysLeft}天后过期`, color: '#52c41a' };
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: '许可对象',
      dataIndex: 'license_object',
      key: 'license_object',
      ellipsis: true,
    },
    {
      title: '特征码',
      dataIndex: 'feature_code',
      key: 'feature_code',
      render: (code: string) => (
        code ? (
          <Text code style={{ fontSize: 12 }}>{code}</Text>
        ) : (
          <Text type="secondary">未设置</Text>
        )
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      render: (record: License) => (
        <div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.start_date} ~ {record.end_date}
          </div>
          <div style={{ fontSize: 12 }}>
            <Tag color={getLicenseStatus(record.end_date).color} size="small">
              {getLicenseStatus(record.end_date).text}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '有效点数',
      dataIndex: 'valid_points',
      key: 'valid_points',
      render: (points: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {points.toLocaleString()}
        </Text>
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
      render: (record: License) => (
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
            title="确定要删除这个许可吗？"
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

  const getTabData = () => {
    switch (activeTab) {
      case 'expiring':
        return expiringSoon;
      case 'expired':
        return expired;
      default:
        return licenses;
    }
  };

  const totalPoints = licenses.reduce((sum, license) => sum + (license.valid_points || 0), 0);
  const activeCount = licenses.filter(l => getLicenseStatus(l.end_date).status === 'normal').length;
  const warningCount = licenses.filter(l => getLicenseStatus(l.end_date).status === 'warning').length;
  const criticalCount = licenses.filter(l => ['critical', 'expired'].includes(getLicenseStatus(l.end_date).status)).length;

  return (
    <div>
      <div className="page-header">
        <Title level={2} style={{ margin: 0 }}>
          <FileText size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          许可管理
        </Title>
        <Text type="secondary">管理软件许可和授权</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {licenses.length}
              </div>
              <div style={{ color: '#8c8c8c' }}>许可总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {activeCount}
              </div>
              <div style={{ color: '#8c8c8c' }}>正常许可</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                {warningCount}
              </div>
              <div style={{ color: '#8c8c8c' }}>即将到期</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                {criticalCount}
              </div>
              <div style={{ color: '#8c8c8c' }}>紧急处理</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 告警信息 */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {expiringSoon.length > 0 && (
            <Col span={12}>
              <Alert
                message={`有 ${expiringSoon.length} 个许可即将在30天内到期`}
                description="请及时续费或联系客户处理"
                type="warning"
                showIcon
                icon={<AlertTriangle />}
              />
            </Col>
          )}
          {expired.length > 0 && (
            <Col span={12}>
              <Alert
                message={`有 ${expired.length} 个许可已经过期`}
                description="请立即处理过期许可"
                type="error"
                showIcon
                icon={<Clock />}
              />
            </Col>
          )}
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreate}
            >
              新增许可
            </Button>
          </Space>
          <div style={{ color: '#8c8c8c' }}>
            总点数: <Text strong style={{ color: '#1890ff' }}>{totalPoints.toLocaleString()}</Text>
          </div>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <CheckCircle size={16} style={{ marginRight: 4 }} />
                全部许可 ({licenses.length})
              </span>
            } 
            key="all" 
          />
          <TabPane 
            tab={
              <span>
                <AlertTriangle size={16} style={{ marginRight: 4 }} />
                即将到期 ({expiringSoon.length})
              </span>
            } 
            key="expiring" 
          />
          <TabPane 
            tab={
              <span>
                <Clock size={16} style={{ marginRight: 4 }} />
                已过期 ({expired.length})
              </span>
            } 
            key="expired" 
          />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getTabData()}
          rowKey="id"
          loading={loading}
          pagination={{
            total: getTabData().length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => {
            const status = getLicenseStatus(record.end_date).status;
            if (status === 'expired' || status === 'critical') {
              return 'table-row-error';
            } else if (status === 'warning') {
              return 'table-row-warning';
            }
            return '';
          }}
        />
      </Card>

      <Modal
        title={editingLicense ? '编辑许可' : '新增许可'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select 
                  placeholder="请选择客户"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableCustomers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.industry || '未分类'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="license_object"
                label="许可对象"
                rules={[{ required: true, message: '请输入许可对象' }]}
              >
                <Input placeholder="例如: 核心系统许可" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date_range"
                label="有效期"
                rules={[{ required: true, message: '请选择有效期' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="valid_points"
                label="有效点数"
                rules={[{ required: true, message: '请输入有效点数' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="请输入有效点数"
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="feature_code"
            label="特征码"
          >
            <Input placeholder="请输入特征码（可选）" />
          </Form.Item>

          <Form.Item
            name="description"
            label="许可描述"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入许可描述"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingLicense ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .table-row-error {
          background-color: #fff2f0 !important;
        }
        .table-row-warning {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  );
};

export default Licenses;