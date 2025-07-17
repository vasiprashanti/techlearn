import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import LoadingScreen from '../../components/Loader/Loader3D';

const AdminDashboard = () => {
  const { theme } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced fetch function with error handling
  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const apiUrl = `${import.meta.env.VITE_API_URL || ''}/payments`;
      const res = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include' // For cookies if using them
      });

      // Check for HTML responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text.startsWith('<!DOCTYPE html>') )
          ? 'Server returned HTML (check API URL)' 
          : text || 'Invalid response format';
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error('Payment fetch failed:', err);
      setError(err.message.includes('Failed to fetch')
        ? 'Could not connect to server'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  // Payment approval function
  const approvePayment = async (paymentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!res.ok) throw new Error('Approval failed');
      
      // Optimistic UI update
      setPayments(payments.map(p => 
        p._id === paymentId ? { ...p, status: 'approved' } : p
      ));
    } catch (err) {
      console.error('Approval error:', err);
      setError('Failed to approve payment');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) return <LoadingScreen fullScreen={true} />;

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
      <div className="bg-red-100 dark:bg-red-900 p-6 rounded-lg max-w-md mx-4">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
          Admin Dashboard Error
        </h2>
        <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background gradient */}
      <div className={`fixed inset-0 -z-10 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-[#020b23] to-[#0a1128]' 
          : 'bg-gradient-to-br from-[#daf0fa] to-[#bceaff]'
      }`} />
      
      {/* Main content */}
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Certificate Approvals
        </h1>
        
        {payments.length > 0 ? (
          <div className="grid gap-4">
            {payments.map(payment => (
              <div 
                key={payment._id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {payment.user?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Course: {payment.course || 'N/A'} • ${payment.amount || '0'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {payment.status}
                    </span>
                    {payment.status !== 'approved' && (
                      <button
                        onClick={() => approvePayment(payment._id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No pending certificate approvals
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;