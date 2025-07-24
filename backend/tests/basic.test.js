// Basic test with no imports
describe('Basic Test', () => {
  it('should pass a basic test', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });

  it('should handle async/await', async () => {
    const asyncFunc = () => Promise.resolve('success');
    const result = await asyncFunc();
    expect(result).toBe('success');
  });
});
