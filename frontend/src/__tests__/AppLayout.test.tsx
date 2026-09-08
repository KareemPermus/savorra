import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/' }),
}));

jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>;
});

import AppLayout from '@/components/layout/AppLayout';

describe('AppLayout', () => {
  it('renders brand name', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getAllByText('Savorra').length).toBeGreaterThan(0);
  });

  it('renders children', () => {
    render(<AppLayout><div>Test Content</div></AppLayout>);
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders Recipes nav link', () => {
    render(<AppLayout><div /></AppLayout>);
    expect(screen.getAllByText('Recipes').length).toBeGreaterThan(0);
  });
});