import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Check, LogOut, AlertCircle, CheckCircle } from 'lucide-react';

const Slides = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completing, setCompleting] = useState(false);
  const [progress, setProgress] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await axios.get('/slides/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSlides(response.data.slides);
        fetchProgress();
      } catch (err) {
        setError('Ошибка при загрузке слайдов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, [token]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get('/slides/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleMarkViewed = async () => {
    if (!slides[currentSlideIndex]) return;

    try {
      await axios.post(
        `/slides/mark/${slides[currentSlideIndex].id}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const newSlides = [...slides];
      newSlides[currentSlideIndex].viewed = true;
      setSlides(newSlides);
      fetchProgress();
    } catch (err) {
      setError('Ошибка при отметке слайда');
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        '/slides/complete',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setSuccess('🎉 Ознакомление завершено успешно!');
      } else {
        const missing = response.data.missing_slides.join(', ');
        setError(`⚠️ Вы не ознакомились со слайдами: ${missing}`);
      }
    } catch (err) {
      setError('Ошибка при завершении ознакомления');
    } finally {
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
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
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Загрузка слайдов...</p>
        </div>
      </div>
    );
  }

  if (error && slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-gray-900 font-semibold mb-6">{error}</p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-600 mb-6">Слайды еще не загружены администратором</p>
          <button
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === slides.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SlideConfirm</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Выход
          </button>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Прогресс ознакомления</span>
              <span className="text-sm font-bold text-blue-600">{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Просмотрено {progress.viewed_count} из {progress.total_count} слайдов
            </p>
          </div>
        )}

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

        {/* Main Slide Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-1"></div>
          
          {/* Slide Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Слайд {currentSlideIndex + 1} из {slides.length}
              </h2>
              <p className="text-gray-500">{currentSlide.filename}</p>
            </div>

            {/* Slide Image */}
            <div className="mb-8 flex justify-center">
              <div className="bg-gray-100 rounded-lg p-4 max-w-2xl w-full">
                <img 
                  src={`/slides/image/${currentSlide.presentation_id}/${currentSlide.filename}`}
                  alt={`Slide ${currentSlideIndex + 1}`}
                  className="w-full rounded-lg shadow-md bg-gray-200 h-96 object-contain"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23E5E7EB" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="18"%3EПредпросмотр слайда%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>

            {/* Slide Status */}
            <div className="flex items-center justify-center mb-6">
              {currentSlide.viewed ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                  <Check className="text-green-600" size={20} />
                  <span className="text-green-700 font-semibold">Просмотрено</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                  <span className="text-yellow-700 font-semibold">Не просмотрено</span>
                </div>
              )}
            </div>

            {/* Mark as Viewed Button */}
            {!currentSlide.viewed && (
              <button
                onClick={handleMarkViewed}
                className="w-full mb-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Отметить как просмотренное
              </button>
            )}
          </div>
        </div>

        {/* Navigation and Controls */}
        <div className="space-y-4">
          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              disabled={isFirstSlide}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <ChevronLeft size={20} />
              Назад
            </button>

            <button
              onClick={handleNext}
              disabled={isLastSlide}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Вперед
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={completing || progress?.percentage !== 100}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completing ? 'Завершение...' : '✓ Подтвердить ознакомление'}
          </button>
        </div>

        {/* Slide Thumbnails */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Все слайды</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`aspect-square rounded-lg font-semibold transition ${
                  idx === currentSlideIndex
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : slide.viewed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slides;
