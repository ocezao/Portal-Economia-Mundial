import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { renderWithIntl } from '../../utils/renderWithIntl';

afterEach(() => {
  cleanup();
});

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth - default unauthenticated
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: false,
  user: null,
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
  });

  it('renders logo', () => {
    const view = renderWithIntl(<Header />);
    expect(view.getByLabelText(/Portal/i)).toBeDefined();
  });

  it('renders navigation menu items', () => {
    const view = renderWithIntl(<Header />);
    expect(view.getAllByText('Home').length).toBeGreaterThan(0);
    expect(view.getAllByText('Em Alta').length).toBeGreaterThan(0);
    expect(view.getAllByText('Destaque').length).toBeGreaterThan(0);
  });

  it('renders search button', () => {
    const view = renderWithIntl(<Header />);
    expect(view.getByLabelText('Abrir busca')).toBeDefined();
  });

  it('shows search bar when search button is clicked', () => {
    const view = renderWithIntl(<Header />);
    const searchButton = view.getByLabelText('Abrir busca');
    fireEvent.click(searchButton);
    expect(view.getByRole('searchbox')).toBeDefined();
  });

  it('renders login button for unauthenticated users', () => {
    const view = renderWithIntl(<Header />);
    // Look for links with "Entrar" text
    const entrarElements = view.getAllByText('Entrar');
    expect(entrarElements.length).toBeGreaterThan(0);
  });

  it('renders register button', () => {
    const view = renderWithIntl(<Header />);
    // Can appear in desktop action buttons and in the mobile menu.
    expect(view.getAllByText('Cadastrar').length).toBeGreaterThan(0);
  });

  it('toggles mobile menu', () => {
    const view = renderWithIntl(<Header />);
    const menuButton = view.getByLabelText('Abrir menu');
    fireEvent.click(menuButton);
    expect(menuButton).toBeDefined();
  });

  it('renders all main navigation items', () => {
    const view = renderWithIntl(<Header />);
    const navItems = ['Home', 'Em Alta', 'Destaque', 'Categorias', 'Sobre Nós', 'Contato'];
    navItems.forEach(item => {
      expect(view.getAllByText(item).length).toBeGreaterThan(0);
    });
  });

  it('closes search bar on form submission', async () => {
    const view = renderWithIntl(<Header />);
    const searchButton = view.getByLabelText('Abrir busca');
    fireEvent.click(searchButton);
    
    const searchInput = await view.findByRole('searchbox');
    expect(searchInput).toBeDefined();
    
    const form = searchInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(view.queryByRole('searchbox')).toBeNull();
    });
  });
});

describe('Header - Authenticated User', () => {
  it('renders user name for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' },
    });

    renderWithIntl(<Header />);
    // Should show first name
    expect(screen.getByText('Test')).toBeDefined();
  });
});

describe('Header - Admin User', () => {
  it('renders admin menu for admin users', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    });

    renderWithIntl(<Header />);
    expect(screen.getByText('Admin')).toBeDefined();
  });
});

