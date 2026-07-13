import '@testing-library/jest-dom';

// Recharts requiere ResizeObserver para funcionar en jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
