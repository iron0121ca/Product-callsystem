import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Form, Input, Button, DatePicker, TimePicker, 
  Select, InputNumber, message, Card, Space, Table, Tag, Row, Col
} from 'antd';
import dayjs from 'dayjs';

// 1. 配置 Supabase
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

const SalesEntryForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // 存放从数据库读取的数据列表
  const [tableLoading, setTableLoading] = useState(false);

  // --- 生成年份选项 ---
  const annualYearOptions = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => {
    const year = 2024 + i;
    return { value: year.toString(), label: `${year}年` };
  });

  const yearOptions = Array.from({ length: 2030 - 1900 + 1 }, (_, i) => {
    const year = 1900 + i;
    return { value: year.toString(), label: `${year}年` };
  });

  // --- 从数据库获取数据的函数 ---
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
      message.error('获取列表失败: ' + error.message);
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

      message.success('数据已成功同步到系统！');
      form.resetFields();
      fetchData(); 
      
    } catch (error) {
      message.error('提交失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      title: '年度', 
      dataIndex: 'annual_year', 
      key: 'annual_year',
      render: (text) => <Tag color="blue">{text}年</Tag>
    },
    { title: 'Stock#', dataIndex: 'stock_number', key: 'stock_number' },
    { title: '客户姓名', dataIndex: 'name', key: 'name' },
    { title: '品牌/型号', key: 'car', render: (record) => `${record.brand || ''} ${record.model || ''}` },
    { title: '交付日期', dataIndex: 'date_delivery', key: 'date_delivery' },
    { title: '状态', dataIndex: 'result', key: 'result' },
  ];

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        {/* 左侧/上方：录入表单 */}
        <Col xs={24} lg={10}>
          <Card 
            title="汽车销售/交付信息录入" 
            variant="outlined"
            styles={{ body: { background: '#f0f2f5' } }}
          >
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinish}
              initialValues={{ annual_year: '2025', car_type: 'New' }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="annual_year" label="年度" rules={[{ required: true }]}>
                    <Select options={annualYearOptions} placeholder="选择年度" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="car_type" label="车况" rules={[{ required: true }]}>
                    <Select options={[{value:'New', label:'New'}, {value:'Used', label:'Used'}]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="stock_number" label="Stock#" rules={[{ required: true }]}>
                    <Input placeholder="H25XXX" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="客户姓名" rules={[{ required: true }]}>
                    <Input placeholder="例如: Ming Lo Kim" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contact_number" label="联系电话">
                    <Input placeholder="(604) 783-6903" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="year" label="年份">
                    <Select options={yearOptions} placeholder="选择年份" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="brand" label="品牌">
                    <Input placeholder="Honda" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="model" label="型号">
                    <Input placeholder="Civic" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="color" label="颜色">
                    <Input placeholder="Red" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="date_of_buy" label="购买日期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="date_delivery" label="交付日期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="delivery_time" label="交付时间">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="result" label="结果/状态 (Result)">
                <Select placeholder="选择状态" options={[
                  { value: '加油', label: '加油' },
                  { value: '清洁', label: '清洁' },
                  { value: '已交付', label: '已交付' },
                ]} />
              </Form.Item>

              <Form.Item name="benefit" label="福利 (Benefit)">
                <Select placeholder="选择福利" options={[
                  { value: 'All season mat', label: 'All season mat' },
                  { value: 'Trunk tray', label: 'Trunk tray' },
                  { value: 'Oil change service', label: 'Oil change service' },
                ]} />
              </Form.Item>

              <Form.Item name="part_incentive" label="备注/交代 (Part Incentive)">
                <Input.TextArea rows={2} placeholder="记得跟经理交代2次机油保养..." />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  提交到后端数据库
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧/下方：数据列表展示 */}
        <Col xs={24} lg={14}>
          <Card title="最近录入记录" variant="outlined">
            <Table 
              dataSource={dataList} 
              columns={columns} 
              rowKey={(record, index) => record.id || index} 
              loading={tableLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SalesEntryForm;