--[[
	CreatePart Tool - Create Parts in Studio workspace with specified properties
	Enhanced beyond Rust server with comprehensive part creation capabilities
]]

local function parseVector3(str, default)
	if not str then return default end
	
	local parts = string.split(str, ",")
	if #parts ~= 3 then return default end
	
	local x = tonumber(parts[1])
	local y = tonumber(parts[2])
	local z = tonumber(parts[3])
	
	if x and y and z then
		return Vector3.new(x, y, z)
	else
		return default
	end
end

local function parseBrickColor(colorName)
	if not colorName then
		return BrickColor.new("Medium stone grey")
	end
	
	-- Try to create BrickColor from name
	local success, brickColor = pcall(function()
		return BrickColor.new(colorName)
	end)
	
	if success then
		return brickColor
	else
		-- Fallback to default if color name is invalid
		warn("[CreatePart] Invalid color name:", colorName, "using default")
		return BrickColor.new("Medium stone grey")
	end
end

local function parseMaterial(materialName)
	if not materialName then
		return Enum.Material.Plastic
	end
	
	-- Try to find material enum
	for _, material in pairs(Enum.Material:GetEnumItems()) do
		if string.lower(material.Name) == string.lower(materialName) then
			return material
		end
	end
	
	-- Fallback to plastic if material not found
	warn("[CreatePart] Invalid material name:", materialName, "using Plastic")
	return Enum.Material.Plastic
end

local function createPart(args)
	-- Create the part
	local part = Instance.new("Part")
	
	-- Set name
	local name = args.name or "MCPPart"
	local finalName = name
	local counter = 1
	
	while workspace:FindFirstChild(finalName) do
		finalName = name .. "_" .. counter
		counter = counter + 1
	end
	
	part.Name = finalName
	
	-- Set size
	local size = parseVector3(args.size, Vector3.new(4, 1, 2))
	part.Size = size
	
	-- Set position
	local position = parseVector3(args.position, Vector3.new(0, 10, 0))
	part.Position = position
	
	-- Set color
	part.BrickColor = parseBrickColor(args.color)
	
	-- Set material
	part.Material = parseMaterial(args.material)
	
	-- Default properties for better visibility
	part.Anchored = true
	part.CanCollide = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	
	-- Parent to workspace
	part.Parent = workspace
	
	return {
		name = finalName,
		size = size,
		position = position,
		color = part.BrickColor.Name,
		material = part.Material.Name
	}
end

-- Tool handler function
local function handleCreatePart(args)
	if not args then
		args = {}
	end
	
	print("[MCP CreatePart] Creating part with properties:", args)
	
	local success, result = pcall(createPart, args)
	
	if success then
		local info = result
		return string.format(
			"✅ Successfully created part:\n" ..
			"• Name: %s\n" ..
			"• Size: %.1f, %.1f, %.1f\n" ..
			"• Position: %.1f, %.1f, %.1f\n" ..
			"• Color: %s\n" ..
			"• Material: %s\n" ..
			"• Location: workspace.%s",
			info.name,
			info.size.X, info.size.Y, info.size.Z,
			info.position.X, info.position.Y, info.position.Z,
			info.color,
			info.material,
			info.name
		)
	else
		return "❌ Failed to create part: " .. tostring(result)
	end
end

return handleCreatePart