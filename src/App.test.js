import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-chartjs-2', () => ({
  Line: () => null,
  Bar: () => null,
}));

test('renders password gate on first load', async () => {
  render(<App />);
  expect(await screen.findByText(/Quotation App/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
});
