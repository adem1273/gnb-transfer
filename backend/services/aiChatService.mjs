/**
 * AI Chat Service - OpenAI integration for LiveChat assistant
 * Now uses batch processing for cost optimization
 *
 * @module services/aiChatService
 */

import OpenAI from 'openai';
import Tour from '../models/Tour.mjs';
import { batchAIRequest, directAIRequest } from './aiBatchService.mjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// System prompts for different languages
const SYSTEM_PROMPTS = {
  en: `You are a helpful AI assistant for GNB Transfer, a tourism and transfer service company in Turkey. 
You help customers with:
1. Booking inquiries and management
2. Tour information and recommendations
3. Payment and pricing questions
4. General customer support

Be friendly, professional, and concise. If you cannot help with a request, acknowledge this and suggest creating a support ticket.
Always respond in English unless the user speaks another language.`,

  tr: `GNB Transfer için yardımcı bir yapay zeka asistanısınız, Türkiye'de bir turizm ve transfer hizmeti şirketisiniz.
Müşterilere şu konularda yardımcı olursunuz:
1. Rezervasyon sorguları ve yönetimi
2. Tur bilgileri ve öneriler
3. Ödeme ve fiyatlandırma soruları
4. Genel müşteri desteği

Arkadaş canlısı, profesyonel ve özlü olun. Bir taleple yardımcı olamazsanız, bunu kabul edin ve bir destek bileti oluşturmayı önerin.
Kullanıcı başka bir dil konuşmadıkça her zaman Türkçe yanıt verin.`,

  de: `Sie sind ein hilfreicher KI-Assistent für GNB Transfer, ein Tourismus- und Transferdienstleistungsunternehmen in der Türkei.
Sie helfen Kunden bei:
1. Buchungsanfragen und -verwaltung
2. Tourinformationen und Empfehlungen
3. Zahlungs- und Preisfragen
4. Allgemeiner Kundensupport

Seien Sie freundlich, professionell und prägnant. Wenn Sie bei einer Anfrage nicht helfen können, erkennen Sie dies an und schlagen Sie vor, ein Support-Ticket zu erstellen.
Antworten Sie immer auf Deutsch, es sei denn, der Benutzer spricht eine andere Sprache.`,

  fr: `Vous êtes un assistant IA utile pour GNB Transfer, une société de services touristiques et de transfert en Turquie.
Vous aidez les clients avec :
1. Demandes et gestion de réservations
2. Informations sur les circuits et recommandations
3. Questions de paiement et de tarification
4. Support client général

Soyez amical, professionnel et concis. Si vous ne pouvez pas aider avec une demande, reconnaissez-le et suggérez de créer un ticket de support.
Répondez toujours en français sauf si l'utilisateur parle une autre langue.`,

  es: `Eres un asistente de IA útil para GNB Transfer, una empresa de servicios turísticos y de traslado en Turquía.
Ayudas a los clientes con:
1. Consultas y gestión de reservas
2. Información de tours y recomendaciones
3. Preguntas de pago y precios
4. Soporte al cliente general

Sé amable, profesional y conciso. Si no puedes ayudar con una solicitud, reconócelo y sugiere crear un ticket de soporte.
Siempre responde en español a menos que el usuario hable otro idioma.`,

  it: `Sei un assistente AI utile per GNB Transfer, un'azienda di servizi turistici e di trasferimento in Turchia.
Aiuti i clienti con:
1. Richieste e gestione delle prenotazioni
2. Informazioni sui tour e raccomandazioni
3. Domande sui pagamenti e sui prezzi
4. Supporto clienti generale

Sii cordiale, professionale e conciso. Se non puoi aiutare con una richiesta, riconoscilo e suggerisci di creare un ticket di supporto.
Rispondi sempre in italiano a meno che l'utente non parli un'altra lingua.`,

  ru: `Вы полезный AI-ассистент для GNB Transfer, туристической и трансферной компании в Турции.
Вы помогаете клиентам с:
1. Запросы и управление бронированием
2. Информация о турах и рекомендации
3. Вопросы об оплате и ценах
4. Общая поддержка клиентов

Будьте дружелюбны, профессиональны и лаконичны. Если вы не можете помочь с запросом, признайте это и предложите создать тикет поддержки.
Всегда отвечайте на русском, если пользователь не говорит на другом языке.`,

  ar: `أنت مساعد ذكاء اصطناعي مفيد لـ GNB Transfer، وهي شركة خدمات سياحية ونقل في تركيا.
أنت تساعد العملاء في:
1. استفسارات وإدارة الحجز
2. معلومات الجولات والتوصيات
3. أسئلة الدفع والتسعير
4. دعم العملاء العام

كن ودودًا ومحترفًا وموجزًا. إذا لم تتمكن من المساعدة في طلب، اعترف بذلك واقترح إنشاء تذكرة دعم.
أجب دائمًا بالعربية إلا إذا كان المستخدم يتحدث لغة أخرى.`,
};

/**
 * Generate AI response based on user message and context
 * Uses batch processing for cost optimization
 */
export async function generateAIResponse(message, language = 'en', context = {}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;

    // Build context information
    let contextInfo = '';
    if (context.availableTours) {
      contextInfo += `\n\nAvailable tours: ${context.availableTours.map((t) => `${t.title} (${t.price}€)`).join(', ')}`;
    }
    if (context.userBookings) {
      contextInfo += `\n\nUser's bookings: ${context.userBookings.length} active bookings`;
    }

    const messages = [
      { role: 'system', content: systemPrompt + contextInfo },
      ...(context.conversationHistory || []),
      { role: 'user', content: message },
    ];

    // Use batch processing for cost optimization
    return await batchAIRequest(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
    });
  } catch (error) {
    console.error('AI response generation error:', error.message);
    return {
      success: false,
      message: null,
      error: error.message,
    };
  }
}

/**
 * Classify user intent from message
 * Uses batch processing for cost optimization
 */
export async function classifyIntent(message, _language = 'en') {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { intent: 'general', confidence: 0 };
    }

    const messages = [
      {
        role: 'system',
        content: `Classify the user's intent into one of these categories:
- booking: User wants to make, check, or modify a booking
- tour_info: User wants information about tours
- payment: User has payment-related questions
- complaint: User has a complaint or issue
- general: General inquiry or chitchat

Respond with just the category name.`,
      },
      { role: 'user', content: message },
    ];

    // Use batch processing
    const result = await batchAIRequest(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 20,
    });

    if (!result.success) {
      return { intent: 'general', confidence: 0 };
    }

    const intent = result.message.trim().toLowerCase();
    return {
      intent,
      confidence: 0.8,
    };
  } catch (error) {
    console.error('Intent classification error:', error.message);
    return { intent: 'general', confidence: 0 };
  }
}

/**
 * Get recommended tours based on user message
 * Uses batch processing for cost optimization
 */
export async function getRecommendedTours(message, _language = 'en') {
  try {
    const allTours = await Tour.find({ isActive: true }).limit(10).lean();

    if (!process.env.OPENAI_API_KEY || allTours.length === 0) {
      return allTours.slice(0, 3);
    }

    const tourList = allTours.map((t) => `${t._id}: ${t.title} - ${t.description}`).join('\n');

    const messages = [
      {
        role: 'system',
        content: `Based on the user's message, recommend the top 3 most relevant tours from this list. 
Respond with only the tour IDs separated by commas (e.g., "id1,id2,id3").

Available tours:
${tourList}`,
      },
      { role: 'user', content: message },
    ];

    // Use batch processing
    const result = await batchAIRequest(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 100,
    });

    if (!result.success) {
      return allTours.slice(0, 3);
    }

    const recommendedIds = result.message.trim().split(',').map((id) => id.trim());
    const recommended = allTours.filter((t) => recommendedIds.includes(t._id.toString()));

    return recommended.length > 0 ? recommended : allTours.slice(0, 3);
  } catch (error) {
    console.error('Tour recommendation error:', error.message);
    const tours = await Tour.find({ isActive: true }).limit(3).lean();
    return tours;
  }
}

/**
 * Generate upsell suggestions based on booking context
 */
export async function generateUpsellSuggestions(booking, language = 'en') {
  try {
    const tours = await Tour.find({ isActive: true, _id: { $ne: booking.tourId } })
      .limit(5)
      .lean();

    if (tours.length === 0) {
      return [];
    }

    // Return VIP and popular tours as upsell suggestions
    const suggestions = tours.map((tour) => ({
      type: 'tour',
      tourId: tour._id,
      title: tour.title,
      price: tour.price,
      discount: tour.discount || 0,
      message:
        language === 'tr'
          ? `${tour.title} turunu da denemeyi düşünür müsünüz?`
          : `Would you like to try our ${tour.title} tour as well?`,
    }));

    return suggestions.slice(0, 2);
  } catch (error) {
    console.error('Upsell generation error:', error.message);
    return [];
  }
}

/**
 * Translate missing i18n keys using AI
 * Uses batch processing for cost optimization
 */
export async function translateText(text, targetLanguage) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return text; // Fallback to original text
    }

    const languageNames = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
      ru: 'Russian',
      ar: 'Arabic',
    };

    const messages = [
      {
        role: 'system',
        content: `Translate the following text to ${languageNames[targetLanguage] || targetLanguage}. Respond with only the translation, nothing else.`,
      },
      { role: 'user', content: text },
    ];

    // Use batch processing
    const result = await batchAIRequest(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 200,
    });

    return result.success ? result.message.trim() : text;
  } catch (error) {
    console.error('Translation error:', error.message);
    return text;
  }
}

export default {
  generateAIResponse,
  classifyIntent,
  getRecommendedTours,
  generateUpsellSuggestions,
  translateText,
};
