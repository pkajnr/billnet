import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { showToast } from '../utils/toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  processingTime: string;
  fees: string;
  minAmount: number;
  maxAmount: number | null;
  enabled: boolean;
  bitcoinAddress?: string;
  instructions?: any;
}

export default function AddFunds() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [fundAmount, setFundAmount] = useState('');
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
    fetchPaymentMethods();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/payment-methods', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast.error('Please enter a valid amount');
      return;
    }

    if (!selectedPaymentMethod) {
      showToast.error('Please select a payment method');
      return;
    }

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod) {
      if (amount < selectedMethod.minAmount) {
        showToast.error(`Minimum amount for ${selectedMethod.name} is $${selectedMethod.minAmount}`);
        return;
      }
      if (selectedMethod.maxAmount && amount > selectedMethod.maxAmount) {
        showToast.error(`Maximum amount for ${selectedMethod.name} is $${selectedMethod.maxAmount.toLocaleString()}`);
        return;
      }
    }

    setIsAddingFunds(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/initiate-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount,
          paymentMethod: selectedPaymentMethod,
          currency: 'USD'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentInstructions(data);
        showToast.success(`Payment initiated! Reference: ${data.transaction.referenceId}`, 'Payment Initiated');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const data = await response.json();
        showToast.error(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      showToast.error('An error occurred while initiating payment');
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handleReset = () => {
    setFundAmount('');
    setSelectedPaymentMethod('');
    setPaymentInstructions(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link to="/profile" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-flex items-center gap-2">
            <span>←</span> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add Funds to Wallet</h1>
          <p className="text-gray-600 mt-2">Choose a payment method and add funds to your investment wallet</p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-2">Current Balance</p>
          <p className="text-4xl font-bold">${walletBalance.toFixed(2)}</p>
          <p className="text-blue-100 text-sm mt-1">USD</p>
        </div>

        {/* Payment Instructions (if exists) */}
        {paymentInstructions && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-3 text-green-700 bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold text-lg">Payment Initiated Successfully</h3>
                <p className="text-sm text-green-600">Follow the instructions below to complete your payment</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Amount:</span>
                  <span className="text-gray-900 font-bold text-lg">
                    ${parseFloat(paymentInstructions.transaction.amount).toFixed(2)} {paymentInstructions.transaction.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Reference ID:</span>
                  <span className="text-gray-900 font-mono">{paymentInstructions.transaction.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Payment Method:</span>
                  <span className="text-gray-900 capitalize">{paymentInstructions.transaction.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    {paymentInstructions.transaction.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bitcoin Instructions */}
            {paymentInstructions.instructions.bitcoinAddress && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <span className="text-2xl">₿</span> Bitcoin Payment Instructions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-2">Bitcoin Address:</label>
                    <div className="bg-white p-4 rounded-lg border-2 border-amber-300 font-mono text-sm break-all">
                      {paymentInstructions.instructions.bitcoinAddress}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(paymentInstructions.instructions.bitcoinAddress);
                        showToast.success('Address copied to clipboard!', 'Copied');
                      }}
                      className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      📋 Copy Address
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-700 font-semibold">Network:</label>
                      <p className="text-gray-900">{paymentInstructions.instructions.network}</p>
                    </div>
                    <div>
                      <label className="text-gray-700 font-semibold">Min Confirmations:</label>
                      <p className="text-gray-900">{paymentInstructions.instructions.minConfirmations}</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
                    <p className="text-amber-900 text-sm font-medium">
                      ⚠️ {paymentInstructions.instructions.note}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Instructions */}
            {paymentInstructions.instructions.bankName && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <span className="text-2xl">🏦</span> Bank Transfer Instructions
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600 font-semibold">Bank Name:</label>
                      <p className="text-gray-900">{paymentInstructions.instructions.bankName}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-semibold">Account Name:</label>
                      <p className="text-gray-900">{paymentInstructions.instructions.accountName}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-semibold">Account Number:</label>
                      <p className="text-gray-900 font-mono">{paymentInstructions.instructions.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-semibold">Routing Number:</label>
                      <p className="text-gray-900 font-mono">{paymentInstructions.instructions.routingNumber}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-semibold">SWIFT Code:</label>
                      <p className="text-gray-900 font-mono">{paymentInstructions.instructions.swiftCode}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 font-semibold">Reference ID:</label>
                      <p className="text-gray-900 font-mono font-bold">{paymentInstructions.instructions.referenceId}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg border border-green-300 mt-4">
                    <p className="text-green-900 text-sm font-semibold">
                      📝 Important: {paymentInstructions.instructions.note}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Card Instructions */}
            {paymentInstructions.instructions.redirectUrl && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 mb-6">
                <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">💳</span> Card Payment
                </h3>
                <p className="text-gray-700">{paymentInstructions.instructions.note}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Make Another Payment
              </button>
              <Link
                to="/profile"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition text-center"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        )}

        {/* Payment Form (if no instructions yet) */}
        {!paymentInstructions && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <form onSubmit={handleAddFunds} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">Amount to Add (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:outline-none transition text-xl font-semibold"
                  required
                />
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Select Payment Method
                  {selectedPaymentMethod && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      (Selected: {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name})
                    </span>
                  )}
                </label>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment methods...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => {
                          setSelectedPaymentMethod(method.id);
                          console.log('Selected payment method:', method.id);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedPaymentMethod(method.id);
                          }
                        }}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedPaymentMethod === method.id
                            ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-4xl">{method.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900 text-lg">{method.name}</h3>
                              {selectedPaymentMethod === method.id && (
                                <span className="text-blue-600 text-2xl flex items-center gap-1">
                                  <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center">✓</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                                <span className="text-gray-500 font-medium">Processing:</span>
                                <p className="text-gray-700 font-semibold">{method.processingTime}</p>
                              </div>
                              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                                <span className="text-gray-500 font-medium">Fees:</span>
                                <p className="text-gray-700 font-semibold">{method.fees}</p>
                              </div>
                            </div>
                            {method.minAmount && (
                              <p className="text-xs text-gray-500 mt-3 font-medium">
                                Min: ${method.minAmount} {method.maxAmount ? `• Max: $${method.maxAmount.toLocaleString()}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isAddingFunds || !selectedPaymentMethod || !fundAmount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition text-lg"
                >
                  {isAddingFunds ? 'Processing...' : 'Continue to Payment'}
                </button>
                <Link
                  to="/profile"
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-4 rounded-lg transition text-center text-lg"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• All payments are processed securely</p>
            <p>• Bank transfers typically take 1-3 business days</p>
            <p>• Bitcoin payments require 3 confirmations</p>
            <p>• Contact support if you have any questions</p>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-600">
              Support: <a href="mailto:support@bilnet.com" className="text-blue-600 hover:text-blue-700 font-semibold">support@bilnet.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
