// Sync Verification: v2.0 - Excel Export Integrated
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Form, Input, Button, DatePicker, TimePicker, 
  Select, message, Card, Table, Tag, Row, Col, Space, Popconfirm,
  ConfigProvider, theme, Switch, Menu, Layout
} from 'antd';
import { 
  PrinterOutlined, EditOutlined, PlusOutlined, 
  SaveOutlined, CloseOutlined, DeleteOutlined,
  DownloadOutlined, SunOutlined, MoonOutlined,
  HomeOutlined, UsergroupAddOutlined, UserAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import FollowingSandbox from './FollowingSandbox.jsx';

const { Header, Content } = Layout;

// 1. Configure Supabase
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

const Home = ({ isDarkMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // Store data list from DB
  const [tableLoading, setTableLoading] = useState(false);
  
  // --- New State for Form Reuse ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  // --- Phone Formatting ---
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleContactChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setFieldsValue({ contact_number: formatted });
  };

  // --- Edit Mode Trigger ---
  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record.id);
    
    // Fill form with record data
    form.setFieldsValue({
      ...record,
      annual_year: record.annual_year?.toString(),
      month: record.month?.toString(),
      year: record.year?.toString(),
      date_of_buy: record.date_of_buy ? dayjs(record.date_of_buy) : null,
      date_delivery: record.date_delivery ? dayjs(record.date_delivery) : null,
      delivery_time: record.delivery_time ? dayjs(record.delivery_time, 'HH:mm:ss') : null,
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    form.resetFields();
    // Restore defaults
    form.setFieldsValue({
      annual_year: dayjs().year().toString(),
      month: (dayjs().month() + 1).toString(),
      year: dayjs().year().toString(),
      result: 'N/A',
      benefit: 'N/A',
      benefit_qty: 1,
      type: 'Buy'
    });
  };

  // --- Generate Options ---
  const annualYearOptions = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => {
    const year = 2024 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const yearOptions = Array.from({ length: 2030 - 1900 + 1 }, (_, i) => {
    const year = 1900 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const monthOptions = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, 
    { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' }, 
    { value: '5', label: 'May' }, { value: '6', label: 'Jun' }, 
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, 
    { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' }, 
    { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];

  // --- Fetch Data Function ---
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
        .order('annual_year', { ascending: false })
        .order('month', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDataList(data);
    } catch (error) {
      message.error('Failed to fetch list: ' + error.message);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Export Excel Logic ---
  const handleExportExcel = () => {
    const exportData = dataList.map(item => ({
      'Annual': item.annual_year,
      'Month': item.month,
      'Type': item.type,
      'Condition': item.car_type,
      'StockNo': item.stock_number,
      'CustomerName': item.name,
      'Contact': item.contact_number,
      'Year': item.year,
      'Brand': item.brand,
      'Model': item.model,
      'Color': item.color,
      'PurchaseDate': item.date_of_buy,
      'DeliveryDate': item.date_delivery,
      'DeliveryTime': item.delivery_time,
      'Status': item.result,
      'Benefit': item.benefit,
      'Qty': item.benefit_qty,
      'Remarks': item.part_incentive
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesRecords');
    XLSX.writeFile(workbook, `sales_records_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`);
  };

  // --- Delete Logic ---
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('sales_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Record deleted successfully');
      await fetchData();
    } catch (err) {
      message.error('Delete failed: ' + err.message);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    console.log('Submitting data:', values);
    try {
      // 1. Prepare data with correct types
      const dataToSubmit = {
        annual_year: parseInt(values.annual_year),
        month: parseInt(values.month),
        type: values.type,
        car_type: values.car_type,
        stock_number: values.stock_number,
        name: values.name,
        contact_number: values.contact_number,
        year: parseInt(values.year),
        brand: values.brand,
        model: values.model,
        color: values.color,
        date_of_buy: values.date_of_buy ? values.date_of_buy.format('YYYY-MM-DD') : null,
        date_delivery: values.date_delivery ? values.date_delivery.format('YYYY-MM-DD') : null,
        delivery_time: values.delivery_time ? values.delivery_time.format('HH:mm:ss') : null,
        result: values.result,
        benefit: values.benefit,
        benefit_qty: values.benefit_qty,
        part_incentive: values.part_incentive,
      };

      if (isEditing) {
        console.log('Updating record ID:', editingId);
        const { data, error } = await supabase
          .from('sales_records')
          .update(dataToSubmit)
          .eq('id', editingId)
          .select();
        
        if (error) throw error;
        
        // Optimistic Local State Update
        setDataList(prev => prev.map(item => String(item.id) === String(editingId) ? { ...item, ...dataToSubmit } : item));
        
        message.success('Record updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('sales_records')
          .insert([dataToSubmit])
          .select();
        
        if (error) throw error;
        message.success('New record added successfully!');
        if (data) setDataList(prev => [data[0], ...prev]);
      }

      handleCancelEdit(); 
      await fetchData(); 
      
    } catch (error) {
      console.error('Operation Error:', error);
      message.error('Operation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      title: 'Annual', 
      dataIndex: 'annual_year', 
      key: 'annual_year',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Month', 
      dataIndex: 'month', 
      key: 'month',
      sorter: (a, b) => b.month - a.month,
      render: (value) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = months[parseInt(value) - 1] || 'N/A';
        return <Tag color="cyan">{label}</Tag>;
      }
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type',
      render: (text, record) => {
        const typeValue = text || 'N/A';
        let color = 'default';
        if (typeValue === 'Sell') {
          if (record.result === 'N/A') color = 'red';
          else if (record.result === 'Gas Full') color = 'gold';
          else if (record.result === 'Delivered') color = 'green';
          else color = 'green'; // Default for Sell if not specified above, or keep green as base
        } else if (typeValue === 'Buy') {
          color = 'orange';
        }
        return <Tag color={color}>{typeValue}</Tag>;
      }
    },
    { title: 'Condition', dataIndex: 'car_type', key: 'car_type' },
    { title: 'Stock#', dataIndex: 'stock_number', key: 'stock_number' },
    { title: 'Customer Name', dataIndex: 'name', key: 'name' },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number' },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Color', dataIndex: 'color', key: 'color' },
    { title: 'Purchase Date', dataIndex: 'date_of_buy', key: 'date_of_buy' },
    { title: 'Delivery Date', dataIndex: 'date_delivery', key: 'date_delivery' },
    { title: 'Delivery Time', dataIndex: 'delivery_time', key: 'delivery_time' },
    { title: 'Status', dataIndex: 'result', key: 'result' },
    { title: 'Benefit', dataIndex: 'benefit', key: 'benefit' },
    { title: 'Qty', dataIndex: 'benefit_qty', key: 'benefit_qty' },
    { title: 'Remarks', dataIndex: 'part_incentive', key: 'part_incentive', width: 200 },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      className: 'no-print',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
            disabled={isEditing && editingId === record.id}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this record?"
            description="Are you sure you want to delete this record?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              disabled={isEditing && editingId === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
        {/* Page Title */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 8px 8px 8px' 
        }} className="no-print">
          <h2 style={{ 
            margin: 0, 
            color: isDarkMode ? '#fff' : '#000', 
            fontSize: '24px', 
            fontWeight: 'bold',
            fontFamily: "'Roboto', sans-serif" 
          }}>
            {isEditing ? "Edit Sale Record" : "Sales Entry"}
          </h2>
        </div>

        {/* Top Section: Entry Form */}
        <Card 
          variant="outlined"
          style={{ marginBottom: '8px', width: '100%' }}
          styles={{ 
            body: { 
              background: isDarkMode ? '#141414' : '#f0f2f5',
              padding: '8px 12px' 
            } 
          }}
          className="no-print"
        >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          initialValues={{ 
            annual_year: dayjs().year().toString(), 
            month: (dayjs().month() + 1).toString(),
            car_type: 'New',
            year: dayjs().year().toString(),
            result: 'N/A',
            benefit: 'N/A',
            benefit_qty: 1,
            type: 'Buy'
          }}
          size="small"
        >
          <Row gutter={16}>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="annual_year" label="Annual" rules={[{ required: true }]}>
                <Select options={annualYearOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="month" label="Month" rules={[{ required: true }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Buy', label: 'Buy' },
                  { value: 'Sell', label: 'Sell' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="car_type" label="Condition" rules={[{ required: true }]}>
                <Select options={[{value:'New', label:'New'}, {value:'Used', label:'Used'}]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="stock_number" label="Stock#" rules={[{ required: true }]}>
                <Input placeholder="H25XXX" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={5}>
              <Form.Item name="name" label="Customer Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Ming Lo Kim" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="contact_number" label="Contact">
                <Input placeholder="(604) 783-6903" onChange={handleContactChange} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Item name="year" label="Year">
                <Select options={yearOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Item name="brand" label="Brand">
                <Input placeholder="Honda" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12} md={4}>
              <Form.Item name="model" label="Model">
                <Input placeholder="Civic" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12} md={3}>
              <Form.Item name="color" label="Color">
                <Input placeholder="Red" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={2}>
              <Form.Item name="date_of_buy" label="Buy Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={3}>
              <Form.Item name="date_delivery" label="Deliv. Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8} md={3}>
              <Form.Item name="delivery_time" label="Deliv. Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="result" label="Status">
                <Select placeholder="Select Status" options={[
                  { value: 'N/A', label: 'N/A' },
                  { value: 'Gas Full', label: 'Gas Full' },
                  { value: 'Cleaned', label: 'Cleaned' },
                  { value: 'Delivered', label: 'Delivered' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="benefit" label="Benefit">
                <Select placeholder="Select Benefit" options={[
                  { value: 'N/A', label: 'N/A' },
                  { value: 'All season mat', label: 'All season mat' },
                  { value: 'Trunk tray', label: 'Trunk tray' },
                  { value: 'Oil change service', label: 'Oil change service' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={3}>
              <Form.Item name="benefit_qty" label="Benefit Qty">
                <Select options={Array.from({ length: 11 }, (_, i) => ({ value: i, label: i.toString() }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={9}>
              <Form.Item name="part_incentive" label="Remarks">
                <Input placeholder="e.g. Mention 2 oil changes to manager..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              {!isEditing ? (
                <Button type="primary" htmlType="submit" size="large" icon={<PlusOutlined />} loading={loading} style={{ minWidth: '200px' }}>
                  Submit Record
                </Button>
              ) : (
                <Space>
                  <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading} style={{ minWidth: '150px' }}>
                    Save Changes
                  </Button>
                  <Button size="large" icon={<CloseOutlined />} onClick={handleCancelEdit} style={{ minWidth: '150px' }}>
                    Cancel
                  </Button>
                </Space>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Bottom Section: Data Table */}
      <Card 
        title="Recent Records" 
        extra={
          <Space className="no-print">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={() => window.print()}
            >
              Print List
            </Button>
          </Space>
        }
        variant="outlined" 
        styles={{ body: { padding: 0 } }}
        style={{ width: '100%' }}
      >
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table 
            dataSource={dataList} 
            columns={columns.map(col => ({
              ...col,
              onCell: () => ({
                style: { whiteSpace: 'nowrap' },
              }),
              onHeaderCell: () => ({
                style: { whiteSpace: 'nowrap' },
              }),
            }))} 
            rowKey={(record, index) => record.id || index} 
            loading={tableLoading}
            pagination={{ pageSize: 20 }}
            size="small"
            bordered
            sticky
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Card>
    </>
  );
};

const Navigation = ({ isDarkMode, setIsDarkMode }) => {
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
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
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
    <ConfigProvider theme={{ algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm }}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#000' : '#f0f2f5' }}>
          <Navigation isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <Content style={{ padding: '8px' }}>
            <Routes>
              <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
              <Route path="/following" element={<Following isDarkMode={isDarkMode} />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;ode={setIsDarkMode} />
          <Content style={{ padding: '8px' }}>
            <Routes>
              <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
              <Route path="/following" element={<FollowingSandbox />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;