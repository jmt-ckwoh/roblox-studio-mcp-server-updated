local function getWorkspaceFiles(args)
    local filterType = args.filter_type or "all"
    local includeDisabled = args.include_disabled or false
    local maxDepth = args.max_depth or 10
    local startPath = args.start_path or "Workspace"
    
    local files = {}
    local totalCount = 0
    local scanTime = os.time()
    
    local function isScriptType(obj)
        return obj.ClassName == "Script" or obj.ClassName == "LocalScript" or obj.ClassName == "ModuleScript"
    end
    
    local function shouldInclude(obj)
        if not isScriptType(obj) then
            return false
        end
        
        if filterType ~= "all" and obj.ClassName ~= filterType then
            return false
        end
        
        -- Only check Disabled property for Scripts and LocalScripts (ModuleScripts don't have Disabled)
        if not includeDisabled then
            if obj.ClassName == "Script" or obj.ClassName == "LocalScript" then
                if obj.Disabled then
                    return false
                end
            end
        end
        
        return true
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
    
    local function getParentPath(obj)
        if not obj.Parent or obj.Parent == game then
            return ""
        end
        return getFullPath(obj.Parent)
    end
    
    local function scanObject(obj, currentDepth)
        if currentDepth > maxDepth then
            return
        end
        
        if shouldInclude(obj) then
            local fileInfo = {
                name = obj.Name,
                full_path = getFullPath(obj),
                type = obj.ClassName,
                parent_path = getParentPath(obj),
                is_disabled = (obj.ClassName == "Script" or obj.ClassName == "LocalScript") and obj.Disabled or false,
                last_modified = tostring(scanTime), -- Roblox doesn't expose actual modification time
                description = obj:GetAttribute("Description") or ""
            }
            
            table.insert(files, fileInfo)
            totalCount = totalCount + 1
        end
        
        -- Recursively scan children
        for _, child in ipairs(obj:GetChildren()) do
            scanObject(child, currentDepth + 1)
        end
    end
    
    -- Start scanning from the specified path
    local startObject
    if startPath == "Workspace" then
        startObject = workspace
    else
        -- Try to find the object by path
        local pathParts = {}
        for part in string.gmatch(startPath, "[^%.]+") do
            table.insert(pathParts, part)
        end
        
        startObject = game
        for _, part in ipairs(pathParts) do
            startObject = startObject:FindFirstChild(part)
            if not startObject then
                return {
                    success = false,
                    error = "Path not found: " .. startPath,
                    files = {},
                    total_count = 0,
                    scan_time = tostring(scanTime)
                }
            end
        end
    end
    
    scanObject(startObject, 0)
    
    return {
        success = true,
        files = files,
        total_count = totalCount,
        scan_time = tostring(scanTime)
    }
end

return getWorkspaceFiles