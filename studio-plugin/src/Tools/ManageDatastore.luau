--[[
	ManageDatastore Tool - Real DataStore operations in Studio
	Provides actual DataStore read/write/list/delete functionality
]]

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")

local function performDataStoreOperation(operation, datastoreName, key, data, scope)
	local datastore = DataStoreService:GetDataStore(datastoreName, scope)
	
	if operation == "read" then
		local success, result = pcall(function()
			return datastore:GetAsync(key)
		end)
		
		if success then
			if result == nil then
				return {
					success = true,
					message = "Key not found",
					data = nil
				}
			else
				local dataStr = tostring(result)
				if type(result) == "table" then
					local jsonSuccess, jsonStr = pcall(HttpService.JSONEncode, HttpService, result)
					if jsonSuccess then
						dataStr = jsonStr
					end
				end
				
				return {
					success = true,
					message = "Data retrieved successfully",
					data = dataStr,
					dataType = type(result)
				}
			end
		else
			return {
				success = false,
				message = "Failed to read data: " .. tostring(result)
			}
		end
		
	elseif operation == "write" then
		local success, result = pcall(function()
			return datastore:SetAsync(key, data)
		end)
		
		if success then
			return {
				success = true,
				message = "Data saved successfully",
				data = data
			}
		else
			return {
				success = false,
				message = "Failed to write data: " .. tostring(result)
			}
		end
		
	elseif operation == "list" then
		local success, result = pcall(function()
			return datastore:ListKeysAsync()
		end)
		
		if success then
			local keys = {}
			local pageCount = 0
			local totalKeys = 0
			
			repeat
				pageCount = pageCount + 1
				if pageCount > 10 then -- Safety limit
					table.insert(keys, "... (truncated - too many keys)")
					break
				end
				
				local page = result:GetCurrentPage()
				for _, keyInfo in pairs(page) do
					table.insert(keys, keyInfo.KeyName)
					totalKeys = totalKeys + 1
					
					if totalKeys >= 50 then -- Limit displayed keys
						table.insert(keys, "... (showing first 50 keys)")
						break
					end
				end
				
				if totalKeys >= 50 then
					break
				end
				
				if not result.IsFinished then
					result:AdvanceToNextPageAsync()
				end
			until result.IsFinished
			
			return {
				success = true,
				message = string.format("Found %d keys", totalKeys),
				data = keys,
				totalKeys = totalKeys
			}
		else
			return {
				success = false,
				message = "Failed to list keys: " .. tostring(result)
			}
		end
		
	elseif operation == "delete" then
		local success, previousValue = pcall(function()
			return datastore:RemoveAsync(key)
		end)
		
		if success then
			if previousValue == nil then
				return {
					success = true,
					message = "Key was already empty",
					previousValue = nil
				}
			else
				return {
					success = true,
					message = "Key deleted successfully",
					previousValue = tostring(previousValue)
				}
			end
		else
			return {
				success = false,
				message = "Failed to delete key: " .. tostring(previousValue)
			}
		end
	else
		return {
			success = false,
			message = "Unknown operation: " .. tostring(operation)
		}
	end
end

-- Tool handler function
local function handleManageDatastore(args)
	if not args then
		error("ManageDatastore requires arguments")
	end
	
	local operation = args.operation
	local datastoreName = args.datastoreName
	local key = args.key
	local data = args.data
	local scope = args.scope or "global"
	
	-- Validate required parameters
	if not operation then
		error("Missing 'operation' parameter")
	end
	
	if not datastoreName then
		error("Missing 'datastoreName' parameter")
	end
	
	if not key then
		error("Missing 'key' parameter")
	end
	
	if operation == "write" and data == nil then
		error("Write operation requires 'data' parameter")
	end
	
	print(string.format("[MCP ManageDatastore] %s operation on '%s' key '%s'", 
		operation, datastoreName, key))
	
	local result = performDataStoreOperation(operation, datastoreName, key, data, scope)
	
	if result.success then
		local output = "✅ DataStore " .. operation .. " successful:\n"
		output = output .. "• DataStore: " .. datastoreName .. "\n"
		output = output .. "• Key: " .. key .. "\n"
		output = output .. "• Scope: " .. scope .. "\n"
		output = output .. "• Message: " .. result.message .. "\n"
		
		if operation == "read" and result.data then
			output = output .. "• Data: " .. result.data .. "\n"
			output = output .. "• Type: " .. (result.dataType or "unknown") .. "\n"
		elseif operation == "write" then
			output = output .. "• Saved data: " .. tostring(data) .. "\n"
		elseif operation == "list" and result.data then
			output = output .. "• Keys found: " .. result.totalKeys .. "\n"
			output = output .. "• Keys: " .. table.concat(result.data, ", ") .. "\n"
		elseif operation == "delete" and result.previousValue then
			output = output .. "• Previous value: " .. result.previousValue .. "\n"
		end
		
		return output
	else
		return "❌ DataStore " .. operation .. " failed:\n" ..
			"• DataStore: " .. datastoreName .. "\n" ..
			"• Key: " .. key .. "\n" ..
			"• Error: " .. result.message
	end
end

return handleManageDatastore