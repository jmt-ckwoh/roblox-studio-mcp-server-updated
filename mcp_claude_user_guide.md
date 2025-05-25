# MCP Claude User Guide - Roblox Studio Integration

## Overview
This MCP server provides direct control of Roblox Studio through 6 tools. It uses HTTP polling architecture where Studio plugin polls the TypeScript server for commands.

## Architecture
- **TypeScript MCP Server**: Runs on port 3000, handles MCP protocol via stdio
- **Studio Plugin**: Polls server every second for commands, executes tools, sends responses
- **Communication**: HTTP long-polling (15s timeout) with UUID-based request/response correlation

## Setup Process
1. **Start Server**: `npm run studio-server:test` (must stay running)
2. **Studio Plugin**: Auto-installed to `C:\Users\{user}\AppData\Local\Roblox\Plugins\MCPStudioPlugin.rbxm`
3. **Plugin Connection**: Click "Toggle MCP" button in Studio Plugins tab
4. **Verify**: Studio output shows "[MCP] Connected to MCP Server successfully"

## Available Tools

### ✅ Working Tools (4/6)

#### `get_workspace`
- **Purpose**: Analyze Roblox workspace hierarchy and objects
- **Args**: `{ maxDepth: number }` (default: 3)
- **Returns**: Detailed tree structure with object properties (Position, Size, Material, etc.)
- **Example**: Returns Baseplate, SpawnLocation, Terrain with full property details

#### `create_part`
- **Purpose**: Create new Part objects in workspace
- **Args**: `{ name: string, material?: string, color?: string, size?: [x,y,z], position?: [x,y,z] }`
- **Returns**: Confirmation with part location and properties
- **Example**: Creates visible neon parts at specified positions

#### `insert_model`
- **Purpose**: Search and insert free models from Roblox marketplace
- **Args**: `{ query: string }` (search term like "car", "house", "tree")
- **Returns**: Model name, creator, Asset ID, and workspace location
- **Example**: Inserts functioning car models from marketplace

#### `create_gui`
- **Purpose**: Create GUI elements (ScreenGui, Frame, TextLabel, etc.)
- **Args**: `{ componentType: string, properties: object }`
- **Returns**: GUI element location and properties
- **Note**: Creates in temporary parent in Studio (no LocalPlayer)

### ❌ Partially Working Tools (2/6)

#### `run_code`
- **Purpose**: Execute Luau code in Studio with output capture
- **Args**: `{ code: string }` (Luau script)
- **Status**: Executes successfully but server gets 500 error on response parsing
- **Studio Output**: Shows execution in Studio console

#### `manage_datastore`
- **Purpose**: DataStore operations (read/write/delete)
- **Args**: `{ operation: string, datastoreName: string, key: string, data?: any }`
- **Status**: Executes successfully but server gets 500 error on response parsing
- **Operations**: "read", "write", "delete", "list"

## Usage Patterns

### Workspace Analysis
```
Use get_workspace to understand current Studio environment before making changes
```

### Object Creation
```
1. get_workspace - See current objects
2. create_part - Add new parts with specific properties
3. get_workspace - Verify changes
```

### Model Integration
```
insert_model with search terms to add complex pre-built models
```

### GUI Development
```
create_gui to build user interface elements
```

## Technical Details

### Tool Name Mapping
- Server uses snake_case: `get_workspace`, `run_code`
- Studio uses PascalCase: `GetWorkspace`, `RunCode`
- Server automatically maps names

### Error Handling
- Connection errors: Plugin auto-reconnects
- Tool failures: Return error details in response
- Timeouts: 30-second limit per command

### Performance
- Polling interval: 1 second
- Long-polling timeout: 15 seconds
- Command queue: FIFO processing

## Troubleshooting

### Plugin Not Connecting
- Verify server running on port 3000
- Check "Toggle MCP" button state in Studio
- Restart Studio if plugin doesn't load

### Tools Timing Out
- Ensure Studio plugin is connected (check output)
- Verify server logs show polling requests
- Check for port conflicts

### Missing Objects
- Use get_workspace to verify object creation
- Check Studio Explorer panel for new objects
- Some tools create temporary objects for testing

## Current Limitations
- run_code and manage_datastore have response parsing issues (tools work, server errors)
- GUI creation uses temporary parent in Studio environment
- DataStore operations require proper Roblox permissions
- Marketplace models limited to free assets

## Integration Notes
- Server must run continuously for tools to work
- Plugin automatically loads tools: CreateGUI, CreatePart, GetWorkspace, InsertModel, ManageDatastore, RunCode
- All changes appear immediately in Studio
- Tools support undo/redo through Studio ChangeHistoryService