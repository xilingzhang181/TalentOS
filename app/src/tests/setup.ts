/**
 * Vitest global setup — browser API mocks for jsdom environment.
 */

// ─── window.matchMedia ──────────────────────────────────────────────────────

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),          // deprecated
    removeListener: vi.fn(),       // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── IntersectionObserver ───────────────────────────────────────────────────

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// ─── ResizeObserver ─────────────────────────────────────────────────────────

class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

// ─── Additional browser globals that jsdom lacks ─────────────────────────────

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn();

// URL.createObjectURL / revokeObjectURL are not in jsdom
if (!window.URL.createObjectURL) {
  Object.defineProperty(window.URL, "createObjectURL", {
    value: vi.fn(() => "blob:mock-url"),
  });
}
if (!window.URL.revokeObjectURL) {
  Object.defineProperty(window.URL, "revokeObjectURL", {
    value: vi.fn(),
  });
}
