# MCP Server Bug Report for Roblox Studio Integration
*Report Date: 2025-01-23*  
*Client: Claude Code via Anthropic CLI*  
*MCP Server: Roblox Studio Integration (Rust-based)*  

## Environment Information

### Client Environment
- **Platform**: WSL2 (Linux 5.15.167.4-microsoft-standard-WSL2)
- **Client**: Claude Code via Anthropic CLI
- **Model**: claude-sonnet-4-20250514
- **Working Directory**: `/mnt/d/jmt_github/betrayer`
- **Date Range**: 2025-01-23 (multiple sessions)

### MCP Server Environment
- **Server Type**: Rust-based MCP server for Roblox Studio
- **Transport**: stdio
- **Commands Available**: `npm run explore`, `npm run dev read <script>`, `npm run dev backup <script> <file>`
- **Studio**: Roblox Studio (running during all tests)
- **Studio Project**: "Betrayer" social deduction game

## Bug Report Summary

### 1. **Inconsistent File Access Permissions**
**Severity**: HIGH  
**Impact**: Cannot reliably read files across different Studio locations

#### Description
The MCP server exhibits inconsistent ability to read files from different locations within the same Roblox Studio project. Some locations are consistently accessible while others consistently fail with "Could not read script" errors.

#### Expected Behavior
All ModuleScript and Script objects in the Studio project should be readable via the `npm run dev read` command if the MCP server has proper Studio integration.

#### Actual Behavior
- **ServerScriptService/Betrayer/** files: **ACCESSIBLE** (can read most files)
- **StarterPlayer/StarterPlayerScripts/** files: **INACCESSIBLE** (consistently fails)
- **ReplicatedStorage/SharedModules/** files: **INACCESSIBLE** (consistently fails)

#### Reproduction Steps
1. Start Roblox Studio with active project containing scripts in multiple locations
2. Connect MCP server to Studio
3. Execute: `npm run dev read "ServerScriptService/Betrayer/GameManager"` → **SUCCESS**
4. Execute: `npm run dev read "StarterPlayer/StarterPlayerScripts/CameraController"` → **FAILS**
5. Execute: `npm run dev read "ReplicatedStorage/SharedModules/Config"` → **FAILS**

#### Evidence
```bash
> npm run dev read ServerScriptService/Betrayer/GameManager
✅ Connected to Roblox Studio!
📖 Reading: ServerScriptService/Betrayer/GameManager
📄 Script Source: [Returns full script content]

> npm run dev read StarterPlayer/StarterPlayerScripts/CameraController  
✅ Connected to Roblox Studio!
📖 Reading: StarterPlayer/StarterPlayerScripts/CameraController
📄 Script Source: Could not read script

> npm run dev read ReplicatedStorage/SharedModules/Config
✅ Connected to Roblox Studio!
📖 Reading: ReplicatedStorage/SharedModules/Config  
📄 Script Source: Could not read script
```

#### Files Confirmed Present in Studio
User confirmed all files exist in Studio at expected locations:
- `StarterPlayer/StarterPlayerScripts/AgendaClient.lua`
- `StarterPlayer/StarterPlayerScripts/CameraController.lua`
- `StarterPlayer/StarterPlayerScripts/CharacterController.lua`
- `StarterPlayer/StarterPlayerScripts/InputStateManager.lua`
- `StarterPlayer/StarterPlayerScripts/RoomSelectClient.lua`
- `StarterPlayer/StarterPlayerScripts/TestClientScript.lua`
- `ReplicatedStorage/SharedModules/Config.lua`
- `ReplicatedStorage/SharedModules/GamePhases.lua`
- And 4 additional SharedModules files

---

### 2. **Explorer Command Incomplete Structure Detection**
**Severity**: MEDIUM  
**Impact**: Cannot rely on explorer output for complete project structure analysis

#### Description
The `npm run explore` command does not detect or report the complete Studio project structure, specifically missing entire directories that contain scripts.

#### Expected Behavior
The explorer should report all containers and scripts in the Studio project, including StarterPlayer/StarterPlayerScripts and ReplicatedStorage/SharedModules.

#### Actual Behavior
- **Reports**: ServerScriptService/Betrayer/ with all contained scripts
- **Missing**: Complete StarterPlayer/StarterPlayerScripts structure  
- **Missing**: Complete ReplicatedStorage/SharedModules structure
- **Partial Detection**: Finds individual scripts like GameFlowClient but not the container structure

#### Reproduction Steps
1. Execute: `npm run explore`
2. Observe output sections:
   - `=== SERVERSCRIPTSERVICE ===` → **COMPLETE** (shows all scripts)
   - `=== STARTERPLAYER SCRIPTS ===` → **EMPTY** (shows no structure)
   - No `=== REPLICATEDSTORAGE ===` section at all

#### Evidence
```bash
> npm run explore
📜 Looking for Betrayer Scripts:
=== WORKSPACE SCRIPTS ===

=== SERVERSCRIPTSERVICE ===
📁 Betrayer
  🔧 GameManager (ModuleScript)
  🔧 RoomSystem (ModuleScript)
  [... 20+ more scripts listed correctly]

=== STARTERPLAYER SCRIPTS ===
[Empty - no content shown]

🔍 Searching for Betrayer Features:
🎯 FOUND BETRAYER CODE in StarterPlayer/StarterPlayerScripts/GameFlowClient
  Type: LocalScript
  Lines: 746
```

Note: The explorer finds GameFlowClient individually but doesn't show the StarterPlayer structure or other StarterPlayerScripts files.

---

### 3. **Backup Command Complete Failure**
**Severity**: HIGH  
**Impact**: Cannot extract files from Studio for local backup/analysis

#### Description
The `npm run dev backup` command connects successfully but fails to create backup files. No error message is provided, and no local file is created.

#### Expected Behavior
The backup command should read the specified Studio script and create a local file with the provided filename containing the script content.

#### Actual Behavior
- Connection to Studio: **SUCCESS**
- File reading: **UNKNOWN** (no feedback)
- Local file creation: **FAILURE** (no file created)
- Error reporting: **NONE** (command appears to complete successfully)

#### Reproduction Steps
1. Execute: `npm run dev backup "ServerScriptService/Betrayer/GameManager" "gamemanager-studio-64line.lua"`
2. Command output shows successful connection and backup attempt
3. Check for created file: `ls gamemanager-studio-64line.lua` → **FILE NOT FOUND**
4. No error message or indication of failure

#### Evidence
```bash
> npm run dev backup ServerScriptService/Betrayer/GameManager gamemanager-studio-64line.lua
🔗 Connecting to Roblox Studio...
✅ Connected to Roblox Studio!
💾 Backing up ServerScriptService/Betrayer/GameManager to gamemanager-studio-64line.lua
📖 Reading: ServerScriptService/Betrayer/GameManager
🔌 Disconnected from Roblox Studio

# File check
$ ls gamemanager-studio-64line.lua
ls: cannot access 'gamemanager-studio-64line.lua': No such file or directory
```

---

### 4. **Inconsistent Connection Behavior**
**Severity**: LOW  
**Impact**: Minor reliability concerns, but connections generally succeed

#### Description
While connections generally succeed, there are occasional variations in connection behavior and timing.

#### Expected Behavior
Consistent connection establishment and disconnection patterns.

#### Actual Behavior
- Most connections succeed within reasonable timeframes
- Occasional variations in connection messages
- Generally reliable overall

#### Evidence
Standard successful connection pattern:
```bash
🔗 Connecting to Roblox Studio...
✅ Connected to Roblox Studio!
[operation]
🔌 Disconnected from Roblox Studio
```

---

### 5. **Path Format Handling Inconsistencies**
**Severity**: MEDIUM  
**Impact**: Unclear path format requirements may cause unnecessary failures

#### Description
The MCP server's expected path format for different Studio locations is not clearly documented, and it's unclear if path format contributes to access failures.

#### Observed Path Formats Tested
- `ServerScriptService/Betrayer/GameManager` → **WORKS**
- `StarterPlayer/StarterPlayerScripts/CameraController` → **FAILS**
- `ReplicatedStorage/SharedModules/Config` → **FAILS**

#### Questions for Investigation
1. Are there required path format differences for different Studio containers?
2. Do LocalScript vs ModuleScript types require different path handling?
3. Are there specific naming conventions required?

---

### 6. **Console Output Extraction Unavailable**
**Severity**: MEDIUM  
**Impact**: Cannot debug runtime issues through console output access

#### Description
There appears to be no MCP command to extract Roblox Studio console output, which limits debugging capabilities when scripts are running.

#### Expected Behavior
Ability to retrieve Studio console output to debug runtime script issues.

#### Actual Behavior
No apparent mechanism to access Studio console output through MCP commands.

#### Use Case
When debugging script initialization failures, console output is critical for understanding error messages and execution flow.

---

## User Workarounds Discovered

### 1. **File Access Validation**
**Issue**: Cannot trust MCP file access results  
**Workaround**: Always verify major findings with user confirmation  
**Example**: "I found X using MCP tools, can you confirm this matches what you see in Studio?"

### 2. **Structure Discovery**
**Issue**: Explorer doesn't show complete project structure  
**Workaround**: Ask user to confirm directory structures and file presence  
**Example**: "Can you confirm if the following files exist in StarterPlayer/StarterPlayerScripts?"

### 3. **Console Debugging**
**Issue**: Cannot access Studio console through MCP  
**Workaround**: Ask user to copy/paste console output manually  
**Example**: User provided complete console output showing script initialization sequence

---

## Impact on Development Workflow

### Positive Impacts
1. **ServerScriptService Access**: Reliable access to server-side scripts enables code analysis and architecture review
2. **Studio Integration**: When working, the integration provides real-time Studio state information
3. **Connection Reliability**: Connections generally establish successfully

### Negative Impacts
1. **Incomplete Architecture View**: Cannot analyze complete client-side architecture due to StarterPlayer access failures
2. **False Negative Diagnostics**: MCP limitations led to incorrect "missing client architecture" diagnosis
3. **Reduced Debugging Capability**: Cannot extract console output for runtime debugging
4. **Backup Failures**: Cannot create local copies of Studio scripts for version control/comparison

### Development Process Adaptations Required
1. **User Verification Protocol**: Must verify all major architectural findings with user
2. **Conditional Language**: Must use "based on available MCP data" qualifiers
3. **Multiple Evidence Sources**: Cannot rely solely on MCP tools for project assessment
4. **Manual Sync Processes**: Must rely on user for file copying between local and Studio

---

## Recommendations for MCP Server Maintainers

### High Priority Fixes
1. **Investigate StarterPlayer Access**: Determine why StarterPlayerScripts files are inaccessible
2. **Investigate ReplicatedStorage Access**: Determine why SharedModules files are inaccessible  
3. **Fix Backup Command**: Ensure backup command actually creates local files
4. **Improve Explorer Coverage**: Ensure explorer reports complete Studio project structure

### Medium Priority Improvements
1. **Console Output Access**: Add command to retrieve Studio console output
2. **Error Message Enhancement**: Provide specific error details for "Could not read script" failures
3. **Path Format Documentation**: Document expected path formats for different Studio locations
4. **Permission Diagnostics**: Add command to test/report access permissions for different Studio areas

### Low Priority Enhancements
1. **Connection Status Reporting**: More detailed connection status and diagnostics
2. **Batch Operations**: Commands to read multiple files in single operation
3. **File Type Detection**: Report script types (LocalScript vs ModuleScript vs Script) in explorer

---

## Test Environment Availability

The reporter (Claude Code client) has ongoing access to this test environment and can provide additional testing, reproduction steps, or detailed behavior analysis as needed by the MCP server maintainers.

**Contact Method**: Through the same session/environment where this bug report was generated.

---

*End of Bug Report*