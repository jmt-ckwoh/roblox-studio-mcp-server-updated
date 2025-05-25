# 🚀 TypeScript MCP Server with Real Studio Integration

**Complete Claude Desktop ↔ Roblox Studio integration system built in TypeScript**

## 🎯 What This Provides

**Direct Studio Control**: Execute Luau code, create parts, manage DataStores, build GUIs, and manipulate workspace directly from Claude Desktop.

**Real Integration**: Not code generation - actual live Studio interaction with real-time results.

**Extensible Architecture**: Easy to add new tools and capabilities using TypeScript.

## 🏗️ Architecture

```
Claude Desktop <--stdio--> TypeScript MCP Server <--HTTP--> Studio Plugin <--Roblox API--> Studio
                           (Express + MCP SDK)              (Luau + HTTP polling)
```

### Communication Flow
1. **Claude** sends tool requests via MCP protocol
2. **TypeScript Server** queues commands with UUID correlation  
3. **Studio Plugin** polls server, executes commands in Studio
4. **Results** flow back through same path to Claude

## 🛠️ Available Tools

### Core Studio Tools
- **`run_code`** - Execute Luau code directly in Studio with output capture
- **`insert_model`** - Search marketplace and insert models into workspace
- **`create_part`** - Create Parts with specified properties (size, color, material, position)
- **`get_workspace`** - Analyze and return Studio workspace hierarchy
- **`manage_datastore`** - Real DataStore operations (read, write, list, delete)
- **`create_gui`** - Create GUI elements in Studio PlayerGui

### Enhanced Capabilities
- **Real-time execution** with output capture
- **Error handling** with Studio change history integration
- **Comprehensive workspace manipulation**
- **Live DataStore operations** (not simulation)
- **Professional GUI creation** with modern styling

## 🚀 Quick Setup

### Prerequisites
- **Roblox Studio** installed and run at least once
- **Claude Desktop** installed  
- **Node.js** 18+ with npm
- **Rojo** for plugin building: `cargo install rojo` or download from [rojo.space](https://rojo.space)

### Installation

1. **Build and Setup**
   ```bash
   cd /path/to/roblox-studio-mcp-server-updated
   npm install
   npm run setup-studio  # Builds server + plugin, installs to Studio
   ```

2. **Configure Claude Desktop**
   
   Add to your Claude Desktop config (`claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "roblox-studio": {
         "command": "node",
         "args": ["/full/path/to/roblox-studio-mcp-server-updated/dist/studio-integration/studio-mcp-server.js"]
       }
     }
   }
   ```

3. **Start the System**
   ```bash
   npm run studio-server  # Start MCP server
   ```
   
   Then open Roblox Studio and look for "Toggle MCP" button in Plugins tab.

## 🎮 Usage Examples

### Basic Code Execution
```
Claude: "Create a red part at position 0,10,0"
```
Executes: `run_code` tool with part creation script

### Marketplace Integration  
```
Claude: "Insert a tree model from the marketplace"
```
Executes: `insert_model` with search and placement

### DataStore Operations
```
Claude: "Save player data with key 'player_123' containing level: 5, coins: 100"
```
Executes: `manage_datastore` with real DataStore write

### Workspace Analysis
```
Claude: "Show me what's currently in the workspace"
```
Executes: `get_workspace` with hierarchical analysis

### GUI Creation
```
Claude: "Create a blue button that says 'Start Game'"
```
Executes: `create_gui` with professional styling

## 🔧 Development

### Running in Development Mode
```bash
npm run studio-server:dev  # TypeScript server with hot reload
```

### Building Plugin Only
```bash
npm run build-plugin  # Rebuilds and reinstalls Studio plugin
```

### Project Structure
```
src/studio-integration/
├── studio-mcp-server.ts      # Main MCP server with HTTP endpoints
└── build-plugin.ts           # Plugin build and installation script

studio-plugin/
├── src/
│   ├── Main.server.luau      # Plugin main script with HTTP polling
│   └── Tools/                # Individual tool implementations
│       ├── RunCode.luau      # Code execution with output capture
│       ├── InsertModel.luau  # Marketplace model insertion
│       ├── CreatePart.luau   # Part creation with properties
│       ├── GetWorkspace.luau # Workspace hierarchy analysis
│       ├── ManageDatastore.luau  # Real DataStore operations
│       └── CreateGUI.luau    # GUI element creation
└── default.project.json      # Rojo project configuration
```

## 🔄 Extending the System

### Adding New Tools

1. **Server Side** (TypeScript):
   ```typescript
   this.mcpServer.tool(
     'my_new_tool',
     'Description of what it does',
     { param1: z.string().describe('Parameter description') },
     async ({ param1 }) => {
       const response = await this.executeStudioCommand('MyNewTool', { param1 });
       return { content: [{ type: 'text' as const, text: response }] };
     }
   );
   ```

2. **Plugin Side** (Luau):
   ```lua
   -- studio-plugin/src/Tools/MyNewTool.luau
   local function handleMyNewTool(args)
     -- Implement tool logic
     return "✅ Tool executed successfully"
   end
   
   return handleMyNewTool
   ```

3. **Rebuild**: `npm run build-plugin`

## 🛡️ Security & Limitations

### Security Features
- **Local HTTP server** (port 44755) - not exposed externally
- **Studio plugin sandbox** - runs within Roblox security model
- **Input validation** on both server and plugin sides
- **Timeout protection** - prevents infinite operations

### Current Limitations
- **Single Studio instance** - one Studio session at a time
- **Local only** - requires Studio and server on same machine
- **DataStore testing** - requires published place for real DataStore operations
- **Plugin permissions** - limited by Studio plugin security model

## 🎉 Success Validation

### Verify Setup Working:

1. **Plugin Installed**: Look for "Toggle MCP" button in Studio Plugins tab
2. **Server Connection**: Plugin console shows "MCP Studio plugin is ready for prompts!"
3. **Claude Integration**: Hammer icon in Claude shows available Roblox tools
4. **End-to-End Test**: Ask Claude to "create a red part" and see it appear in Studio

### Expected Claude Tools:
- `run_code` - Execute Luau code in Studio  
- `insert_model` - Insert marketplace models
- `create_part` - Create parts with properties
- `get_workspace` - Analyze workspace hierarchy
- `manage_datastore` - DataStore operations  
- `create_gui` - Create GUI elements

## 🆚 Advantages Over Rust Server

### Development Benefits
- ✅ **Full TypeScript development** - easy debugging and extension
- ✅ **Familiar ecosystem** - npm, Node.js, standard tooling
- ✅ **Enhanced error handling** - comprehensive error reporting
- ✅ **Better output formatting** - structured, readable responses
- ✅ **Extensible architecture** - easy to add new capabilities

### Functional Benefits  
- ✅ **More tools** - 6 tools vs Rust server's 2
- ✅ **Better tool implementations** - enhanced features and error handling
- ✅ **Real DataStore operations** - not just code generation
- ✅ **Comprehensive workspace analysis** - detailed hierarchy inspection
- ✅ **Professional GUI creation** - modern styling and event handling

**This system provides complete Claude ↔ Studio integration with room for unlimited expansion!** 🚀