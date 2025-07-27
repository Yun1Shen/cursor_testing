import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard,
  Package,
  Users,
  UserCheck,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <Dashboard size={18} />,
      label: '控制台',
    },
    {
      key: '/products',
      icon: <Package size={18} />,
      label: '产品管理',
    },
    {
      key: '/channels',
      icon: <Users size={18} />,
      label: '渠道管理',
    },
    {
      key: '/customers',
      icon: <UserCheck size={18} />,
      label: '客户管理',
    },
    {
      key: '/licenses',
      icon: <FileText size={18} />,
      label: '许可管理',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={240}
      theme="light"
      style={{
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        borderRight: '1px solid #f0f0f0',
      }}
      trigger={
        <div style={{ 
          textAlign: 'center', 
          padding: '12px 0',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </div>
      }
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        fontWeight: 'bold',
        fontSize: collapsed ? 16 : 18,
        color: '#1890ff'
      }}>
        {collapsed ? 'CMS' : '客户管理系统'}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          paddingTop: 16,
        }}
        theme="light"
      />
    </Sider>
  );
};

export default Sidebar;