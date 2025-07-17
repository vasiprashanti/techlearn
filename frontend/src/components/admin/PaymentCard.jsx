import { Link } from 'react-router-dom';

const PaymentCard = ({ payment }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-b dark:border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium dark:text-white">
            User: {payment.userId?.name || 'Unknown'}
          </p>
          <p className="text-sm dark:text-gray-400">
            ${payment.amount} • {payment.status}
          </p>
        </div>
        <Link
          to={`/admin/payments/${payment._id}`}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Review
        </Link>
      </div>
    </div>
  );
};

export default PaymentCard;