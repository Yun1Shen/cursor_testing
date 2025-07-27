import React from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Badge } from 'antd';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <User size={16} />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <Settings size={16} />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout':
        // 处理退出登录
        console.log('退出登录');
        break;
      case 'profile':
        console.log('个人资料');
        break;
      case 'settings':
        console.log('系统设置');
        break;
      default:
        break;
    }
  };

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ flex: 1 }}>
        {/* 这里可以添加面包屑导航或页面标题 */}
      </div>
      
      <Space size="middle">
        <Badge count={3} size="small">
          <Button
            type="text"
            icon={<Bell size={18} />}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              width: 40,
            }}
          />
        </Badge>
        
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          arrow
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Avatar
              size={32}
              style={{
                backgroundColor: '#1890ff',
                marginRight: 8,
              }}
            >
              管
            </Avatar>
            <span style={{ color: '#262626', fontWeight: 500 }}>
              管理员
            </span>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;