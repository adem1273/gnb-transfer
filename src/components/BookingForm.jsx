import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';

function BookingForm({ onSubmit, tours = [], initialTourId = '' }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tourId: initialTourId,
    date: '',
    time: '',
    guests: 1,
    pickupLocation: '',
    specialRequests: '',
    discountCode: '',
    paymentMethod: 'cash',
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [errors, setErrors] = useState({});

  const totalSteps = 3;

  // Validate discount code via backend API
  const validateDiscountCode = useCallback(
    async (code, bookingAmount, tourId) => {
      if (!code || !bookingAmount) {
        return { valid: false, discountAmount: 0 };
      }

      setDiscountLoading(true);
      setDiscountError('');

      try {
        const response = await API.post('/coupons/validate', {
          code,
          bookingAmount,
          tourId,
        });

        if (response.data?.success && response.data?.data?.valid) {
          return {
            valid: true,
            discountAmount: response.data.data.discountAmount || 0,
          };
        }
        return { valid: false, discountAmount: 0 };
      } catch (error) {
        // Provide specific error messages based on error response
        let errorMessage;
        const errorCode = error.response?.data?.error;

        if (error.response?.status === 404) {
          errorMessage = t('booking.errors.codeNotFound') || 'Discount code not found';
        } else if (errorCode?.includes('expired')) {
          errorMessage = t('booking.errors.codeExpired') || 'This discount code has expired';
        } else if (errorCode?.includes('limit')) {
          errorMessage =
            t('booking.errors.codeLimitReached') ||
            'This discount code has reached its usage limit';
        } else if (errorCode?.includes('minimum')) {
          errorMessage =
            t('booking.errors.minimumNotMet') || 'Minimum purchase amount not met for this code';
        } else {
          errorMessage =
            errorCode || t('booking.errors.invalidDiscountCode') || 'Invalid discount code';
        }

        setDiscountError(errorMessage);
        return { valid: false, discountAmount: 0 };
      } finally {
        setDiscountLoading(false);
      }
    },
    [t]
  );

  const calculatePrice = useCallback(async () => {
    const selectedTour = tours.find((tour) => tour._id === formData.tourId);
    if (selectedTour) {
      const basePrice = selectedTour.price * formData.guests;
      let discountAmount = 0;

      // Validate discount code via backend API
      if (formData.discountCode) {
        const result = await validateDiscountCode(
          formData.discountCode,
          basePrice,
          formData.tourId
        );
        if (result.valid) {
          discountAmount = result.discountAmount;
        }
      }

      setDiscount(discountAmount);
      setCalculatedPrice(basePrice - discountAmount);
    } else {
      setCalculatedPrice(0);
      setDiscount(0);
    }
  }, [formData.tourId, formData.guests, formData.discountCode, tours, validateDiscountCode]);

  useEffect(() => {
    calculatePrice();
  }, [calculatePrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    // Phone validation regex: supports international format with optional +, spaces, dashes, and parentheses
    // Matches formats like: +90 555 123 4567, (555) 123-4567, +1-555-123-4567, 05551234567
    const phoneRegex =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

    if (step === 1) {
      if (!formData.name.trim())
        newErrors.name = t('booking.errors.nameRequired') || 'Name is required';
      if (!formData.email.trim())
        newErrors.email = t('booking.errors.emailRequired') || 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = t('booking.errors.emailInvalid') || 'Email is invalid';
      if (!formData.phone.trim()) {
        newErrors.phone = t('booking.errors.phoneRequired') || 'Phone is required';
      } else {
        // Remove all non-digit characters except + for validation of digit count
        const digitsOnly = formData.phone.replace(/[^\d+]/g, '');
        const digitCount = digitsOnly.replace(/\+/g, '').length;

        if (!phoneRegex.test(formData.phone) || digitCount < 10 || digitCount > 15) {
          newErrors.phone = t('booking.errors.phoneInvalid') || 'Please enter a valid phone number';
        }
      }
    } else if (step === 2) {
      if (!formData.tourId)
        newErrors.tourId = t('booking.errors.tourRequired') || 'Please select a tour';
      if (!formData.date) newErrors.date = t('booking.errors.dateRequired') || 'Date is required';
      if (!formData.time) newErrors.time = t('booking.errors.timeRequired') || 'Time is required';
      if (!formData.pickupLocation.trim())
        newErrors.pickupLocation =
          t('booking.errors.locationRequired') || 'Pickup location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(2)) {
      onSubmit({ ...formData, totalPrice: calculatedPrice });
    }
  };

  const stepVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="relative flex flex-col items-center">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: currentStep === step ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {currentStep > step ? '✓' : step}
                </motion.div>
                <span className="text-xs mt-2 text-gray-600 absolute -bottom-6 whitespace-nowrap">
                  {step === 1
                    ? t('booking.step1') || 'Personal Info'
                    : step === 2
                      ? t('booking.step2') || 'Tour Details'
                      : t('booking.step3') || 'Review & Pay'}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {t('booking.personalInfo') || 'Personal Information'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.phone') || 'Phone Number'} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+90 XXX XXX XX XX"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {t('booking.tourDetails') || 'Tour Details'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.selectTour') || 'Select Tour'} *
                  </label>
                  <select
                    name="tourId"
                    value={formData.tourId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.tourId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('booking.chooseTour') || 'Choose a tour...'}</option>
                    {tours.map((tour) => (
                      <option key={tour._id} value={tour._id}>
                        {tour.title} - ${tour.price}
                      </option>
                    ))}
                  </select>
                  {errors.tourId && <p className="text-red-500 text-sm mt-1">{errors.tourId}</p>}
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
                    {t('booking.guests') || 'Number of Guests'} *
                  </label>
                  <input
                    type="number"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                  {errors.pickupLocation && (
                    <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('booking.specialRequests') || 'Special Requests'}
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      t('booking.requestsPlaceholder') || 'Any special requirements or requests?'
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {t('booking.reviewAndPay') || 'Review & Payment'}
              </h2>

              <div className="space-y-6">
                {/* Booking Summary */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">
                    {t('booking.summary') || 'Booking Summary'}
                  </h3>
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
                      <span className="text-gray-600">{t('booking.date') || 'Date'}:</span>
                      <span className="font-medium">
                        {formData.date} at {formData.time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('booking.guests') || 'Guests'}:</span>
                      <span className="font-medium">{formData.guests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t('booking.pickupLocation') || 'Pickup'}:
                      </span>
                      <span className="font-medium">{formData.pickupLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Price Calculation */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('booking.subtotal') || 'Subtotal'}:</span>
                      <span>${(calculatedPrice + discount).toFixed(2)}</span>
                    </div>
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
                  <div className="relative">
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        discountError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('booking.enterCode') || 'Enter discount code'}
                    />
                    {discountLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="animate-spin h-5 w-5 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    )}
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
                    <option value="credit_card">
                      {t('booking.creditCard') || 'Credit Card (Online)'}
                    </option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
