import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl p-4 w-72">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">{t('liveChat.title')}</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t('liveChat.description')}</p>
          <form>
            <input
              type="text"
              placeholder={t('forms.fullName')}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="email"
              placeholder={t('forms.email')}
              className="w-full p-2 border rounded mb-2"
            />
            <textarea
              placeholder={t('liveChat.messagePlaceholder')}
              rows="4"
              className="w-full p-2 border rounded mb-2"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              {t('buttons.submit')}
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" fillRule="evenodd"></path>
          </svg>
        </button>
      )}
    </div>
  );
}

export default LiveChat;