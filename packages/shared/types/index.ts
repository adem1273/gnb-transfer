/**
 * Shared TypeScript types for GNB Transfer
 * These types are shared between web and mobile applications
 */

// User types
export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin' | 'manager' | 'support' | 'driver';
  phone?: string;
  isCorporate?: boolean;
  corporateDetails?: CorporateDetails;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

export interface CorporateDetails {
  companyName?: string;
  taxNumber?: string;
  address?: string;
  contactPerson?: string;
  billingEmail?: string;
  paymentTerms?: 'net15' | 'net30' | 'net60' | 'prepaid';
  discount?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  monthlyInvoicing?: boolean;
}

export interface UserPreferences {
  language?: string;
  tourCategories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

// Tour types
export interface Tour {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  description: string;
  category: 'transfer' | 'tour' | 'vip' | 'airport' | 'city' | 'excursion' | 'package';
  active: boolean;
  price: number;
  duration: number;
  discount?: number;
  isCampaign?: boolean;
  availableSeats?: number;
  image?: string;
  // Localized fields
  title_ar?: string;
  title_ru?: string;
  title_es?: string;
  title_zh?: string;
  title_hi?: string;
  title_de?: string;
  title_it?: string;
  description_ar?: string;
  description_ru?: string;
  description_es?: string;
  description_zh?: string;
  description_hi?: string;
  description_de?: string;
  description_it?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Booking types
export interface Passenger {
  firstName: string;
  lastName: string;
  type: 'adult' | 'child' | 'infant';
}

export interface ExtraService {
  selected: boolean;
  quantity?: number;
  price: number;
}

export interface ExtraServices {
  childSeat?: ExtraService;
  babySeat?: ExtraService;
  meetAndGreet?: ExtraService;
  vipLounge?: ExtraService;
}

export interface DelayGuarantee {
  riskScore?: number;
  estimatedDelay?: number;
  discountCode?: string;
}

export interface AIMetadata {
  isAIPackage?: boolean;
  packageDiscount?: number;
  recommendationId?: string;
  delayGuarantee?: DelayGuarantee;
}

export interface Booking {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  phoneCountryCode?: string;
  whatsappLink?: string;
  user?: string | User;
  tour: string | Tour;
  tourId?: string;
  driver?: string;
  vehicle?: string;
  date: string;
  time?: string;
  flightNumber?: string;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  guests: number;
  passengers: Passenger[];
  extraServices?: ExtraServices;
  extraServicesTotal?: number;
  amount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'stripe';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'paid';
  pickupLocation?: string;
  notes?: string;
  aiMetadata?: AIMetadata;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  user?: User;
}

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Driver types
export interface Driver {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_trip' | 'offline';
  vehicle?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Vehicle types
export interface Vehicle {
  id: string;
  _id?: string;
  model: string;
  brand: string;
  plateNumber: string;
  capacity: number;
  type: string;
  year?: number;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Review types
export interface Review {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  rating: number;
  comment: string;
  tour?: string | Tour;
  booking?: string | Booking;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Blog types
export interface BlogPost {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  image?: string;
  tags?: string[];
  published?: boolean;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Settings types
export interface GlobalSettings {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  businessHours?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };
}

// Form state types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Booking form types
export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  phoneCountryCode?: string;
  tourId: string;
  date: string;
  time?: string;
  flightNumber?: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  passengers: Passenger[];
  extraServices?: ExtraServices;
  pickupLocation?: string;
  notes?: string;
  paymentMethod: 'cash' | 'credit_card' | 'stripe';
}

// Export all types for convenience
export type {
  User as IUser,
  Tour as ITour,
  Booking as IBooking,
  Driver as IDriver,
  Vehicle as IVehicle,
  Review as IReview,
  BlogPost as IBlogPost,
};
