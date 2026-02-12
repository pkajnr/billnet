import { useState } from 'react';
import { showToast } from '../utils/toast';

interface BiddingModalProps {
  ideaId: number;
  ideaTitle: string;
  currentBalance: number;
  onBidPlaced: () => void;
  onClose: () => void;
}

export default function BiddingModal({
  ideaId,
  ideaTitle,
  currentBalance,
  onBidPlaced,
  onClose,
}: BiddingModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [equityPercentage, setEquityPercentage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const amount = parseFloat(bidAmount);
    const equity = parseFloat(equityPercentage);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    if (isNaN(equity) || equity <= 0 || equity > 100) {
      setError('Equity percentage must be between 0 and 100');
      return;
    }

    if (currentBalance < 10000) {
      setError('You need a minimum balance of $10,000 to place a bid');
      return;
    }

    if (amount > currentBalance) {
      setError(`Insufficient balance. You have $${currentBalance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId,
          bidAmount: amount,
          equityPercentage: equity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast.success(data.message || `Your bid of $${amount.toFixed(2)} has been placed successfully! Funds reserved from wallet.`, 'Bid Placed');
        setTimeout(() => {
          onBidPlaced();
          onClose();
        }, 1500);
      } else {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to place bid';
        setError(errorMsg);
        showToast.error(errorMsg, 'Bid Failed');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      const errorMsg = 'An error occurred. Please try again.';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <h2 className="font-roboto text-2xl font-bold text-gray-900 mb-2">Place Bid</h2>
        <p className="font-inter text-gray-600 text-sm mb-6">{ideaTitle}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 font-inter text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-700 font-inter text-sm">
            {message}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="font-inter text-xs text-blue-900 font-semibold mb-2">
            ℹ️ How Bidding Works
          </p>
          <ul className="font-inter text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Your bid amount will be <strong>reserved from your wallet</strong></li>
            <li>If accepted, funds move to your portfolio</li>
            <li>If rejected, funds are <strong>returned to your wallet</strong></li>
            <li>Track all bids in "My Bids" section</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance Display */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-inter text-xs text-blue-900 font-semibold uppercase tracking-wider mb-1">
              Current Balance
            </p>
            <p className="font-roboto text-2xl font-bold text-blue-600">
              ${currentBalance.toFixed(2)}
            </p>
          </div>

          {/* Bid Amount */}
          <div>
            <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
              Bid Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid amount"
              className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition duration-300"
              required
            />
          </div>

          {/* Equity Percentage */}
          <div>
            <label className="block font-inter text-sm font-semibold text-gray-700 mb-2">
              Equity Offering (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={equityPercentage}
              onChange={(e) => setEquityPercentage(e.target.value)}
              placeholder="e.g., 5.5"
              className="w-full font-inter px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition duration-300"
              required
            />
            <p className="font-inter text-xs text-gray-500 mt-1">What % equity are you requesting for this investment?</p>
          </div>

          {/* Minimum Balance Warning */}
          {currentBalance < 10000 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-inter text-sm text-amber-800">
                ⚠️ You need a minimum balance of <strong>$10,000</strong> to bid. Add funds in your profile.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || currentBalance < 10000}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-inter font-semibold py-3 rounded-lg transition duration-300"
            >
              {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-inter font-semibold py-3 rounded-lg transition duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
