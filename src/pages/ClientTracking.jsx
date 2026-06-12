import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPhoneNumber } from '../utils/formatters';

export default function ClientTracking({ isDarkMode }) {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const initialFormState = {
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    desired_vehicle: '',
    condition: 'Any',
    budget_amount: '',
    currently_vehicle: '',
    lien: 'Cash',
    status: 'In progress',
    buy_vehicle_date: '',
    lead_following: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    memo: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch Data
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
      if (isEditing) {
        // Update Logic
        const { error } = await supabase
          .from('following_customers')
          .update(formData)
          .eq('id', editId);

        if (error) throw error;
      } else {
        // Insert Logic
        const { error } = await supabase
          .from('following_customers')
          .insert([formData]);

        if (error) throw error;
      }
      
      // Clear edit state and force fresh fetch
      handleCancel();
      await fetchData();
    } catch (error) {
      alert('Operation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const { error } = await supabase
        .from('following_customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      phone_number: item.phone_number || '',
      email: item.email || '',
      desired_vehicle: item.desired_vehicle || '',
      condition: item.condition || 'Any',
      budget_amount: item.budget_amount || '',
      currently_vehicle: item.currently_vehicle || '',
      lien: item.lien || 'Cash',
      status: item.status || 'In progress',
      buy_vehicle_date: item.buy_vehicle_date || '',
      lead_following: item.lead_following || '',
      memo: item.memo || ''
    });
    setIsEditing(true);
    setEditId(item.id);
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setEditId(null);
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-[#000]' : 'bg-[#f0f2f5]',
    card: isDarkMode ? 'bg-[#141414] border-[#333]' : 'bg-white border-gray-200',
    text: isDarkMode ? 'text-[#fff]' : 'text-gray-900',
    label: isDarkMode ? 'text-[#aaa]' : 'text-gray-600',
    input: isDarkMode ? 'bg-[#1f1f1f] border-[#434343] text-[#fff] focus:ring-[#1677ff]' : 'bg-white border-gray-300 text-black focus:ring-blue-500',
    tableHeader: isDarkMode ? 'bg-[#1f1f1f] border-[#333] text-[#aaa]' : 'bg-[#fafafa] border-gray-200 text-gray-600',
    tableRow: isDarkMode ? 'hover:bg-[#1f1f1f] border-[#333]' : 'hover:bg-gray-50/50 border-gray-100',
    tableCell: isDarkMode ? 'border-[#333]' : 'border-gray-100',
    secondaryText: isDarkMode ? 'text-[#666]' : 'text-gray-400'
  };

  return (
    <div className={`w-full min-h-screen ${themeClasses.bg} px-4 py-6 font-sans text-left transition-colors duration-300`}>
      {/* Header - Styled to match Home page Sales Entry */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 8px 16px 8px' 
        }}>
          <h2 style={{ 
            margin: 0, 
            color: isDarkMode ? '#fff' : '#000', 
            fontSize: '24px', 
            fontWeight: 'bold',
            fontFamily: "'Roboto', sans-serif" 
          }}>
            Client Tracking
          </h2>
        </div>

        {/* Input Form Card */}
        <div className={`${themeClasses.card} rounded-lg border shadow-sm p-6 mb-8`}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Phone Number</label>
                <input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} placeholder="(XXX) XXX-XXXX" />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>

              {/* Row 2 */}
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Desired Vehicle</label>
                <input name="desired_vehicle" value={formData.desired_vehicle} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} placeholder="e.g. Honda" />
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
                <input type="text" name="budget_amount" value={formData.budget_amount} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} placeholder="e.g. 25000" />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Currently Vehicle</label>
                <input name="currently_vehicle" value={formData.currently_vehicle} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>

              {/* Row 3 */}
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Lien</label>
                <select name="lien" value={formData.lien} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none text-sm`}>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Cash</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Lease</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Finance</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'} mb-1 uppercase tracking-wider`}>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none text-sm font-bold`}>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>In progress</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Contacted</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Appointment</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Sold</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Lost</option>
                  <option className={isDarkMode ? 'bg-[#1f1f1f]' : ''}>Cancelled</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Buy Vehicle Date</label>
                <input type="date" name="buy_vehicle_date" value={formData.buy_vehicle_date} onChange={handleInputChange} className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'} mb-1 uppercase tracking-wider`}>Lead Following</label>
                <input type="date" name="lead_following" value={formData.lead_following} onChange={handleInputChange} className={`w-full px-3 py-2 ${isDarkMode ? 'bg-[#111b26] border-[#153450] text-[#fff]' : 'bg-white border-blue-200 text-black'} border rounded outline-none transition-all text-sm`} />
              </div>

              {/* Row 4 */}
              <div className="lg:col-span-3">
                <label className={`block text-xs font-semibold ${themeClasses.label} mb-1 uppercase tracking-wider`}>Memo</label>
                <textarea 
                  name="memo" 
                  value={formData.memo} 
                  onChange={handleInputChange} 
                  rows="1"
                  className={`w-full px-3 py-2 ${themeClasses.input} border rounded outline-none transition-all text-sm resize-none`}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="lg:col-span-1 flex items-end justify-end gap-2">
                {isEditing ? (
                  <>
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className={`px-6 py-2 rounded text-sm font-semibold transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className={`px-6 py-2 rounded text-sm font-semibold transition-colors text-white ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}
                    >
                      {loading ? '...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button type="submit" disabled={loading} className={`w-full py-2 ${isDarkMode ? 'bg-[#177ddc] hover:bg-[#3c9ae8]' : 'bg-[#1677ff] hover:bg-[#4096ff]'} text-white rounded text-sm font-semibold transition-colors shadow-sm disabled:opacity-50`}>
                    {loading ? '...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Data Table Card */}
        <div className={`${themeClasses.card} rounded-lg border shadow-sm overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-[#333]' : 'border-gray-100'} flex justify-between items-center`}>
            <h2 className={`text-lg font-bold ${themeClasses.text}`}>Recent Records</h2>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className={`${themeClasses.tableHeader} border-b font-semibold uppercase tracking-wider text-[11px]`}>
                <tr>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell} w-[80px]`}>Action</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell} w-[150px]`}>Created</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell} w-[120px]`}>Status</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Name</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Contact</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Desired Vehicle</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Budget & Lien</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Current Car</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Buy Date</th>
                  <th className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>Lead Following</th>
                  <th className="px-4 py-3">Memo</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-[#333]' : 'divide-gray-100'}`}>
                {tableLoading ? (
                  <tr><td colSpan="11" className={`text-center py-10 ${themeClasses.secondaryText}`}>Loading leads...</td></tr>
                ) : dataList.length === 0 ? (
                  <tr><td colSpan="11" className={`text-center py-10 ${themeClasses.secondaryText}`}>No records found.</td></tr>
                ) : (
                  dataList.map((item) => {
                    // --- Status Logic ---
                    const isLost = item.status === 'Lost';
                    const isCancelled = item.status === 'Cancelled';
                    const isSold = item.status === 'Sold';
                    const isAppt = item.status === 'Appointment';
                    const isContacted = item.status === 'Contacted';
                    
                    // --- Precise Local Date Logic ---
                    const todayObj = new Date();
                    const yyyy = todayObj.getFullYear();
                    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(todayObj.getDate()).padStart(2, '0');
                    const localTodayStr = `${yyyy}-${mm}-${dd}`;
                    
                    // --- Ultimate Date Cleaning: Splitting by space or T to keep only YYYY-MM-DD ---
                    const cleanLeadFollowing = item.lead_following ? item.lead_following.split(' ')[0].split('T')[0] : '';
                    
                    // --- Highlight Condition: localTodayStr >= cleanLeadFollowing ---
                    const isDue = cleanLeadFollowing && localTodayStr >= cleanLeadFollowing && !isLost && !isSold && !isCancelled;
                    
                    const rowHighlightClass = isDue 
                      ? (isDarkMode ? 'bg-red-950/30 border-l-4 border-l-red-500' : 'bg-red-50/60 hover:bg-red-50 border-l-4 border-l-red-500') 
                      : '';
                    
                    // --- Lost Style ---
                    const lostTextClass = isLost ? 'line-through decoration-red-500 decoration-2' : '';
                    
                    const textHighlightClass = isDue 
                      ? (isDarkMode ? 'text-red-400 font-semibold' : 'text-red-600 font-bold') 
                      : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-400' : 'text-black') : themeClasses.text);

                    return (
                      <tr key={item.id} className={`${themeClasses.tableRow} ${rowHighlightClass} ${(isLost || isCancelled) ? 'bg-gray-500/5' : ''} transition-colors`}>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleEdit(item)}
                              className={`${isDue ? 'text-red-500 hover:text-red-400' : 'text-blue-500 hover:text-blue-600'} transition-colors`}
                              title="Modify"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className={`${isDue ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'} transition-colors`}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell} text-xs ${isDue ? (isDarkMode ? 'text-red-300' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? themeClasses.text : 'text-black'))}`}>
                          <div className={lostTextClass}>{item.created_at ? dayjs(item.created_at).format('MMM DD, HH:mm') : '-'}</div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            isLost ? 'bg-gray-200 text-gray-500' :
                            isCancelled ? 'bg-red-100 text-red-600' :
                            isSold ? 'bg-green-500 text-white' :
                            isAppt ? 'bg-purple-500 text-white' :
                            isContacted ? 'bg-orange-500 text-white' :
                            (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')
                          }`}>
                            {item.status || 'In progress'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className={`font-bold ${textHighlightClass} ${lostTextClass}`}>{item.first_name} {item.last_name}</div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className={`${isDue ? (isDarkMode ? 'text-red-200' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? 'text-[#fff]' : 'text-black'))} ${lostTextClass}`}>{item.phone_number}</div>
                          <div className={`${isDue ? (isDarkMode ? 'text-red-400' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500/50' : 'text-black') : (isDarkMode ? themeClasses.secondaryText : 'text-black'))} text-xs ${lostTextClass}`}>{item.email}</div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className={`flex items-center gap-2 ${lostTextClass}`}>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.condition === 'New' 
                                ? (isDarkMode ? 'bg-[#111b26] text-[#177ddc]' : 'bg-blue-100 text-blue-700') 
                                : (isDarkMode ? 'bg-[#162312] text-[#49aa19]' : 'bg-green-100 text-green-700')
                            } ${isDue ? 'ring-1 ring-red-400/50' : ''} ${(isLost || isCancelled) ? 'grayscale opacity-50' : ''}`}>
                              {item.condition}
                            </span>
                            <span className={`${isDue ? textHighlightClass : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? themeClasses.text : 'text-black'))} font-medium`}>{item.desired_vehicle}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className={`font-semibold ${isDue ? textHighlightClass : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? themeClasses.text : 'text-black'))} ${lostTextClass}`}>
                            {isNaN(item.budget_amount) ? item.budget_amount : `$${Number(item.budget_amount || 0).toLocaleString()}`}
                          </div>
                          <div className={`${isDue ? (isDarkMode ? 'text-red-400' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'))} text-[10px] font-bold uppercase ${lostTextClass}`}>{item.lien}</div>
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell} ${isDue ? (isDarkMode ? 'text-red-300' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? 'text-[#aaa]' : 'text-black'))} ${lostTextClass}`}>
                          {item.currently_vehicle || '-'}
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell} ${isDue ? (isDarkMode ? 'text-red-400' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500/50' : 'text-black') : (isDarkMode ? themeClasses.secondaryText : 'text-black'))} ${lostTextClass}`}>
                          {item.buy_vehicle_date ? dayjs(item.buy_vehicle_date).format('MM/DD/YYYY') : '-'}
                        </td>
                        <td className={`px-4 py-3 border-r ${themeClasses.tableCell}`}>
                          <div className={`font-bold ${isDue ? (isDarkMode ? 'text-red-400' : 'text-red-600') : ((isLost || isCancelled) ? (isDarkMode ? 'text-slate-500' : 'text-black') : (isDarkMode ? 'text-[#177ddc]' : 'text-blue-600'))} ${lostTextClass}`}>
                            {dayjs(item.lead_following).format('MM/DD/YYYY')}
                          </div>
                          {isDue && <div className="text-[9px] uppercase font-black text-red-500 mt-0.5 animate-pulse">Action Required</div>}
                        </td>
                        <td className={`px-4 py-3 text-xs italic ${lostTextClass} ${isDue ? (isDarkMode ? 'text-red-300' : 'text-red-600') : (isDarkMode ? 'text-white' : 'text-black')}`}>
                          {item.memo || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
