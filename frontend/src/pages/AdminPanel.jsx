import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Users, LogOut, AlertCircle, CheckCircle, Trash2, FileUp, Play, X, Edit2, Save } from 'lucide-react';

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
  
  // Для редактирования слайдов
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [slides, setSlides] = useState([]);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [editingSlideTitle, setEditingSlideTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Для проверки папки со слайдами
  const [checkedSlides, setCheckedSlides] = useState([]);
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const folderInputRef = useRef(null);
  
  // Для фильтра пользователей в отчёте
  const [reportFilter, setReportFilter] = useState(null); // null, 'all', 'completed', 'pending'
  const [filteredReportUsers, setFilteredReportUsers] = useState([]);
  
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Проверка авторизации и роли при загрузке
  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/login');
    }
  }, [token, role, navigate]);

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
      setSelectedPresentation(null);
      setSlides([]);
    } catch (err) {
      console.error('Ошибка при загрузке презентаций:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Ошибка при загрузке презентаций');
      }
    }
  };

  const fetchSlides = async (presentationId) => {
    try {
      const response = await axios.get(`/admin/slides/${presentationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSlides(response.data.data);
      setSelectedPresentation(presentationId);
    } catch (err) {
      console.error('Ошибка при загрузке слайдов:', err);
      setError('Ошибка при загрузке слайдов');
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

  const handleUpdateSlideTitle = async (slideId, newTitle) => {
    try {
      await axios.put(`/admin/slides/${slideId}/title`, { title: newTitle }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('✓ Название слайда обновлено');
      setEditingSlideId(null);
      fetchSlides(selectedPresentation);
    } catch (err) {
      setError('Ошибка при обновлении названия слайда');
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
    
    // Проверяем все условия
    if (!checkedSlides || checkedSlides.length === 0) {
      setError('❌ Выберите папку со слайдами! Нажмите на кнопку "📁 Нажмите для выбора папки"');
      setSuccess('');
      return;
    }
    
    if (!presentationTitle || !presentationTitle.trim()) {
      setError('❌ Введите название презентации!');
      setSuccess('');
      return;
    }

    console.log(`Начинаем загрузку: ${checkedSlides.length} слайдов, название: "${presentationTitle}"`);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Создаем FormData для отправки файлов
      const formData = new FormData();
      formData.append('presentation_title', presentationTitle);
      
      // Добавляем файлы слайдов с переименованием
      console.log('Добавляем файлы (с переименованием):');
      checkedSlides.forEach((slide, index) => {
        const newFilename = `slide${index + 1}.jpg`;  // Переименовываем в slide1.jpg, slide2.jpg, ...
        console.log(`  ${index + 1}. ${slide.filename} → ${newFilename}`);
        formData.append('slides', slide.file, newFilename);
      });

      console.log('Отправляем запрос на сервер...');
      const response = await axios.post('/admin/slides/upload-from-files', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Ответ сервера:', response.data);
      setSuccess(`✅ Презентация загружена! Всего слайдов: ${response.data.slides_count}`);
      
      // Очищаем форму
      setPresentationTitle('');
      setCheckedSlides([]);
      setSelectedFolderPath('');
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
      
      // Перезагружаем список презентаций
      setTimeout(() => fetchPresentations(), 1000);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Ошибка при загрузке слайдов';
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(
        '/admin/create_user',
        null,
        {
          params: newUser,
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSuccess('✓ Пользователь создан');
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (userId, newRole) => {
    try {
      await axios.put(
        `/admin/set_role/${userId}`,
        null,
        {
          params: { role: newRole },
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSuccess('✓ Роль обновлена');
      fetchUsers();
    } catch (err) {
      setError('Ошибка при обновлении роли');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🔐 Административная панель</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Выход
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
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {['presentations', 'upload', 'users', 'report'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'presentations' && <span>📁 Презентации</span>}
              {tab === 'upload' && <span>📤 Загрузить</span>}
              {tab === 'users' && <span>👥 Пользователи</span>}
              {tab === 'report' && <span>📊 Отчет</span>}
            </button>
          ))}
        </div>

        {/* Presentations Tab */}
        {activeTab === 'presentations' && (
          <div className="space-y-8">
            {/* Presentations List */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Загруженные презентации</h2>
              {presentations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Нет загруженных презентаций</p>
              ) : (
                <div className="space-y-4">
                  {presentations.map(presentation => (
                    <div key={presentation.id}>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
                        <div className="flex-1 cursor-pointer" onClick={() => {
                          if (selectedPresentation === presentation.id) {
                            setSelectedPresentation(null);
                            setSlides([]);
                          } else {
                            fetchSlides(presentation.id);
                          }
                        }}>
                          <p className="font-semibold text-gray-900">{presentation.title}</p>
                          <p className="text-sm text-gray-600">
                            {presentation.status === 'draft' ? '📝 Черновик' : '✅ Опубликована'}
                            {' • '}
                            {new Date(presentation.uploaded_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {presentation.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(presentation.id)}
                              disabled={publishingId === presentation.id}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                              <Play size={18} />
                              {publishingId === presentation.id ? 'Публикация...' : 'Опубликовать'}
                            </button>
                          )}
                          {presentation.status === 'published' && (
                            <button
                              onClick={() => handleUnpublish(presentation.id)}
                              className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                            >
                              Снять с публикации
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(presentation.id)}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                          >
                            <Trash2 size={18} />
                            Удалить
                          </button>
                        </div>
                      </div>

                      {/* Slides Editor */}
                      {selectedPresentation === presentation.id && slides.length > 0 && (
                        <div className="mt-4 ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-4">Слайды ({slides.length})</h3>
                          <div className="space-y-3">
                            {slides.map(slide => (
                              <div key={slide.id} className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                                <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-sm font-semibold text-gray-700">
                                  {slide.order}
                                </div>
                                {editingSlideId === slide.id ? (
                                  <div className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={editingSlideTitle}
                                      onChange={(e) => setEditingSlideTitle(e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateSlideTitle(slide.id, editingSlideTitle)}
                                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                                    >
                                      <Save size={16} />
                                      Сохранить
                                    </button>
                                    <button
                                      onClick={() => setEditingSlideId(null)}
                                      className="flex items-center gap-1 bg-gray-400 text-white px-3 py-2 rounded hover:bg-gray-500"
                                    >
                                      <X size={16} />
                                      Отмена
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-between">
                                    <p className="text-gray-800">{slide.title || 'Слайд без названия'}</p>
                                    <button
                                      onClick={() => {
                                        setEditingSlideId(slide.id);
                                        setEditingSlideTitle(slide.title || '');
                                      }}
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit2 size={16} />
                                      Редактировать
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete Confirmation Modal */}
                      {showDeleteConfirm === presentation.id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Удалить презентацию?</h3>
                            <p className="text-gray-700 mb-6">
                              Вы уверены, что хотите удалить "{presentation.title}"? Это действие удалит все слайды из базы данных и не может быть отменено.
                            </p>
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition"
                              >
                                Отмена
                              </button>
                              <button
                                onClick={() => handleDeletePresentation(presentation.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                              >
                                Удалить
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
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📤 Загрузить слайды из папки</h2>
            <form onSubmit={handleUploadSlidesFromFolder} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Выберите папку со слайдами</label>
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
                  className="block w-full px-6 py-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition cursor-pointer text-center"
                >
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-semibold text-blue-600">Нажмите для выбора папки</p>
                  <p className="text-sm text-gray-600 mt-1">или перетащите папку сюда</p>
                  {selectedFolderPath && (
                    <p className="text-xs text-green-600 mt-2">✓ Выбрана папка: {selectedFolderPath}</p>
                  )}
                </label>
              </div>

              {/* Preview of found slides */}
              {checkedSlides.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">✓ Найденные слайды ({checkedSlides.length}):</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {checkedSlides.slice(0, 12).map(slide => (
                      <div key={slide.filename} className="p-2 bg-white rounded border border-blue-200 text-center text-sm">
                        <div className="font-semibold text-blue-600">#{slide.order}</div>
                        <div className="text-xs text-gray-500">{(slide.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ))}
                  </div>
                  {checkedSlides.length > 12 && (
                    <div className="text-xs text-gray-500 mt-2">... и ещё {checkedSlides.length - 12} слайдов</div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Название презентации</label>
                <input
                  type="text"
                  placeholder="Например: Грамположительные и грамотрицательные бактерии"
                  value={presentationTitle}
                  onChange={(e) => setPresentationTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-semibold py-3 rounded-lg transition ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                    : checkedSlides.length > 0
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {loading ? '⏳ Загрузка...' : checkedSlides.length > 0 ? `✓ Загрузить ${checkedSlides.length} слайдов` : '⚠️ Выберите папку и введите название'}
              </button>
            </form>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Как использовать:</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Конвертируйте ваш PPTX файл в JPG файлы используя внешний инструмент (например LibreOffice, Python-pptx или онлайн конвертер)</li>
                <li>Сохраните все JPG файлы в одну папку на вашем компьютере</li>
                <li>Назовите файлы в порядке: <code className="bg-white px-2 py-1 rounded text-xs">slide1.jpg</code>, <code className="bg-white px-2 py-1 rounded text-xs">slide2.jpg</code>, и т.д.</li>
                <li>Нажмите на кнопку "Нажмите для выбора папки"</li>
                <li>Выберите папку со слайдами (откроется проводник/Finder)</li>
                <li>Введите название презентации</li>
                <li>Нажмите "Загрузить слайды"</li>
              </ol>
            </div>

            <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Примеры путей на разных ОС:</h3>
              <div className="space-y-2 text-sm font-mono text-gray-700">
                <div><strong>macOS:</strong> /Users/john/Documents/presentation_slides</div>
                <div><strong>Windows:</strong> C:\Users\john\Documents\presentation_slides</div>
                <div><strong>Linux:</strong> /home/john/presentation_slides</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Create User Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Создать пользователя</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Имя"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Фамилия"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать пользователя'}
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Список пользователей</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Имя</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Роль</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{user.first_name} {user.last_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full font-semibold ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? '👨‍💼 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleSetRole(user.id, 'admin')}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Назначить админом
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleSetRole(user.id, 'user')}
                              className="text-gray-600 hover:text-gray-700 font-semibold"
                            >
                              Снять права админа
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Отчет об ознакомлении</h2>
            {report && (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'all' ? null : 'all')}
                    className={`rounded-lg p-6 border-2 cursor-pointer transition ${
                      reportFilter === 'all' 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <p className="text-gray-600 text-sm font-semibold mb-2">Всего пользователей</p>
                    <p className="text-3xl font-bold text-blue-600">{report.total_users}</p>
                  </div>
                  
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'completed' ? null : 'completed')}
                    className={`rounded-lg p-6 border-2 cursor-pointer transition ${
                      reportFilter === 'completed' 
                        ? 'bg-green-100 border-green-500' 
                        : 'bg-green-50 border-green-200 hover:border-green-400'
                    }`}
                  >
                    <p className="text-gray-600 text-sm font-semibold mb-2">Завершили</p>
                    <p className="text-3xl font-bold text-green-600">{report.completed}</p>
                  </div>
                  
                  <div 
                    onClick={() => setReportFilter(reportFilter === 'pending' ? null : 'pending')}
                    className={`rounded-lg p-6 border-2 cursor-pointer transition ${
                      reportFilter === 'pending' 
                        ? 'bg-yellow-100 border-yellow-500' 
                        : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                    }`}
                  >
                    <p className="text-gray-600 text-sm font-semibold mb-2">В процессе</p>
                    <p className="text-3xl font-bold text-yellow-600">{report.pending}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <p className="text-gray-600 text-sm font-semibold mb-2">Процент выполнения</p>
                    <p className="text-3xl font-bold text-purple-600">{Math.round(report.completion_percentage)}%</p>
                  </div>
                </div>

                {/* Filtered Users List */}
                {reportFilter && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {reportFilter === 'all' && 'Все пользователи'}
                      {reportFilter === 'completed' && 'Пользователи, завершившие'}
                      {reportFilter === 'pending' && 'Пользователи в процессе'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">ФИО</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Завершено презентаций</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.users
                            .filter(user => {
                              if (reportFilter === 'all') return true;
                              if (reportFilter === 'completed') return user.is_completed;
                              if (reportFilter === 'pending') return !user.is_completed;
                              return false;
                            })
                            .map(user => (
                              <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-800">
                                  {user.first_name} {user.last_name}
                                </td>
                                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                                <td className="py-3 px-4 text-gray-800 font-semibold">{user.completion_count}</td>
                                <td className="py-3 px-4">
                                  {user.is_completed ? (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                      ✓ Завершено
                                    </span>
                                  ) : (
                                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                                      ⏳ В процессе
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
