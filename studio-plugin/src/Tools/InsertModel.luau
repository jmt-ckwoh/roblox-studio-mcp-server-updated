--[[
	InsertModel Tool - Insert models from Roblox marketplace into Studio
	Enhanced version of Rust server implementation with better error handling
]]

local InsertService = game:GetService("InsertService")

local function getInsertPosition()
	local camera = workspace.CurrentCamera
	if not camera then
		return Vector3.new(0, 5, 0) -- Default position
	end
	
	local viewportPoint = camera.ViewportSize / 2
	local unitRay = camera:ViewportPointToRay(viewportPoint.X, viewportPoint.Y, 0)
	
	-- Raycast to find surface to place on
	local raycastParams = RaycastParams.new()
	raycastParams.FilterType = Enum.RaycastFilterType.Blacklist
	raycastParams.FilterDescendantsInstances = {}
	
	local raycastResult = workspace:Raycast(unitRay.Origin, unitRay.Direction * 1000, raycastParams)
	
	if raycastResult then
		return raycastResult.Position + Vector3.new(0, 2, 0) -- Slightly above surface
	else
		return unitRay.Origin + unitRay.Direction * 20 -- 20 studs in front of camera
	end
end

local function searchAndInsertModel(query)
	print("[MCP InsertModel] Searching for:", query)
	
	-- Search for free models
	local success, searchResults = pcall(function()
		return InsertService:GetFreeModels(query, 1) -- Get first page
	end)
	
	if not success then
		error("Failed to search marketplace: " .. tostring(searchResults))
	end
	
	if not searchResults or #searchResults == 0 or not searchResults[1] or not searchResults[1].Results then
		error("No models found for query: " .. query)
	end
	
	local models = searchResults[1].Results
	if #models == 0 then
		error("No models found for query: " .. query)
	end
	
	-- Get the first (most relevant) model
	local modelInfo = models[1]
	local assetId = modelInfo.AssetId
	
	print("[MCP InsertModel] Found model:", modelInfo.Name, "by", modelInfo.CreatorName, "ID:", assetId)
	
	-- Insert the model
	local insertSuccess, model = pcall(function()
		local objects = game:GetObjects("rbxassetid://" .. assetId)
		if #objects == 0 then
			error("Failed to load model objects")
		end
		
		-- If multiple objects, put them in a model
		local mainObject
		if #objects == 1 then
			mainObject = objects[1]
		else
			mainObject = Instance.new("Model")
			mainObject.Name = modelInfo.Name
			for _, obj in objects do
				obj.Parent = mainObject
			end
		end
		
		return mainObject
	end)
	
	if not insertSuccess then
		error("Failed to load model: " .. tostring(model))
	end
	
	-- Generate unique name
	local baseName = modelInfo.Name or "InsertedModel"
	local finalName = baseName
	local counter = 1
	
	while workspace:FindFirstChild(finalName) do
		finalName = baseName .. "_" .. counter
		counter = counter + 1
	end
	
	model.Name = finalName
	
	-- Position the model
	local insertPos = getInsertPosition()
	
	if model:IsA("Model") then
		-- Position model using PivotTo
		local cf = CFrame.new(insertPos)
		model:PivotTo(cf)
	else
		-- Position single part
		if model:IsA("BasePart") then
			model.Position = insertPos
		end
	end
	
	-- Parent to workspace
	model.Parent = workspace
	
	return {
		name = finalName,
		assetId = assetId,
		creator = modelInfo.CreatorName,
		position = insertPos
	}
end

-- Tool handler function
local function handleInsertModel(args)
	if not args or not args.query then
		error("InsertModel requires 'query' parameter")
	end
	
	local query = args.query
	
	local success, result = pcall(searchAndInsertModel, query)
	
	if success then
		local info = result
		return string.format(
			"✅ Successfully inserted model:\n" ..
			"• Name: %s\n" ..
			"• Creator: %s\n" ..
			"• Asset ID: %d\n" ..
			"• Position: %.1f, %.1f, %.1f\n" ..
			"• Location: workspace.%s",
			info.name,
			info.creator,
			info.assetId,
			info.position.X, info.position.Y, info.position.Z,
			info.name
		)
	else
		return "❌ Failed to insert model: " .. tostring(result)
	end
end

return handleInsertModel