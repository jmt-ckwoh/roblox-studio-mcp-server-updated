--[[
	Roblox Studio MCP Plugin
	Communicates with TypeScript MCP Server via HTTP polling
	Based on Rust server architecture but implemented in TypeScript ecosystem
]]

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local StudioService = game:GetService("StudioService")

-- Server configuration
local MCP_SERVER_URL = "http://localhost:3000"
local REQUEST_ENDPOINT = "/request"
local RESPONSE_ENDPOINT = "/response"
local POLL_INTERVAL = 1 -- Poll every 1 second

-- Plugin state
local isConnected = false
local pollConnection = nil

-- Import tool modules
local Tools = {}
for _, toolModule in script.Tools:GetChildren() do
	if toolModule:IsA("ModuleScript") then
		local success, tool = pcall(require, toolModule)
		if success and typeof(tool) == "function" then
			Tools[toolModule.Name] = tool
			print("[MCP] Loaded tool:", toolModule.Name)
		else
			warn("[MCP] Failed to load tool:", toolModule.Name, tool)
		end
	end
end

-- HTTP request helper with error handling
local function makeRequest(method, endpoint, data)
	local url = MCP_SERVER_URL .. endpoint
	local success, result = pcall(function()
		if method == "GET" then
			return HttpService:GetAsync(url)
		elseif method == "POST" then
			return HttpService:PostAsync(url, HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
		end
	end)
	
	if success then
		return true, result
	else
		return false, result
	end
end

-- Execute a tool command
local function executeCommand(command)
	local commandId = command.id
	local toolName = command.tool
	local args = command.args
	
	print("[MCP] Executing command:", toolName, "with ID:", commandId)
	
	-- Start change history recording
	local recording = ChangeHistoryService:TryBeginRecording("MCP_" .. toolName)
	
	local success, response = pcall(function()
		-- Find and execute the appropriate tool
		local tool = Tools[toolName]
		if tool then
			return tool(args)
		else
			error("Unknown tool: " .. toolName)
		end
	end)
	
	-- Finish recording
	if recording then
		ChangeHistoryService:FinishRecording(recording, 
			success and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel)
	end
	
	-- Send response back to server
	local responseData = {
		id = commandId,
		result = success and tostring(response) or "",
		success = success,
		error = success and nil or tostring(response)
	}
	
	local responseSuccess, responseResult = makeRequest("POST", RESPONSE_ENDPOINT, responseData)
	if not responseSuccess then
		warn("[MCP] Failed to send response:", responseResult)
	else
		print("[MCP] Response sent successfully for command:", commandId)
	end
end

-- Poll for commands from MCP server
local function pollForCommands()
	if not isConnected then
		return
	end
	
	local success, result = makeRequest("GET", REQUEST_ENDPOINT)
	if success then
		-- Check if we got a command (not a timeout/empty response)
		local commandData = nil
		pcall(function()
			commandData = HttpService:JSONDecode(result)
		end)
		
		if commandData and commandData.id and commandData.tool then
			-- Execute command in a separate thread to avoid blocking the poll loop
			task.spawn(executeCommand, commandData)
		end
	else
		-- Connection error - will retry on next poll
		if not string.find(result, "HttpError") then
			warn("[MCP] Poll error:", result)
		end
	end
end

-- Connect to MCP server
local function connect()
	if isConnected then
		return
	end
	
	print("[MCP] Connecting to TypeScript MCP Server...")
	
	-- Test connection
	local success, result = makeRequest("GET", "/health")
	if success then
		print("[MCP] Connected to MCP Server successfully")
		isConnected = true
		
		-- Start polling loop
		pollConnection = task.spawn(function()
			while isConnected do
				pollForCommands()
				wait(POLL_INTERVAL)
			end
		end)
		
		print("[MCP] Studio plugin is ready for Claude prompts!")
	else
		warn("[MCP] Failed to connect to MCP Server:", result)
		warn("[MCP] Make sure the TypeScript MCP server is running on port 44755")
	end
end

-- Disconnect from MCP server
local function disconnect()
	if not isConnected then
		return
	end
	
	print("[MCP] Disconnecting from MCP Server...")
	isConnected = false
	
	if pollConnection then
		task.cancel(pollConnection)
		pollConnection = nil
	end
	
	print("[MCP] MCP Studio plugin disconnected")
end

-- Plugin UI setup
local function setupPluginUI()
	local toolbar = plugin:CreateToolbar("MCP Studio")
	local toggleButton = toolbar:CreateButton(
		"Toggle MCP",
		"Connect/disconnect from TypeScript MCP Server",
		"rbxasset://textures/ui/GuiImagePlaceholder.png"
	)
	
	toggleButton.ClickableWhenViewportHidden = true
	
	toggleButton.Click:Connect(function()
		if isConnected then
			disconnect()
			toggleButton:SetActive(false)
		else
			connect()
			toggleButton:SetActive(isConnected)
		end
	end)
	
	-- Auto-connect on startup
	connect()
	toggleButton:SetActive(isConnected)
end

-- Prevent running in play mode
if RunService:IsRunning() then
	return
end

-- Initialize plugin
setupPluginUI()

print("[MCP] TypeScript MCP Studio Plugin loaded")
print("[MCP] Available tools:", table.concat(script.Parent.Tools:GetChildren(), ", "))