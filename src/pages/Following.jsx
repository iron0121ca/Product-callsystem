import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Car, 
  Calendar, 
  DollarSign, 
  Clock, 
  MessageSquare,
  AlertCircle,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

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

const Following = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    email: '',
    condition: 'Any',
    desired_vehicle: '',
    budget_type: 'Monthly',
    budget_amount: '',
    expected_buying_time: 'Within 1 Month',
    current_car: '',
    next_followup_date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    remarks: ''
  });

  // Fetch Data
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('potential_customers')
      .select('*')
      .order('next_followup_date', { ascending: false });
    
    if (!error) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.desired_vehicle?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contact_number') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('potential_customers')
      .insert([formData]);
    
    if (!error) {
      setIsModalOpen(false);
      fetchCustomers();
      // Reset form
      setFormData({
        customer_name: '', contact_number: '', email: '', condition: 'Any',
        desired_vehicle: '', budget_type: 'Monthly', budget_amount: '',
        expected_buying_time: 'Within 1 Month', current_car: '',
        next_followup_date: dayjs().add(3, 'day').format('YYYY-MM-DD'), remarks: ''
      });
    }
  };

  return (
    <div className="bg-white min-h-screen p-8 text-left">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Client information</h1>
            <p className="text-gray-500 mt-1">Manage and track your potential leads effectively.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <UserPlus size={18} />
            Add Potential Lead
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by name or vehicle..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer & Contact</th>
                  <th className="px-6 py-4">Desired Vehicle</th>
                  <th className="px-6 py-4">Budget & Time</th>
                  <th className="px-6 py-4">Follow-up Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-20 text-gray-400">Loading leads...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-20 text-gray-400">No matching leads found.</td></tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50/80 transition-colors ${customer.expected_buying_time === 'Urgent 1-2 weeks' ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-base">{customer.customer_name}</div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="flex items-center gap-1.5 text-gray-500"><Phone size={14} /> {customer.contact_number}</span>
                          <span className="flex items-center gap-1.5 text-gray-500"><Mail size={14} /> {customer.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${customer.condition === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {customer.condition}
                          </span>
                          <span className="text-gray-900 font-medium">{customer.desired_vehicle}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">Current: {customer.current_car || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-semibold flex items-center gap-1 text-base">
                          <DollarSign size={16} className="text-gray-400" />
                          {Number(customer.budget_amount).toLocaleString()} 
                          <span className="text-xs text-gray-400 font-normal ml-1">({customer.budget_type})</span>
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          customer.expected_buying_time === 'Urgent 1-2 weeks' 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          <Clock size={12} />
                          {customer.expected_buying_time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-indigo-600">
                          <Calendar size={16} />
                          {dayjs(customer.next_followup_date).format('MMM DD, YYYY')}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Created {dayjs(customer.created_at).format('MM/DD')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="max-w-[200px] truncate text-gray-500 italic" title={customer.remarks}>
                           {customer.remarks || 'No notes...'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">New Potential Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-2 gap-6">
                {/* Section 1: Contact */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name</label>
                    <input required name="customer_name" value={formData.customer_name} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number</label>
                    <input name="contact_number" value={formData.contact_number} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(XXX) XXX-XXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                {/* Section 2: Vehicle Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition</label>
                      <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                        <option>New</option><option>Used</option><option>Any</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Desired Vehicle</label>
                      <input name="desired_vehicle" value={formData.desired_vehicle} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Lucid Air" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget Type</label>
                      <select name="budget_type" value={formData.budget_type} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                        <option>Monthly</option><option>Total Cash</option><option>Finance</option><option>Lease</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget Amount</label>
                      <input type="number" name="budget_amount" value={formData.budget_amount} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timeframe</label>
                    <select name="expected_buying_time" value={formData.expected_buying_time} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option>Urgent 1-2 weeks</option><option>Within 1 Month</option><option>Just Browsing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Follow-up & Remarks */}
              <div className="mt-6 space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Car</label>
                      <input name="current_car" value={formData.current_car} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 text-indigo-600">Next Follow-up Date</label>
                      <input type="date" name="next_followup_date" value={formData.next_followup_date} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes / Remarks</label>
                    <textarea name="remarks" rows="3" value={formData.remarks} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-2 px-12 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Following;