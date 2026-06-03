import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Card, Table, Tag, Space, Popconfirm, Select, message
} from 'antd';
import { 
  PrinterOutlined, EditOutlined, PlusOutlined, 
  SaveOutlined, CloseOutlined, DeleteOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber } from '../utils/formatters';

const SalesRecords = ({ isDarkMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]); // Store data list from DB
  const [tableLoading, setTableLoading] = useState(false);
  
  // --- New State for Form Reuse ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- Filter State ---
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [selectedMonth, setSelectedMonth] = useState((dayjs().month() + 1).toString());

  // --- UI Constants for Refactoring ---
  const inputClasses = `h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`;
  const selectClasses = `${inputClasses} pr-8`;
  const labelClasses = "text-[11px] font-semibold text-slate-500 ml-1 uppercase tracking-wider";
  const fieldWrapperClasses = "flex flex-col gap-1";

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
      date_of_buy: record.date_of_buy || null,
      date_delivery: record.date_delivery || null,
      delivery_time: record.delivery_time || null,
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
      benefit_qty: 0,
      type: 'Buy',
      car_type: 'New',
      date_of_buy: null,
      date_delivery: null,
      delivery_time: null
    });
  };

  // --- Generate Options ---
  const annualYearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    ...Array.from({ length: 2050 - 2027 + 1 }, (_, i) => {
      const year = 2027 + i;
      return { value: year.toString(), label: year.toString() };
    })
  ];

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
      setDataList(data || []);
    } catch (error) {
      message.error('Failed to fetch list: ' + error.message);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Dynamic Filtering Logic (Based on Delivery Date) ---
  const filteredData = dataList.filter(item => {
    // Rule: Always show records with no delivery date (Pending deals)
    if (!item.date_delivery) return true;
    
    // If "All" is selected for both, show everything
    if (selectedYear === 'all' && selectedMonth === 'all') return true;
    
    // Otherwise, check if delivery date matches filters
    const deliveryDate = dayjs(item.date_delivery);
    const yearMatch = selectedYear === 'all' || deliveryDate.year().toString() === selectedYear;
    const monthMatch = selectedMonth === 'all' || (deliveryDate.month() + 1).toString() === selectedMonth;
    
    return yearMatch && monthMatch;
  });

  // --- Real-time Stats Calculation (Strict Rule) ---
  const totalCars = filteredData.filter(item => {
    if (!item.date_delivery || item.result !== 'Delivered') return false;
    
    const deliveryDate = dayjs(item.date_delivery);
    const yearMatch = selectedYear === 'all' || deliveryDate.year().toString() === selectedYear;
    const monthMatch = selectedMonth === 'all' || (deliveryDate.month() + 1).toString() === selectedMonth;
    
    return yearMatch && monthMatch;
  }).length;

  // --- Export Excel Logic ---
  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
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
    try {
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
        date_of_buy: values.date_of_buy ? (dayjs.isDayjs(values.date_of_buy) ? values.date_of_buy.format('YYYY-MM-DD') : values.date_of_buy) : null,
        date_delivery: values.date_delivery ? (dayjs.isDayjs(values.date_delivery) ? values.date_delivery.format('YYYY-MM-DD') : values.date_delivery) : null,
        delivery_time: values.delivery_time ? (dayjs.isDayjs(values.delivery_time) ? values.delivery_time.format('HH:mm:ss') : values.delivery_time) : null,
        result: values.result,
        benefit: values.benefit,
        benefit_qty: parseInt(values.benefit_qty || 0),
        part_incentive: values.part_incentive,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('sales_records')
          .update(dataToSubmit)
          .eq('id', editingId);
        
        if (error) throw error;
        message.success('Record updated successfully!');
      } else {
        const { error } = await supabase
          .from('sales_records')
          .insert([dataToSubmit]);
        
        if (error) throw error;
        message.success('New record added successfully!');
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
          else color = 'green';
        } else if (typeValue === 'Buy') {
          color = 'orange';
        }
        return <Tag color={color}>{typeValue}</Tag>;
      }
    },
    { title: 'Condition', dataIndex: 'car_type', key: 'car_type' },
    { 
      title: 'Stock#', 
      dataIndex: 'stock_number', 
      key: 'stock_number',
      render: (text, record) => (
        <span style={record.result === 'Canceled' ? { textDecoration: 'line-through', color: 'red' } : {}}>
          {text}
        </span>
      )
    },
    { title: 'Customer Name', dataIndex: 'name', key: 'name' },
    { title: 'Contact', dataIndex: 'contact_number', key: 'contact_number' },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Color', dataIndex: 'color', key: 'color' },
    { title: 'Purchase Date', dataIndex: 'date_of_buy', key: 'date_of_buy' },
    { title: 'Delivery Date', dataIndex: 'date_delivery', key: 'date_delivery' },
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
          />
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
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
        {/* Page Title & Header Stats */}
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

          {/* Dynamic Stats Badge - Positioned at far right */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border ${
            isDarkMode 
              ? 'bg-blue-900/30 text-blue-300 border-blue-800' 
              : 'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
            <span>📊 Total Sold: <span className="text-lg">{totalCars}</span> Units</span>
          </div>
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
            type: 'Buy',
            car_type: 'New',
            year: dayjs().year().toString(),
            result: 'N/A',
            benefit: 'N/A',
            benefit_qty: 0,
          }}
          size="small"
        >
          <div className="flex flex-wrap items-end gap-3 mb-6">
            {/* Annual */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Annual</label>
              <Form.Item name="annual_year" rules={[{ required: true }]} noStyle>
                <select className={`${selectClasses} w-24`}>
                  {annualYearOptions.filter(opt => opt.value !== 'all').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Form.Item>
            </div>

            {/* Month */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Month</label>
              <Form.Item name="month" rules={[{ required: true }]} noStyle>
                <select className={`${selectClasses} w-24`}>
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Form.Item>
            </div>

            {/* Type */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Type</label>
              <Form.Item name="type" rules={[{ required: true }]} noStyle>
                <select className={`${selectClasses} w-24`}>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </Form.Item>
            </div>

            {/* Condition */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Condition</label>
              <Form.Item name="car_type" rules={[{ required: true }]} noStyle>
                <select className={`${selectClasses} w-24`}>
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </Form.Item>
            </div>

            {/* Stock# */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Stock#</label>
              <Form.Item name="stock_number" rules={[{ required: true }]} noStyle>
                <input type="text" className={`${inputClasses} w-28`} placeholder="H25XXX" />
              </Form.Item>
            </div>

            {/* Customer Name */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Customer Name</label>
              <Form.Item name="name" rules={[{ required: true }]} noStyle>
                <input type="text" className={`${inputClasses} w-44`} placeholder="e.g. Ming Lo Kim" />
              </Form.Item>
            </div>

            {/* Contact */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Contact</label>
              <Form.Item name="contact_number" noStyle>
                <input type="text" className={`${inputClasses} w-36`} placeholder="(604) 783-6903" onChange={handleContactChange} />
              </Form.Item>
            </div>

            {/* Year */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Year</label>
              <Form.Item name="year" noStyle>
                <select className={`${selectClasses} w-24`}>
                  {yearOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Form.Item>
            </div>

            {/* Brand */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Brand</label>
              <Form.Item name="brand" noStyle>
                <input type="text" className={`${inputClasses} w-28`} placeholder="Honda" />
              </Form.Item>
            </div>

            {/* Model */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Model</label>
              <Form.Item name="model" noStyle>
                <input type="text" className={`${inputClasses} w-28`} placeholder="Civic" />
              </Form.Item>
            </div>

            {/* Color */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Color</label>
              <Form.Item name="color" noStyle>
                <input type="text" className={`${inputClasses} w-24`} placeholder="Red" />
              </Form.Item>
            </div>

            {/* Buy Date */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Buy Date</label>
              <Form.Item name="date_of_buy" noStyle>
                <input type="date" className={`${inputClasses} w-36`} />
              </Form.Item>
            </div>

            {/* Deliv. Date */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Deliv. Date</label>
              <Form.Item name="date_delivery" noStyle>
                <input type="date" className={`${inputClasses} w-36`} />
              </Form.Item>
            </div>

            {/* Deliv. Time */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Deliv. Time</label>
              <Form.Item name="delivery_time" noStyle>
                <input type="time" className={`${inputClasses} w-28`} />
              </Form.Item>
            </div>

            {/* Status */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Status</label>
              <Form.Item name="result" noStyle>
                <select className={`${selectClasses} w-32`}>
                  <option value="N/A">N/A</option>
                  <option value="Gas Full">Gas Full</option>
                  <option value="Cleaned">Cleaned</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </Form.Item>
            </div>

            {/* Benefit */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Benefit</label>
              <Form.Item name="benefit" noStyle>
                <select className={`${selectClasses} w-44`}>
                  <option value="N/A">N/A</option>
                  <option value="All season mat">All season mat</option>
                  <option value="Trunk tray">Trunk tray</option>
                  <option value="Oil change service">Oil change service</option>
                </select>
              </Form.Item>
            </div>

            {/* Benefit Qty */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Qty</label>
              <Form.Item name="benefit_qty" noStyle>
                <select className={`${selectClasses} w-20`}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </Form.Item>
            </div>

            {/* Remarks */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Remarks</label>
              <Form.Item name="part_incentive" noStyle>
                <input type="text" className={`${inputClasses} w-48`} placeholder="Notes..." />
              </Form.Item>
            </div>
          </div>

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
          <div className="flex items-center gap-3 no-print">
            {/* Filter Group */}
            <Select 
              value={selectedYear} 
              onChange={setSelectedYear}
              style={{ width: 110 }}
              options={annualYearOptions}
              placeholder="Year"
            />
            <Select 
              value={selectedMonth} 
              onChange={setSelectedMonth}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Months' },
                ...monthOptions
              ]}
              placeholder="Month"
            />
            
            <Space>
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
          </div>
        }
        variant="outlined" 
        styles={{ body: { padding: 0 } }}
        style={{ width: '100%' }}
      >
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table 
            dataSource={filteredData} 
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

export default SalesRecords;
