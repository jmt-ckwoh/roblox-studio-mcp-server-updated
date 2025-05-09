// Jest setup file
// This file is loaded after the Jest environment is set up but before the tests start

// Set environment variables for testing
process.env.NODE_ENV = 'test';\nprocess.env.SERVER_NAME = 'MCP Test Server';\nprocess.env.SERVER_VERSION = '1.0.0-test';\nprocess.env.PORT = '3001';\nprocess.env.DEBUG = 'false';\nprocess.env.ENABLE_RATE_LIMITING = 'false';\nprocess.env.JWT_SECRET = 'test-secret-key';\nprocess.env.CORS_ORIGINS = '*';\n