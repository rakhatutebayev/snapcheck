  const saveManualClientId = async () => {
    try {
      if (!manualClientId.trim()) { setError('Client ID пуст'); return; }
      setError('');
      // Обеспечим наличие базовой строки настроек (минимальное сохранение)
      const filteredRecipients = recipients.filter(r => r.trim() !== '');
      const basePayload = {
        provider,
        from_email: fromEmail || 'noreply@example.com',
        from_name: fromName || 'System',
        notification_recipients: filteredRecipients.length ? filteredRecipients : [fromEmail || 'admin@example.com'],
        notifications_enabled: notificationsEnabled,
        notify_on_registration: notifyOnRegistration,
        notify_on_completion: notifyOnCompletion,
      };
      await api.post('/admin/email/settings', basePayload);
      await api.post('/admin/email/oauth/client-id', { provider, client_id: manualClientId.trim() });
      setSuccess('Client ID сохранён');
      setShowManualIdInput(false);
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка сохранения Client ID');
    }
  };
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Mail, Send, Settings, CheckCircle, XCircle, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';

const EmailSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [provider, setProvider] = useState('smtp');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('SnapCheck System');
  const [recipients, setRecipients] = useState(['']);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyOnRegistration, setNotifyOnRegistration] = useState(true);
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);
  
  // SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [smtpPreset, setSmtpPreset] = useState('');
  
  // OAuth (legacy fields removed from UI – kept for backward compatibility if needed)
  const [clientId, setClientId] = useState(''); // not shown anymore
  const [clientSecret, setClientSecret] = useState(''); // not shown anymore
  // Manual Client ID override (when ENV not set)
  const [manualClientId, setManualClientId] = useState('');
  const [showManualIdInput, setShowManualIdInput] = useState(false);
  
  // SMTP Presets
  const smtpPresets = {
    gmail: {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      tls: true,
      info: 'Используйте App Password: https://myaccount.google.com/apppasswords'
    },
    yandex: {
      name: 'Яндекс',
      host: 'smtp.yandex.ru',
      port: 587,
      tls: true,
      info: 'Используйте пароль от почты'
    },
    mailru: {
      name: 'Mail.ru',
      host: 'smtp.mail.ru',
      port: 587,
      tls: true,
      info: 'Используйте пароль от почты'
    },
    outlook: {
      name: 'Outlook/Hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      tls: true,
      info: 'Используйте пароль от Microsoft аккаунта'
    },
    office365: {
      name: 'Office 365',
      host: 'smtp.office365.com',
      port: 587,
      tls: true,
      info: 'Используйте корпоративный пароль'
    },
    mailgun: {
      name: 'Mailgun',
      host: 'smtp.mailgun.org',
      port: 587,
      tls: true,
      info: 'Получите SMTP credentials на mailgun.com'
    },
    sendgrid: {
      name: 'SendGrid',
      host: 'smtp.sendgrid.net',
      port: 587,
      tls: true,
      info: 'Username: apikey, Password: ваш API key'
    }
  };
  
  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  // Logs
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync manualClientId with stored value from backend (if present)
  useEffect(() => {
    if (settings?.stored_client_id) {
      setManualClientId(settings.stored_client_id);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/email/settings');
      
      if (response.data) {
        const s = response.data;
        setSettings(s);
        setProvider(s.provider);
        setFromEmail(s.from_email);
        setFromName(s.from_name);
        setRecipients(s.notification_recipients.length > 0 ? s.notification_recipients : ['']);
        setNotificationsEnabled(s.notifications_enabled);
        setNotifyOnRegistration(s.notify_on_registration);
        setNotifyOnCompletion(s.notify_on_completion);
      }
      
      setError('');
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Ошибка загрузки настроек');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Валидация
      if (!fromEmail) {
        setError('Укажите email отправителя');
        return;
      }
      
      const filteredRecipients = recipients.filter(r => r.trim() !== '');
      if (filteredRecipients.length === 0) {
        setError('Добавьте хотя бы одного получателя');
        return;
      }
      
      if (provider === 'smtp') {
        if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
          setError('Заполните все SMTP поля');
          return;
        }
      }
      
      // Для OAuth провайдеров больше не требуем client_id / secret – используем ENV
      
      const data = {
        provider,
        from_email: fromEmail,
        from_name: fromName,
        notification_recipients: filteredRecipients,
        notifications_enabled: notificationsEnabled,
        notify_on_registration: notifyOnRegistration,
        notify_on_completion: notifyOnCompletion,
      };
      
      if (provider === 'smtp') {
        data.smtp_host = smtpHost;
        data.smtp_port = parseInt(smtpPort);
        data.smtp_username = smtpUsername;
        data.smtp_password = smtpPassword;
        data.use_tls = useTls;
      }
      
      // OAuth credentials не отправляем – backend использует окружение
      
      await api.post('/admin/email/settings', data);
      setSuccess('Настройки сохранены успешно!');
      fetchSettings();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка сохранения настроек');
    }
  };

  const handleOAuthAuthorize = async () => {
    try {
      setError('');
      setSuccess('');

      // Минимальная проверка перед OAuth
      if (!fromEmail) {
        setError('Укажите email отправителя');
        return;
      }
      const filteredRecipients = recipients.filter(r => r.trim() !== '');
      if (filteredRecipients.length === 0) {
        setError('Добавьте хотя бы одного получателя');
        return;
      }

      // 1) Гарантированно сохраняем текущие настройки с выбранным провайдером
      const savePayload = {
        provider,
        from_email: fromEmail,
        from_name: fromName,
        notification_recipients: filteredRecipients,
        notifications_enabled: notificationsEnabled,
        notify_on_registration: notifyOnRegistration,
        notify_on_completion: notifyOnCompletion,
      };
      if (provider === 'smtp') {
        // Если вдруг пользователь выбрал SMTP — без сохранения OAuth не запустится
        setError('Для авторизации выберите провайдера Microsoft или Google');
        return;
      }
      await api.post('/admin/email/settings', savePayload);

      // 2) Инициализируем OAuth
      const redirectUri = `${window.location.origin}/admin/email/callback`;
      const response = await api.post('/admin/email/oauth/init', { redirect_uri: redirectUri });
      const { auth_url } = response.data;
      
      // Открыть OAuth окно
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        auth_url,
        'OAuth Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Слушать сообщения от окна
      const messageHandler = (event) => {
        if (event.data.type === 'oauth_success') {
          authWindow.close();
          setSuccess('OAuth авторизация успешна!');
          fetchSettings();
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'oauth_error') {
          authWindow.close();
          setError('Ошибка OAuth авторизации');
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка инициализации OAuth');
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestLoading(true);
      setError('');
      setSuccess('');
      
      if (!testEmail) {
        setError('Укажите email для тестовой отправки');
        return;
      }
      
      await api.post('/admin/email/test', { test_recipient: testEmail });
      setSuccess(`Тестовое письмо отправлено на ${testEmail}`);
      setTestEmail('');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки тестового письма');
    } finally {
      setTestLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/admin/email/logs?limit=20');
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const applySmtpPreset = (presetKey) => {
    if (!presetKey) return;
    
    const preset = smtpPresets[presetKey];
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setUseTls(preset.tls);
    setSmtpPreset(presetKey);
    setSuccess(`✓ Настройки ${preset.name} применены. ${preset.info}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="text-blue-600" />
          Email Уведомления
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Настройте отправку уведомлений о регистрации пользователей и прохождении презентаций
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Status */}
      {settings && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.is_verified ? (
                <>
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-semibold text-green-700">Настроено и активно</span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-yellow-600" size={20} />
                  <span className="text-sm font-semibold text-yellow-700">Требуется настройка</span>
                </>
              )}
            </div>
            {settings.last_test_at && (
              <span className="text-xs text-gray-600">
                Последний тест: {new Date(settings.last_test_at).toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          {(settings.provider === 'office365' || settings.provider === 'google') && (
            <div className="mt-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded-md font-medium ${settings.ready_for_oauth ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  OAuth готовность: {settings.ready_for_oauth ? '✓' : '✕'}
                </span>
                <span className="px-2 py-1 rounded-md bg-white border border-blue-200 text-blue-700">
                  Client ID: {settings.effective_client_id ? (
                    <span className="font-mono">{settings.effective_client_id.slice(0,12)}…</span>
                  ) : 'не найден'}
                </span>
                {(!settings.effective_client_id) && (
                  <span className="text-red-600">Добавьте переменную {settings.provider === 'office365' ? 'MICROSOFT_CLIENT_ID' : 'GOOGLE_CLIENT_ID'} в .env и перезапустите</span>
                )}
                {settings.has_oauth_configured && settings.oauth_expires_at && (
                  <span className="px-2 py-1 rounded-md bg-green-100 text-green-700">
                    Токен истекает: {new Date(settings.oauth_expires_at).toLocaleString('ru-RU')}
                  </span>
                )}
              </div>
              {!settings.effective_client_id && (
                <div className="mt-2">
                  {!showManualIdInput ? (
                    <button
                      onClick={() => setShowManualIdInput(true)}
                      className="px-3 py-1 text-xs bg-gray-800 text-white rounded-md hover:bg-black transition"
                    >
                      Ввести Client ID вручную (в БД)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={manualClientId}
                        onChange={(e) => setManualClientId(e.target.value)}
                        placeholder="Application (client) ID"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                      />
                      <button
                        onClick={saveManualClientId}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                      >Сохранить</button>
                      <button
                        onClick={() => setShowManualIdInput(false)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">Это временно до того, как добавите переменную окружения. Client ID будет храниться в таблице.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        
        {/* Provider Selection */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Провайдер Email</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setProvider('smtp')}
              className={`p-4 border-2 rounded-lg text-center transition ${
                provider === 'smtp'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Settings className="mx-auto mb-2 text-gray-700" size={24} />
              <div className="font-semibold text-sm">SMTP</div>
              <div className="text-xs text-gray-500">Обычный SMTP</div>
            </button>
            
            <button
              onClick={() => setProvider('office365')}
              className={`p-4 border-2 rounded-lg text-center transition ${
                provider === 'office365'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Mail className="mx-auto mb-2 text-blue-700" size={24} />
              <div className="font-semibold text-sm">Office 365</div>
              <div className="text-xs text-gray-500">Microsoft OAuth</div>
            </button>
            
            <button
              onClick={() => setProvider('google')}
              className={`p-4 border-2 rounded-lg text-center transition ${
                provider === 'google'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Mail className="mx-auto mb-2 text-red-600" size={24} />
              <div className="font-semibold text-sm">Google</div>
              <div className="text-xs text-gray-500">Gmail OAuth</div>
            </button>
          </div>
        </div>

        {/* From Email */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Отправитель</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="SnapCheck System"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        {provider === 'smtp' && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">SMTP Настройки</h3>
            
            {/* Quick Setup Presets */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">⚡ Быстрая настройка</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(smtpPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applySmtpPreset(key)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition ${
                      smtpPreset === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Выберите провайдер для автоматической настройки SMTP
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useTls}
                  onChange={(e) => setUseTls(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Use TLS</span>
              </label>
            </div>
          </div>
        )}

        {/* OAuth Settings */}
        {(provider === 'office365' || provider === 'google') && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Подключение аккаунта</h3>
            {settings?.has_oauth_configured ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={18} />
                  <span className="text-sm text-green-700">Аккаунт подключён</span>
                </div>
                {settings.oauth_expires_at && (
                  <span className="text-xs text-green-600">
                    Токен истекает: {new Date(settings.oauth_expires_at).toLocaleString('ru-RU')}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={handleOAuthAuthorize}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={!settings?.ready_for_oauth}
              >
                <ExternalLink size={18} />
                Подключить {provider === 'office365' ? 'Microsoft 365' : 'Google Gmail'}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Введите email отправителя выше и сохраните настройки, затем выполните подключение аккаунта.
            </p>
            {!settings?.ready_for_oauth && (
              <p className="text-xs text-red-600 mt-1">Нет Client ID — добавьте переменную окружения и перезапустите сервер.</p>
            )}
          </div>
        )}

        {/* Recipients */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Получатели уведомлений</h3>
          <div className="space-y-2 mb-3">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => updateRecipient(index, e.target.value)}
                  placeholder="admin@company.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {recipients.length > 1 && (
                  <button
                    onClick={() => removeRecipient(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addRecipient}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Добавить получателя
          </button>
        </div>

        {/* Notification Settings */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Настройки уведомлений</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Включить email уведомления</span>
            </label>
            <label className="flex items-center gap-2 ml-6">
              <input
                type="checkbox"
                checked={notifyOnRegistration}
                onChange={(e) => setNotifyOnRegistration(e.target.checked)}
                disabled={!notificationsEnabled}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Уведомлять о регистрации новых пользователей</span>
            </label>
            <label className="flex items-center gap-2 ml-6">
              <input
                type="checkbox"
                checked={notifyOnCompletion}
                onChange={(e) => setNotifyOnCompletion(e.target.checked)}
                disabled={!notificationsEnabled}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Уведомлять о завершении презентаций</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            💾 Сохранить настройки
          </button>
        </div>
      </div>

      {/* Test Email */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Send size={20} />
          Тестовая отправка
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestEmail}
            disabled={testLoading || !settings?.is_verified}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {testLoading ? '⏳' : '✉️'} Отправить
          </button>
        </div>
        {!settings?.is_verified && (
          <p className="text-xs text-yellow-600 mt-2">
            ⚠️ Сначала настройте и сохраните параметры email
          </p>
        )}
      </div>

      {/* Email Logs */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Лог отправок</h3>
          <button
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) fetchLogs();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            {showLogs ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        
        {showLogs && (
          <div className="p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Нет записей</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{log.recipient}</span>
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle className="text-green-600" size={16} />
                        ) : (
                          <XCircle className="text-red-600" size={16} />
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(log.sent_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-600">{log.subject}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Тип: {log.event_type}
                      {log.error_message && ` • Ошибка: ${log.error_message}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSettings;
