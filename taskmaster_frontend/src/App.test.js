import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing headline', () => {
  render(<App />);
  const el = screen.getByText(/Manage tasks, insights, and publishing/i);
  expect(el).toBeInTheDocument();
});
