import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Recipes from '@/pages/recipes';
import apiClient from '@/api/client';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockRecipes = [
  { id: 1, title: 'Salmon Bowl', description: 'Fresh salmon', category: 'Dinner', prep_time_minutes: 10, cook_time_minutes: 20, servings: 2, image_url: '', created_at: '2024-01-01T00:00:00Z' },
  { id: 2, title: 'Avocado Toast', description: 'Simple breakfast', category: 'Breakfast', prep_time_minutes: 5, cook_time_minutes: 0, servings: 1, image_url: '', created_at: '2024-01-02T00:00:00Z' },
];

describe('Recipes page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockRecipes });
  });

  it('renders recipes after loading', async () => {
    render(<Recipes />);
    await waitFor(() => {
      expect(screen.getByText('Salmon Bowl')).toBeInTheDocument();
      expect(screen.getByText('Avocado Toast')).toBeInTheDocument();
    });
  });

  it('filters by search', async () => {
    render(<Recipes />);
    await waitFor(() => screen.getByText('Salmon Bowl'));
    fireEvent.change(screen.getByPlaceholderText('Search recipes…'), { target: { value: 'salmon' } });
    expect(screen.getByText('Salmon Bowl')).toBeInTheDocument();
    expect(screen.queryByText('Avocado Toast')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<Recipes />);
    await waitFor(() => screen.getByText('Salmon Bowl'));
    fireEvent.click(screen.getByText('Breakfast'));
    expect(screen.queryByText('Salmon Bowl')).not.toBeInTheDocument();
    expect(screen.getByText('Avocado Toast')).toBeInTheDocument();
  });

  it('opens add recipe modal', async () => {
    render(<Recipes />);
    await waitFor(() => screen.getByText('Salmon Bowl'));
    fireEvent.click(screen.getByText('Add Recipe'));
    expect(screen.getByText('Title *')).toBeInTheDocument();
  });

  it('shows empty state when no recipes', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<Recipes />);
    await waitFor(() => {
      expect(screen.getByText('No recipes found. Add your first recipe!')).toBeInTheDocument();
    });
  });
});