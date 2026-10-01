import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders the login page by default for unauthenticated users', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // Because of ProtectedRoute, '/' will redirect to '/login' for unauthenticated
    // Check if the login form or text exists.
    const elements = screen.getAllByText(/Iniciar Sesión/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
