import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Form, Input, Button, DatePicker, TimePicker, 
  Select, InputNumber, message, Card, Space, Table, Tag 
} from 'antd';
import dayjs from 'dayjs';

// 1. 配置 Supabase
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

const SalesEntryForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // 存放从数据库读取的数据列表
  const [tableLoading, setTableLoading] = useState(false);

  // --- 新增：从数据库获取数据的函数 ---
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_records')
        .select('*')
        .order('created_at', { ascending: false }); // 最新的排在最前面

      if (error) throw error;
      setDataList(data);
    } catch (error) {
      message.error('获取列表失败: ' + error.message);
    } finally {
      setTableLoading(false);
    }
  };

  // --- 新增：初始化页面时读取数据 ---
  useEffect(() => {
    fetchData();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 格式化日期和时间
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
      
      // --- 新增：提交成功后立即刷新列表 ---
      fetchData(); 
      
    } catch (error) {
      message.error('提交失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 新增：定义表格的列结构 ---
  const columns = [
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (text) => <Tag color={text === 'Delivered' ? 'green' : 'blue'}>{text}</Tag>
    },
    { title: 'Stock#', dataIndex: 'stock_number', key: 'stock_number' },
    { title: '客户姓名', dataIndex: 'name', key: 'name' },
    { title: '品牌/型号', key: 'car', render: (record) => `${record.brand || ''} ${record.model || ''}` },
    { title: '交付日期', dataIndex: 'date_delivery', key: 'date_delivery' },
    { title: '状态', dataIndex: 'result', key: 'result' },
  ];

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ display: 'flex', maxWidth: 1000, margin: '0 auto' }}>
        
        {/* 上部分：录入表单 */}
        <Card title="汽车销售/交付信息录入" variant="outlined">
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish}
            initialValues={{ type: 'Delivery', car_type: 'New' }}
          >
            {/* 第一行：基本分类 */}
            <Space size="large" wrap>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={[{value:'Delivery', label:'Delivery'}, {value:'Delivered', label:'Delivered'}]} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="car_type" label="车况" rules={[{ required: true }]}>
                <Select options={[{value:'New', label:'New'}, {value:'Used', label:'Used'}]} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="stock_number" label="Stock#" rules={[{ required: true }]}>
                <Input placeholder="H25XXX" />
              </Form.Item>
            </Space>

            {/* 第二行：客户信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Form.Item name="name" label="客户姓名" rules={[{ required: true }]}>
                <Input placeholder="例如: Ming Lo Kim" />
              </Form.Item>
              <Form.Item name="contact_number" label="联系电话">
                <Input placeholder="(604) 783-6903" />
              </Form.Item>
            </div>

            {/* 第三行：车辆信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <Form.Item name="year" label="年份">
                <InputNumber placeholder="2025" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="Honda" />
              </Form.Item>
              <Form.Item name="model" label="型号">
                <Input placeholder="Civic" />
              </Form.Item>
              <Form.Item name="color" label="颜色">
                <Input placeholder="Red" />
              </Form.Item>
            </div>

            {/* 第四行：时间相关 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <Form.Item name="date_of_buy" label="购买日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="date_delivery" label="交付日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="delivery_time" label="交付时间">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="result" label="结果/状态 (Result)">
              <Input placeholder="Done / 已预约..." />
            </Form.Item>

            <Form.Item name="benefit" label="福利 (Benefit)">
              <Input.TextArea rows={2} placeholder="Gas Full / Half Half..." />
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

        {/* 下部分：数据列表展示 */}
        <Card title="最近录入记录" variant="outlined">
          <Table 
            dataSource={dataList} 
            columns={columns} 
            rowKey={(record, index) => record.id || index} 
            loading={tableLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }} // 适配小屏幕滚动
          />
        </Card>

      </Space>
    </div>
  );
};

export default SalesEntryForm;