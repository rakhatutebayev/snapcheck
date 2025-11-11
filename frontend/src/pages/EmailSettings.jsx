import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Mail, Send, Settings, CheckCircle, XCircle, AlertCircle, UserPlus, Trash2, Users } from 'lucide-react';

// Default sender name - change this value to customize email sender name
const DEFAULT_SENDER_NAME = 'Training System';

const EmailSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  // Form states - SMTP only
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [encryption, setEncryption] = useState('starttls');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState(DEFAULT_SENDER_NAME);
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyOnRegistration, setNotifyOnRegistration] = useState(true);
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);
  
  // Notification admins
  const [notificationAdmins, setNotificationAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRegistration, setNewAdminRegistration] = useState(true);
  const [newAdminCompletion, setNewAdminCompletion] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(false);
  
  // SMTP Presets
  const smtpPresets = {
    gmail: {
      name: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      encryption: 'starttls',
      info: 'Use App Password: https://myaccount.google.com/apppasswords'
    },
    office365: {
      name: 'Office 365',
      host: 'smtp.office365.com',
      port: 587,
      encryption: 'starttls',
      info: 'Enable SMTP AUTH in Microsoft 365 Admin Center + use App Password'
    },
    yandex: {
      name: 'Yandex',
      host: 'smtp.yandex.ru',
      port: 587,
      encryption: 'starttls',
      info: 'Use email password'
    },
    mailru: {
      name: 'Mail.ru',
      host: 'smtp.mail.ru',
      port: 587,
      encryption: 'starttls',
      info: 'Use email password'
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchNotificationAdmins();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/email/settings');
      const data = response.data;
      
      if (data) {
        setSettings(data);
        setSmtpHost(data.smtp_host || '');
        setSmtpPort(data.smtp_port || 587);
        setEncryption(data.encryption || 'starttls');
        setSmtpUsername(data.smtp_username || '');
        setSmtpPassword(data.smtp_password || '');
        setFromEmail(data.from_email || '');
        setFromName(data.from_name || DEFAULT_SENDER_NAME);
        setNotificationsEnabled(data.notifications_enabled ?? true);
        setNotifyOnRegistration(data.notify_on_registration ?? true);
        setNotifyOnCompletion(data.notify_on_completion ?? true);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationAdmins = async () => {
    try {
      setAdminsLoading(true);
      const response = await api.get('/admin/email/notification-admins');
      setNotificationAdmins(response.data || []);
    } catch (err) {
      console.error('Failed to load notification admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const addNotificationAdmin = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!newAdminEmail) {
        setError('Please enter email address');
        return;
      }

      await api.post('/admin/email/notification-admins', {
        email: newAdminEmail,
        receive_registration_notifications: newAdminRegistration,
        receive_completion_notifications: newAdminCompletion
      });

      setSuccess('Admin added successfully');
      setNewAdminEmail('');
      setNewAdminRegistration(true);
      setNewAdminCompletion(true);
      fetchNotificationAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add admin');
    }
  };

  const toggleAdminStatus = async (adminId, currentStatus) => {
    try {
      await api.patch(`/admin/email/notification-admins/${adminId}`, {
        is_active: !currentStatus
      });
      fetchNotificationAdmins();
    } catch (err) {
      setError('Failed to update admin status');
    }
  };

  const toggleAdminNotification = async (adminId, field, currentValue) => {
    try {
      await api.patch(`/admin/email/notification-admins/${adminId}`, {
        [field]: !currentValue
      });
      fetchNotificationAdmins();
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  const deleteNotificationAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to remove this admin?')) {
      return;
    }

    try {
      await api.delete(`/admin/email/notification-admins/${adminId}`);
      setSuccess('Admin removed successfully');
      fetchNotificationAdmins();
    } catch (err) {
      setError('Failed to delete admin');
    }
  };

  const applyPreset = (presetKey) => {
    const preset = smtpPresets[presetKey];
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setEncryption(preset.encryption);
  };

  const saveSettings = async () => {
    try {
      setError('');
      setSuccess('');

      if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
        setError('Please fill all SMTP fields');
        return;
      }

      if (!fromEmail) {
        setError('Please enter From Email');
        return;
      }

      const payload = {
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort),
        encryption,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword,
        from_email: fromEmail,
        from_name: fromName,
        notifications_enabled: notificationsEnabled,
        notify_on_registration: notifyOnRegistration,
        notify_on_completion: notifyOnCompletion
      };

      await api.post('/admin/email/settings', payload);
      setSuccess('✅ Settings saved successfully');
      fetchSettings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings');
    }
  };

  const sendTestEmail = async () => {
    try {
      setError('');
      setSuccess('');
      setTestLoading(true);

      if (!testEmail) {
        setError('Please enter test email recipient');
        return;
      }

      await api.post('/admin/email/test', { test_recipient: testEmail });
      setSuccess(`✅ Test email sent to ${testEmail}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send test email');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Configure SMTP email delivery</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* SMTP Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Setup
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(smtpPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* SMTP Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SMTP Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port *
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encryption *
                </label>
                <select
                  value={encryption}
                  onChange={(e) => setEncryption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="starttls">STARTTLS (587)</option>
                  <option value="ssl">SSL (465)</option>
                  <option value="tls">TLS (587)</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password / App Password *
                </label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Gmail/Office 365: use App Password, not regular password
                </p>
              </div>
            </div>
          </div>

          {/* From Settings */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Sender Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email *
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="noreply@yourdomain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={DEFAULT_SENDER_NAME}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Notification Settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable email notifications</span>
              </label>

              <label className="flex items-center gap-3 ml-6">
                <input
                  type="checkbox"
                  checked={notifyOnRegistration}
                  onChange={(e) => setNotifyOnRegistration(e.target.checked)}
                  disabled={!notificationsEnabled}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Notify on user registration</span>
              </label>

              <label className="flex items-center gap-3 ml-6">
                <input
                  type="checkbox"
                  checked={notifyOnCompletion}
                  onChange={(e) => setNotifyOnCompletion(e.target.checked)}
                  disabled={!notificationsEnabled}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Notify on presentation completion</span>
              </label>
            </div>
          </div>

          {/* Notification Recipients */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Notification Recipients
              </h3>
              <span className="text-sm text-gray-500">
                {notificationAdmins.length} {notificationAdmins.length === 1 ? 'admin' : 'admins'}
              </span>
            </div>

            {/* Add New Admin Form */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newAdminRegistration}
                      onChange={(e) => setNewAdminRegistration(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Registration notifications</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newAdminCompletion}
                      onChange={(e) => setNewAdminCompletion(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Completion notifications</span>
                  </label>
                </div>

                <button
                  onClick={addNotificationAdmin}
                  disabled={!newAdminEmail || adminsLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Admin
                </button>
              </div>
            </div>

            {/* Admins List */}
            {adminsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading admins...</div>
            ) : notificationAdmins.length === 0 ? (
              <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                No notification admins added yet
              </div>
            ) : (
              <div className="space-y-2">
                {notificationAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className={`bg-white rounded-lg p-4 border ${
                      admin.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-medium ${admin.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {admin.email}
                          </span>
                          <button
                            onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                            className={`px-2 py-1 text-xs rounded ${
                              admin.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        <div className="flex gap-4 text-sm">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={admin.receive_registration_notifications}
                              onChange={() => toggleAdminNotification(
                                admin.id,
                                'receive_registration_notifications',
                                admin.receive_registration_notifications
                              )}
                              disabled={!admin.is_active}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={admin.is_active ? 'text-gray-700' : 'text-gray-500'}>
                              Registration
                            </span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={admin.receive_completion_notifications}
                              onChange={() => toggleAdminNotification(
                                admin.id,
                                'receive_completion_notifications',
                                admin.receive_completion_notifications
                              )}
                              disabled={!admin.is_active}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={admin.is_active ? 'text-gray-700' : 'text-gray-500'}>
                              Completion
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteNotificationAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remove admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save Settings
            </button>
          </div>

          {/* Test Email */}
          {settings && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Email</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={testLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {testLoading ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Gmail/Office 365 require App Passwords (not regular passwords)</li>
                <li>Office 365 requires SMTP AUTH to be enabled in admin panel</li>
                <li>Test email delivery before using in production</li>
                <li>Manage notification recipients in the "Admins" section</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
