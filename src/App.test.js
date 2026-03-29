import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-chartjs-2', () => ({
  Line: () => null,
  Bar: () => null,
}));

test('renders quotation workspace heading', async () => {
  render(<App />);
  expect(await screen.findByText(/Fast daily electrical quotation entry/i)).toBeInTheDocument();
});
