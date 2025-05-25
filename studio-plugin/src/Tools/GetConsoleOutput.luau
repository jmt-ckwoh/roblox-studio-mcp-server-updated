--[[
	GetConsoleOutput Tool - Capture and filter console output from Roblox Studio
	Provides real-time debugging visibility for AI-assisted development
]]

local LogService = game:GetService("LogService")
local RunService = game:GetService("RunService")

-- Circular buffer with configurable size
local ConsoleBuffer = {
    server_logs = {},
    max_size = 500,
    current_index = 1,
    total_count = 0
}

-- LogService.MessageOut event signature: (message: string, messageType: Enum.MessageType)
-- messageType values: Enum.MessageType.MessageOutput, MessageWarning, MessageError, MessageInfo
local function addLogEntry(message, messageType)
    local logEntry = {
        timestamp = tick(),
        message = tostring(message),
        level = messageType.Name:lower():gsub("message", ""), -- "messageoutput" -> "output", "messageerror" -> "error"
        source_script = debug.traceback():match("([^%.]+%.luau)") or "unknown"
    }
    
    -- Add to circular buffer with proper wraparound
    ConsoleBuffer.server_logs[ConsoleBuffer.current_index] = logEntry
    ConsoleBuffer.current_index = (ConsoleBuffer.current_index % ConsoleBuffer.max_size) + 1
    ConsoleBuffer.total_count = ConsoleBuffer.total_count + 1
end

-- Connect to LogService events when this module loads
LogService.MessageOut:Connect(addLogEntry)

-- Tool implementation function
local function GetConsoleOutput(params)
    local success, result = pcall(function()
        local context = params.context or "both"
        local log_level = params.log_level or "all"
        local max_lines = math.min(params.max_lines or 100, ConsoleBuffer.max_size)
        local since_timestamp = params.since_timestamp
        local filter_pattern = params.filter_pattern
        
        -- Collect logs from circular buffer (start from most recent)
        local collected_logs = {}
        local count = 0
        
        -- Start from current position and work backwards through circular buffer
        for i = 0, ConsoleBuffer.max_size - 1 do
            if count >= max_lines then break end
            
            -- Calculate actual index (wrap around)
            local index = ((ConsoleBuffer.current_index - 1 - i - 1) % ConsoleBuffer.max_size) + 1
            local log = ConsoleBuffer.server_logs[index]
            
            if log then
                -- Apply filters
                local include = true
                
                -- Log level filter
                if log_level ~= "all" and log.level ~= log_level then
                    include = false
                end
                
                -- Timestamp filter  
                if include and since_timestamp and log.timestamp < since_timestamp then
                    include = false
                end
                
                -- Pattern filter (with error handling)
                if include and filter_pattern then
                    local pattern_success, pattern_match = pcall(string.match, log.message, filter_pattern)
                    if not pattern_success or not pattern_match then
                        include = false
                    end
                end
                
                if include then
                    table.insert(collected_logs, log)
                    count = count + 1
                end
            end
        end
        
        -- Logs are already collected newest-first due to circular buffer traversal
        return {
            server_logs = collected_logs,
            client_logs = {}, -- TODO: Implement client-side logging if possible
            total_server_lines = ConsoleBuffer.total_count,
            total_client_lines = 0,
            capture_time = tick()
        }
    end)
    
    -- Use standard response format
    if success then
        return {
            success = true,
            result = result
        }
    else
        return {
            success = false,
            error = tostring(result)
        }
    end
end

return GetConsoleOutput