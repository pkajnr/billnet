import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface Bid {
  id: number;
  bid_amount: number;
  equity_percentage: number;
  counter_amount?: number;
  counter_equity?: number;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface BidManagementModalProps {
  ideaId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function BidManagementModal({ ideaId, isOpen, onClose }: BidManagementModalProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingBidId, setProcessingBidId] = useState<number | null>(null);
  const [counterBidId, setCounterBidId] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterEquity, setCounterEquity] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBids();
    }
  }, [isOpen, ideaId]);

  const fetchBids = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ideas/${ideaId}/bids/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBids(Array.isArray(data) ? data : data.bids || []);
      } else {
        showToast.error('Failed to load bids');
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      showToast.error('Failed to load bids', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    setProcessingBidId(bidId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bids/${bidId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast.success('Bid accepted successfully! Investment created.');
        await fetchBids();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast.error(errorData.error || 'Failed to accept bid');
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      showToast.error('Failed to accept bid');
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleRejectBid = async (bidId: number) => {
    setProcessingBidId(bidId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bids/${bidId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast.info('Bid rejected. Funds returned to investor.');
        await fetchBids();
      } else {
        showToast.error('Failed to reject bid');
      }
    } catch (error) {
      console.error('Error rejecting bid:', error);
      showToast.error('Failed to reject bid');
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleCounterBid = (bidId: number, currentAmount: number, currentEquity: number) => {
    setCounterBidId(bidId);
    setCounterAmount(currentAmount.toString());
    setCounterEquity(currentEquity.toString());
  };

  const submitCounterBid = async () => {
    if (!counterBidId) return;
    
    const amount = parseFloat(counterAmount);
    const equity = parseFloat(counterEquity);

    if (isNaN(amount) || amount <= 0) {
      showToast.error('Please enter a valid amount');
      return;
    }

    if (isNaN(equity) || equity <= 0 || equity > 100) {
      showToast.error('Equity must be between 0 and 100');
      return;
    }

    setProcessingBidId(counterBidId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bids/${counterBidId}/counter`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counterAmount: amount,
          counterEquity: equity
        }),
      });

      if (response.ok) {
        showToast.success('Counter offer sent successfully!');
        setCounterBidId(null);
        setCounterAmount('');
        setCounterEquity('');
        await fetchBids();
      } else {
        showToast.error('Failed to send counter offer');
      }
    } catch (error) {
      console.error('Error sending counter offer:', error);
      showToast.error('Failed to send counter offer');
    } finally {
      setProcessingBidId(null);
    }

  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 flex items-center justify-between" style={{borderBottom: '1px solid var(--color-border)'}}>
          <h2 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>Manage Bids</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-70 transition"
            style={{color: 'var(--color-text-secondary)'}}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p style={{color: 'var(--color-text-secondary)'}}>Loading bids...</p>
            </div>
          ) : bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map(bid => (
                <div key={bid.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold" style={{color: 'var(--color-text)'}}>
                        {bid.first_name} {bid.last_name}
                      </h3>
                      <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>{bid.email}</p>
                    </div>
                    <span className={`badge ${
                      bid.status === 'accepted' ? 'badge-success' :
                      bid.status === 'rejected' ? 'badge-error' :
                      bid.status === 'countered' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {bid.status === 'countered' ? 'Counter Offer Sent' : bid.status}
                    </span>
                  </div>

                  {counterBidId === bid.id ? (
                    <div className="space-y-3 p-4 rounded-lg" style={{backgroundColor: 'var(--color-background)'}}>
                      <h4 className="font-semibold" style={{color: 'var(--color-text)'}}>Send Counter Offer</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Counter Amount ($)</label>
                          <input
                            type="number"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                            className="form-input"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="form-label">Counter Equity (%)</label>
                          <input
                            type="number"
                            value={counterEquity}
                            onChange={(e) => setCounterEquity(e.target.value)}
                            className="form-input"
                            placeholder="Enter equity"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={submitCounterBid}
                          disabled={processingBidId === bid.id}
                          className="btn btn-primary flex-1"
                        >
                          {processingBidId === bid.id ? 'Sending...' : 'Send Counter Offer'}
                        </button>
                        <button
                          onClick={() => {
                            setCounterBidId(null);
                            setCounterAmount('');
                            setCounterEquity('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{color: 'var(--color-text-secondary)'}}>Bid Amount</p>
                          <p className="text-lg font-bold" style={{color: 'var(--color-primary)'}}>
                            ${bid.bid_amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{color: 'var(--color-text-secondary)'}}>Equity Offered</p>
                          <p className="text-lg font-bold" style={{color: 'var(--color-accent)'}}>
                            {bid.equity_percentage}%
                          </p>
                        </div>
                      </div>

                      {/* Show counter offer if it exists */}
                      {bid.status === 'countered' && bid.counter_amount && bid.counter_equity && (
                        <div className="mb-4 p-3 rounded-lg" style={{backgroundColor: 'var(--color-background)'}}>
                          <p className="text-xs font-semibold mb-2" style={{color: 'var(--color-text-secondary)'}}>
                            💡 Your Counter Offer
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs mb-1" style={{color: 'var(--color-text-secondary)'}}>Counter Amount</p>
                              <p className="text-base font-bold" style={{color: 'var(--color-primary)'}}>
                                ${bid.counter_amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs mb-1" style={{color: 'var(--color-text-secondary)'}}>Counter Equity</p>
                              <p className="text-base font-bold" style={{color: 'var(--color-accent)'}}>
                                {bid.counter_equity}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {bid.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={processingBidId === bid.id}
                            className="btn btn-primary flex-1"
                          >
                            {processingBidId === bid.id ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => handleCounterBid(bid.id, bid.bid_amount, bid.equity_percentage)}
                            disabled={processingBidId === bid.id}
                            className="btn btn-secondary flex-1"
                          >
                            ↔ Counter
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={processingBidId === bid.id}
                            className="btn flex-1"
                            style={{backgroundColor: '#fee', color: '#c00'}}
                          >
                            {processingBidId === bid.id ? 'Processing...' : '✕ Reject'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{color: 'var(--color-text-secondary)'}}>No bids yet for this idea</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
