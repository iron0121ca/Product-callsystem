import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Layout } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppNavigation from './components/AppNavigation';
import SalesRecords from './pages/SalesRecords';
import ClientTracking from './pages/ClientTracking';

import './App.css';

const { Content } = Layout;

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.style.backgroundColor = '#000';
      document.body.style.color = '#fff';
    } else {
      document.body.style.backgroundColor = '#fff';
      document.body.style.color = '#000';
    }
  }, [isDarkMode]);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider theme={{
      algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      token: {
        colorBorderSecondary: isDarkMode ? '#555555' : '#d0d0d0',
      }
    }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#000' : '#f0f2f5' }}>
          <AppNavigation isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <Content style={{ padding: '8px' }}>
            <Routes>
              <Route path="/" element={<SalesRecords isDarkMode={isDarkMode} />} />
              <Route path="/following" element={<ClientTracking isDarkMode={isDarkMode} />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
