--[[
	RunCode Tool - Execute Luau code in Studio with output capture
	Matches the Rust server implementation but with enhanced output formatting
]]

local HttpService = game:GetService("HttpService")

local function captureOutput(code)
	local output = {}
	
	-- Create environment with output capture
	local env = setmetatable({}, {__index = getfenv()})
	
	-- Override print, warn, error to capture output
	env.print = function(...)
		local args = {...}
		local message = table.concat(args, "\t")
		table.insert(output, "[PRINT] " .. message)
		print(...) -- Also print to studio console
	end
	
	env.warn = function(...)
		local args = {...}
		local message = table.concat(args, "\t")
		table.insert(output, "[WARN] " .. message)
		warn(...) -- Also warn to studio console
	end
	
	env.error = function(...)
		local args = {...}
		local message = table.concat(args, "\t")
		table.insert(output, "[ERROR] " .. message)
		error(...) -- Also error to studio console
	end
	
	-- Execute code in protected environment
	local chunk, compileError = loadstring(code)
	if not chunk then
		return false, "Compilation error: " .. tostring(compileError)
	end
	
	setfenv(chunk, env)
	
	local success, result = pcall(chunk)
	if success then
		-- Capture return values if any
		if result ~= nil then
			local resultStr = tostring(result)
			if type(result) == "table" then
				local success, json = pcall(HttpService.JSONEncode, HttpService, result)
				if success then
					resultStr = json
				end
			end
			table.insert(output, "[RETURN] " .. resultStr)
		end
		
		-- Return combined output
		local outputText = table.concat(output, "\n")
		return true, outputText ~= "" and outputText or "Code executed successfully (no output)"
	else
		table.insert(output, "[RUNTIME ERROR] " .. tostring(result))
		return false, table.concat(output, "\n")
	end
end

-- Tool handler function
local function handleRunCode(args)
	if not args or not args.command then
		return {
			success = false,
			error = "RunCode requires 'command' parameter"
		}
	end
	
	local command = args.command
	print("[MCP RunCode] Executing Luau code:")
	print(command)
	
	local success, output = captureOutput(command)
	
	if success then
		print("[MCP RunCode] Execution completed successfully")
		return {
			success = true,
			result = {
				message = "Code executed successfully",
				output = output,
				execution_time = tick()
			}
		}
	else
		warn("[MCP RunCode] Execution failed")
		return {
			success = false,
			error = "Code execution failed",
			result = {
				output = output,
				execution_time = tick()
			}
		}
	end
end

return handleRunCode