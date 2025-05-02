// Load environment variables for testing
require("dotenv").config({ path: ".env.test" });

// Mock any external services or modules here
jest.mock("mongoose", () => ({
  connect: jest.fn(),
  model: jest.fn(),
  Schema: jest.fn(),
}));

// Global test setup
beforeAll(() => {
  // Setup any global test configurations
});

// Global test cleanup
afterAll(() => {
  // Cleanup any global test configurations
});
