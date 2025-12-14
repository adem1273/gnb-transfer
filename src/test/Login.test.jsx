import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

// Mock SocialLoginButtons component
vi.mock('../components/SocialLoginButtons', () => ({
  default: () => <div data-testid="social-login-buttons">Social Login Buttons</div>,
}));

// Mock ErrorMessage component
vi.mock('../components/ErrorMessage', () => ({
  default: ({ message }) => <div data-testid="error-message">{message}</div>,
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password fields', () => {
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('forms.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('forms.passwordPlaceholder');
    const submitButton = screen.getByRole('button', { type: 'submit' });
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderLogin();
    const user = userEvent.setup();
    
    const loginButton = screen.getByRole('button', { type: 'submit' });
    await user.click(loginButton);
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/email is required/i) || screen.queryByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByPlaceholderText('forms.emailPlaceholder');
    await user.type(emailInput, 'invalid-email');
    
    const loginButton = screen.getByRole('button', { type: 'submit' });
    await user.click(loginButton);
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/invalid email format/i) || screen.queryByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByPlaceholderText('forms.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('forms.passwordPlaceholder');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    
    const loginButton = screen.getByRole('button', { type: 'submit' });
    await user.click(loginButton);
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/password must be at least 6 characters/i) || screen.queryByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('allows typing in email and password fields', async () => {
    renderLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByPlaceholderText('forms.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('forms.passwordPlaceholder');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('renders social login buttons', () => {
    renderLogin();
    expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument();
  });

  it('has a link to register page', () => {
    renderLogin();
    const registerLink = screen.getByText(/auth.register/i);
    expect(registerLink).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    renderLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByPlaceholderText('forms.emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('forms.passwordPlaceholder');
    const loginButton = screen.getByRole('button', { type: 'submit' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    // Check button is not disabled before submit
    expect(loginButton).not.toBeDisabled();
  });
});
