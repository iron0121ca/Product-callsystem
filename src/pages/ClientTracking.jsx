import React, { useState, useEffect } from 'react';
import {
  Form, Button, Card, Table, Tag, Space, Popconfirm, Select, message, Input
} from 'antd';
import {
  EditOutlined, PlusOutlined,
  SaveOutlined, CloseOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber } from '../utils/formatters';

const CONDITION_OPTIONS = ['New', 'Used', 'Any'];
const LIEN_OPTIONS = ['Cash', 'Lease', 'Finance'];
const STATUS_OPTIONS = ['In progress', 'Contacted', 'Appointment', 'Sold', 'Lost', 'Cancelled'];

const ClientTracking = ({ isDarkMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- UI Constants (matching SalesRecords) ---
  const labelClasses = "text-[11px] font-semibold text-slate-500 ml-1 uppercase tracking-wider";
  const fieldWrapperClasses = "flex flex-col gap-1";

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setFieldsValue({ phone_number: formatted });
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('following_customers')
        .select('*')
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

  // --- Edit Mode Trigger ---
  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingId(record.id);

    form.setFieldsValue({
      first_name: record.first_name || '',
      last_name: record.last_name || '',
      phone_number: record.phone_number || '',
      email: record.email || '',
      desired_vehicle: record.desired_vehicle || '',
      condition: record.condition || 'Any',
      budget_amount: record.budget_amount || '',
      currently_vehicle: record.currently_vehicle || '',
      lien: record.lien || 'Cash',
      status: record.status || 'In progress',
      appointment_date: record.appointment_date || null,
      lead_following: record.lead_following || null,
      memo: record.memo || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    form.resetFields();
    // Restore defaults
    form.setFieldsValue({
      condition: 'Any',
      lien: 'Cash',
      status: 'In progress',
      lead_following: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    });
  };

  // --- Delete Logic ---
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('following_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Record deleted successfully');
      await fetchData();
    } catch (err) {
      message.error('Delete failed: ' + err.message);
    }
  };

  // --- Submit ---
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSubmit = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone_number: values.phone_number,
        email: values.email,
        desired_vehicle: values.desired_vehicle,
        condition: values.condition,
        budget_amount: values.budget_amount,
        currently_vehicle: values.currently_vehicle,
        lien: values.lien,
        status: values.status,
        appointment_date: values.appointment_date || null,
        lead_following: values.lead_following || null,
        memo: values.memo,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('following_customers')
          .update(dataToSubmit)
          .eq('id', editingId);

        if (error) throw error;
        message.success('Record updated successfully!');
      } else {
        const { error } = await supabase
          .from('following_customers')
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

  // --- Table Columns ---
  const columns = [
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (text) => (
        <span className="text-xs">
          {text ? dayjs(text).format('MMM DD, HH:mm') : '-'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const isLost = status === 'Lost';
        const isCancelled = status === 'Cancelled';
        const isSold = status === 'Sold';
        const isAppt = status === 'Appointment';
        const isContacted = status === 'Contacted';

        let color;
        if (isLost) color = 'default';
        else if (isCancelled) color = 'red';
        else if (isSold) color = 'green';
        else if (isAppt) color = 'purple';
        else if (isContacted) color = 'orange';
        else color = 'blue';

        return (
          <Tag color={color} className="font-bold uppercase text-[10px]">
            {status || 'In progress'}
          </Tag>
        );
      }
    },
    {
      title: 'Name',
      key: 'name',
      width: 160,
      render: (_, record) => {
        const isLost = record.status === 'Lost';
        const isCancelled = record.status === 'Cancelled';
        const nameText = `${record.first_name} ${record.last_name}`;

        return (
          <span className={isLost ? 'line-through decoration-red-500 decoration-2' : ''}>
            {nameText}
          </span>
        );
      }
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 180,
      render: (_, record) => {
        const isLost = record.status === 'Lost';
        const isCancelled = record.status === 'Cancelled';
        return (
          <div className={isLost ? 'line-through decoration-red-500 decoration-2' : ''}>
            <div>{record.phone_number}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        );
      }
    },
    {
      title: 'Desired Vehicle',
      key: 'desired_vehicle',
      width: 180,
      render: (_, record) => {
        const isLost = record.status === 'Lost';
        const isCancelled = record.status === 'Cancelled';
        const condColor = record.condition === 'New' ? 'blue' : 'green';
        return (
          <div className={isLost ? 'line-through decoration-red-500 decoration-2 grayscale opacity-50' : ''}>
            <Tag color={condColor} className="text-[10px] font-bold uppercase">
              {record.condition}
            </Tag>
            <span className="font-medium">{record.desired_vehicle}</span>
          </div>
        );
      }
    },
    {
      title: 'Budget & Lien',
      key: 'budget_lien',
      width: 150,
      render: (_, record) => {
        const isLost = record.status === 'Lost';
        const isCancelled = record.status === 'Cancelled';
        const budget = isNaN(record.budget_amount)
          ? record.budget_amount
          : `$${Number(record.budget_amount || 0).toLocaleString()}`;
        return (
          <div className={isLost ? 'line-through decoration-red-500 decoration-2' : ''}>
            <div className="font-semibold">{budget}</div>
            <Tag color="blue" className="text-[10px] font-bold uppercase mt-0.5">
              {record.lien}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Current Car',
      dataIndex: 'currently_vehicle',
      key: 'currently_vehicle',
      width: 130,
      render: (text, record) => {
        const isLost = record.status === 'Lost';
        return (
          <span className={isLost ? 'line-through decoration-red-500 decoration-2' : ''}>
            {text || '-'}
          </span>
        );
      }
    },
    {
      title: 'Appointment',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      width: 120,
      render: (text) => text ? dayjs(text).format('MM/DD/YYYY') : '-'
    },
    {
      title: 'Lead Following',
      dataIndex: 'lead_following',
      key: 'lead_following',
      width: 140,
      render: (text, record) => {
        // Due date check
        const cleanLead = text ? text.split(' ')[0].split('T')[0] : '';
        const todayStr = dayjs().format('YYYY-MM-DD');
        const isLost = record.status === 'Lost';
        const isSold = record.status === 'Sold';
        const isCancelled = record.status === 'Cancelled';
        const isDue = cleanLead && todayStr >= cleanLead && !isLost && !isSold && !isCancelled;

        return (
          <div>
            <Tag color={isDue ? 'red' : 'blue'} className="font-bold">
              {text ? dayjs(text).format('MM/DD/YYYY') : '-'}
            </Tag>
            {isDue && (
              <div className="text-[9px] uppercase font-black text-red-500 mt-0.5 animate-pulse">
                Action Required
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Memo',
      dataIndex: 'memo',
      key: 'memo',
      width: 200,
      render: (text, record) => {
        const isLost = record.status === 'Lost';
        return (
          <span className={`text-xs italic ${isLost ? 'line-through decoration-red-500 decoration-2' : ''}`}>
            {text || '-'}
          </span>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
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
      {/* Page Title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px 8px 8px'
      }}>
        <h2 style={{
          margin: 0,
          color: isDarkMode ? '#fff' : '#000',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: "'Roboto', sans-serif"
        }}>
          {isEditing ? "Edit Client Record" : "Client Tracking"}
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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            condition: 'Any',
            lien: 'Cash',
            status: 'In progress',
            lead_following: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          }}
        >
          <div className="flex flex-wrap items-end gap-3 mb-6">
            {/* First Name */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>First Name</label>
              <Form.Item name="first_name" rules={[{ required: true }]} noStyle>
                <Input className="w-36" placeholder="John" />
              </Form.Item>
            </div>

            {/* Last Name */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Last Name</label>
              <Form.Item name="last_name" rules={[{ required: true }]} noStyle>
                <Input className="w-36" placeholder="Doe" />
              </Form.Item>
            </div>

            {/* Phone Number */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Phone Number</label>
              <Form.Item name="phone_number" noStyle>
                <Input className="w-36" placeholder="(604) 783-6903" onChange={handlePhoneChange} />
              </Form.Item>
            </div>

            {/* Email */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Email</label>
              <Form.Item name="email" noStyle>
                <Input className="w-44" placeholder="john@example.com" />
              </Form.Item>
            </div>

            {/* Desired Vehicle */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Desired Vehicle</label>
              <Form.Item name="desired_vehicle" noStyle>
                <Input className="w-36" placeholder="e.g. Honda" />
              </Form.Item>
            </div>

            {/* Condition */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Condition</label>
              <Form.Item name="condition" noStyle>
                <Select className="w-28">
                  {CONDITION_OPTIONS.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Budget Amount */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Budget Amount</label>
              <Form.Item name="budget_amount" noStyle>
                <Input className="w-36" placeholder="e.g. 25000" />
              </Form.Item>
            </div>

            {/* Currently Vehicle */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Current Vehicle</label>
              <Form.Item name="currently_vehicle" noStyle>
                <Input className="w-40" placeholder="e.g. Toyota Camry" />
              </Form.Item>
            </div>

            {/* Lien */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Lien</label>
              <Form.Item name="lien" noStyle>
                <Select className="w-28">
                  {LIEN_OPTIONS.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Status */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Status</label>
              <Form.Item name="status" noStyle>
                <Select className="w-36">
                  {STATUS_OPTIONS.map(opt => (
                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Appointment Date */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Appt. Date</label>
              <Form.Item name="appointment_date" noStyle>
                <Input type="date" className="w-36" />
              </Form.Item>
            </div>

            {/* Lead Following */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Lead Following</label>
              <Form.Item name="lead_following" noStyle>
                <Input type="date" className="w-36" />
              </Form.Item>
            </div>

            {/* Memo */}
            <div className={fieldWrapperClasses}>
              <label className={labelClasses}>Memo</label>
              <Form.Item name="memo" noStyle>
                <Input className="w-[560px]" placeholder="Additional notes..." />
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
        variant="outlined"
        styles={{ body: { padding: 0 }, header: { textAlign: 'left' } }}
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
            rowKey={(record) => record.id}
            loading={tableLoading}
            pagination={{ pageSize: 20 }}
            size="small"
            bordered
            sticky
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              const cleanLead = record.lead_following ? record.lead_following.split(' ')[0].split('T')[0] : '';
              const todayStr = dayjs().format('YYYY-MM-DD');
              const isLost = record.status === 'Lost';
              const isSold = record.status === 'Sold';
              const isCancelled = record.status === 'Cancelled';
              const isDue = cleanLead && todayStr >= cleanLead && !isLost && !isSold && !isCancelled;

              if (isDue) return isDarkMode ? 'due-row-dark' : 'due-row';
              if (isLost || isCancelled) return isDarkMode ? 'lost-row-dark' : 'lost-row';
              return '';
            }}
          />
        </div>
      </Card>
    </>
  );
};

export default ClientTracking;
