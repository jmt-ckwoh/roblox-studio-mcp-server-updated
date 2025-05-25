import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Direct Roblox Studio integration tools
 */
export const studioIntegration = {
  register: (server: McpServer) => {
    logger.info('Registering studioIntegration tools...');
    
    // Run Luau code in Studio
    server.tool(
      'run-studio-code',
      'Execute Luau code directly in Roblox Studio',
      {
        code: z.string().describe('Luau code to execute in Studio'),
        description: z.string().optional().describe('Description of what the code does')
      },
      async ({ code, description }) => {
        try {
          const result = await executeStudioCode(code, description);
          
          return {
            content: [
              {
                type: "text",
                text: result.output || 'Code executed successfully'
              }
            ]
          };
        } catch (error) {
          logger.error('Studio code execution failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error executing code: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    // Create a new script in Studio
    server.tool(
      'create-studio-script',
      'Create a new script in Roblox Studio',
      {
        name: z.string().describe('Name of the script'),
        type: z.enum(['ServerScript', 'LocalScript', 'ModuleScript']).describe('Type of script to create'),
        code: z.string().describe('Initial code for the script'),
        parent: z.string().optional().default('ServerStorage').describe('Parent object for the script')
      },
      async ({ name, type, code, parent }) => {
        try {
          const result = await createStudioScript(name, type, code, parent ?? 'ServerStorage');
          
          return {
            content: [
              {
                type: "text",
                text: `Script "${name}" created successfully in ${parent}`
              }
            ]
          };
        } catch (error) {
          logger.error('Studio script creation failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error creating script: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    // Insert a model from the marketplace
    server.tool(
      'insert-studio-model',
      'Insert a model from the Roblox marketplace into Studio',
      {
        query: z.string().describe('Search query for the model'),
        position: z.object({
          x: z.number().default(0),
          y: z.number().default(5),
          z: z.number().default(0)
        }).optional().describe('Position to place the model')
      },
      async ({ query, position }) => {
        try {
          const result = await insertStudioModel(query, position);
          
          return {
            content: [
              {
                type: "text",
                text: `Model "${result.modelName}" inserted successfully`
              }
            ]
          };
        } catch (error) {
          logger.error('Studio model insertion failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error inserting model: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    // Get Studio workspace information
    server.tool(
      'get-studio-workspace',
      'Get information about the current Studio workspace',
      {},
      async () => {
        try {
          const result = await getStudioWorkspace();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          logger.error('Studio workspace query failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error getting workspace info: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    // Manage Studio instances
    server.tool(
      'manage-studio-instance',
      'Create, modify, or delete instances in Studio',
      {
        action: z.enum(['create', 'modify', 'delete', 'get']).describe('Action to perform'),
        instanceType: z.string().optional().describe('Type of instance (for create action)'),
        name: z.string().optional().describe('Name of the instance'),
        parent: z.string().optional().describe('Parent path for the instance'),
        properties: z.record(z.any()).optional().describe('Properties to set on the instance')
      },
      async ({ action, instanceType, name, parent, properties }) => {
        try {
          const result = await manageStudioInstance(action, {
            instanceType,
            name,
            parent,
            properties
          });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          logger.error('Studio instance management failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error managing instance: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    logger.info('studioIntegration tools registered successfully');
  }
};

// Studio integration functions (these would interface with the Studio plugin)
async function executeStudioCode(code: string, description?: string): Promise<{ output: string; success: boolean }> {
  // This would send the code to the Studio plugin via HTTP
  // For now, return a mock response
  logger.info(`Executing Studio code: ${description || 'No description'}`);
  
  return {
    output: `Mock execution result for code:\n${code}\n\nCode would be executed in Studio.`,
    success: true
  };
}

async function createStudioScript(name: string, type: string, code: string, parent: string) {
  logger.info(`Creating ${type} script "${name}" in ${parent}`);
  
  const createCode = `
    local ${type.toLowerCase()} = Instance.new("${type}")
    ${type.toLowerCase()}.Name = "${name}"
    ${type.toLowerCase()}.Source = [==[${code}]==]
    ${type.toLowerCase()}.Parent = ${parent}
    print("Created script: ${name}")
  `;
  
  return await executeStudioCode(createCode, `Create ${type} script "${name}"`);
}

async function insertStudioModel(query: string, position?: { x: number; y: number; z: number }) {
  logger.info(`Inserting model from query: ${query}`);
  
  const pos = position || { x: 0, y: 5, z: 0 };
  const insertCode = `
    local InsertService = game:GetService("InsertService")
    local results = InsertService:GetFreeModels("${query}", 0)
    
    if #results[1].Results > 0 then
      local assetId = results[1].Results[1].AssetId
      local model = game:GetObjects("rbxassetid://" .. assetId)[1]
      model.Name = "${query}Model"
      model.Parent = workspace
      
      if model:IsA("Model") and model.PrimaryPart then
        model:SetPrimaryPartCFrame(CFrame.new(${pos.x}, ${pos.y}, ${pos.z}))
      elseif model:IsA("Model") then
        model:MoveTo(Vector3.new(${pos.x}, ${pos.y}, ${pos.z}))
      end
      
      print("Inserted model: " .. model.Name)
    else
      error("No models found for query: ${query}")
    end
  `;
  
  await executeStudioCode(insertCode, `Insert model: ${query}`);
  
  return {
    modelName: `${query}Model`,
    position: pos
  };
}

async function getStudioWorkspace() {
  logger.info('Getting Studio workspace information');
  
  const workspaceCode = `
    local workspace = game:GetService("Workspace")
    local children = {}
    
    for _, child in ipairs(workspace:GetChildren()) do
      table.insert(children, {
        Name = child.Name,
        ClassName = child.ClassName,
        Parent = child.Parent.Name
      })
    end
    
    local info = {
      ChildCount = #workspace:GetChildren(),
      Children = children,
      CurrentCamera = workspace.CurrentCamera and workspace.CurrentCamera.Name or "None",
      Timestamp = os.time()
    }
    
    print(game:GetService("HttpService"):JSONEncode(info))
  `;
  
  const result = await executeStudioCode(workspaceCode, 'Get workspace information');
  
  // Mock response structure
  return {
    childCount: 5,
    children: [
      { name: 'Baseplate', className: 'Part', parent: 'Workspace' },
      { name: 'SpawnLocation', className: 'SpawnLocation', parent: 'Workspace' },
      { name: 'Camera', className: 'Camera', parent: 'Workspace' }
    ],
    currentCamera: 'Camera',
    timestamp: new Date().toISOString()
  };
}

async function manageStudioInstance(
  action: 'create' | 'modify' | 'delete' | 'get',
  options: {
    instanceType?: string;
    name?: string;
    parent?: string;
    properties?: Record<string, any>;
  }
) {
  logger.info(`Managing Studio instance: ${action}`);
  
  let code = '';
  
  switch (action) {
    case 'create':
      if (!options.instanceType || !options.name) {
        throw new Error('instanceType and name required for create action');
      }
      
      code = `
        local instance = Instance.new("${options.instanceType}")
        instance.Name = "${options.name}"
        ${options.parent ? `instance.Parent = ${options.parent}` : 'instance.Parent = workspace'}
        
        ${options.properties ? Object.entries(options.properties).map(([key, value]) => 
          `instance.${key} = ${typeof value === 'string' ? `"${value}"` : value}`
        ).join('\n        ') : ''}
        
        print("Created instance: " .. instance.Name)
      `;
      break;
      
    case 'modify':
      if (!options.name) {
        throw new Error('name required for modify action');
      }
      
      code = `
        local instance = workspace:FindFirstChild("${options.name}", true)
        if instance then
          ${options.properties ? Object.entries(options.properties).map(([key, value]) => 
            `instance.${key} = ${typeof value === 'string' ? `"${value}"` : value}`
          ).join('\n          ') : ''}
          print("Modified instance: " .. instance.Name)
        else
          error("Instance not found: ${options.name}")
        end
      `;
      break;
      
    case 'delete':
      if (!options.name) {
        throw new Error('name required for delete action');
      }
      
      code = `
        local instance = workspace:FindFirstChild("${options.name}", true)
        if instance then
          instance:Destroy()
          print("Deleted instance: ${options.name}")
        else
          error("Instance not found: ${options.name}")
        end
      `;
      break;
      
    case 'get':
      if (!options.name) {
        throw new Error('name required for get action');
      }
      
      code = `
        local instance = workspace:FindFirstChild("${options.name}", true)
        if instance then
          local info = {
            Name = instance.Name,
            ClassName = instance.ClassName,
            Parent = instance.Parent and instance.Parent.Name or "None",
            Position = instance:IsA("BasePart") and tostring(instance.Position) or "N/A"
          }
          print(game:GetService("HttpService"):JSONEncode(info))
        else
          error("Instance not found: ${options.name}")
        end
      `;
      break;
  }
  
  const result = await executeStudioCode(code, `${action} instance: ${options.name}`);
  
  return {
    action,
    success: result.success,
    instance: options.name,
    result: result.output
  };
}