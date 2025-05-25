--[[
	GetWorkspace Tool - Analyze and return Studio workspace hierarchy
	Provides comprehensive workspace inspection capabilities
]]

local function getObjectInfo(obj, depth, maxDepth)
	local info = {
		Name = obj.Name,
		ClassName = obj.ClassName,
		Children = {}
	}
	
	-- Add specific properties based on class
	if obj:IsA("BasePart") then
		info.Position = string.format("%.1f, %.1f, %.1f", obj.Position.X, obj.Position.Y, obj.Position.Z)
		info.Size = string.format("%.1f, %.1f, %.1f", obj.Size.X, obj.Size.Y, obj.Size.Z)
		info.Material = obj.Material.Name
		info.BrickColor = obj.BrickColor.Name
		info.Anchored = obj.Anchored
	elseif obj:IsA("Model") then
		local parts = {}
		for _, child in obj:GetChildren() do
			if child:IsA("BasePart") then
				table.insert(parts, child.Name)
			end
		end
		if #parts > 0 then
			info.Parts = parts
		end
	elseif obj:IsA("Script") or obj:IsA("LocalScript") or obj:IsA("ModuleScript") then
		info.ScriptType = obj.ClassName
		info.Enabled = obj:IsA("BaseScript") and obj.Enabled or nil
	elseif obj:IsA("GuiObject") then
		info.Visible = obj.Visible
		if obj:IsA("GuiBase2d") then
			info.Size = tostring(obj.Size)
			info.Position = tostring(obj.Position)
		end
	end
	
	-- Recursively get children if within depth limit
	if depth < maxDepth then
		local childCount = 0
		for _, child in obj:GetChildren() do
			childCount = childCount + 1
			if childCount <= 20 then -- Limit children to prevent overwhelming output
				info.Children[child.Name] = getObjectInfo(child, depth + 1, maxDepth)
			elseif childCount == 21 then
				info.Children["..."] = {
					Name = "...",
					ClassName = "TruncatedChildren",
					Note = string.format("(%d more children not shown)", #obj:GetChildren() - 20)
				}
				break
			end
		end
	elseif #obj:GetChildren() > 0 then
		info.Children["..."] = {
			Name = "...",
			ClassName = "MaxDepthReached",
			Note = string.format("(%d children at max depth)", #obj:GetChildren())
		}
	end
	
	return info
end

local function formatWorkspaceInfo(info, indent)
	indent = indent or ""
	local lines = {}
	
	-- Format object header
	local header = indent .. "📁 " .. info.Name .. " (" .. info.ClassName .. ")"
	table.insert(lines, header)
	
	-- Add specific properties
	local properties = {}
	for key, value in pairs(info) do
		if key ~= "Name" and key ~= "ClassName" and key ~= "Children" then
			if type(value) == "table" then
				table.insert(properties, key .. ": [" .. table.concat(value, ", ") .. "]")
			else
				table.insert(properties, key .. ": " .. tostring(value))
			end
		end
	end
	
	if #properties > 0 then
		table.insert(lines, indent .. "  " .. table.concat(properties, " | "))
	end
	
	-- Format children
	for childName, childInfo in pairs(info.Children) do
		local childLines = formatWorkspaceInfo(childInfo, indent .. "  ")
		for _, line in childLines do
			table.insert(lines, line)
		end
	end
	
	return lines
end

local function analyzeWorkspace(maxDepth)
	print("[MCP GetWorkspace] Analyzing workspace with max depth:", maxDepth)
	
	local workspaceInfo = getObjectInfo(workspace, 0, maxDepth)
	
	-- Count total objects
	local function countObjects(info)
		local count = 1
		for _, child in pairs(info.Children) do
			count = count + countObjects(child)
		end
		return count
	end
	
	local totalObjects = countObjects(workspaceInfo)
	
	-- Format the output
	local lines = formatWorkspaceInfo(workspaceInfo)
	local output = table.concat(lines, "\n")
	
	-- Add summary
	local summary = string.format(
		"\n📊 Workspace Summary:\n" ..
		"• Total objects analyzed: %d\n" ..
		"• Analysis depth: %d levels\n" ..
		"• Direct workspace children: %d",
		totalObjects,
		maxDepth,
		#workspace:GetChildren()
	)
	
	return output .. summary
end

-- Tool handler function
local function handleGetWorkspace(args)
	local maxDepth = (args and args.maxDepth) or 3
	
	-- Validate maxDepth
	if maxDepth < 1 then
		maxDepth = 1
	elseif maxDepth > 10 then
		maxDepth = 10 -- Prevent excessive recursion
	end
	
	local success, result = pcall(analyzeWorkspace, maxDepth)
	
	if success then
		return "✅ Workspace analysis complete:\n\n" .. result
	else
		return "❌ Failed to analyze workspace: " .. tostring(result)
	end
end

return handleGetWorkspace