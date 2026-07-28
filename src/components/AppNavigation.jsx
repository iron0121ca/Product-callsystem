import { Layout, Menu, Space, Switch } from 'antd';
import { HomeOutlined, UserAddOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header } = Layout;

export default function AppNavigation({ isDarkMode, setIsDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate('/'),
    },
    {
      key: '/following',
      icon: <UserAddOutlined />,
      label: 'Following',
      onClick: () => navigate('/following'),
    },
  ];

  return (
    <Header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: isDarkMode ? '#141414' : '#fff',
      borderBottom: `1px solid ${isDarkMode ? '#333' : '#f0f0f0'}`,
      height: '48px',
      lineHeight: '48px'
    }} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Menu
          theme={isDarkMode ? 'dark' : 'light'}
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderBottom: 'none', flex: 1, backgroundColor: 'transparent' }}
        />
      </div>
      <Space>
        <Switch
          checked={isDarkMode}
          onChange={(checked) => setIsDarkMode(checked)}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />
        <span style={{ color: isDarkMode ? '#fff' : '#000', fontSize: '12px', marginLeft: '8px' }}>
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      </Space>
    </Header>
  );
}
