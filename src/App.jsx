import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Form, Input, Button, DatePicker, TimePicker, 
  Select, message, Card, Table, Tag, Row, Col, Space
} from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 1. Configure Supabase
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

const SalesEntryForm = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // Store data list from DB
  const [tableLoading, setTableLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record) => record.id === editingKey;

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

  const handleContactChange = (e, targetForm = form) => {
    const formatted = formatPhoneNumber(e.target.value);
    targetForm.setFieldsValue({ contact_number: formatted });
  };

  // --- Full Row Edit Logic ---
  const edit = (record) => {
    editForm.setFieldsValue({
      ...record,
      date_of_buy: record.date_of_buy ? dayjs(record.date_of_buy) : null,
      date_delivery: record.date_delivery ? dayjs(record.date_delivery) : null,
      delivery_time: record.delivery_time ? dayjs(record.delivery_time, 'HH:mm:ss') : null,
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (id) => {
    try {
      const row = await editForm.validateFields();
      const dataToUpdate = {
        ...row,
        date_of_buy: row.date_of_buy?.format('YYYY-MM-DD'),
        date_delivery: row.date_delivery?.format('YYYY-MM-DD'),
        delivery_time: row.delivery_time?.format('HH:mm:ss'),
      };

      const { error } = await supabase
        .from('sales_records')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;
      message.success('Record updated successfully');
      setEditingKey('');
      fetchData();
    } catch (err) {
      message.error('Save failed: ' + err.message);
    }
  };

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
      // Reset specific defaults
      form.setFieldsValue({
        annual_year: dayjs().year().toString(),
        year: dayjs().year().toString(),
        result: 'N/A',
        benefit: 'N/A',
        benefit_qty: 1,
        type: 'Buy'
      });
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
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="annual_year" style={{ margin: 0 }} rules={[{ required: true }]}>
          <Select options={annualYearOptions} size="small" style={{ width: 80 }} />
        </Form.Item>
      ) : <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type',
      render: (type, record) => isEditing(record) ? (
        <Form.Item name="type" style={{ margin: 0 }} rules={[{ required: true }]}>
          <Select options={[
            { value: 'Buy', label: 'Buy' },
            { value: 'Delivery', label: 'Delivery' },
            { value: 'Delivered', label: 'Delivered' },
          ]} size="small" style={{ width: 90 }} />
        </Form.Item>
      ) : (
        <Tag color={type === 'Delivered' ? 'green' : type === 'Buy' ? 'orange' : 'blue'}>{type || 'N/A'}</Tag>
      )
    },
    { 
      title: 'Condition', 
      dataIndex: 'car_type', 
      key: 'car_type',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="car_type" style={{ margin: 0 }}>
          <Select options={[{value:'New', label:'New'}, {value:'Used', label:'Used'}]} size="small" style={{ width: 80 }} />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Stock#', 
      dataIndex: 'stock_number', 
      key: 'stock_number',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="stock_number" style={{ margin: 0 }} rules={[{ required: true }]}>
          <Input size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Customer Name', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="name" style={{ margin: 0 }} rules={[{ required: true }]}>
          <Input size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Contact', 
      dataIndex: 'contact_number', 
      key: 'contact_number',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="contact_number" style={{ margin: 0 }}>
          <Input size="small" onChange={(e) => handleContactChange(e, editForm)} />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Year', 
      dataIndex: 'year', 
      key: 'year',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="year" style={{ margin: 0 }}>
          <Select options={yearOptions} size="small" style={{ width: 80 }} />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Brand', 
      dataIndex: 'brand', 
      key: 'brand',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="brand" style={{ margin: 0 }}><Input size="small" /></Form.Item>
      ) : text
    },
    { 
      title: 'Model', 
      dataIndex: 'model', 
      key: 'model',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="model" style={{ margin: 0 }}><Input size="small" /></Form.Item>
      ) : text
    },
    { 
      title: 'Color', 
      dataIndex: 'color', 
      key: 'color',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="color" style={{ margin: 0 }}><Input size="small" /></Form.Item>
      ) : text
    },
    { 
      title: 'Purchase Date', 
      dataIndex: 'date_of_buy', 
      key: 'date_of_buy',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="date_of_buy" style={{ margin: 0 }}>
          <DatePicker size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Delivery Date', 
      dataIndex: 'date_delivery', 
      key: 'date_delivery',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="date_delivery" style={{ margin: 0 }}>
          <DatePicker size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Delivery Time', 
      dataIndex: 'delivery_time', 
      key: 'delivery_time',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="delivery_time" style={{ margin: 0 }}>
          <TimePicker format="HH:mm" size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Status', 
      dataIndex: 'result', 
      key: 'result',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="result" style={{ margin: 0 }}>
          <Select options={[
            { value: 'N/A', label: 'N/A' },
            { value: 'Gas Full', label: 'Gas Full' },
            { value: 'Cleaned', label: 'Cleaned' },
            { value: 'Delivered', label: 'Delivered' },
          ]} size="small" style={{ width: 100 }} />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Benefit', 
      dataIndex: 'benefit', 
      key: 'benefit',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="benefit" style={{ margin: 0 }}>
          <Select options={[
            { value: 'N/A', label: 'N/A' },
            { value: 'All season mat', label: 'All season mat' },
            { value: 'Trunk tray', label: 'Trunk tray' },
            { value: 'Oil change service', label: 'Oil change service' },
          ]} size="small" style={{ width: 120 }} />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Qty', 
      dataIndex: 'benefit_qty', 
      key: 'benefit_qty',
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="benefit_qty" style={{ margin: 0 }}>
          <Select options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))} size="small" />
        </Form.Item>
      ) : text
    },
    { 
      title: 'Remarks', 
      dataIndex: 'part_incentive', 
      key: 'part_incentive', 
      width: 200,
      render: (text, record) => isEditing(record) ? (
        <Form.Item name="part_incentive" style={{ margin: 0 }}><Input size="small" /></Form.Item>
      ) : text
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      className: 'no-print',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button type="primary" size="small" onClick={() => save(record.id)}>Save</Button>
            <Button size="small" onClick={cancel}>Cancel</Button>
          </Space>
        ) : (
          <Button disabled={editingKey !== ''} size="small" onClick={() => edit(record)}>
            Edit
          </Button>
        );
      },
    },
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
          initialValues={{ 
            annual_year: dayjs().year().toString(), 
            car_type: 'New',
            year: dayjs().year().toString(),
            result: 'N/A',
            benefit: 'N/A',
            benefit_qty: 1,
            type: 'Buy'
          }}
          size="middle"
        >
          <Row gutter={16}>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="annual_year" label="Annual" rules={[{ required: true }]}>
                <Select options={annualYearOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6} md={3}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Buy', label: 'Buy' },
                  { value: 'Delivery', label: 'Delivery' },
                  { value: 'Delivered', label: 'Delivered' },
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
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="contact_number" label="Contact">
                <Input placeholder="(604) 783-6903" onChange={(e) => handleContactChange(e, form)} />
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
                <Select options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() }))} />
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
        extra={
          <Button 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()}
            className="no-print"
          >
            Print List
          </Button>
        }
        variant="outlined" 
        styles={{ body: { padding: 0 } }}
        style={{ width: '100%' }}
      >
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Form form={editForm} component={false}>
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
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default SalesEntryForm;