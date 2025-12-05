import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

// Country codes for phone number
const COUNTRY_CODES = [
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'USA' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'UK' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
];

// Extra services pricing
const EXTRA_SERVICES = {
  childSeat: { price: 10, icon: '🚼' },
  babySeat: { price: 10, icon: '👶' },
  meetAndGreet: { price: 15, icon: '🎯' },
  vipLounge: { price: 50, icon: '✨' },
};

/**
 * Enhanced Booking Form with Ministry-compliant passenger name collection
 * 
 * Turkish Ministry of Transport Requirement:
 * All passenger names (first + last name) must be collected for transfer services.
 * At least one passenger name is required for booking.
 */
function BookingFormEnhanced({ onSubmit, tours = [], initialTourId = '' }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCountryCode: '+90',
    tourId: initialTourId,
    date: '',
    time: '',
    flightNumber: '',
    adultsCount: 1,
    childrenCount: 0,
    infantsCount: 0,
    passengers: [{ firstName: '', lastName: '', type: 'adult' }],
    pickupLocation: '',
    specialRequests: '',
    discountCode: '',
    paymentMethod: 'cash',
    extraServices: {
      childSeat: { selected: false, quantity: 0, price: EXTRA_SERVICES.childSeat.price },
      babySeat: { selected: false, quantity: 0, price: EXTRA_SERVICES.babySeat.price },
      meetAndGreet: { selected: false, price: EXTRA_SERVICES.meetAndGreet.price },
      vipLounge: { selected: false, price: EXTRA_SERVICES.vipLounge.price },
    },
  });

  const [basePrice, setBasePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [errors, setErrors] = useState({});

  const totalSteps = 4;

  // Calculate total passenger count
  const totalPassengerCount = useMemo(() => {
    return formData.adultsCount + formData.childrenCount;
  }, [formData.adultsCount, formData.childrenCount]);

  // Calculate extra services total
  const extraServicesTotal = useMemo(() => {
    let total = 0;
    const { extraServices } = formData;
    
    if (extraServices.childSeat.selected) {
      total += extraServices.childSeat.quantity * extraServices.childSeat.price;
    }
    if (extraServices.babySeat.selected) {
      total += extraServices.babySeat.quantity * extraServices.babySeat.price;
    }
    if (extraServices.meetAndGreet.selected) {
      total += extraServices.meetAndGreet.price;
    }
    if (extraServices.vipLounge.selected) {
      total += extraServices.vipLounge.price;
    }
    
    return total;
  }, [formData.extraServices]);

  // Calculate total price
  const calculatedPrice = useMemo(() => {
    const totalGuests = formData.adultsCount + formData.childrenCount + formData.infantsCount;
    return Math.max(0, (basePrice * totalGuests) + extraServicesTotal - discount);
  }, [basePrice, formData.adultsCount, formData.childrenCount, formData.infantsCount, extraServicesTotal, discount]);

  // Update passengers array when counts change
  useEffect(() => {
    const requiredPassengers = totalPassengerCount;
    const currentPassengers = [...formData.passengers];
    
    // Add passengers if needed
    while (currentPassengers.length < requiredPassengers) {
      const newIndex = currentPassengers.length;
      const type = newIndex < formData.adultsCount ? 'adult' : 'child';
      currentPassengers.push({ firstName: '', lastName: '', type });
    }
    
    // Remove passengers if needed
    while (currentPassengers.length > requiredPassengers && currentPassengers.length > 1) {
      currentPassengers.pop();
    }
    
    // Update types
    currentPassengers.forEach((p, index) => {
      p.type = index < formData.adultsCount ? 'adult' : 'child';
    });
    
    setFormData(prev => ({ ...prev, passengers: currentPassengers }));
  }, [totalPassengerCount, formData.adultsCount]);

  // Validate discount code via backend API
  const validateDiscountCode = useCallback(async (code, bookingAmount, tourId) => {
    if (!code || !bookingAmount) {
      return { valid: false, discountAmount: 0 };
    }

    setDiscountLoading(true);
    setDiscountError('');

    try {
      const response = await API.post('/coupons/validate', {
        code,
        bookingAmount,
        tourId
      });
      
      if (response.data?.success && response.data?.data?.valid) {
        return {
          valid: true,
          discountAmount: response.data.data.discountAmount || 0
        };
      }
      return { valid: false, discountAmount: 0 };
    } catch (error) {
      let errorMessage;
      const errorCode = error.response?.data?.error;
      
      if (error.response?.status === 404) {
        errorMessage = t('booking.errors.codeNotFound') || 'Discount code not found';
      } else if (typeof errorCode === 'string' && errorCode.includes('expired')) {
        errorMessage = t('booking.errors.codeExpired') || 'This discount code has expired';
      } else if (typeof errorCode === 'string' && errorCode.includes('limit')) {
        errorMessage = t('booking.errors.codeLimitReached') || 'This discount code has reached its usage limit';
      } else if (typeof errorCode === 'string' && errorCode.includes('minimum')) {
        errorMessage = t('booking.errors.minimumNotMet') || 'Minimum purchase amount not met for this code';
      } else {
        errorMessage = (typeof errorCode === 'string' ? errorCode : '') || t('booking.errors.invalidDiscountCode') || 'Invalid discount code';
      }
      
      setDiscountError(errorMessage);
      return { valid: false, discountAmount: 0 };
    } finally {
      setDiscountLoading(false);
    }
  }, [t]);

  // Update base price when tour changes
  useEffect(() => {
    const selectedTour = tours.find(tour => tour._id === formData.tourId);
    if (selectedTour) {
      setBasePrice(selectedTour.price);
    } else {
      setBasePrice(0);
    }
  }, [formData.tourId, tours]);

  // Apply discount code
  const applyDiscount = useCallback(async () => {
    if (formData.discountCode && basePrice > 0) {
      const totalGuests = formData.adultsCount + formData.childrenCount + formData.infantsCount;
      const result = await validateDiscountCode(
        formData.discountCode,
        basePrice * totalGuests + extraServicesTotal,
        formData.tourId
      );
      if (result.valid) {
        setDiscount(result.discountAmount);
      } else {
        setDiscount(0);
      }
    } else {
      setDiscount(0);
    }
  }, [formData.discountCode, formData.tourId, formData.adultsCount, formData.childrenCount, formData.infantsCount, basePrice, extraServicesTotal, validateDiscountCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
    
    // Clear passenger errors
    if (errors.passengers) {
      setErrors(prev => ({ ...prev, passengers: '' }));
    }
  };

  const handleExtraServiceChange = (service, field, value) => {
    setFormData(prev => ({
      ...prev,
      extraServices: {
        ...prev.extraServices,
        [service]: {
          ...prev.extraServices[service],
          [field]: value,
        },
      },
    }));
  };

  const handleGuestCountChange = (type, delta) => {
    setFormData(prev => {
      const currentValue = prev[type];
      let newValue = Math.max(type === 'adultsCount' ? 1 : 0, currentValue + delta);
      
      // Max limits
      if (type === 'adultsCount') newValue = Math.min(newValue, 50);
      if (type === 'childrenCount') newValue = Math.min(newValue, 50);
      if (type === 'infantsCount') newValue = Math.min(newValue, 20);
      
      return { ...prev, [type]: newValue };
    });
  };

  const addPassenger = () => {
    if (formData.passengers.length < 100) {
      const type = formData.passengers.length < formData.adultsCount ? 'adult' : 'child';
      setFormData(prev => ({
        ...prev,
        passengers: [...prev.passengers, { firstName: '', lastName: '', type }],
      }));
    }
  };

  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      setFormData(prev => ({
        ...prev,
        passengers: prev.passengers.filter((_, i) => i !== index),
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    const phoneRegex = /^[\d\s\-()]+$/;

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = t('booking.errors.nameRequired') || 'Name is required';
      if (!formData.email.trim()) newErrors.email = t('booking.errors.emailRequired') || 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('booking.errors.emailInvalid') || 'Email is invalid';
      if (!formData.phone.trim()) {
        newErrors.phone = t('booking.errors.phoneRequired') || 'Phone is required';
      } else {
        const digitsOnly = formData.phone.replace(/\D/g, '');
        if (!phoneRegex.test(formData.phone) || digitsOnly.length < 6 || digitsOnly.length > 15) {
          newErrors.phone = t('booking.errors.phoneInvalid') || 'Please enter a valid phone number';
        }
      }
    } else if (step === 2) {
      if (!formData.tourId) newErrors.tourId = t('booking.errors.tourRequired') || 'Please select a tour';
      if (!formData.date) newErrors.date = t('booking.errors.dateRequired') || 'Date is required';
      if (!formData.time) newErrors.time = t('booking.errors.timeRequired') || 'Time is required';
      if (!formData.flightNumber.trim()) newErrors.flightNumber = t('booking.errors.flightRequired') || 'Flight number is required';
      if (!formData.pickupLocation.trim()) newErrors.pickupLocation = t('booking.errors.locationRequired') || 'Pickup location is required';
    } else if (step === 3) {
      // Validate passengers (Ministry requirement)
      const hasEmptyPassenger = formData.passengers.some(p => !p.firstName.trim() || !p.lastName.trim());
      if (hasEmptyPassenger) {
        newErrors.passengers = t('booking.errors.passengersRequired') || 'All passenger names are required (Ministry regulation)';
      }
      if (formData.passengers.length === 0) {
        newErrors.passengers = t('booking.errors.atLeastOnePassenger') || 'At least one passenger name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(3)) {
      const totalGuests = formData.adultsCount + formData.childrenCount + formData.infantsCount;
      onSubmit({
        ...formData,
        guests: totalGuests,
        totalPrice: calculatedPrice,
        extraServicesTotal,
        notes: formData.specialRequests,
      });
    }
  };

  const stepVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  };

  // Counter component for guests with proper accessibility
  const CounterInput = ({ label, value, onIncrease, onDecrease, min = 0, icon }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" role="group" aria-label={label}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className="font-medium text-gray-700" id={`counter-label-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3" role="spinbutton" aria-valuenow={value} aria-valuemin={min} aria-valuemax={100} aria-labelledby={`counter-label-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          aria-disabled={value <= min}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            value <= min 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-8 text-center font-semibold text-lg" aria-live="polite">{value}</span>
        <button
          type="button"
          onClick={onIncrease}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="relative flex flex-col items-center">
                <motion.div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: currentStep === step ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {currentStep > step ? '✓' : step}
                </motion.div>
                <span className="text-xs mt-2 text-gray-600 absolute -bottom-6 whitespace-nowrap hidden md:block">
                  {step === 1 ? t('booking.step1') || 'Contact' : 
                   step === 2 ? t('booking.step2') || 'Details' : 
                   step === 3 ? t('booking.step3Passengers') || 'Passengers' :
                   t('booking.step4') || 'Review'}
                </span>
              </div>
              {step < totalSteps && (
                <div className={`flex-1 h-1 mx-1 md:mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-xl shadow-lg">
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
                {t('booking.personalInfo') || 'Contact Information'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.name') || 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('booking.namePlaceholder') || 'Enter your full name'}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.email') || 'Email'} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('booking.emailPlaceholder') || 'your.email@example.com'}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Phone with Country Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.phone') || 'Phone Number'} * 
                    <span className="text-gray-500 text-xs ml-1">(WhatsApp)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="phoneCountryCode"
                      value={formData.phoneCountryCode}
                      onChange={handleChange}
                      className="w-32 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {COUNTRY_CODES.map(({ code, flag, country }) => (
                        <option key={code} value={code}>
                          {flag} {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="555 123 4567"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Tour Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
                {t('booking.tourDetails') || 'Transfer Details'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.selectTour') || 'Select Service'} *
                  </label>
                  <select
                    name="tourId"
                    value={formData.tourId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.tourId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('booking.chooseTour') || 'Choose a service...'}</option>
                    {tours.map(tour => (
                      <option key={tour._id} value={tour._id}>
                        {tour.title} - ${tour.price}
                      </option>
                    ))}
                  </select>
                  {errors.tourId && <p className="text-red-500 text-sm mt-1">{errors.tourId}</p>}
                </div>

                {/* Flight Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.flightNumber') || 'Flight Number'} *
                  </label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase ${
                      errors.flightNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="TK 1234"
                    maxLength={10}
                  />
                  {errors.flightNumber && <p className="text-red-500 text-sm mt-1">{errors.flightNumber}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('booking.date') || 'Date'} *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('booking.time') || 'Time'} *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.time ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.pickupLocation') || 'Pickup Location'} *
                  </label>
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.pickupLocation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('booking.locationPlaceholder') || 'Hotel name or address'}
                  />
                  {errors.pickupLocation && <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>}
                </div>

                {/* Guest Counters */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.passengers') || 'Passengers'}
                  </label>
                  <CounterInput
                    label={t('booking.adults') || 'Adults'}
                    value={formData.adultsCount}
                    onIncrease={() => handleGuestCountChange('adultsCount', 1)}
                    onDecrease={() => handleGuestCountChange('adultsCount', -1)}
                    min={1}
                    icon="👤"
                  />
                  <CounterInput
                    label={t('booking.children') || 'Children (2-12)'}
                    value={formData.childrenCount}
                    onIncrease={() => handleGuestCountChange('childrenCount', 1)}
                    onDecrease={() => handleGuestCountChange('childrenCount', -1)}
                    icon="🧒"
                  />
                  <CounterInput
                    label={t('booking.infants') || 'Infants (0-2)'}
                    value={formData.infantsCount}
                    onIncrease={() => handleGuestCountChange('infantsCount', 1)}
                    onDecrease={() => handleGuestCountChange('infantsCount', -1)}
                    icon="👶"
                  />
                </div>

                {/* Extra Services */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.extraServices') || 'Extra Services'}
                  </label>
                  
                  {/* Child Seat */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.extraServices.childSeat.selected}
                        onChange={(e) => handleExtraServiceChange('childSeat', 'selected', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xl">{EXTRA_SERVICES.childSeat.icon}</span>
                      <span className="font-medium text-gray-700">{t('booking.childSeat') || 'Child Seat'}</span>
                      <span className="text-sm text-green-600">(+${EXTRA_SERVICES.childSeat.price}/ea)</span>
                    </div>
                    {formData.extraServices.childSeat.selected && (
                      <select
                        value={formData.extraServices.childSeat.quantity}
                        onChange={(e) => handleExtraServiceChange('childSeat', 'quantity', parseInt(e.target.value, 10))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Baby Seat */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.extraServices.babySeat.selected}
                        onChange={(e) => handleExtraServiceChange('babySeat', 'selected', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xl">{EXTRA_SERVICES.babySeat.icon}</span>
                      <span className="font-medium text-gray-700">{t('booking.babySeat') || 'Baby Seat'}</span>
                      <span className="text-sm text-green-600">(+${EXTRA_SERVICES.babySeat.price}/ea)</span>
                    </div>
                    {formData.extraServices.babySeat.selected && (
                      <select
                        value={formData.extraServices.babySeat.quantity}
                        onChange={(e) => handleExtraServiceChange('babySeat', 'quantity', parseInt(e.target.value, 10))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Meet & Greet */}
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.extraServices.meetAndGreet.selected}
                      onChange={(e) => handleExtraServiceChange('meetAndGreet', 'selected', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xl ml-2">{EXTRA_SERVICES.meetAndGreet.icon}</span>
                    <span className="font-medium text-gray-700 ml-2">{t('booking.meetAndGreet') || 'Meet & Greet'}</span>
                    <span className="text-sm text-green-600 ml-2">(+${EXTRA_SERVICES.meetAndGreet.price})</span>
                  </div>

                  {/* VIP Lounge */}
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.extraServices.vipLounge.selected}
                      onChange={(e) => handleExtraServiceChange('vipLounge', 'selected', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xl ml-2">{EXTRA_SERVICES.vipLounge.icon}</span>
                    <span className="font-medium text-gray-700 ml-2">{t('booking.vipLounge') || 'VIP Lounge Access'}</span>
                    <span className="text-sm text-green-600 ml-2">(+${EXTRA_SERVICES.vipLounge.price})</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Passenger Names (Ministry Requirement) */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  {t('booking.passengerNames') || 'Passenger Names'}
                </h2>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <strong>{t('booking.ministryRequirement') || 'Ministry Requirement'}:</strong>{' '}
                      {t('booking.ministryRequirementText') || 'Turkish Ministry of Transport requires all passenger names for transfer services.'}
                    </span>
                  </p>
                </div>
              </div>

              {errors.passengers && (
                <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{errors.passengers}</p>
              )}

              <div className="space-y-4">
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        {passenger.type === 'adult' 
                          ? t('booking.adultPassenger') || 'Adult Passenger' 
                          : t('booking.childPassenger') || 'Child Passenger'}
                      </span>
                      {formData.passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t('booking.remove') || 'Remove'}
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          {t('booking.firstName') || 'First Name'} *
                        </label>
                        <input
                          type="text"
                          value={passenger.firstName}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('booking.firstNamePlaceholder') || 'First name'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          {t('booking.lastName') || 'Last Name'} *
                        </label>
                        <input
                          type="text"
                          value={passenger.lastName}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('booking.lastNamePlaceholder') || 'Last name'}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.passengers.length < 100 && (
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('booking.addPassenger') || 'Add Passenger'}
                  </button>
                )}
              </div>

              {/* Special Requests */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.specialRequests') || 'Special Requests'}
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('booking.requestsPlaceholder') || 'Any special requirements or requests?'}
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Payment */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
                {t('booking.reviewAndPay') || 'Review & Payment'}
              </h2>
              
              <div className="space-y-6">
                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">{t('booking.summary') || 'Booking Summary'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.name') || 'Name'}:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.email') || 'Email'}:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.phone') || 'Phone'}:</span>
                      <span className="font-medium">{formData.phoneCountryCode} {formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.flightNumber') || 'Flight'}:</span>
                      <span className="font-medium">{formData.flightNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.date') || 'Date'}:</span>
                      <span className="font-medium">{formData.date} {t('booking.at') || 'at'} {formData.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.passengers') || 'Passengers'}:</span>
                      <span className="font-medium">
                        {formData.adultsCount} {t('booking.adults') || 'Adults'}
                        {formData.childrenCount > 0 && `, ${formData.childrenCount} ${t('booking.children') || 'Children'}`}
                        {formData.infantsCount > 0 && `, ${formData.infantsCount} ${t('booking.infants') || 'Infants'}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.pickupLocation') || 'Pickup'}:</span>
                      <span className="font-medium">{formData.pickupLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Names Summary */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">{t('booking.passengerList') || 'Passenger List'}</h3>
                  <div className="space-y-1 text-sm">
                    {formData.passengers.map((p, i) => (
                      <div key={i} className="flex justify-between py-1">
                        <span className="text-gray-600">{i + 1}. {p.type === 'adult' ? '👤' : '🧒'}</span>
                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Calculation */}
                <div className="bg-blue-50 p-4 md:p-6 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('booking.basePrice') || 'Base Price'} ({formData.adultsCount + formData.childrenCount + formData.infantsCount} {t('booking.passengers') || 'passengers'}):</span>
                      <span>${(basePrice * (formData.adultsCount + formData.childrenCount + formData.infantsCount)).toFixed(2)}</span>
                    </div>
                    
                    {extraServicesTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>{t('booking.extraServices') || 'Extra Services'}:</span>
                        <span>+${extraServicesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{t('booking.discount') || 'Discount'}:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>{t('booking.total') || 'Total'}:</span>
                      <span className="text-blue-600">${calculatedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.discountCode') || 'Discount Code'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        discountError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('booking.enterCode') || 'Enter discount code'}
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountLoading}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      {discountLoading ? '...' : t('booking.apply') || 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="text-red-500 text-sm mt-1">{discountError}</p>}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.paymentMethod') || 'Payment Method'}
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">{t('booking.cashOnArrival') || 'Cash on Arrival'}</option>
                    <option value="credit_card">{t('booking.creditCard') || 'Credit Card (Online)'}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Price Display */}
        {basePrice > 0 && currentStep < 4 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">{t('booking.estimatedTotal') || 'Estimated Total'}:</span>
              <span className="text-2xl font-bold text-blue-600">${calculatedPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {currentStep > 1 && (
            <motion.button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('booking.previous') || 'Previous'}
            </motion.button>
          )}

          {currentStep < totalSteps ? (
            <motion.button
              type="button"
              onClick={nextStep}
              className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('booking.next') || 'Next'}
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{t('booking.confirmBooking') || 'Confirm Booking'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BookingFormEnhanced;
