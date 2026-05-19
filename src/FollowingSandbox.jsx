import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// --- Supabase Config ---
const supabase = createClient('https://ishyhtympjphqkaieeud.supabase.co', 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5');

// --- Helper: Phone Formatting ---
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

export default function FollowingSandbox({ isDarkMode }) {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    business_name: '',
    phone_number: '',
    email: '',
    vehicle_brand: '',
    condition: 'Any',
    budget_amount: '',
    currently_vehicle: '',
    lien: 'Cash',
    buy_vehicle_date: '',
    lead_following: dayjs().add(3, 'day').format('YYYY-MM-DD')
  });

  // Fetch Data
  const fetchData = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('following_customers')
        .select('*')
        .order('lead_following', { ascending: false });

      if (error) throw error;
      setDataList(data || []);
    } catch (error) {
      console.error('Fetch error:', error.message);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone_number') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('following_customers')
        .insert([formData]);

      if (error) throw error;
      
      // Reset Form
      setFormData({
        first_name: '',
        last_name: '',
        business_name: '',
        phone_number: '',
        email: '',
        vehicle_brand: '',
        condition: 'Any',
        budget_amount: '',
        currently_vehicle: '',
        lien: 'Cash',
        buy_vehicle_date: '',
        lead_following: dayjs().add(3, 'day').format('YYYY-MM-DD')
      });

      await fetchData();
    } catch (error) {
      alert('Operation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-[#000]' : 'bg-[#f0f2f5]',
    card: isDarkMode ? 'bg-[#141414] border-[#333]' : 'bg-white border-gray-200',
    text: isDarkMode ? 'text-[#fff]' : 'text-gray-900',
    label: isDarkMode ? 'text-[#aaa]' : 'text-gray-600',
    input: isDarkMode ? 'bg-[#1f1f1f] border-[#434343] text-[#fff] focus:ring-[#1677ff]' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500',
    tableHeader: isDarkMode ? 'bg-[#1f1f1f] border-[#333] text-[#aaa]' : 'bg-[#fafafa] border-gray-200 text-gray-600',
    tableRow: isDarkMode ? 'hover:bg-[#1f1f1f] border-[#333]' : 'hover:bg-gray-50/50 border-gray-100',
    tableCell: isDarkMode ? 'border-[#333]' : 'border-gray-100',
    secondaryText: isDarkMode ? 'text-[#666]' : 'text-gray-400'
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6 font-sans text-left transition-colors duration-300`}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Client information</h1>
          <p className={`${themeClasses.secondaryText} mt-1`}>Manage and track your potential leads with real-time updates.</p>
        </div>

        {/* Input Form Card */}
        <div className={`${themeClasses.card} rounded-lg border shadow-sm p-6 mb-8`}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Row 1 */}
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>First Name</label>
                <input required name="first_name" value={formData.first_name} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Last Name</label>
                <input required name="last_name" value={formData.last_name} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Business Name</label>
                <input name="business_name" value={formData.business_name} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Phone Number</label>
                <input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} placeholder="(XXX) XXX-XXXX" />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>

              {/* Row 2 */}
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Vehicle Brand</label>
                <input name="vehicle_brand" value={formData.vehicle_brand} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} placeholder="e.g. Honda" />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Condition</label>
                <select name="condition" value={formData.condition} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none text-sm`}>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>New</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Used</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Any</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Budget Amount</label>
                <input type="number" name="budget_amount" value={formData.budget_amount} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Currently Vehicle</label>
                <input name="currently_vehicle" value={formData.currently_vehicle} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Lien</label>
                <select name="lien" value={formData.lien} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none text-sm`}>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Cash</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Lease</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Finance</option>
                </select>
              </div>

              {/* Row 3 - Dates and Submit */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Buy Vehicle Date</label>
                  <input type="date" name="buy_vehicle_date" value={formData.buy_vehicle_date} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold ${isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'} mb-1 uppercase tracking-wider`}>Lead Following</label>
                  <input type="date" name="lead_following" value={formData.lead_following} onChange={handleInputChange} className={`w-full px-3 py-2 ${isDarkMode ? 'bg-[#111b26] border-[#153450] text-[#fff]' : 'bg-blue-50/50 border-blue-200 text-gray-900'} border rounded outline-none transition-all text-sm`} />
                </div>
              </div>

              <div className="lg:col-span-3 flex items-end justify-end">
                <button type="submit" disabled={loading} className={`px-10 py-2.5 ${isDarkMode ? 'bg-[#177ddc] hover:bg-[#3c9ae8]' : 'bg-[#1677ff] hover:bg-[#4096ff]'} text-white rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50`}>
                  {loading ? 'Submitting...' : 'Submit Record'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Data Table Card */}
        <div className={`${themeClasses.card} rounded-lg border shadow-sm overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-100'} flex justify-between items-center`}>
            <h2 className={`text-lg font-bold ${themeClasses.text}`}>Recent Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className={`${themeClasses.tableHeader} border-b font-semibold uppercase tracking-wider text-[11px]`}>
                <tr>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Name & Business</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Contact</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Desired Vehicle</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Budget & Lien</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Current Car</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Buy Date</th>
                  <th className="px-4 py-3">Lead Following</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-[#333]' : 'divide-gray-100'}`}>
                {tableLoading ? (
                  <tr><td colSpan="7" className={`text-center py-10 ${themeClasses.secondaryText}`}>Loading leads...</td></tr>
                ) : dataList.length === 0 ? (
                  <tr><td colSpan="7" className={`text-center py-10 ${themeClasses.secondaryText}`}>No records found.</td></tr>
                ) : (
                  dataList.map((item) => (
                    <tr key={item.id} className={`${themeClasses.tableRow} transition-colors`}>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                        <div className={`font-bold ${themeClasses.text}`}>{item.first_name} {item.last_name}</div>
                        <div className={`${themeClasses.secondaryText} text-xs`}>{item.business_name || '-'}</div>
                      </td>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                        <div className={isDarkMode ? 'text-[#fff]' : 'text-gray-700'}>{item.phone_number}</div>
                        <div className={`${themeClasses.secondaryText} text-xs`}>{item.email}</div>
                      </td>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.condition === 'New' ? (isDarkMode ? 'bg-[#111b26] text-[#177ddc]' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'bg-[#162312] text-[#49aa19]' : 'bg-green-100 text-green-700')}`}>
                            {item.condition}
                          </span>
                          <span className={`${themeClasses.text} font-medium`}>{item.vehicle_brand}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                        <div className={`font-semibold ${themeClasses.text}`}>${Number(item.budget_amount || 0).toLocaleString()}</div>
                        <div className={`${isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'} text-[10px] font-bold uppercase`}>{item.lien}</div>
                      </td>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell} ${isDarkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                        {item.currently_vehicle || '-'}
                      </td>
                      <td className={`px-4 py-3 border-r ${themeClasses.tableCell} ${themeClasses.secondaryText}`}>
                        {item.buy_vehicle_date ? dayjs(item.buy_vehicle_date).format('MM/DD/YYYY') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-bold ${isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'}`}>
                          {dayjs(item.lead_following).format('MM/DD/YYYY')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}