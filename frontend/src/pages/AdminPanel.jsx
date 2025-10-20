import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Users, LogOut, AlertCircle, CheckCircle, Trash2, FileUp, Play, X, Eye, EyeOff, Plus } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('presentations');
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [presentationTitle, setPresentationTitle] = useState('');
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  // For modal and password visibility
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userErrors, setUserErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });
  
  // For editing slides - NO LONGER NEEDED
  // const [selectedPresentation, setSelectedPresentation] = useState(null);
  // const [slides, setSlides] = useState([]);
  // const [editingSlideId, setEditingSlideId] = useState(null);
  // const [editingSlideTitle, setEditingSlideTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // For folder slide checking
  const [checkedSlides, setCheckedSlides] = useState([]);
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const folderInputRef = useRef(null);
  
  // For report user filtering
  const [reportFilter, setReportFilter] = useState(null); // null, 'all', 'completed', 'pending'
  const [filteredReportUsers, setFilteredReportUsers] = useState([]);
  
  // For filtering by presentation name
  const [presentationNameFilter, setPresentationNameFilter] = useState('');
  
  // For recently uploaded presentations
  const [recentlyUploadedPresentation, setRecentlyUploadedPresentation] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  
  // Validation errors
  const [errors, setErrors] = useState({
    presentationTitle: '',
    file: ''
  });
  
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const currentUserEmail = localStorage.getItem('email');

  // Проверка авторизации и роли при загрузке
  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/login');
    }
  }, [token, role, navigate]);

  // Auto-dismiss error and success messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (activeTab === 'presentations') {
      fetchPresentations();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'report') {
      fetchReport();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.data);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Ошибка при загрузке пользователей');
      }
    }
  };

  const fetchPresentations = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('/admin/presentations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPresentations(response.data.data);
    } catch (err) {
      console.error('Ошибка при загрузке презентаций:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Ошибка при загрузке презентаций');
      }
    }
  };

  const handlePublish = async (presentationId) => {
    setPublishingId(presentationId);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`/admin/presentations/${presentationId}/publish`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('✓ Презентация опубликована');
      fetchPresentations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при публикации');
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (presentationId) => {
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`/admin/presentations/${presentationId}/unpublish`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('✓ Презентация удалена из опубликованных');
      fetchPresentations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при снятии с публикации');
    }
  };

  const handleDeletePresentation = async (presentationId) => {
    setShowDeleteConfirm(null);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/admin/presentations/${presentationId}?confirm=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('✓ Презентация и все ее слайды удалены');
      fetchPresentations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при удалении презентации');
    }
  };

  const fetchReport = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get('/admin/report', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReport(response.data.data);
    } catch (err) {
      console.error('Ошибка при загрузке отчета:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Ошибка при загрузке отчета');
      }
    }
  };

  const handleFolderSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('Все файлы в папке:', Array.from(files).map(f => f.name));

    // Получаем все файлы со слайдами - максимально гибкая фильтрация
    // Принимаем: любые файлы .jpg/.jpeg, которые начинаются с "slide", или содержат цифры
    const slideFiles = Array.from(files).filter(f => {
      const name = f.name.toLowerCase();
      const isImageFile = name.endsWith('.jpg') || name.endsWith('.jpeg');
      const isSlideFile = name.startsWith('slide');
      // Принимаем файлы которые либо называются slide*, либо это JPG файлы с цифрами в имени
      return isImageFile && isSlideFile;
    }).sort((a, b) => {
      // Извлекаем номер из имени файла
      const numA = parseInt(a.name.match(/\d+/)?.[0]) || 0;
      const numB = parseInt(b.name.match(/\d+/)?.[0]) || 0;
      return numA - numB;
    });

    console.log('Найденные слайды:', slideFiles.map(f => f.name));

    if (slideFiles.length === 0) {
      const allFiles = Array.from(files).map(f => f.name).join(', ');
      setError(`В выбранной папке не найдены JPG слайды. Файлы должны начинаться с "slide" и быть в формате .jpg или .jpeg\n\nНайденные файлы: ${allFiles}`);
      setCheckedSlides([]);
      setSelectedFolderPath('');
      return;
    }

    // Получаем путь к первому файлу для отображения
    const firstFile = slideFiles[0];
    let folderPath = firstFile.webkitRelativePath.split('/')[0];
    if (firstFile.webkitRelativePath.includes('/')) {
      folderPath = firstFile.webkitRelativePath.split('/').slice(0, -1).join('/');
    }

    // Подготавливаем данные о найденных слайдах
    // Frontend автоматически переименует их в slide1.jpg, slide2.jpg, и т.д.
    const slidesData = slideFiles.map((file, index) => ({
      filename: file.name,
      order: index + 1,
      size: file.size,
      file: file
    }));

    setSelectedFolderPath(folderPath);
    setCheckedSlides(slidesData);
    setSuccess(`✓ Найдено ${slidesData.length} слайдов`);
    setError('');
  };

  const handleUploadSlidesFromFolder = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    const newErrors = {};
    
    // Validate slides
    if (!checkedSlides || checkedSlides.length === 0) {
      newErrors.file = 'Select a folder with slides';
    }
    
    // Validate presentation title
    if (!presentationTitle || !presentationTitle.trim()) {
      newErrors.presentationTitle = 'Enter presentation name';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('');
      setSuccess('');
      setRecentlyUploadedPresentation(null);
      return;
    }

    console.log(`Uploading: ${checkedSlides.length} slides, title: "${presentationTitle}"`);
    setLoading(true);
    setError('');
    setSuccess('');
    setErrors({});
    setRecentlyUploadedPresentation(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('presentation_title', presentationTitle);
      
      // Add slide files with renaming
      console.log('Adding files (with renaming):');
      checkedSlides.forEach((slide, index) => {
        const newFilename = `slide${index + 1}.jpg`;
        console.log(`  ${index + 1}. ${slide.filename} → ${newFilename}`);
        formData.append('slides', slide.file, newFilename);
      });

      console.log('Sending request to server...');
      const response = await axios.post('/admin/slides/upload-from-files', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Server response:', response.data);
      setSuccess(`✅ Presentation uploaded successfully! Total slides: ${response.data.slides_count}`);
      
      // Store recently uploaded presentation data
      const newPresentation = {
        id: response.data.presentation_id,
        title: presentationTitle,
        slides_count: response.data.slides_count,
        uploaded_at: new Date().toLocaleString(),
        uploaded_by: currentUserEmail || 'Unknown'
      };
      
      setRecentlyUploadedPresentation(newPresentation);
      // Add to upload history (keep last 10)
      setUploadHistory([newPresentation, ...uploadHistory].slice(0, 10));
      
      // Clear form
      setPresentationTitle('');
      setCheckedSlides([]);
      setSelectedFolderPath('');
      setErrors({});
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
      
      // Reload presentations list
      setTimeout(() => fetchPresentations(), 1000);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Error uploading slides';
      setError(`❌ Upload failed: ${errorMsg}`);
      setRecentlyUploadedPresentation(null);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate form
    const newErrors = {};
    if (!newUser.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!newUser.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(newUser.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!newUser.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setUserErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        '/admin/create_user',
        null,
        {
          params: newUser,
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSuccess('✓ User created successfully');
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'user' });
      setUserErrors({});
      setShowAddUserModal(false);
      setShowPassword(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (userId, newRole) => {
    try {
      // If trying to change an admin to non-admin, check if there's at least one other admin
      if (newRole !== 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          setError('❌ Cannot remove admin rights! At least one administrator must remain in the system.');
          return;
        }
      }

      await axios.put(
        `/admin/set_role/${userId}`,
        null,
        {
          params: { role: newRole },
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSuccess('✓ Role updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error updating role');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const exportToExcel = () => {
    if (!report) return;

    // Prepare data for Excel
    let data = [];
    
    // Add summary section
    data.push(['REPORT SUMMARY']);
    data.push(['']);
    data.push(['Total Users', report.total_users]);
    data.push(['Completed', report.completed]);
    data.push(['In Progress', report.pending]);
    data.push(['Completion %', Math.round(report.completion_percentage) + '%']);
    if (presentationNameFilter) {
      data.push(['Presentation Filter', presentationNameFilter]);
    }
    data.push(['']);
    data.push(['']);

    // Add users section header
    data.push(['USER DETAILS']);
    data.push(['']);
    data.push(['Name', 'Email', 'Completed Presentations', 'Completed Count', 'Status']);
    
    // Add filtered users data
    const usersToExport = report.users
      .filter(user => {
        // Filter by presentation name if filter is set
        if (!presentationNameFilter) return true;
        
        const matchesPresentationName = user.completed_presentations && 
          user.completed_presentations.some(pres => 
            pres === presentationNameFilter
          );
        
        return matchesPresentationName;
      });

    usersToExport.forEach(user => {
      const presentations = user.completed_presentations && user.completed_presentations.length > 0 
        ? user.completed_presentations.join('; ')
        : '-';
      
      data.push([
        `${user.first_name} ${user.last_name}`,
        user.email,
        presentations,
        user.completion_count,
        user.is_completed ? 'Completed' : 'In Progress'
      ]);
    });

    // Create CSV content
    const csvContent = data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess('✓ Report exported successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🔐 Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
          {['presentations', 'upload', 'users', 'report'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'presentations' && <span>📁 Presentations</span>}
              {tab === 'upload' && <span>📤 Upload</span>}
              {tab === 'users' && <span>👥 Users</span>}
              {tab === 'report' && <span>📊 Reports</span>}
            </button>
          ))}
        </div>

        {/* Presentations Tab */}
        {activeTab === 'presentations' && (
          <div className="space-y-4">
            {/* Presentations List */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Presentations</h2>
              {presentations.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">No presentations uploaded</p>
              ) : (
                <div className="space-y-2">
                  {presentations.map(presentation => (
                    <div key={presentation.id}>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{presentation.title}</p>
                          <p className="text-xs text-gray-600">
                            {presentation.status === 'draft' ? '📝 Draft' : '✅ Published'}
                            {' • '}
                            {new Date(presentation.uploaded_at).toLocaleString('en-US')}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => navigate(`/slides?presentation_id=${presentation.id}&preview=true`)}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                            title="Preview presentation (test mode, won't count in reports)"
                          >
                            <Eye size={14} />
                            Preview
                          </button>
                          {presentation.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(presentation.id)}
                              disabled={publishingId === presentation.id}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition disabled:opacity-50"
                            >
                              <Play size={14} />
                              {publishingId === presentation.id ? 'Publishing...' : 'Publish'}
                            </button>
                          )}
                          {presentation.status === 'published' && (
                            <button
                              onClick={() => handleUnpublish(presentation.id)}
                              className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(presentation.id)}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Delete Confirmation Modal */}
                      {showDeleteConfirm === presentation.id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-5 max-w-md mx-4 shadow-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Delete Presentation?</h3>
                            <p className="text-gray-700 mb-4 text-sm">
                              Are you sure you want to delete "{presentation.title}"? This action will delete all slides from the database and cannot be undone.
                            </p>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-900 rounded text-sm hover:bg-gray-400 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeletePresentation(presentation.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📤 Upload Slides from Folder</h2>
            <form onSubmit={handleUploadSlidesFromFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Select Folder with Slides <span className="text-red-600">*</span></label>
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory="true"
                  mozdirectory="true"
                  onChange={handleFolderSelect}
                  className="hidden"
                  id="folder-input"
                />
                <label 
                  htmlFor="folder-input"
                  className="block w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition cursor-pointer text-center"
                >
                  <div className="text-2xl mb-1">📁</div>
                  <p className="font-semibold text-blue-600 text-sm">Click to select folder</p>
                  {selectedFolderPath && (
                    <p className="text-xs text-green-600 mt-1">✓ Selected: {selectedFolderPath}</p>
                  )}
                </label>
                {errors.file && <p className="text-xs text-red-600 mt-1">⚠️ {errors.file}</p>}
              </div>

              {/* Preview of found slides */}
              {checkedSlides.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">✓ Found Slides ({checkedSlides.length}):</h3>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                    {checkedSlides.slice(0, 16).map(slide => (
                      <div key={slide.filename} className="p-1 bg-white rounded border border-blue-200 text-center text-xs">
                        <div className="font-semibold text-blue-600">#{slide.order}</div>
                      </div>
                    ))}
                  </div>
                  {checkedSlides.length > 16 && (
                    <div className="text-xs text-gray-500 mt-1">... and {checkedSlides.length - 16} more</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Presentation Name <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Biology Presentation"
                  value={presentationTitle}
                  onChange={(e) => {
                    setPresentationTitle(e.target.value);
                    setErrors({...errors, presentationTitle: ''});
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.presentationTitle && <p className="text-xs text-red-600 mt-1">⚠️ {errors.presentationTitle}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-2 rounded-lg transition text-sm ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                    : checkedSlides.length > 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {loading ? '⏳ Uploading...' : checkedSlides.length > 0 ? `✓ Upload ${checkedSlides.length} Slides` : '⚠️ Select Folder & Name'}
              </button>
            </form>

            {/* Recently Uploaded Presentation */}
            {recentlyUploadedPresentation && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-3 mt-4">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <h3 className="text-sm font-bold text-green-900">✅ Upload Successful!</h3>
                    <p className="text-xs text-green-700 mt-0.5">Presentation has been uploaded successfully.</p>
                  </div>
                </div>
                
                {/* Recently uploaded presentation details */}
                <div className="bg-white rounded-lg p-2 mt-2 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Presentation Name</p>
                      <p className="text-xs font-bold text-gray-900">{recentlyUploadedPresentation.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Number of Slides</p>
                      <p className="text-xs font-bold text-blue-600">📊 {recentlyUploadedPresentation.slides_count} slides</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Upload Date & Time</p>
                      <p className="text-xs text-gray-700">📅 {recentlyUploadedPresentation.uploaded_at}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Uploaded By</p>
                      <p className="text-xs text-gray-700">👤 {recentlyUploadedPresentation.uploaded_by}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Add User Button */}
            <button
              onClick={() => {
                setShowAddUserModal(true);
                setUserErrors({});
                setShowPassword(false);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
            >
              <Plus size={16} />
              Add User
            </button>

            {/* Modal - Add User */}
            {showAddUserModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                    <button
                      onClick={() => {
                        setShowAddUserModal(false);
                        setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'user' });
                        setUserErrors({});
                        setShowPassword(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-3">
                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. John"
                        value={newUser.first_name}
                        onChange={(e) => {
                          setNewUser({ ...newUser, first_name: e.target.value });
                          setUserErrors({ ...userErrors, first_name: '' });
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          userErrors.first_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {userErrors.first_name && (
                        <p className="text-xs text-red-600 mt-0.5">⚠️ {userErrors.first_name}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Doe"
                        value={newUser.last_name}
                        onChange={(e) => {
                          setNewUser({ ...newUser, last_name: e.target.value });
                          setUserErrors({ ...userErrors, last_name: '' });
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          userErrors.last_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {userErrors.last_name && (
                        <p className="text-xs text-red-600 mt-0.5">⚠️ {userErrors.last_name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={newUser.email}
                        onChange={(e) => {
                          setNewUser({ ...newUser, email: e.target.value });
                          setUserErrors({ ...userErrors, email: '' });
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          userErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {userErrors.email && (
                        <p className="text-xs text-red-600 mt-0.5">⚠️ {userErrors.email}</p>
                      )}
                    </div>

                    {/* Password with Show/Hide */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="e.g. MyPassword123"
                          value={newUser.password}
                          onChange={(e) => {
                            setNewUser({ ...newUser, password: e.target.value });
                            setUserErrors({ ...userErrors, password: '' });
                          }}
                          className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            userErrors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {userErrors.password && (
                        <p className="text-xs text-red-600 mt-0.5">⚠️ {userErrors.password}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">👨‍💼 Admin</option>
                      </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUserModal(false);
                          setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'user' });
                          setUserErrors({});
                          setShowPassword(false);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
                      >
                        {loading ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 text-xs">Name</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 text-xs">Email</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 text-xs">Role</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs">{user.first_name} {user.last_name}</td>
                        <td className="py-2 px-2 text-xs">{user.email}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? '👨‍💼 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="py-2 px-2 space-x-1">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleSetRole(user.id, 'admin')}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-xs"
                            >
                              Make Admin
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleSetRole(user.id, 'user')}
                              className="text-gray-600 hover:text-gray-700 font-semibold text-xs"
                            >
                              Remove Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Reports</h2>
              <button
                onClick={exportToExcel}
                disabled={!report}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileUp size={16} />
                Export to Excel
              </button>
            </div>
            
            {/* Presentation Filter - Dropdown */}
            {report && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Filter by Presentation Name:</p>
                <select
                  value={presentationNameFilter}
                  onChange={(e) => setPresentationNameFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Presentations</option>
                  {report.all_presentations && Array.isArray(report.all_presentations) && 
                    report.all_presentations.sort().map(pres => (
                      <option key={pres} value={pres}>{pres}</option>
                    ))
                  }
                </select>
              </div>
            )}
            
            {report && (
              <>
                {/* Stat Cards - Single Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'all' ? null : 'all')}
                    className={`rounded-lg p-3 border-2 cursor-pointer transition ${
                      reportFilter === 'all' 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <p className="text-gray-600 text-xs font-semibold mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{report.total_users}</p>
                  </div>
                  
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'completed' ? null : 'completed')}
                    className={`rounded-lg p-3 border-2 cursor-pointer transition ${
                      reportFilter === 'completed' 
                        ? 'bg-green-100 border-green-500' 
                        : 'bg-green-50 border-green-200 hover:border-green-400'
                    }`}
                  >
                    <p className="text-gray-600 text-xs font-semibold mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{report.completed}</p>
                  </div>
                  
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'pending' ? null : 'pending')}
                    className={`rounded-lg p-3 border-2 cursor-pointer transition ${
                      reportFilter === 'pending' 
                        ? 'bg-yellow-100 border-yellow-500' 
                        : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                    }`}
                  >
                    <p className="text-gray-600 text-xs font-semibold mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{report.pending}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-gray-600 text-xs font-semibold mb-1">Completion %</p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(report.completion_percentage)}%</p>
                  </div>
                </div>

                {/* Filtered Users List */}
                {reportFilter && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {reportFilter === 'all' && 'All Users'}
                      {reportFilter === 'completed' && 'Completed'}
                      {reportFilter === 'pending' && 'In Progress'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Name</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Presentations</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Completed Count</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.users
                            .filter(user => {
                              // Filter by presentation name if filter is set
                              if (!presentationNameFilter) return true;
                              
                              const matchesPresentationName = user.completed_presentations && 
                                user.completed_presentations.some(pres => 
                                  pres === presentationNameFilter
                                );
                              
                              return matchesPresentationName;
                            })
                            .map(user => (
                              <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-2 px-2 text-gray-800">
                                  {user.first_name} {user.last_name}
                                </td>
                                <td className="py-2 px-2 text-gray-600">{user.email}</td>
                                <td className="py-2 px-2 text-gray-700">
                                  <div className="max-w-xs">
                                    {user.completed_presentations && user.completed_presentations.length > 0 ? (
                                      <ul className="list-disc list-inside text-gray-600">
                                        {user.completed_presentations.map((pres, idx) => (
                                          <li key={idx} className={presentationNameFilter === pres ? 'text-blue-600 font-semibold' : ''}>
                                            {pres}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-gray-800 font-semibold">{user.completion_count}</td>
                                <td className="py-2 px-2">
                                  {user.is_completed ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                                      ✓ Done
                                    </span>
                                  ) : (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                                      ⏳ Progress
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
