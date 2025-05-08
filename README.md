# Roblox Studio MCP Server

An implementation of the Model Context Protocol (MCP) server specifically designed for Roblox Studio, built with TypeScript.

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/dmae97/roblox-studio-mcp-server-updated/ci.yml?branch=main)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

This MCP server provides specialized resources, tools, and prompts for Roblox Studio development. It allows LLM applications to access Roblox Studio documentation, templates, code generation capabilities, and other features through a standardized interface.

## Enhanced Features

- **JWT Authentication**: Secure JWT-based authentication with role-based access control
- **Docker Support**: Easy deployment and scaling with Docker and Docker Compose
- **Testing Framework**: Unit and integration tests using Jest
- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
- **Security Enhancements**: HTTP header security with Helmet and environment variable validation
- **Improved Logging**: Structured logging system using Winston
- **Monitoring**: Prometheus and Grafana support (optional)
- **Extensible Architecture**: Modular design for easy expansion
- **WebSocket Support**: Alternative to SSE for better real-time communication
- **Connection Management**: Robust connection tracking and health monitoring
- **API Versioning**: Support for multiple API versions with graceful deprecation
- **Advanced Rate Limiting**: Flexible rate limiting strategies for API protection
- **Automatic Retries**: Configurable retry mechanisms for failed operations

## Features

- **Resources**: Access to Roblox Studio documentation, API references, and code templates
- **Tools**: Luau code generation and validation, asset search, game component creation
- **Prompts**: Special prompts for script generation, bug finding, and performance optimization
- **API Integration**: Direct connection to Roblox API and Open Cloud API
- **Interactive Systems**: Creation of dialogue systems, UI interfaces, and complex gameplay mechanics
- **Enhanced Performance**: Built-in caching and rate limiting for optimal performance
- **Robust Error Handling**: Comprehensive error management and graceful recovery
- **Metrics and Monitoring**: Built-in health checks and performance metrics

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Docker and Docker Compose (optional)
- Roblox API key (for API integration features)
- Roblox Open Cloud API key (for Open Cloud features)

## Installation

1. Clone the repository
```bash
git clone https://github.com/dmae97/roblox-studio-mcp-server-updated.git
cd roblox-studio-mcp-server-updated
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`
```bash
cp .env.example .env
```

4. Update the `.env` file with your Roblox API keys and other configuration
```
ROBLOX_API_KEY=your_api_key_here
ROBLOX_OPEN_CLOUD_API_KEY=your_open_cloud_api_key_here
ROBLOX_OPEN_CLOUD_UNIVERSE_ID=your_universe_id_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

5. Build the project
```bash
npm run build
```

## Running the Server

Start the server in development mode:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

The server starts on port 3000 by default (configurable in `.env`).

## Docker Deployment

You can also run the server using Docker:

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

Or using Docker Compose:

```bash
docker-compose up -d
```

## Running Tests

Run unit tests:
```bash
npm test
```

Generate a test coverage report:
```bash
npm run test:coverage
```

Run integration tests:
```bash
npm run test:integration
```

## API Endpoints

### MCP-Related Endpoints
- `GET /sse` - Server-Sent Events endpoint for MCP communication
- `GET /ws` - WebSocket endpoint for MCP communication (alternative to SSE)
- `POST /messages` - Message endpoint for MCP communication
- `GET /health` - Server health check endpoint
- `GET /metrics` - Server metrics endpoint

### Authentication Endpoints
- `POST /auth/login` - User login and token issuance
- `POST /auth/refresh` - Issue new access token using refresh token
- `GET /auth/validate` - Validate token
- `GET /auth/admin` - Admin privilege check (admin only)

## Configuration Options

The server can be configured using environment variables in the `.env` file:

### Server Configuration
- `PORT` - Port to run the server on (default: 3000)
- `SERVER_NAME` - Server name (default: "Roblox Studio MCP Server")
- `SERVER_VERSION` - Server version (default: "1.0.0")
- `NODE_ENV` - Environment (development/production)
- `DEBUG` - Enable debug mode (true/false)

### Logging Configuration
- `LOG_LEVEL` - Logging level (info, warn, error, debug)
- `LOG_TIMESTAMP` - Include timestamp in logs (true/false)
- `LOG_COLOR` - Colorize log output (true/false)

### Performance Settings
- `ENABLE_RATE_LIMITING` - Enable rate limiting (true/false)
- `RATE_LIMIT_WINDOW` - Rate limit time window (milliseconds)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `CACHE_TTL` - Time to live for cached data (seconds)
- `CACHE_CHECK_PERIOD` - Check interval for expired cache items (seconds)

### Security Settings
- `CORS_ORIGINS` - Comma-separated list of allowed origins, or * for all
- `JWT_SECRET` - Secret key for JWT token generation and verification
- `JWT_EXPIRES_IN` - Token expiry time in seconds (default: 1 hour)
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh token generation and verification
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry time in seconds (default: 1 week)

## Resources

### Documentation

- `docs://api/{section}` - Access Roblox Studio API documentation
- `docs://api` - List available documentation sections
- `docs://luau` - Luau language documentation and best practices
- `docs://services/{service}` - Documentation for specific Roblox services

### Templates

- `template://roblox/{category}/{name}` - Access code templates
- `template://roblox` - List available templates
- `template://ui/{component}` - UI component templates using Roblox UI

## Development

### Project Structure

```
.
├── src/                    # Source code
│   ├── api/                # API-related code
│   ├── auth/               # Authentication code
│   ├── connection/         # Connection management
│   ├── middleware/         # Express middleware
│   ├── resources/          # MCP resources
│   ├── tools/              # MCP tools
│   │   ├── datastore/      # DataStore tools
│   │   ├── interactive/    # Interactive system tools
│   │   ├── opencloud/      # Open Cloud integration tools
│   │   └── physics/        # Physics system tools
│   ├── prompts/            # MCP prompts
│   ├── tests/              # Test code
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── prometheus/             # Prometheus configuration
├── .env.example           # Environment variable example
├── Dockerfile             # Docker build definition
├── docker-compose.yml     # Docker Compose configuration
├── package.json           # Project metadata and dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # Documentation
```

## Connecting to the MCP Server

### Example 1: Using Claude with API

```javascript
// Example code for calling the MCP server from a web application using Claude
async function callRobloxMcp() {
  const response = await fetch('https://your-claude-api-endpoint/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-claude-api-key'
    },
    body: JSON.stringify({
      model: "claude-3.7-sonnet-20250219",
      messages: [
        {
          role: "user",
          content: "Help me create a platformer game in Roblox Studio"
        }
      ],
      tool_choice: "auto",
      tools: [
        {
          function: {
            name: "mcp",
            description: "Call the Roblox Studio MCP server",
            parameters: {
              type: "object",
              properties: {
                server_url: {
                  type: "string",
                  description: "URL of the MCP server"
                },
                tool_name: {
                  type: "string",
                  description: "Name of the MCP tool to call"
                },
                tool_parameters: {
                  type: "object",
                  description: "Parameters for the MCP tool"
                }
              },
              required: ["server_url", "tool_name"]
            }
          }
        }
      ]
    })
  });
  
  return await response.json();
}
```

### Example 2: Using the MCP CLI Tool

You can also use the MCP server via the command line:

```bash
# Install the MCP client CLI
npm install -g @modelcontextprotocol/cli

# Connect to the MCP server
mcp connect http://localhost:3000

# Use an MCP tool
mcp tool generate-roblox-code --scriptType=ServerScript --functionality="Handle player movement" --includeComments=true

# Access a template
mcp resource template://roblox/game/platformer
```

### Example 3: Connecting with Anthropic's Claude

```python
import anthropic
from anthropic.tool_use import MCP

# Initialize Claude client
client = anthropic.Client(api_key="your-anthropic-api-key")

# Create MCP connection
mcp = MCP(server_url="http://localhost:3000")

# Send message to Claude with MCP capabilities
response = client.messages.create(
    model="claude-3.7-sonnet-20250219",
    max_tokens=1000,
    system="You are a helpful AI assistant with access to a Roblox Studio MCP server.",
    messages=[
        {
            "role": "user",
            "content": "I want to create a multiplayer game in Roblox Studio. What tools should I use?"
        }
    ],
    tools=[mcp.to_tool()]
)

print(response.content)
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify that your Roblox API key is correctly configured.
2. **Authentication Failures**: Check that your JWT secret keys are properly set.
3. **High Memory Usage**: Adjust Cache TTL settings to manage memory usage.
4. **Rate Limit Errors**: Adjust `RATE_LIMIT_*` settings for your environment.

### Logging

Set `LOG_LEVEL=debug` to enable detailed logging for debugging issues.

## Contributing

Contributions are welcome! Feel free to submit a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
