import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { ChevronLeft, ChevronRight, Check, LogOut, AlertCircle, CheckCircle, Maximize, Minimize } from 'lucide-react';
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
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideControlsTimer, setHideControlsTimer] = useState(null);
  const slideContainerRef = React.useRef(null);
  
  // ✅ Используем новый модуль Toast
  const { toasts, error, success, info, warning, clearAll } = useToast();
  
  // Проверка, все ли слайды просмотрены
  const allSlidesViewed = slides.every(slide => slide.viewed);
  
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

  // Обработчик клика по слайду для toggle меню (как в YouTube)
  const handleSlideClick = (e) => {
    // Игнорировать клики по кнопкам и контролам
    if (e.target.closest('button') || e.target.closest('.controls-area')) {
      return;
    }
    
    // Toggle показ контролов
    setShowControls(prev => !prev);
    
    // Если показали контролы, установить таймер автоскрытия
    if (!showControls && isFullscreen) {
      if (hideControlsTimer) {
        clearTimeout(hideControlsTimer);
      }
      
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      setHideControlsTimer(timer);
    }
  };

  // Cleanup таймера при unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimer) {
        clearTimeout(hideControlsTimer);
      }
    };
  }, [hideControlsTimer]);

  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // Hide controls after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  // Handle screen tap to show/hide controls on mobile
  const handleScreenTap = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    // Hide controls after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Toggle fullscreen mode
  const toggleFullscreen = async () => {
    const elem = slideContainerRef.current;
    if (!elem) return;
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        await elem.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { // Safari
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        await document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

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
      {/* Header - Fixed Height - Hidden on mobile when controls hidden, always visible in fullscreen mode */}
      <div className={`flex items-center justify-between px-2 py-2 bg-white bg-opacity-90 flex-shrink-0 border-b border-gray-200 transition-all duration-300 z-50 ${
        showControls || isFullscreen ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 -translate-y-full opacity-0'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              if (isPreviewMode) {
                navigate('/admin');
              } else {
                navigate('/presentations');
              }
            }}
            className="flex items-center gap-0.5 bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition text-xs font-semibold flex-shrink-0"
          >
            <ChevronLeft size={12} />
            Back
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">SnapCheck</h1>
          {isPreviewMode && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold hidden sm:inline-block">
              🔍 Preview Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Fullscreen Toggle Button - Hidden when in fullscreen */}
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-0.5 bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 transition text-xs flex-shrink-0"
              title="Enter fullscreen"
            >
              <Maximize size={14} />
              <span className="hidden sm:inline">Full</span>
            </button>
          )}
          
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-gray-700">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-0.5 bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition text-xs flex-shrink-0"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Flexible */}
      <div 
        className="flex-1 overflow-hidden flex flex-col relative md:px-2 md:py-2 md:gap-1"
        onClick={handleSlideClick}
        onTouchStart={handleSlideClick}
      >
        {/* ✅ Оповещения - используем новый модуль Toast */}
        <div className={`space-y-2 flex-shrink-0 transition-all duration-300 px-2 ${
          showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 -translate-y-full opacity-0 absolute top-0 pointer-events-none'
        }`}>
          {toasts.error && <Toast type="error" message={toasts.error} duration={5000} />}
          {toasts.success && <Toast type="success" message={toasts.success} duration={4000} />}
          {toasts.info && <Toast type="info" message={toasts.info} duration={4000} />}
          {toasts.warning && <Toast type="warning" message={toasts.warning} duration={5000} />}
        </div>

        {/* Progress Bar - Minimal Height - Hidden on mobile when controls hidden */}
        {progress && (
          <div className={`bg-white rounded-lg shadow-sm p-1.5 flex-shrink-0 mx-2 md:mx-0 transition-all duration-300 ${
            showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 -translate-y-full opacity-0 absolute top-0 pointer-events-none'
          }`}>
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

        {/* Slide Container - Main Content - Full screen on mobile */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white md:rounded-lg md:shadow-lg relative md:mx-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-0.5 hidden md:block"></div>
          
          {/* Slide Info - Minimal - Hidden on mobile when controls hidden */}
          <div className={`text-center px-2 py-1 flex-shrink-0 border-b border-gray-100 transition-all duration-300 ${
            showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 -translate-y-full opacity-0 h-0 overflow-hidden md:h-auto md:overflow-visible'
          }`}>
            <h2 className="text-xs font-bold text-gray-900">
              Slide {currentSlideIndex + 1} of {slides.length}
            </h2>
          </div>

          {/* Slide Image Container with Fullscreen Support - FULL SCREEN ON MOBILE */}
          <div 
            ref={slideContainerRef}
            className="flex-1 overflow-hidden flex flex-col items-center justify-center md:px-2 md:py-2 bg-black relative"
          >
            {/* Slide Image */}
            <img 
              src={`/api/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`}
              alt={`Slide ${currentSlideIndex + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23E5E7EB" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="18"%3ESlide Preview%3C/text%3E%3C/svg%3E';
              }}
            />

            {/* Controls Overlay - Shows ONLY in fullscreen mode */}
            {isFullscreen && (
              <div className={`controls-area absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-20 pb-4 px-4 transition-all duration-300 ${
                showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}>
              {/* Top Row - Slide Counter and Fullscreen Button */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-semibold">
                  Slide {currentSlideIndex + 1} of {slides.length}
                </p>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold shadow-lg"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  <span>{isFullscreen ? 'Exit' : 'Full'}</span>
                </button>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                {/* Left - Prev Button */}
                <button
                  onClick={handlePrev}
                  disabled={isFirstSlide}
                  className="flex items-center justify-center gap-1 bg-white/90 text-gray-900 px-3 py-2 rounded-lg hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm flex-shrink-0 shadow-lg"
                  title="Previous slide"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Center - Mark as Viewed or Viewed Badge */}
                <div className="flex-1">
                  {currentSlide.viewed ? (
                    <div className="flex items-center gap-1 bg-blue-500 px-3 py-2 rounded-lg text-sm justify-center h-full shadow-lg">
                      <Check className="text-white" size={14} />
                      <span className="text-white font-semibold">{allSlidesViewed ? 'Completed' : 'Viewed'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkViewed}
                      disabled={isPreviewMode}
                      className={`w-full font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-sm transition shadow-lg ${
                        isPreviewMode 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                      title={isPreviewMode ? 'Disabled in preview mode' : 'Mark this slide as viewed'}
                    >
                      <Check size={14} />
                      {isPreviewMode ? <span className="hidden sm:inline">Preview Mode</span> : <span>Mark as Viewed</span>}
                    </button>
                  )}
                </div>

                {/* Right - Next Button */}
                <button
                  onClick={handleNext}
                  disabled={isLastSlide || (!isPreviewMode && !currentSlide.viewed)}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm flex-shrink-0 transition shadow-lg ${
                    isLastSlide 
                      ? 'bg-white/90 text-gray-900 opacity-30 cursor-not-allowed'
                      : !isPreviewMode && !currentSlide.viewed
                      ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-not-allowed'
                      : 'bg-white/90 text-gray-900 hover:bg-white'
                  }`}
                  title={
                    isLastSlide 
                      ? 'Last slide' 
                      : !isPreviewMode && !currentSlide.viewed
                      ? 'Mark current slide as viewed first'
                      : 'Next slide'
                  }
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Original Controls - Visible when NOT in fullscreen */}
          {!isFullscreen && (
            <div className={`controls-area border-t border-gray-100 px-2 py-1 flex-shrink-0 transition-all duration-300 ${
              showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 translate-y-full opacity-0'
            }`}>
              <div className="flex items-center gap-1">
                {/* Left - Prev Button */}
                <button
                  onClick={handlePrev}
                  disabled={isFirstSlide}
                  className="flex items-center justify-center gap-0.5 bg-gray-600 text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-xs flex-shrink-0"
                  title="Previous slide"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Center - Mark as Viewed or Viewed Badge */}
                <div className="flex-1">
                  {currentSlide.viewed ? (
                    <div className="flex items-center gap-0.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs justify-center h-full">
                      <Check className="text-blue-600" size={12} />
                      <span className="text-blue-700 font-semibold">{allSlidesViewed ? 'Completed' : 'Viewed'}</span>
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
                      {isPreviewMode ? <span className="hidden sm:inline">Preview Mode</span> : <span>Mark as Viewed</span>}
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
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls - Fixed Height - Hidden on mobile when controls hidden */}
        <div className={`flex gap-1 flex-shrink-0 relative mx-2 md:mx-0 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 translate-y-full opacity-0'
        }`}>
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
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block">
                {isPreviewMode ? 'Preview mode - cannot complete' : 'Complete your review after viewing all slides'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </button>
        </div>

        {/* Slide Thumbnails - Fixed Height - Hidden on mobile when controls hidden */}
        <div className={`bg-white rounded-lg shadow-sm p-1 flex-shrink-0 max-h-[70px] overflow-y-auto mx-2 md:mx-0 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'md:translate-y-0 md:opacity-100 translate-y-full opacity-0'
        }`}>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(32px, 1fr))` }}>
            {slides.map((slide, idx) => {
              // ✅ Определяем доступность слайда
              let isAccessible = idx === 0;
              
              if (!isAccessible && idx > 0 && !isPreviewMode) {
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
