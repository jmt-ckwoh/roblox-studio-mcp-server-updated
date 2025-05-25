--[[
	CreateGUI Tool - Create GUI elements in Studio PlayerGui
	Provides real GUI creation capabilities for Studio testing
]]

local Players = game:GetService("Players")

-- Get LocalPlayer in Studio (for testing)
local function getStudioPlayer()
	-- In Studio, we'll create a mock player structure for GUI testing
	local player = Players.LocalPlayer
	if not player then
		-- Create a temporary structure for Studio testing
		warn("[CreateGUI] No LocalPlayer in Studio - creating temporary GUI parent")
		local tempFolder = workspace:FindFirstChild("TempGUIParent")
		if not tempFolder then
			tempFolder = Instance.new("Folder")
			tempFolder.Name = "TempGUIParent"
			tempFolder.Parent = workspace
		end
		return tempFolder
	end
	return player
end

local function parseUDim2(str, default)
	if not str then return default end
	
	-- Parse string like "{0.5,0},{0.1,0}" into UDim2
	local pattern = "{([%d%.%-]+),([%d%.%-]+)},{([%d%.%-]+),([%d%.%-]+)}"
	local scaleX, offsetX, scaleY, offsetY = str:match(pattern)
	
	if scaleX and offsetX and scaleY and offsetY then
		return UDim2.new(
			tonumber(scaleX), tonumber(offsetX),
			tonumber(scaleY), tonumber(offsetY)
		)
	else
		warn("[CreateGUI] Invalid UDim2 format:", str, "using default")
		return default
	end
end

local function parseColor3(str, default)
	if not str then return default end
	
	-- Handle named colors
	local namedColors = {
		red = Color3.fromRGB(255, 0, 0),
		green = Color3.fromRGB(0, 255, 0),
		blue = Color3.fromRGB(0, 0, 255),
		white = Color3.fromRGB(255, 255, 255),
		black = Color3.fromRGB(0, 0, 0),
		yellow = Color3.fromRGB(255, 255, 0),
		cyan = Color3.fromRGB(0, 255, 255),
		magenta = Color3.fromRGB(255, 0, 255),
		gray = Color3.fromRGB(128, 128, 128),
		orange = Color3.fromRGB(255, 165, 0),
		purple = Color3.fromRGB(128, 0, 128),
		pink = Color3.fromRGB(255, 192, 203)
	}
	
	local lowerStr = string.lower(str)
	if namedColors[lowerStr] then
		return namedColors[lowerStr]
	end
	
	-- Try to parse RGB values like "255,0,0"
	local r, g, b = str:match("(%d+),(%d+),(%d+)")
	if r and g and b then
		return Color3.fromRGB(tonumber(r), tonumber(g), tonumber(b))
	end
	
	warn("[CreateGUI] Invalid color format:", str, "using default")
	return default
end

local function createGUIComponent(componentType, properties)
	local component = Instance.new(componentType)
	local props = properties or {}
	
	-- Set common properties
	component.Name = props.name or (componentType .. "_MCP")
	
	-- Set type-specific properties
	if componentType == "ScreenGui" then
		component.ResetOnSpawn = false
		component.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
		
	elseif componentType == "Frame" then
		component.Size = parseUDim2(props.size, UDim2.new(0.3, 0, 0.2, 0))
		component.Position = parseUDim2(props.position, UDim2.new(0.35, 0, 0.4, 0))
		component.BackgroundColor3 = parseColor3(props.backgroundColor, Color3.fromRGB(70, 130, 180))
		component.BorderSizePixel = 0
		
		-- Add UI corner for modern look
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 8)
		corner.Parent = component
		
	elseif componentType == "TextLabel" or componentType == "TextButton" then
		component.Size = parseUDim2(props.size, UDim2.new(0.25, 0, 0.1, 0))
		component.Position = parseUDim2(props.position, UDim2.new(0.375, 0, 0.45, 0))
		component.BackgroundColor3 = parseColor3(props.backgroundColor, Color3.fromRGB(60, 120, 170))
		component.TextColor3 = parseColor3(props.textColor, Color3.fromRGB(255, 255, 255))
		component.Text = props.text or ("Sample " .. componentType)
		component.TextScaled = true
		component.Font = Enum.Font.Gotham
		component.BorderSizePixel = 0
		
		-- Add UI corner
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 6)
		corner.Parent = component
		
		-- Add button click handler for TextButton
		if componentType == "TextButton" then
			component.MouseButton1Click:Connect(function()
				print("[MCP GUI] Button clicked:", component.Name)
			end)
		end
		
	elseif componentType == "ImageLabel" then
		component.Size = parseUDim2(props.size, UDim2.new(0.2, 0, 0.15, 0))
		component.Position = parseUDim2(props.position, UDim2.new(0.4, 0, 0.425, 0))
		component.BackgroundColor3 = parseColor3(props.backgroundColor, Color3.fromRGB(255, 255, 255))
		component.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"
		component.ScaleType = Enum.ScaleType.Fit
		component.BorderSizePixel = 0
		
		-- Add UI corner
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 6)
		corner.Parent = component
	end
	
	return component
end

local function createGUI(componentType, properties)
	local player = getStudioPlayer()
	local parentObject
	
	if componentType == "ScreenGui" then
		-- Create ScreenGui in PlayerGui or workspace folder
		if player == Players.LocalPlayer and player.PlayerGui then
			parentObject = player.PlayerGui
		else
			parentObject = player -- Use workspace folder for Studio testing
		end
		
		local screenGui = createGUIComponent("ScreenGui", properties)
		screenGui.Parent = parentObject
		
		return {
			component = screenGui,
			location = parentObject:GetFullName() .. "." .. screenGui.Name
		}
	else
		-- Create component inside a ScreenGui
		local screenGuiName = "MCP_TestGui"
		local screenGui
		
		if player == Players.LocalPlayer and player.PlayerGui then
			screenGui = player.PlayerGui:FindFirstChild(screenGuiName)
			if not screenGui then
				screenGui = Instance.new("ScreenGui")
				screenGui.Name = screenGuiName
				screenGui.ResetOnSpawn = false
				screenGui.Parent = player.PlayerGui
			end
		else
			-- Studio testing mode
			screenGui = player:FindFirstChild(screenGuiName)
			if not screenGui then
				screenGui = Instance.new("ScreenGui")
				screenGui.Name = screenGuiName
				screenGui.Parent = player
			end
		end
		
		local component = createGUIComponent(componentType, properties)
		component.Parent = screenGui
		
		return {
			component = component,
			screenGui = screenGui,
			location = screenGui:GetFullName() .. "." .. component.Name
		}
	end
end

-- Tool handler function
local function handleCreateGUI(args)
	if not args or not args.componentType then
		error("CreateGUI requires 'componentType' parameter")
	end
	
	local componentType = args.componentType
	local properties = args.properties or {}
	
	-- Validate component type
	local validTypes = {"ScreenGui", "Frame", "TextLabel", "TextButton", "ImageLabel"}
	local isValid = false
	for _, validType in validTypes do
		if componentType == validType then
			isValid = true
			break
		end
	end
	
	if not isValid then
		error("Invalid componentType. Must be one of: " .. table.concat(validTypes, ", "))
	end
	
	print("[MCP CreateGUI] Creating", componentType, "with properties:", properties)
	
	local success, result = pcall(createGUI, componentType, properties)
	
	if success then
		local info = result
		local output = "✅ Successfully created " .. componentType .. ":\n"
		output = output .. "• Name: " .. info.component.Name .. "\n"
		output = output .. "• Type: " .. info.component.ClassName .. "\n"
		output = output .. "• Location: " .. info.location .. "\n"
		
		-- Add type-specific info
		if componentType ~= "ScreenGui" then
			output = output .. "• Parent ScreenGui: " .. info.screenGui.Name .. "\n"
			
			if info.component:IsA("GuiObject") then
				output = output .. "• Size: " .. tostring(info.component.Size) .. "\n"
				output = output .. "• Position: " .. tostring(info.component.Position) .. "\n"
			end
			
			if info.component:IsA("TextLabel") or info.component:IsA("TextButton") then
				output = output .. "• Text: " .. info.component.Text .. "\n"
			end
		end
		
		return output
	else
		return "❌ Failed to create GUI: " .. tostring(result)
	end
end

return handleCreateGUI