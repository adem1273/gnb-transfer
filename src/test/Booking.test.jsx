import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Booking from '../pages/Booking';
import { AuthProvider } from '../context/AuthContext';
import API from '../utils/api';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

// Mock react-helmet
vi.mock('react-helmet', () => ({
  Helmet: ({ children }) => <div data-testid="helmet">{children}</div>,
}));

// Mock API
vi.mock('../utils/api');

// Mock components
vi.mock('../components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock('../components/ErrorMessage', () => ({
  default: ({ message }) => <div data-testid="error-message">{message}</div>,
}));

vi.mock('../components/SEO', () => ({
  default: () => <div data-testid="seo">SEO Component</div>,
}));

vi.mock('../components/TourCard', () => ({
  default: ({ tour }) => <div data-testid="tour-card">{tour.name}</div>,
}));

vi.mock('../components/DelayBadge', () => ({
  default: () => <div data-testid="delay-badge">Delay Badge</div>,
}));

vi.mock('../utils/seoHelpers', () => ({
  getSEOTranslations: () => ({}),
  generateFAQSchema: () => ({}),
}));

const mockTours = [
  { _id: '1', name: 'City Tour', price: 100, description: 'Amazing city tour' },
  { _id: '2', name: 'Beach Tour', price: 150, description: 'Relaxing beach tour' },
];

const renderBooking = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Booking />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Booking Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: mockTours });
  });

  it('renders loading state initially', () => {
    renderBooking();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('loads and displays tours after fetching', async () => {
    renderBooking();
    
    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/tours');
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('displays error message when tours fail to load', async () => {
    API.get.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    renderBooking();
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('renders booking form fields', async () => {
    renderBooking();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Check for basic form fields
    expect(screen.getByLabelText(/name/i) || screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i) || screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
  });

  it('allows filling booking form', async () => {
    renderBooking();
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText(/name/i) || screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i) || screen.getByPlaceholderText(/phone/i);
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(phoneInput, '+1234567890');
    
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(phoneInput).toHaveValue('+1234567890');
  });
});
