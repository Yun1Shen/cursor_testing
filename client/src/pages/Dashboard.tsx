import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Alert } from 'antd';
import { Package, Users, UserCheck, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { productApi, channelApi, customerApi, licenseApi, Product, Channel, Customer, License } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    products: 0,
    channels: 0,
    customers: 0,
    licenses: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [expiringSoonLicenses, setExpiringSoonLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行加载所有数据
      const [products, channels, customers, licenses, expiring] = await Promise.all([
        productApi.getAll(),
        channelApi.getAll(),
        customerApi.getAll(),
        licenseApi.getAll(),
        licenseApi.getExpiringSoon()
      ]);

      setStats({
        products: products.length,
        channels: channels.length,
        customers: customers.length,
        licenses: licenses.length,
      });

      setExpiringSoonLicenses(expiring);

      // 生成最近活动数据
      const activities = [
        ...products.slice(0, 3).map((p: Product) => ({
          key: `product-${p.id}`,
          type: '产品',
          action: '新增产品',
          target: p.name,
          time: new Date(p.created_at).toLocaleString(),
          color: 'blue'
        })),
        ...customers.slice(0, 3).map((c: Customer) => ({
          key: `customer-${c.id}`,
          type: '客户',
          action: '新增客户',
          target: c.name,
          time: new Date(c.created_at).toLocaleString(),
          color: 'green'
        })),
        ...channels.slice(0, 2).map((ch: Channel) => ({
          key: `channel-${ch.id}`,
          type: '渠道',
          action: '新增渠道',
          target: ch.name,
          time: new Date(ch.created_at).toLocaleString(),
          color: 'orange'
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

      setRecentActivities(activities);
    } catch (error) {
      console.error('加载控制台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statisticCards = [
    {
      title: '产品总数',
      value: stats.products,
      icon: <Package size={24} />,
      color: '#1890ff',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: '渠道总数',
      value: stats.channels,
      icon: <Users size={24} />,
      color: '#52c41a',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      title: '客户总数',
      value: stats.customers,
      icon: <UserCheck size={24} />,
      color: '#fa8c16',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: '许可总数',
      value: stats.licenses,
      icon: <FileText size={24} />,
      color: '#722ed1',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  const activityColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: any) => (
        <Tag color={record.color}>{type}</Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  const licenseColumns = [
    {
      title: '客户名称',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '许可对象',
      dataIndex: 'license_object',
      key: 'license_object',
      ellipsis: true,
    },
    {
      title: '到期时间',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => {
        const endDate = new Date(date);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <span style={{ 
            color: daysLeft <= 7 ? '#ff4d4f' : daysLeft <= 30 ? '#faad14' : '#52c41a' 
          }}>
            {date} ({daysLeft}天)
          </span>
        );
      },
    },
    {
      title: '有效点数',
      dataIndex: 'valid_points',
      key: 'valid_points',
      render: (points: number) => (
        <Statistic 
          value={points} 
          valueStyle={{ fontSize: 14 }}
          suffix="点"
        />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">控制台</h1>
        <p className="page-description">系统总览和关键指标监控</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statisticCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className="dashboard-card"
              style={{
                background: card.background,
                border: 'none',
                color: 'white',
                textAlign: 'center'
              }}
              loading={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {card.icon}
              </div>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>{card.title}</span>}
                value={card.value}
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                prefix={<TrendingUp size={20} />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近活动 */}
        <Col xs={24} lg={14}>
          <Card
            title="最近活动"
            className="dashboard-card"
            loading={loading}
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无活动记录' }}
            />
          </Card>
        </Col>

        {/* 即将到期的许可 */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <AlertTriangle size={16} style={{ marginRight: 8, color: '#faad14' }} />
                即将到期的许可
              </span>
            }
            className="dashboard-card"
            loading={loading}
          >
            {expiringSoonLicenses.length > 0 ? (
              <>
                <Alert
                  message={`有 ${expiringSoonLicenses.length} 个许可即将在30天内到期`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={licenseColumns}
                  dataSource={expiringSoonLicenses.slice(0, 5)}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </>
            ) : (
              <div className="empty-state">
                <AlertTriangle size={48} style={{ color: '#d9d9d9', marginBottom: 16 }} />
                <p>没有即将到期的许可</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;