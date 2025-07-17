import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const PaymentConfirm = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleConfirm = (status) => {
    fetch(`/api/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    }).then(() => navigate('/admin'));
  };

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className={`fixed inset-0 -z-10 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-[#020b23] to-[#0a1128]' 
          : 'bg-gradient-to-br from-[#daf0fa] to-[#bceaff]'
      }`} />
      
      <main className="flex-1 p-6 ml-[70px]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm max-w-md mx-auto">
          <h1 className="text-xl font-bold dark:text-white mb-4">
            Confirm Payment #{paymentId}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => handleConfirm('approved')}
              className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={() => handleConfirm('rejected')}
              className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentConfirm;