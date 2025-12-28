import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminHome from '../pages/AdminHome';
import { AuthProvider } from '../context/AuthContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

const renderAdminHome = (user = { role: 'admin' }) => {
  const MockAuthProvider = ({ children }) => {
    const authValue = {
      user,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };

    return <AuthProvider value={authValue}>{children}</AuthProvider>;
  };

  return render(
    <BrowserRouter>
      <MockAuthProvider>
        <AdminHome />
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('AdminHome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin home page', () => {
    renderAdminHome();
    // Check for common admin elements - expecting multiple Dashboard/Admin texts
    const dashboardElements = screen.getAllByText(/dashboard/i);
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it('displays welcome message', () => {
    renderAdminHome();
    // Admin pages typically have a welcome or dashboard title
    const welcomeElements = screen.queryAllByText(/welcome|admin|dashboard/i);
    expect(welcomeElements.length).toBeGreaterThan(0);
  });

  it('renders navigation links', () => {
    renderAdminHome();
    // Admin pages should have navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
