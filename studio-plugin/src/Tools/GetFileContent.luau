local function getFileContent(args)
    local filePath = args.file_path
    local includeMetadata = args.include_metadata or true
    local lineNumbers = args.line_numbers or false
    
    if not filePath then
        return {
            success = false,
            error = "file_path is required"
        }
    end
    
    local function findScriptByPath(path)
        -- Try exact path match first
        local pathParts = {}
        for part in string.gmatch(path, "[^%.]+") do
            table.insert(pathParts, part)
        end
        
        local current = game
        for _, part in ipairs(pathParts) do
            current = current:FindFirstChild(part)
            if not current then
                break
            end
        end
        
        if current and (current.ClassName == "Script" or current.ClassName == "LocalScript" or current.ClassName == "ModuleScript") then
            return current
        end
        
        -- Fuzzy search by name if exact path fails
        local function searchRecursive(obj, name)
            if obj.Name == name and (obj.ClassName == "Script" or obj.ClassName == "LocalScript" or obj.ClassName == "ModuleScript") then
                return obj
            end
            
            for _, child in ipairs(obj:GetChildren()) do
                local found = searchRecursive(child, name)
                if found then
                    return found
                end
            end
            
            return nil
        end
        
        -- Extract just the script name for fuzzy search
        local scriptName = pathParts[#pathParts] or path
        return searchRecursive(workspace, scriptName)
    end
    
    local function getFullPath(obj)
        local path = {}
        local current = obj
        
        while current and current ~= game do
            table.insert(path, 1, current.Name)
            current = current.Parent
        end
        
        return table.concat(path, ".")
    end
    
    local function addLineNumbers(sourceCode)
        local lines = {}
        local lineNum = 1
        
        for line in string.gmatch(sourceCode .. "\n", "(.-)\n") do
            table.insert(lines, string.format("%3d: %s", lineNum, line))
            lineNum = lineNum + 1
        end
        
        return table.concat(lines, "\n")
    end
    
    local scriptObj = findScriptByPath(filePath)
    
    if not scriptObj then
        return {
            success = false,
            error = "Script not found: " .. filePath
        }
    end
    
    local sourceCode = scriptObj.Source
    local lineCount = 0
    for _ in string.gmatch(sourceCode, "\n") do
        lineCount = lineCount + 1
    end
    lineCount = lineCount + 1 -- Add 1 for the last line if it doesn't end with \n
    
    local result = {
        success = true,
        file_path = getFullPath(scriptObj),
        source_code = lineNumbers and addLineNumbers(sourceCode) or sourceCode,
        line_count = lineCount,
        last_modified = tostring(os.time()) -- Roblox doesn't expose actual modification time
    }
    
    if includeMetadata then
        result.metadata = {
            type = scriptObj.ClassName,
            is_disabled = (scriptObj.ClassName == "Script" or scriptObj.ClassName == "LocalScript") and scriptObj.Disabled or false,
            description = scriptObj:GetAttribute("Description") or ""
        }
    end
    
    return result
end

return getFileContent