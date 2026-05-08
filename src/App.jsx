import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Form, Input, Button, DatePicker, TimePicker, 
  Select, message, Card, Table, Tag, Row, Col
} from 'antd';
import dayjs from 'dayjs';

// 1. Configure Supabase
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

const SalesEntryForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // Store data list from DB
  const [tableLoading, setTableLoading] = useState(false);

  // --- Generate Year Options ---
  const annualYearOptions = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => {
    const year = 2024 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const yearOptions = Array.from({ length: 2030 - 1900 + 1 }, (_, i) => {
    const year = 1900 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // --- Fetch Data Function ---
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSubmit = {
        ...values,
        date_of_buy: values.date_of_buy?.format('YYYY-MM-DD'),
        date_delivery: values.date_delivery?.format('YYYY-MM-DD'),
        delivery_time: values.delivery_time?.format('HH:mm:ss'),
      };

      const { error } = await supabase
        .from('sales_records')
        .insert([dataToSubmit]);

      if (error) throw error;

      message.success('Data successfully synced to system!');
      form.resetFields();
      fetchData(); 
      
    } catch (error) {
      message.error('Submission failed: ' + error.message);
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
    { title: 'Remarks', dataIndex: 'part_incentive', key: 'part_incentive', width: 200 },
  ];

  return (
    <div style={{ padding: '8px', background: '#f0f2f5', minHeight: '100vh', width: '100%' }}>
      {/* Top Section: Entry Form */}
      <Card 
        title="Sales Entry" 
        variant="outlined"
        style={{ marginBottom: '8px', width: '100%' }}
        styles={{ body: { background: '#f0f2f5' } }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          initialValues={{ annual_year: '2025', car_type: 'New' }}
          size="middle"
        >
          <Row gutter={16}>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="annual_year" label="Annual" rules={[{ required: true }]}>
                <Select options={annualYearOptions} />
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
            <Col xs={24} sm={24} md={8}>
              <Form.Item name="name" label="Customer Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Ming Lo Kim" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="contact_number" label="Contact">
                <Input placeholder="(604) 783-6903" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={12} sm={6} md={3}>
              <Form.Item name="year" label="Year">
                <Select options={yearOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
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
            <Col xs={24} sm={8} md={3}>
              <Form.Item name="date_of_buy" label="Buy Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={3}>
              <Form.Item name="date_delivery" label="Deliv. Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Form.Item name="delivery_time" label="Deliv. Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="result" label="Status">
                <Select placeholder="Select Status" options={[
                  { value: 'Gas Full', label: 'Gas Full' },
                  { value: 'Cleaned', label: 'Cleaned' },
                  { value: 'Delivered', label: 'Delivered' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="benefit" label="Benefit">
                <Select placeholder="Select Benefit" options={[
                  { value: 'All season mat', label: 'All season mat' },
                  { value: 'Trunk tray', label: 'Trunk tray' },
                  { value: 'Oil change service', label: 'Oil change service' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item name="part_incentive" label="Remarks">
                <Input placeholder="e.g. Mention 2 oil changes to manager..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Submit Record
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Bottom Section: Data Table with horizontal scroll and sticky header */}
      <Card 
        title="Recent Records" 
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
    </div>
  );
};

export default SalesEntryForm;