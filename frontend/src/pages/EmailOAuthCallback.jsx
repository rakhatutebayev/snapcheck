import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const EmailOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Обработка OAuth авторизации...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Ошибка авторизации: ${error}`);
      
      // Отправить сообщение родительскому окну
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_error', error }, window.location.origin);
      }
      
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Не получен код авторизации');
      
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_error', error: 'No code' }, window.location.origin);
      }
      
      setTimeout(() => window.close(), 3000);
      return;
    }

    // Отправить code на backend
    handleOAuthCallback(code, state);
  }, [searchParams]);

  const handleOAuthCallback = async (code, state) => {
    try {
      await api.get(`/admin/email/oauth/callback?code=${code}&state=${state}`);
      
      setStatus('success');
      setMessage('✅ Авторизация успешна! Окно закроется автоматически...');
      
      // Отправить сообщение родительскому окну
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_success' }, window.location.origin);
      }
      
      setTimeout(() => window.close(), 2000);
      
    } catch (err) {
      setStatus('error');
      setMessage(`Ошибка: ${err.response?.data?.detail || err.message}`);
      
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'oauth_error', 
          error: err.response?.data?.detail || err.message 
        }, window.location.origin);
      }
      
      setTimeout(() => window.close(), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <Loader className="animate-spin mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Обработка...</h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Успешно!</h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="mx-auto text-red-600 mb-4" size={48} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
            </>
          )}
          
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default EmailOAuthCallback;
