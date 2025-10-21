import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Play, LogOut, AlertCircle, CheckCircle, RotateCcw, Lock, Unlock } from 'lucide-react';

const PresentationsList = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPresentations();
  }, [token, navigate]);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching presentations with token:', token?.substring(0, 20) + '...');
      
      const response = await api.get('/user/presentations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Full response:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Response data.data:', response.data?.data);
      
      // Try multiple ways to extract presentations
      const presentations = response.data?.data || response.data?.presentations || response.data || [];
      console.log('📊 Extracted presentations:', presentations);
      
      setPresentations(Array.isArray(presentations) ? presentations : []);
      setError('');
    } catch (err) {
      console.error('❌ Error fetching presentations:', err.message);
      console.error('Full error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      console.error('Response headers:', err.response?.headers);
      
      const errorMsg = err.response?.data?.message || err.message || 'Error loading presentations';
      setError(errorMsg);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('🔐 Unauthorized - redirecting to login');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartPresentation = (presentationId) => {
    navigate(`/slides?presentation_id=${presentationId}`);
  };

  const handleRepeatPresentation = async (presentationId) => {
    try {
        await api.post(
        `/user/presentations/${presentationId}/reset`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setShowConfirm(null);
      fetchPresentations();
    } catch (err) {
      setError('Error resetting presentation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading presentations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📚 Available Presentations</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Presentations Table */}
        {presentations.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 text-sm">No presentations available yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-4 py-2 text-left text-xs font-semibold">Presentation</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold">Slides</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold">Progress</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {presentations.map((presentation, idx) => (
                  <tr key={presentation.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    {/* Presentation Title */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 max-w-xs truncate">
                      {presentation.title}
                    </td>

                    {/* Slides Count */}
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      📊 {presentation.slides_count}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center min-h-[28px]">
                        {presentation.status === 'not_started' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <Unlock className="text-yellow-600 flex-shrink-0" size={12} />
                            <span className="text-yellow-700 font-semibold">Not Started</span>
                          </div>
                        )}
                        {presentation.status === 'in_progress' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                            <Play className="text-blue-600 flex-shrink-0" size={12} />
                            <span className="text-blue-700 font-semibold">In Progress</span>
                          </div>
                        )}
                        {presentation.status === 'completed' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                            <CheckCircle className="text-green-600 flex-shrink-0" size={12} />
                            <span className="text-green-700 font-semibold">Completed</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Progress Bar and Percentage */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${presentation.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 min-w-[35px] text-right">
                          {presentation.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {presentation.viewed_slides}/{presentation.slides_count}
                      </p>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {presentation.status === 'not_started' && (
                          <button
                            onClick={() => handleStartPresentation(presentation.id)}
                            className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition font-semibold text-xs whitespace-nowrap"
                          >
                            <Play size={12} />
                            Start
                          </button>
                        )}
                        {presentation.status === 'in_progress' && (
                          <button
                            onClick={() => handleStartPresentation(presentation.id)}
                            className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition font-semibold text-xs whitespace-nowrap"
                          >
                            <Play size={12} />
                            Continue
                          </button>
                        )}
                        {presentation.status === 'completed' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStartPresentation(presentation.id)}
                              className="flex items-center gap-1 bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition font-semibold text-xs whitespace-nowrap"
                            >
                              <Play size={12} />
                              View
                            </button>
                            <button
                              onClick={() => setShowConfirm(presentation.id)}
                              className="flex items-center gap-1 bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition font-semibold text-xs whitespace-nowrap"
                            >
                              <RotateCcw size={12} />
                              Repeat
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Modal - Repeat */}
        {showConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-orange-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Repeat Presentation?</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    If you repeat this presentation, your previous progress will be reset and deleted.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-orange-700 font-semibold">
                  ⚠️ Your previous result ({presentations.find(p => p.id === showConfirm)?.progress || 0}%) will be lost permanently.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRepeatPresentation(showConfirm);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                >
                  Repeat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationsList;
