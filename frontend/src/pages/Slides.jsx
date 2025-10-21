import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ChevronLeft, ChevronRight, Check, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import ConfirmModal from '../components/ConfirmModal';

const Slides = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [userName, setUserName] = useState('');
  const [lastPosition, setLastPosition] = useState(null);
  const [presentationId, setPresentationId] = useState(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  
  // ✅ Используем новый модуль Toast
  const { toasts, error, success, info, warning, clearAll } = useToast();
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Check if presentation_id is provided
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('presentation_id');
    const previewMode = params.get('preview') === 'true';
    
    setPresentationId(pId);
    setIsPreviewMode(previewMode);
    
    // Get user name from localStorage
    const storedEmail = localStorage.getItem('email') || 'User';
    setUserName(storedEmail.split('@')[0]);
    
    if (!pId) {
      console.warn('⚠️ No presentation_id provided - redirecting to presentations list');
      navigate('/presentations');
      return;
    }

    const fetchSlides = async () => {
      try {
        console.log('🔄 Fetching slides for presentation:', pId);
        
        const response = await api.get(`/slides/list?presentation_id=${pId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Slides loaded:', response.data);
        setSlides(response.data.slides || response.data);
        
        // ✅ ВСЕГДА восстанавливаем сохранённую позицию
        if (!previewMode) {
          const savedPosition = response.data.last_slide_index ?? 0;
          console.log('📍 Restoring position from API:', savedPosition);
          setLastPosition(savedPosition);
          
          const totalSlides = response.data.slides?.length || response.data.length || 0;
          const validPosition = Math.min(savedPosition, totalSlides - 1);
          
          console.log(`📍 Setting slide to ${validPosition} (out of ${totalSlides})`);
          setCurrentSlideIndex(validPosition);
          
          // ✅ Показываем сообщение только если позиция > 0
          if (validPosition > 0) {
            success(`� Resuming from slide ${validPosition + 1}`, 4000);
          }
        }
        
        if (!previewMode) {
          fetchProgress();
        }
      } catch (err) {
        console.error('❌ Error loading slides:', err);
        error(`Error loading slides: ${err.response?.data?.detail || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [token, navigate, success, error]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (toasts.success) {
      const timer = setTimeout(() => {
        // Toast автоматически исчезает благодаря useToast
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts.success]);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/slides/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleMarkViewed = async () => {
    if (!slides[currentSlideIndex] || isPreviewMode) return;

    try {
      await api.post(
        `/slides/mark/${slides[currentSlideIndex].id}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const newSlides = [...slides];
      newSlides[currentSlideIndex].viewed = true;
      setSlides(newSlides);
      
      success('✅ Slide marked as viewed', 3000);
      fetchProgress();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error marking slide';
      error(`❌ ${errorMsg}`, 5000);
      console.error('Error:', err);
    }
  };

  const handleComplete = async () => {
    if (isPreviewMode) {
      success('✅ Preview mode - changes not saved', 3000);
      return;
    }

    setCompleting(true);
    clearAll();

    try {
      const response = await api.post(
        '/slides/complete',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        success('🎉 Training completed successfully!', 4000);
      } else {
        const missing = response.data.missing_slides.join(', ');
        error(`⚠️ You have not reviewed slides: ${missing}`, 5000);
      }
    } catch (err) {
      error('Error completing training', 5000);
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      const currentSlide = slides[currentSlideIndex];
      
      // ✅ ГЛАВНОЕ: Проверяем что слайд помечен
      if (!currentSlide.viewed && !isPreviewMode) {
        // ✅ Показываем МОДАЛЬНОЕ ОКНО вместо toast
        setShowSkipWarning(true);
        console.warn('⚠️ User tried to skip slide without marking as viewed');
        return;
      }
      
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
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
          <p className="text-gray-600 text-sm">Loading slides...</p>
        </div>
      </div>
    );
  }

  if (error && slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-600 mb-3" size={40} />
          <p className="text-gray-900 font-semibold mb-4 text-sm">{error}</p>
          <p className="text-gray-600 text-xs mb-4">Debug: {typeof error === 'string' ? error : JSON.stringify(error)}</p>
          <button
            onClick={() => window.location.href = '/presentations'}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Back to Presentations
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
          <p className="text-gray-600 mb-4 text-sm">Slides have not yet been loaded by administrator</p>
          <button
            onClick={() => window.location.href = '/presentations'}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Back to Presentations
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex items-center justify-between px-2 py-2 bg-white bg-opacity-90 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              if (isPreviewMode) {
                // Admin preview mode - go back to admin panel
                navigate('/admin');
              } else {
                // User normal mode - go back to presentations list
                navigate('/presentations');
              }
            }}
            className="flex items-center gap-0.5 bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition text-xs font-semibold flex-shrink-0"
          >
            <ChevronLeft size={12} />
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate">SnapCheck</h1>
          {isPreviewMode && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
              🔍 Preview Mode
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 flex-shrink-0"
        >
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-0.5 bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition text-xs flex-shrink-0"
          >
            <LogOut size={12} />
            Logout
          </button>
        </button>
      </div>

      {/* Main Content Area - Flexible */}
      <div className="flex-1 overflow-hidden flex flex-col relative px-2 py-2 gap-1">
        {/* ✅ Оповещения - используем новый модуль Toast */}
        <div className="space-y-2 flex-shrink-0">
          {toasts.error && <Toast type="error" message={toasts.error} duration={5000} />}
          {toasts.success && <Toast type="success" message={toasts.success} duration={4000} />}
          {toasts.info && <Toast type="info" message={toasts.info} duration={4000} />}
          {toasts.warning && <Toast type="warning" message={toasts.warning} duration={5000} />}
        </div>

        {/* Progress Bar - Minimal Height */}
        {progress && (
          <div className="bg-white rounded-lg shadow-sm p-1.5 flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-semibold text-gray-700">Progress</span>
              <span className="text-xs font-bold text-blue-600">{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Просмотрено {progress.viewed_count} из {progress.total_count} слайдов
            </p>
          </div>
        )}

        {/* Slide Container - Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-lg shadow-lg relative">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-0.5"></div>
          
          {/* Slide Info - Minimal */}
          <div className="text-center px-2 py-1 flex-shrink-0 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-900">
              Slide {currentSlideIndex + 1} of {slides.length}
            </h2>
          </div>

          {/* Slide Image - Responsive */}
          <div className="flex-1 overflow-hidden flex items-center justify-center px-2 py-2">
            <img 
              src={`/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`}
              alt={`Slide ${currentSlideIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded shadow-md"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23E5E7EB" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="18"%3ESlide Preview%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Slide Status and Controls - Bottom Row */}
          <div className="border-t border-gray-100 px-2 py-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              {/* Left - Prev Button */}
              <button
                onClick={handlePrev}
                disabled={isFirstSlide}
                className="flex items-center justify-center gap-0.5 bg-gray-600 text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs flex-shrink-0"
                title="Previous slide"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              {/* Center - Mark as Viewed or Viewed Badge */}
              <div className="flex-1">
                {currentSlide.viewed ? (
                  <div className="flex items-center gap-0.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs justify-center h-full">
                    <Check className="text-blue-600" size={12} />
                    <span className="text-blue-700 font-semibold">Viewed</span>
                  </div>
                ) : (
                  <button
                    onClick={handleMarkViewed}
                    disabled={isPreviewMode}
                    className={`w-full font-semibold py-1 px-2 rounded flex items-center justify-center gap-1 text-xs transition ${
                      isPreviewMode 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                    }`}
                    title={isPreviewMode ? 'Disabled in preview mode' : 'Mark this slide as viewed'}
                  >
                    <Check size={12} />
                    {isPreviewMode ? 'Preview Mode' : 'Mark as Viewed'}
                  </button>
                )}
              </div>

              {/* Right - Next Button */}
              <button
                onClick={handleNext}
                disabled={isLastSlide || (!isPreviewMode && !currentSlide.viewed)}
                className={`flex items-center justify-center gap-0.5 px-2 py-1 rounded-lg font-semibold text-xs flex-shrink-0 transition ${
                  isLastSlide 
                    ? 'bg-gray-600 text-white opacity-30 cursor-not-allowed'
                    : !isPreviewMode && !currentSlide.viewed
                    ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                title={
                  isLastSlide 
                    ? 'Last slide' 
                    : !isPreviewMode && !currentSlide.viewed
                    ? 'Mark current slide as viewed first'
                    : 'Next slide'
                }
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Controls - Fixed Height */}
        <div className="flex gap-1 flex-shrink-0 relative">
          <button
            onClick={handleComplete}
            disabled={completing || isPreviewMode}
            className={`flex-1 text-white font-semibold py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1 group ${
              isPreviewMode
                ? 'bg-gray-400'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            }`}
            title={isPreviewMode ? 'Preview mode - cannot complete' : 'Complete your review once you\'ve viewed all slides'}
          >
            {completing ? 'Completing...' : '🎉 Complete Review'}
            
            {/* Tooltip */}
            {!isPreviewMode && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {isPreviewMode ? 'Preview mode - cannot complete' : 'Complete your review after viewing all slides'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </button>
        </div>

        {/* Slide Thumbnails - Fixed Height */}
        <div className="bg-white rounded-lg shadow-sm p-1 flex-shrink-0 max-h-[70px] overflow-y-auto">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(32px, 1fr))` }}>
            {slides.map((slide, idx) => {
              // ✅ Определяем доступность слайда
              let isAccessible = idx === 0; // Первый слайд всегда доступен
              
              if (!isAccessible && idx > 0 && !isPreviewMode) {
                // Проверяем просмотрены ли все предыдущие слайды
                isAccessible = slides.slice(0, idx).every(s => s.viewed);
              }
              
              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    if (isAccessible || isPreviewMode) {
                      setCurrentSlideIndex(idx);
                    } else {
                      error('❌ Please review all previous slides first');
                    }
                  }}
                  disabled={!isAccessible && !isPreviewMode}
                  className={`w-8 h-8 rounded font-bold transition text-xs flex items-center justify-center ${
                    idx === currentSlideIndex
                      ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                      : slide.viewed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                      : isAccessible || isPreviewMode
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    isAccessible || isPreviewMode
                      ? `Slide ${idx + 1}`
                      : `Review previous slides first`
                  }
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ Skip Warning Modal */}
      <ConfirmModal
        isOpen={showSkipWarning}
        type="warning"
        title="Cannot Skip"
        message="Please review this slide and click the 'Mark as Viewed' button before proceeding to the next slide."
        confirmText="OK, I understand"
        onConfirm={() => setShowSkipWarning(false)}
        onCancel={() => setShowSkipWarning(false)}
      />
    </div>
  );
};

export default Slides;
