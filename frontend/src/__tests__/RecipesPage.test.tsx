import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Recipes from '@/pages/index';

jest.mock('next/head', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...p }: any) => <a {...p}>{children}</a> }));
jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockRecipes = [
  { id: 1, title: 'Pasta', description: 'Tasty pasta', category: 'Dinner', prep_time_minutes: 10, cook_time_minutes: 20, servings: 4, image_url: '', created_at: '2024-01-01' },
  { id: 2, title: 'Salad', description: 'Fresh', category: 'Lunch', prep_time_minutes: 5, cook_time_minutes: 0, servings: 2, image_url: '', created_at: '2024-01-02' },
];

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: mockRecipes });
});

test('renders recipe list', async () => {
  render(<Recipes />);
  await waitFor(() => expect(screen.getByText('Pasta')).toBeInTheDocument());
  expect(screen.getByText('Salad')).toBeInTheDocument();
});

test('shows empty state when no recipes', async () => {
  mockGet.mockResolvedValue({ data: [] });
  render(<Recipes />);
  await waitFor(() => expect(screen.getByText('No recipes found')).toBeInTheDocument());
});

test('opens add recipe modal', async () => {
  render(<Recipes />);
  await waitFor(() => screen.getByText('Pasta'));
  fireEvent.click(screen.getByText('Add Recipe'));
  expect(screen.getByText('Title *')).toBeInTheDocument();
});

test('search input filters', async () => {
  render(<Recipes />);
  await waitFor(() => screen.getByText('Pasta'));
  const input = screen.getByPlaceholderText('Search recipes…');
  fireEvent.change(input, { target: { value: 'test' } });
  await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/api/recipes', { params: { search: 'test' } }));
});

test('displays stats correctly', async () => {
  render(<Recipes />);
  await waitFor(() => {
    expect(screen.getByText('2')).toBeInTheDocument(); // total recipes
  });
});