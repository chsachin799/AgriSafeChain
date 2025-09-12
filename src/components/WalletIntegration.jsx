import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const WalletIntegration = ({ onPaymentSuccess, onPaymentError, amount, purpose }) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          setSelectedMethod('metamask');
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setSelectedMethod('metamask');
        setError('');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setError('Failed to connect to MetaMask. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processMetaMaskPayment = async () => {
    if (!isConnected || !walletAddress) {
      setError('Please connect your MetaMask wallet first.');
      return;
    }

    try {
      setLoading(true);
      
      // Get current gas price
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      // Convert amount to wei
      const amountInWei = window.ethereum.utils.toWei(amount.toString(), 'ether');

      // Create transaction
      const transactionParameters = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Government wallet address
        from: walletAddress,
        value: amountInWei,
        gas: '0x5208', // 21000 gas limit
        gasPrice: gasPrice,
        data: '0x' // No data for simple transfer
      };

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
      });

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(txHash);
      
      if (receipt.status === '0x1') {
        // Transaction successful
        await recordPayment(txHash, 'metamask', amount, purpose);
        onPaymentSuccess?.(txHash, receipt);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('MetaMask payment error:', error);
      setError('Payment failed. Please try again.');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const waitForTransactionReceipt = (txHash) => {
    return new Promise((resolve, reject) => {
      const checkReceipt = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          });
          
          if (receipt) {
            resolve(receipt);
          } else {
            setTimeout(checkReceipt, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };
      checkReceipt();
    });
  };

  const processRazorPayPayment = async () => {
    try {
      setLoading(true);
      
      // Create RazorPay order
      const response = await axios.post('http://localhost:3001/api/payment/create-razorpay-order', {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        purpose: purpose,
        userId: user.id
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      const { orderId } = response.data;

      // Load RazorPay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: amount * 100,
          currency: 'INR',
          name: 'AgriSafeChain',
          description: purpose,
          order_id: orderId,
          handler: async (response) => {
            try {
              // Verify payment
              const verifyResponse = await axios.post('http://localhost:3001/api/payment/verify-razorpay', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, {
                headers: {
                  'x-auth-token': localStorage.getItem('token')
                }
              });

              if (verifyResponse.data.success) {
                await recordPayment(response.razorpay_payment_id, 'razorpay', amount, purpose);
                onPaymentSuccess?.(response.razorpay_payment_id, response);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed.');
              onPaymentError?.(error);
            }
          },
          prefill: {
            name: user.name || '',
            email: user.email || '',
            contact: user.phone || ''
          },
          theme: {
            color: '#10b981'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error('RazorPay payment error:', error);
      setError('Failed to initiate payment. Please try again.');
      onPaymentError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (transactionId, method, amount, purpose) => {
    try {
      await axios.post('http://localhost:3001/api/payment/record', {
        transactionId,
        method,
        amount,
        purpose,
        userId: user.id,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handlePayment = async () => {
    setError('');
    
    if (selectedMethod === 'metamask') {
      await processMetaMaskPayment();
    } else if (selectedMethod === 'razorpay') {
      await processRazorPayPayment();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Payment Method
      </h3>
      
      <div className="space-y-4">
        {/* MetaMask Option */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">MetaMask</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isConnected ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect your MetaMask wallet'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isConnected ? (
                <button
                  onClick={connectMetaMask}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <input
                  type="radio"
                  name="paymentMethod"
                  value="metamask"
                  checked={selectedMethod === 'metamask'}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* RazorPay Option */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">RazorPay</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pay with UPI, Cards, Net Banking
                </p>
              </div>
            </div>
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={selectedMethod === 'razorpay'}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          Amount: ₹{amount}
        </div>
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
};

export default WalletIntegration;
