// Simple smoke test to verify Jest setup
function sum(a, b) {
  return a + b;
}

describe('Smoke Test', () => {
  it('should pass a simple test', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
