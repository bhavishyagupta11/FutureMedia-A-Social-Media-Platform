import React from 'react';
import { render } from '@testing-library/react';
import App from './app/App';

test('renders FutureMedia application root shell cleanly', () => {
  const { container } = render(<App />);
  expect(container).toBeDefined();
  expect(container.firstChild).not.toBeNull();
});
