local ChangeHistoryService = game:GetService("ChangeHistoryService")

local function updateFileContent(args)
    local filePath = args.file_path
    local newContent = args.new_content
    local changeDescription = args.change_description or "Update script content"
    local createUndoPoint = args.create_undo_point or true
    local validateSyntax = args.validate_syntax or true
    
    if not filePath then
        return {
            success = false,
            error = "file_path is required"
        }
    end
    
    if not newContent then
        return {
            success = false,
            error = "new_content is required"
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
    
    local function validateLuauSyntax(code)
        -- Basic syntax validation by attempting to load the code
        -- This is limited but catches most syntax errors
        local success, errorMsg = pcall(function()
            return loadstring(code)
        end)
        
        if success then
            return { is_valid = true, errors = {} }
        else
            return { is_valid = false, errors = { errorMsg or "Unknown syntax error" } }
        end
    end
    
    local function countLines(text)
        local count = 0
        for _ in string.gmatch(text, "\n") do
            count = count + 1
        end
        return count + 1
    end
    
    local scriptObj = findScriptByPath(filePath)
    
    if not scriptObj then
        return {
            success = false,
            error = "Script not found: " .. filePath
        }
    end
    
    local originalContent = scriptObj.Source
    local originalLineCount = countLines(originalContent)
    local newLineCount = countLines(newContent)
    
    -- Validate syntax if requested
    local validationResult = { is_valid = true, errors = {} }
    if validateSyntax then
        validationResult = validateLuauSyntax(newContent)
        if not validationResult.is_valid then
            return {
                success = false,
                error = "Syntax validation failed",
                validation_result = validationResult
            }
        end
    end
    
    -- Create undo point if requested
    if createUndoPoint then
        ChangeHistoryService:SetWaypoint(changeDescription)
    end
    
    -- Update the script content
    local success, errorMsg = pcall(function()
        scriptObj.Source = newContent
    end)
    
    if not success then
        return {
            success = false,
            error = "Failed to update script: " .. (errorMsg or "Unknown error")
        }
    end
    
    -- Create another waypoint after the change
    if createUndoPoint then
        ChangeHistoryService:SetWaypoint("After " .. changeDescription)
    end
    
    local changeId = tostring(os.time()) .. "_" .. tostring(math.random(1000, 9999))
    
    return {
        success = true,
        file_path = getFullPath(scriptObj),
        lines_changed = math.abs(newLineCount - originalLineCount),
        change_id = changeId,
        validation_result = validationResult
    }
end

return updateFileContent