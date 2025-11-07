/**
 * Backend i18n configuration for multi-language support
 *
 * @module config/i18n
 */

import i18next from 'i18next';

// Translation resources for backend messages
const resources = {
  en: {
    translation: {
      errors: {
        required: 'This field is required',
        invalidEmail: 'Please provide a valid email address',
        invalidBooking: 'Booking not found',
        unauthorized: 'Unauthorized access',
        serverError: 'Internal server error',
      },
      chat: {
        aiUnavailable: 'Sorry, I cannot assist right now. Our support team will contact you.',
        ticketCreated: 'Support ticket created. Our team will contact you shortly.',
        bookingNotFound: 'Booking not found',
        bookingCancelled: 'Your booking has been cancelled. If paid, refund will be processed in 5-7 business days.',
        alreadyCancelled: 'Booking already cancelled',
        contactSupport: 'To modify your booking, please contact our support team.',
      },
    },
  },
  tr: {
    translation: {
      errors: {
        required: 'Bu alan zorunludur',
        invalidEmail: 'Lütfen geçerli bir e-posta adresi girin',
        invalidBooking: 'Rezervasyon bulunamadı',
        unauthorized: 'Yetkisiz erişim',
        serverError: 'Sunucu hatası',
      },
      chat: {
        aiUnavailable: 'Üzgünüm, şu anda yardımcı olamıyorum. Destek ekibimiz sizinle iletişime geçecek.',
        ticketCreated: 'Destek talebiniz oluşturuldu. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
        bookingNotFound: 'Rezervasyon bulunamadı',
        bookingCancelled: 'Rezervasyonunuz iptal edildi. Ödeme yaptıysanız, 5-7 iş günü içinde iade edilecektir.',
        alreadyCancelled: 'Rezervasyon zaten iptal edildi',
        contactSupport: 'Rezervasyonunuzu değiştirmek için lütfen destek ekibimizle iletişime geçin.',
      },
    },
  },
  de: {
    translation: {
      errors: {
        required: 'Dieses Feld ist erforderlich',
        invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        invalidBooking: 'Buchung nicht gefunden',
        unauthorized: 'Unbefugter Zugriff',
        serverError: 'Interner Serverfehler',
      },
      chat: {
        aiUnavailable: 'Entschuldigung, ich kann momentan nicht helfen. Unser Support-Team wird Sie kontaktieren.',
        ticketCreated: 'Support-Ticket erstellt. Unser Team wird sich in Kürze bei Ihnen melden.',
        bookingNotFound: 'Buchung nicht gefunden',
        bookingCancelled: 'Ihre Buchung wurde storniert. Bei Zahlung wird die Rückerstattung in 5-7 Werktagen bearbeitet.',
        alreadyCancelled: 'Buchung bereits storniert',
        contactSupport: 'Um Ihre Buchung zu ändern, kontaktieren Sie bitte unser Support-Team.',
      },
    },
  },
  fr: {
    translation: {
      errors: {
        required: 'Ce champ est obligatoire',
        invalidEmail: 'Veuillez fournir une adresse e-mail valide',
        invalidBooking: 'Réservation introuvable',
        unauthorized: 'Accès non autorisé',
        serverError: 'Erreur de serveur interne',
      },
      chat: {
        aiUnavailable: 'Désolé, je ne peux pas aider pour le moment. Notre équipe de support vous contactera.',
        ticketCreated: 'Ticket de support créé. Notre équipe vous contactera sous peu.',
        bookingNotFound: 'Réservation introuvable',
        bookingCancelled: 'Votre réservation a été annulée. Si payé, le remboursement sera traité sous 5-7 jours ouvrables.',
        alreadyCancelled: 'Réservation déjà annulée',
        contactSupport: 'Pour modifier votre réservation, veuillez contacter notre équipe de support.',
      },
    },
  },
  es: {
    translation: {
      errors: {
        required: 'Este campo es obligatorio',
        invalidEmail: 'Por favor proporcione una dirección de correo válida',
        invalidBooking: 'Reserva no encontrada',
        unauthorized: 'Acceso no autorizado',
        serverError: 'Error interno del servidor',
      },
      chat: {
        aiUnavailable: 'Lo siento, no puedo ayudar en este momento. Nuestro equipo de soporte se pondrá en contacto con usted.',
        ticketCreated: 'Ticket de soporte creado. Nuestro equipo se pondrá en contacto con usted en breve.',
        bookingNotFound: 'Reserva no encontrada',
        bookingCancelled: 'Su reserva ha sido cancelada. Si pagó, el reembolso se procesará en 5-7 días hábiles.',
        alreadyCancelled: 'Reserva ya cancelada',
        contactSupport: 'Para modificar su reserva, póngase en contacto con nuestro equipo de soporte.',
      },
    },
  },
  it: {
    translation: {
      errors: {
        required: 'Questo campo è obbligatorio',
        invalidEmail: 'Fornire un indirizzo email valido',
        invalidBooking: 'Prenotazione non trovata',
        unauthorized: 'Accesso non autorizzato',
        serverError: 'Errore interno del server',
      },
      chat: {
        aiUnavailable: 'Spiacente, non posso aiutare al momento. Il nostro team di supporto ti contatterà.',
        ticketCreated: 'Ticket di supporto creato. Il nostro team ti contatterà a breve.',
        bookingNotFound: 'Prenotazione non trovata',
        bookingCancelled: 'La tua prenotazione è stata cancellata. Se pagato, il rimborso sarà elaborato in 5-7 giorni lavorativi.',
        alreadyCancelled: 'Prenotazione già cancellata',
        contactSupport: 'Per modificare la tua prenotazione, contatta il nostro team di supporto.',
      },
    },
  },
  ru: {
    translation: {
      errors: {
        required: 'Это поле обязательно',
        invalidEmail: 'Пожалуйста, укажите действительный адрес электронной почты',
        invalidBooking: 'Бронирование не найдено',
        unauthorized: 'Несанкционированный доступ',
        serverError: 'Внутренняя ошибка сервера',
      },
      chat: {
        aiUnavailable: 'Извините, я не могу помочь сейчас. Наша команда поддержки свяжется с вами.',
        ticketCreated: 'Тикет поддержки создан. Наша команда скоро свяжется с вами.',
        bookingNotFound: 'Бронирование не найдено',
        bookingCancelled: 'Ваше бронирование отменено. Если оплачено, возврат будет обработан в течение 5-7 рабочих дней.',
        alreadyCancelled: 'Бронирование уже отменено',
        contactSupport: 'Чтобы изменить бронирование, обратитесь в нашу службу поддержки.',
      },
    },
  },
  ar: {
    translation: {
      errors: {
        required: 'هذا الحقل مطلوب',
        invalidEmail: 'يرجى تقديم عنوان بريد إلكتروني صالح',
        invalidBooking: 'الحجز غير موجود',
        unauthorized: 'وصول غير مصرح به',
        serverError: 'خطأ في الخادم الداخلي',
      },
      chat: {
        aiUnavailable: 'عذرًا، لا أستطيع المساعدة الآن. سيتصل بك فريق الدعم لدينا.',
        ticketCreated: 'تم إنشاء تذكرة الدعم. سيتصل بك فريقنا قريبًا.',
        bookingNotFound: 'الحجز غير موجود',
        bookingCancelled: 'تم إلغاء حجزك. إذا تم الدفع، ستتم معالجة الاسترداد في 5-7 أيام عمل.',
        alreadyCancelled: 'الحجز ملغى بالفعل',
        contactSupport: 'لتعديل حجزك، يرجى الاتصال بفريق الدعم لدينا.',
      },
    },
  },
};

// Initialize i18next for backend
i18next.init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
