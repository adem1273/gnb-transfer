import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'question' or 'booking'
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [upsells, setUpsells] = useState([]);

  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with greeting message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = {
        role: 'assistant',
        content: t('liveChat.description'),
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, t]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: inputMessage,
          language: i18n.language,
          mode: mode || 'question',
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          bookingId: mode === 'booking' ? bookingId : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          recommendations: data.data.recommendations || [],
          upsells: data.data.upsells || [],
          needsHumanSupport: data.data.needsHumanSupport,
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (data.data.recommendations && data.data.recommendations.length > 0) {
          setRecommendations(data.data.recommendations);
        }

        if (data.data.upsells && data.data.upsells.length > 0) {
          setUpsells(data.data.upsells);
        }

        // If needs human support, show create ticket option
        if (data.data.needsHumanSupport) {
          // Ticket already created by backend
        }
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: t('liveChat.errorOccurred'),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    const modeMessage = {
      role: 'system',
      content: selectedMode === 'question' ? t('liveChat.modeQuestion') : t('liveChat.modeBooking'),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, modeMessage]);
  };

  const handleBookingAction = async (action) => {
    if (!bookingId) {
      // Show inline error instead of alert
      const errorMessage = {
        role: 'assistant',
        content: t('liveChat.enterBookingId'),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    try {
      // Get email from user context or ask inline
      const email = user?.email;
      if (!email) {
        const emailMessage = {
          role: 'system',
          content: `${t('forms.email')}:`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, emailMessage]);
        // User needs to type email in chat instead
        return;
      }

      const response = await fetch(`${API_URL}/chat/booking/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          email,
          action,
          language: i18n.language,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const bookingMessage = {
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          booking: data.data.booking,
          upsells: data.data.upsells || [],
        };
        setMessages((prev) => [...prev, bookingMessage]);

        if (data.data.upsells && data.data.upsells.length > 0) {
          setUpsells(data.data.upsells);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Booking action error:', error);
      const errorMessage = {
        role: 'assistant',
        content: t('liveChat.errorOccurred'),
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMode(null);
    setMessages([]);
    setBookingId('');
    setRecommendations([]);
    setUpsells([]);
  };

  const logUpsell = async (tourId) => {
    if (!bookingId) return;

    try {
      await fetch(`${API_URL}/chat/log-upsell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          upsellTourId: tourId,
          upsellType: 'tour',
        }),
      });
    } catch (error) {
      console.error('Failed to log upsell:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-2xl w-96 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{t('liveChat.title')}</h3>
              <p className="text-xs text-blue-100">{t('liveChat.poweredByAI')}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          {/* Mode Selection */}
          {!mode && (
            <div className="p-4 border-b">
              <p className="text-sm text-gray-600 mb-3">{t('liveChat.selectMode')}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleModeSelect('question')}
                  className="p-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-sm font-semibold">{t('liveChat.modeQuestion')}</div>
                </button>
                <button
                  onClick={() => handleModeSelect('booking')}
                  className="p-3 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition"
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-semibold">{t('liveChat.modeBooking')}</div>
                </button>
              </div>
            </div>
          )}

          {/* Booking ID Input (for booking mode) */}
          {mode === 'booking' && !bookingId && (
            <div className="p-4 border-b bg-yellow-50">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                {t('liveChat.bookingId')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder={t('liveChat.enterBookingId')}
                  className="flex-1 p-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => bookingId && handleBookingAction('check')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  {t('liveChat.checkStatus')}
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {messages.map((msg, index) => {
              // Determine message style
              let messageStyle = 'bg-gray-100 text-gray-800';
              if (msg.role === 'user') {
                messageStyle = 'bg-blue-600 text-white';
              } else if (msg.role === 'system') {
                messageStyle = 'bg-gray-100 text-gray-600 text-sm italic';
              } else if (msg.isError) {
                messageStyle = 'bg-red-100 text-red-700';
              }

              return (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${messageStyle}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Show booking actions */}
                    {msg.booking && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleBookingAction('cancel')}
                            className="text-xs py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            {t('liveChat.cancelBooking')}
                          </button>
                          <button
                            onClick={() => handleBookingAction('modify')}
                            className="text-xs py-1 px-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            {t('liveChat.modifyBooking')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 p-3 rounded-lg text-sm">
                  {t('liveChat.aiTyping')}
                  <span className="ml-2 animate-pulse">...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                {t('liveChat.recommendedTours')}
              </p>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((tour) => (
                  <div
                    key={tour.id}
                    className="flex justify-between items-center text-xs bg-white p-2 rounded"
                  >
                    <div>
                      <p className="font-semibold">{tour.title}</p>
                      <p className="text-gray-600">{tour.price}€</p>
                    </div>
                    <a
                      href={`/tours#${tour.id}`}
                      onClick={() => logUpsell(tour.id)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t('liveChat.viewTour')}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upsells */}
          {upsells.length > 0 && (
            <div className="p-3 border-t bg-blue-50">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                ✨ {t('liveChat.specialOffer')}
              </p>
              <div className="space-y-2">
                {upsells.slice(0, 2).map((upsell, index) => (
                  <div key={index} className="bg-white p-2 rounded text-xs">
                    <p className="font-semibold">{upsell.title}</p>
                    <p className="text-gray-600 mb-1">{upsell.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">{upsell.price}€</span>
                      <a
                        href={`/tours#${upsell.tourId}`}
                        onClick={() => logUpsell(upsell.tourId)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        {t('liveChat.bookNow')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          {mode && (
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('liveChat.messagePlaceholder')}
                  className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('liveChat.sending') : t('liveChat.send')}
                </button>
              </form>
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                ← {t('liveChat.selectMode')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all focus:outline-none relative"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
              clipRule="evenodd"
              fillRule="evenodd"
            ></path>
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            AI
          </span>
        </button>
      )}
    </div>
  );
}

export default LiveChat;
