import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { validateInput } from '../../utils/input-validator.js';
import { createStandardError, createErrorResponse, ErrorType, validateBoundaries, LIMITS } from '../../utils/error-handler.js';
import { createStandardResponse } from '../../utils/response-formatter.js';

export const uiBuilder = {
  register: (server: McpServer) => {
    logger.info('Registering uiBuilder tool...');
    
    server.tool(
      'build-ui-component',
      'Generate Roblox UI components with proper styling, layout, and best practices',
      {
        componentType: z.enum(['button', 'frame', 'textlabel', 'textbox', 'scrollingframe', 'imagelabel', 'dialog']).describe('Type of UI component to create'),
        properties: z.object({
          text: z.string().optional().describe('Text content for the component'),
          size: z.string().optional().default('{0.2, 0}, {0.1, 0}').describe('Size in UDim2 format'),
          position: z.string().optional().default('{0.5, 0}, {0.5, 0}').describe('Position in UDim2 format'),
          backgroundColor: z.string().optional().default('Color3.fromRGB(255, 255, 255)').describe('Background color'),
          textColor: z.string().optional().default('Color3.fromRGB(0, 0, 0)').describe('Text color'),
          cornerRadius: z.number().optional().default(8).describe('Corner radius in pixels'),
          transparency: z.number().min(0).max(1).optional().default(0).describe('Background transparency (0-1)')
        }).describe('Component properties'),
        layoutType: z.enum(['manual', 'list', 'grid', 'auto']).optional().default('manual').describe('Layout system to use'),
        parent: z.string().optional().default('ScreenGui').describe('Parent object name'),
        includeEvents: z.boolean().optional().default(true).describe('Include common event handlers')
      },
      async ({ componentType, properties, layoutType, parent, includeEvents }) => {
        try {
          // Boundary validation
          if (properties.text) {
            validateBoundaries(properties.text, 200, 'text', 'build-ui-component');
          }
          validateBoundaries(parent, 50, 'parent', 'build-ui-component');
          
          // Input validation
          if (properties.text) {
            const textValidation = validateInput(properties.text, { 
              maxLength: 200,
              fieldName: 'text'
            });
            
            if (!textValidation.isValid) {
              const validationError = createStandardError(
                ErrorType.VALIDATION_ERROR,
                `Invalid text content: ${textValidation.errors.join(', ')}`,
                'build-ui-component',
                'text'
              );
              return createErrorResponse(validationError);
            }
          }
          
          const parentValidation = validateInput(parent, { 
            maxLength: 50,
            fieldName: 'parent'
          });
          
          if (!parentValidation.isValid) {
            const validationError = createStandardError(
              ErrorType.VALIDATION_ERROR,
              `Invalid parent name: ${parentValidation.errors.join(', ')}`,
              'build-ui-component',
              'parent'
            );
            return createErrorResponse(validationError);
          }
          
          // Generate UI component code
          const generatedCode = generateUICode(componentType, properties, layoutType, parent, includeEvents);
          const layoutCode = layoutType !== 'manual' ? generateLayoutCode(layoutType) : '';
          
          const responseText = `Successfully generated ${componentType} UI component\n\n**Generated Luau Code:**\n\`\`\`lua\n${generatedCode}\n${layoutCode}\n\`\`\`\n\n**Component Features:**\n- Modern ${componentType} with proper styling\n- ${layoutType === 'manual' ? 'Manual positioning' : `${layoutType} layout system`}\n- ${includeEvents ? 'Event handlers included' : 'No event handlers'}\n- Responsive design principles\n\n**Usage:**\n- Place in StarterPlayerScripts (LocalScript) for client UI\n- Modify properties as needed for your design\n- Add custom logic to event handlers`;
          
          return createStandardResponse(responseText, { includeTimestamp: true });
          
        } catch (error) {
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            `Failed to generate UI component: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'build-ui-component'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    logger.info('uiBuilder tool registered successfully');
  }
};

function generateUICode(componentType: string, properties: any, layoutType: string, parent: string, includeEvents: boolean): string {
  const componentName = `${componentType.charAt(0).toUpperCase()}${componentType.slice(1)}`;
  const text = properties.text || `Sample ${componentName}`;
  const size = properties.size || '{0.2, 0}, {0.1, 0}';
  const position = properties.position || '{0.5, 0}, {0.5, 0}';
  const bgColor = properties.backgroundColor || 'Color3.fromRGB(70, 130, 180)';
  const textColor = properties.textColor || 'Color3.fromRGB(255, 255, 255)';
  const cornerRadius = properties.cornerRadius || 8;
  const transparency = properties.transparency || 0;
  const instanceType = getInstanceType(componentType);
  const parentVar = parent.toLowerCase();
  
  let baseCode = `-- ${componentName} UI Component
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create or get parent container
local ${parentVar} = playerGui:FindFirstChild("${parent}") or Instance.new("ScreenGui")
${parentVar}.Name = "${parent}"
${parentVar}.Parent = playerGui

-- Create ${componentType}
local ${componentType} = Instance.new("${instanceType}")
${componentType}.Name = "${componentName}"
${componentType}.Size = UDim2.new(${size})
${componentType}.Position = UDim2.new(${position})
${componentType}.AnchorPoint = Vector2.new(0.5, 0.5)
${componentType}.BackgroundColor3 = ${bgColor}
${componentType}.BackgroundTransparency = ${transparency}
${componentType}.BorderSizePixel = 0
${componentType}.Parent = ${parentVar}`;
  
  // Add text property for text-based components
  if (['button', 'textlabel', 'textbox'].includes(componentType)) {
    baseCode += `\n${componentType}.Text = "${text}"
${componentType}.TextColor3 = ${textColor}
${componentType}.TextScaled = true
${componentType}.Font = Enum.Font.Gotham`;
  }
  
  // Add image property for image components
  if (componentType === 'imagelabel') {
    baseCode += `\n${componentType}.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"
${componentType}.ScaleType = Enum.ScaleType.Fit`;
  }
  
  // Add corner radius
  if (cornerRadius > 0) {
    baseCode += `\n\n-- Add rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, ${cornerRadius})
corner.Parent = ${componentType}`;
  }
  
  // Add stroke for better appearance
  baseCode += `\n\n-- Add stroke for better appearance
local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(40, 40, 40)
stroke.Thickness = 1
stroke.Parent = ${componentType}`;
  
  // Add specific component features
  if (componentType === 'scrollingframe') {
    baseCode += `\n\n-- ScrollingFrame specific properties
${componentType}.ScrollBarThickness = 8
${componentType}.CanvasSize = UDim2.new(0, 0, 0, 400)
${componentType}.ScrollingDirection = Enum.ScrollingDirection.Y`;
  }
  
  if (componentType === 'textbox') {
    baseCode += `\n\n-- TextBox specific properties
${componentType}.PlaceholderText = "Enter text here..."
${componentType}.ClearTextOnFocus = false`;
  }
  
  // Add event handlers
  if (includeEvents) {
    baseCode += generateEventHandlers(componentType);
  }
  
  return baseCode;
}

function getInstanceType(componentType: string): string {
  const typeMap: Record<string, string> = {
    'button': 'TextButton',
    'frame': 'Frame',
    'textlabel': 'TextLabel',
    'textbox': 'TextBox',
    'scrollingframe': 'ScrollingFrame',
    'imagelabel': 'ImageLabel',
    'dialog': 'Frame'
  };
  return typeMap[componentType] || 'Frame';
}

function generateEventHandlers(componentType: string): string {
  let eventCode = '\n\n-- Event Handlers';
  
  if (componentType === 'button') {
    eventCode += `\n\n-- Button click handler
${componentType}.MouseButton1Click:Connect(function()
    print("${componentType.charAt(0).toUpperCase() + componentType.slice(1)} clicked!")
    
    -- Add click animation
    local clickTween = TweenService:Create(
        ${componentType},
        TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        {Size = ${componentType}.Size * 0.95}
    )
    local releaseTween = TweenService:Create(
        ${componentType},
        TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        {Size = ${componentType}.Size / 0.95}
    )
    
    clickTween:Play()
    clickTween.Completed:Connect(function()
        releaseTween:Play()
    end)
    
    -- Add your button logic here
end)

-- Hover effects
${componentType}.MouseEnter:Connect(function()
    local hoverTween = TweenService:Create(
        ${componentType},
        TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        {BackgroundColor3 = Color3.fromRGB(90, 150, 200)}
    )
    hoverTween:Play()
end)

${componentType}.MouseLeave:Connect(function()
    local unhoverTween = TweenService:Create(
        ${componentType},
        TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        {BackgroundColor3 = ${componentType}.BackgroundColor3}
    )
    unhoverTween:Play()
end)`;
  }
  
  if (componentType === 'textbox') {
    eventCode += `\n\n-- TextBox input handlers
${componentType}.FocusLost:Connect(function(enterPressed)
    if enterPressed then
        print("Text entered:", ${componentType}.Text)
        -- Process the entered text
    end
end)

${componentType}.Focused:Connect(function()
    print("TextBox focused")
end)`;
  }
  
  return eventCode;
}

function generateLayoutCode(layoutType: string): string {
  if (layoutType === 'manual') return '';
  
  let layoutCode = '\n-- Layout System\n';
  
  switch (layoutType) {
    case 'list':
      layoutCode += `local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0, 5)
listLayout.Parent = ${layoutType === 'list' ? 'frame' : 'scrollingframe'}`;
      break;
      
    case 'grid':
      layoutCode += `local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize = UDim2.new(0, 100, 0, 100)
gridLayout.CellPadding = UDim2.new(0, 5, 0, 5)
gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
gridLayout.Parent = ${layoutType === 'grid' ? 'frame' : 'scrollingframe'}`;
      break;
      
    case 'auto':
      layoutCode += `local sizeConstraint = Instance.new("UISizeConstraint")
sizeConstraint.MaxSize = Vector2.new(400, 200)
sizeConstraint.MinSize = Vector2.new(100, 50)
sizeConstraint.Parent = frame

local aspectRatio = Instance.new("UIAspectRatioConstraint")
aspectRatio.AspectRatio = 2
aspectRatio.Parent = frame`;
      break;
  }
  
  return layoutCode;
}