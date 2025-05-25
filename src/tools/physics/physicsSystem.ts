import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { validateInput } from '../../utils/input-validator.js';
import { createStandardError, createErrorResponse, ErrorType, validateBoundaries, LIMITS } from '../../utils/error-handler.js';
import { createStandardResponse } from '../../utils/response-formatter.js';

export const physicsSystem = {
  register: (server: McpServer) => {
    logger.info('Registering physicsSystem tool...');
    
    server.tool(
      'calculate-physics',
      'Perform physics calculations and generate Roblox physics simulation code',
      {
        calculationType: z.enum(['trajectory', 'force', 'collision', 'constraint', 'velocity']).describe('Type of physics calculation'),
        parameters: z.object({
          // Trajectory parameters
          initialVelocity: z.number().optional().describe('Initial velocity (studs/second)'),
          angle: z.number().optional().describe('Launch angle (degrees)'),
          gravity: z.number().optional().default(196.2).describe('Gravity (studs/second²)'),
          
          // Force parameters
          mass: z.number().optional().describe('Object mass (kg)'),
          acceleration: z.number().optional().describe('Acceleration (studs/second²)'),
          force: z.number().optional().describe('Applied force (Newtons)'),
          
          // Collision parameters
          velocity1: z.number().optional().describe('First object velocity'),
          velocity2: z.number().optional().describe('Second object velocity'),
          mass1: z.number().optional().describe('First object mass'),
          mass2: z.number().optional().describe('Second object mass'),
          elasticity: z.number().min(0).max(1).optional().default(0.5).describe('Collision elasticity (0-1)'),
          
          // Constraint parameters
          springConstant: z.number().optional().describe('Spring constant (N/m)'),
          dampingRatio: z.number().optional().describe('Damping ratio'),
          restLength: z.number().optional().describe('Spring rest length (studs)'),
          
          // General parameters
          time: z.number().optional().describe('Time value for calculations (seconds)'),
          distance: z.number().optional().describe('Distance value (studs)')
        }).describe('Calculation parameters'),
        units: z.enum(['studs', 'meters']).optional().default('studs').describe('Unit system'),
        precision: z.number().min(1).max(10).optional().default(2).describe('Decimal precision')
      },
      async ({ calculationType, parameters, units, precision }) => {
        try {
          // Validate numeric parameters
          const numericParams = Object.entries(parameters).filter(([_, value]) => typeof value === 'number');
          for (const [key, value] of numericParams) {
            if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
              const validationError = createStandardError(
                ErrorType.VALIDATION_ERROR,
                `Invalid numeric value for ${key}: must be a finite number`,
                'calculate-physics',
                key
              );
              return createErrorResponse(validationError);
            }
          }
          
          // Perform calculation based on type
          let result: any;
          let generatedCode: string;
          let explanation: string;
          
          switch (calculationType) {
            case 'trajectory':
              result = calculateTrajectory(parameters, units, precision);
              generatedCode = generateTrajectoryCode(parameters, units);
              explanation = 'Projectile motion calculation with gravity';
              break;
              
            case 'force':
              result = calculateForce(parameters, units, precision);
              generatedCode = generateForceCode(parameters, units);
              explanation = 'Force and acceleration calculations using F = ma';
              break;
              
            case 'collision':
              result = calculateCollision(parameters, units, precision);
              generatedCode = generateCollisionCode(parameters, units);
              explanation = 'Elastic/inelastic collision simulation';
              break;
              
            case 'constraint':
              result = calculateConstraint(parameters, units, precision);
              generatedCode = generateConstraintCode(parameters, units);
              explanation = 'Spring and constraint system physics';
              break;
              
            case 'velocity':
              result = calculateVelocity(parameters, units, precision);
              generatedCode = generateVelocityCode(parameters, units);
              explanation = 'Velocity and motion calculations';
              break;
              
            default:
              const calculationError = createStandardError(
                ErrorType.VALIDATION_ERROR,
                `Unsupported calculation type: ${calculationType}`,
                'calculate-physics',
                'calculationType'
              );
              return createErrorResponse(calculationError);
          }
          
          const responseText = `**Physics Calculation: ${calculationType.toUpperCase()}**\n\n${explanation}\n\n**Results:**\n${formatResults(result, units)}\n\n**Generated Luau Code:**\n\`\`\`lua\n${generatedCode}\n\`\`\`\n\n**Usage Notes:**\n- Place in ServerScript for server-side physics\n- Use in LocalScript for client-side predictions\n- Adjust parameters for your specific use case\n- Consider performance impact for real-time calculations`;
          
          return createStandardResponse(responseText, { includeTimestamp: true });
          
        } catch (error) {
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            `Failed to perform physics calculation: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'calculate-physics'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    logger.info('physicsSystem tool registered successfully');
  }
};

function calculateTrajectory(params: any, units: string, precision: number) {
  const v0 = params.initialVelocity || 50;
  const angle = (params.angle || 45) * Math.PI / 180; // Convert to radians
  const g = params.gravity || 196.2; // Roblox gravity
  const t = params.time || 0;
  
  const v0x = v0 * Math.cos(angle);
  const v0y = v0 * Math.sin(angle);
  
  // Calculate trajectory properties
  const maxHeight = (v0y * v0y) / (2 * g);
  const timeToMaxHeight = v0y / g;
  const totalFlightTime = 2 * timeToMaxHeight;
  const range = v0x * totalFlightTime;
  
  // Position at given time
  const x = v0x * t;
  const y = v0y * t - 0.5 * g * t * t;
  
  return {
    initialVelocityX: parseFloat(v0x.toFixed(precision)),
    initialVelocityY: parseFloat(v0y.toFixed(precision)),
    maxHeight: parseFloat(maxHeight.toFixed(precision)),
    timeToMaxHeight: parseFloat(timeToMaxHeight.toFixed(precision)),
    totalFlightTime: parseFloat(totalFlightTime.toFixed(precision)),
    range: parseFloat(range.toFixed(precision)),
    positionX: parseFloat(x.toFixed(precision)),
    positionY: parseFloat(y.toFixed(precision))
  };
}

function calculateForce(params: any, units: string, precision: number) {
  const mass = params.mass || 1;
  const acceleration = params.acceleration;
  const force = params.force;
  
  let result: any = {};
  
  if (force && mass) {
    result.acceleration = parseFloat((force / mass).toFixed(precision));
  }
  if (acceleration && mass) {
    result.force = parseFloat((acceleration * mass).toFixed(precision));
  }
  if (force && acceleration) {
    result.mass = parseFloat((force / acceleration).toFixed(precision));
  }
  
  return result;
}

function calculateCollision(params: any, units: string, precision: number) {
  const v1 = params.velocity1 || 10;
  const v2 = params.velocity2 || 0;
  const m1 = params.mass1 || 1;
  const m2 = params.mass2 || 1;
  const e = params.elasticity || 0.5;
  
  // Conservation of momentum and energy
  const v1f = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
  const v2f = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
  
  const kineticEnergyBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const kineticEnergyAfter = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;
  
  return {
    finalVelocity1: parseFloat(v1f.toFixed(precision)),
    finalVelocity2: parseFloat(v2f.toFixed(precision)),
    kineticEnergyBefore: parseFloat(kineticEnergyBefore.toFixed(precision)),
    kineticEnergyAfter: parseFloat(kineticEnergyAfter.toFixed(precision)),
    energyLoss: parseFloat((kineticEnergyBefore - kineticEnergyAfter).toFixed(precision))
  };
}

function calculateConstraint(params: any, units: string, precision: number) {
  const k = params.springConstant || 100; // N/m
  const damping = params.dampingRatio || 0.1;
  const restLength = params.restLength || 10;
  const distance = params.distance || restLength;
  
  const displacement = distance - restLength;
  const springForce = -k * displacement;
  const dampingForce = -damping * (params.velocity1 || 0);
  const totalForce = springForce + dampingForce;
  
  return {
    displacement: parseFloat(displacement.toFixed(precision)),
    springForce: parseFloat(springForce.toFixed(precision)),
    dampingForce: parseFloat(dampingForce.toFixed(precision)),
    totalForce: parseFloat(totalForce.toFixed(precision))
  };
}

function calculateVelocity(params: any, units: string, precision: number) {
  const acceleration = params.acceleration || 9.8;
  const time = params.time || 1;
  const initialVelocity = params.initialVelocity || 0;
  const distance = params.distance;
  
  const finalVelocity = initialVelocity + acceleration * time;
  const avgVelocity = (initialVelocity + finalVelocity) / 2;
  const distanceTraveled = initialVelocity * time + 0.5 * acceleration * time * time;
  
  return {
    finalVelocity: parseFloat(finalVelocity.toFixed(precision)),
    averageVelocity: parseFloat(avgVelocity.toFixed(precision)),
    distanceTraveled: parseFloat(distanceTraveled.toFixed(precision))
  };
}

function formatResults(result: any, units: string): string {
  let formatted = '';
  for (const [key, value] of Object.entries(result)) {
    const unit = getUnitSuffix(key, units);
    formatted += `- ${key}: ${value}${unit}\n`;
  }
  return formatted;
}

function getUnitSuffix(property: string, units: string): string {
  const unitMap: Record<string, Record<string, string>> = {
    'studs': {
      'velocity': ' studs/s',
      'acceleration': ' studs/s²',
      'force': ' N',
      'distance': ' studs',
      'height': ' studs',
      'range': ' studs',
      'position': ' studs',
      'time': ' s',
      'mass': ' kg',
      'energy': ' J'
    },
    'meters': {
      'velocity': ' m/s',
      'acceleration': ' m/s²',
      'force': ' N',
      'distance': ' m',
      'height': ' m',
      'range': ' m',
      'position': ' m',
      'time': ' s',
      'mass': ' kg',
      'energy': ' J'
    }
  };
  
  for (const [key, suffix] of Object.entries(unitMap[units] || unitMap['studs'])) {
    if (property.toLowerCase().includes(key)) {
      return suffix;
    }
  }
  return '';
}

function generateTrajectoryCode(params: any, units: string): string {
  const v0 = params.initialVelocity || 50;
  const angle = params.angle || 45;
  const g = params.gravity || 196.2;
  
  return `-- Projectile Trajectory Simulation
local RunService = game:GetService("RunService")

-- Physics parameters
local initialVelocity = ${v0}
local launchAngle = math.rad(${angle}) -- Convert degrees to radians
local gravity = ${g} -- Roblox default gravity

-- Calculate velocity components
local velocityX = initialVelocity * math.cos(launchAngle)
local velocityY = initialVelocity * math.sin(launchAngle)

-- Trajectory function
local function getTrajectoryPosition(time)
    local x = velocityX * time
    local y = velocityY * time - 0.5 * gravity * time * time
    return Vector3.new(x, y, 0)
end

-- Simulate projectile with error handling
local projectile = workspace:FindFirstChild("Projectile")
if not projectile then
    warn("Projectile part not found in workspace")
    return
end

local startTime = tick()
local startPosition = projectile.Position
local maxSimulationTime = 30 -- Prevent infinite simulation

local connection
connection = RunService.Heartbeat:Connect(function()
    local currentTime = tick() - startTime
    
    -- Safety check for simulation time
    if currentTime > maxSimulationTime then
        connection:Disconnect()
        warn("Trajectory simulation timeout")
        return
    end
    
    local success, result = pcall(function()
        local offset = getTrajectoryPosition(currentTime)
        projectile.Position = startPosition + offset
        return projectile.Position
    end)
    
    if not success then
        connection:Disconnect()
        warn("Trajectory simulation error:", result)
        return
    end
    
    -- Stop when projectile hits ground
    if result.Y <= 0 then
        connection:Disconnect()
        print("Projectile landed at:", result)
    end
end)`;
}

function generateForceCode(params: any, units: string): string {
  const mass = params.mass || 1;
  const force = params.force || 10;
  
  return `-- Force Application System
local RunService = game:GetService("RunService")

-- Physics parameters
local mass = ${mass} -- kg
local appliedForce = ${force} -- Newtons
local acceleration = appliedForce / mass

-- Apply force to part with error handling
local function applyForce(part, forceVector, deltaTime)
    if not part or not part.Parent then
        warn("Invalid part provided to applyForce")
        return false
    end
    
    local success, result = pcall(function()
        local bodyVelocity = part:FindFirstChild("BodyVelocity")
        if not bodyVelocity then
            bodyVelocity = Instance.new("BodyVelocity")
            bodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
            bodyVelocity.Velocity = Vector3.new(0, 0, 0)
            bodyVelocity.Parent = part
        end
        
        -- F = ma, so a = F/m
        local accelerationVector = forceVector / mass
        bodyVelocity.Velocity = bodyVelocity.Velocity + accelerationVector * deltaTime
        return true
    end)
    
    if not success then
        warn("Failed to apply force:", result)
        return false
    end
    return true
end

-- Example usage with error handling
local targetPart = workspace:FindFirstChild("Target")
if not targetPart then
    warn("Target part not found in workspace")
    return
end

local forceDirection = Vector3.new(1, 0, 0) -- Force in X direction
local startTime = tick()
local duration = 3 -- seconds

local connection
connection = RunService.Heartbeat:Connect(function(deltaTime)
    local success = applyForce(targetPart, forceDirection * appliedForce, deltaTime)
    
    -- Stop after duration or if force application fails
    if tick() - startTime > duration or not success then
        connection:Disconnect()
        print("Force application stopped")
    end
end)`;
}

function generateCollisionCode(params: any, units: string): string {
  const elasticity = params.elasticity || 0.5;
  
  return `-- Collision Detection and Response
local RunService = game:GetService("RunService")

-- Collision parameters
local elasticity = ${elasticity} -- 0 = perfectly inelastic, 1 = perfectly elastic

-- Collision response function with error handling
local function handleCollision(part1, part2)
    if not part1 or not part2 or not part1.Parent or not part2.Parent then
        warn("Invalid parts provided to handleCollision")
        return false
    end
    
    local success, result = pcall(function()
        local v1 = part1.Velocity
        local v2 = part2.Velocity
        local m1 = part1.Mass
        local m2 = part2.Mass
        
        -- Validate masses
        if m1 <= 0 or m2 <= 0 then
            warn("Invalid mass values for collision calculation")
            return false
        end
        
        -- Calculate post-collision velocities
        local v1f = ((m1 - elasticity * m2) * v1 + (1 + elasticity) * m2 * v2) / (m1 + m2)
        local v2f = ((m2 - elasticity * m1) * v2 + (1 + elasticity) * m1 * v1) / (m1 + m2)
        
        -- Apply new velocities
        part1.Velocity = v1f
        part2.Velocity = v2f
        
        print("Collision detected! New velocities:")
        print("Part1:", v1f)
        print("Part2:", v2f)
        return true
    end)
    
    if not success then
        warn("Collision calculation failed:", result)
        return false
    end
    return result
end

-- Connect collision detection with validation
local function onTouched(hit, part)
    if not hit or not hit.Parent or not part or not part.Parent then
        return
    end
    
    if hit.Parent ~= part.Parent and hit.CanCollide then
        handleCollision(part, hit)
    end
end

-- Example setup with error checking
local ball1 = workspace:FindFirstChild("Ball1")
local ball2 = workspace:FindFirstChild("Ball2")

if ball1 then
    ball1.Touched:Connect(function(hit)
        onTouched(hit, ball1)
    end)
else
    warn("Ball1 not found in workspace")
end

if ball2 then
    ball2.Touched:Connect(function(hit)
        onTouched(hit, ball2)
    end)
else
    warn("Ball2 not found in workspace")
end`;
}

function generateConstraintCode(params: any, units: string): string {
  const springConstant = params.springConstant || 100;
  const damping = params.dampingRatio || 0.1;
  
  return `-- Spring Constraint System
local RunService = game:GetService("RunService")

-- Spring parameters
local springConstant = ${springConstant} -- N/m
local dampingRatio = ${damping}
local restLength = ${params.restLength || 10} -- studs

-- Create spring constraint
local function createSpringConstraint(part1, part2)
    local attachment1 = Instance.new("Attachment")
    attachment1.Parent = part1
    
    local attachment2 = Instance.new("Attachment")
    attachment2.Parent = part2
    
    local spring = Instance.new("SpringConstraint")
    spring.Attachment0 = attachment1
    spring.Attachment1 = attachment2
    spring.FreeLength = restLength
    spring.Stiffness = springConstant
    spring.Damping = dampingRatio * 1000 -- Roblox uses different scale
    spring.Parent = part1
    
    return spring
end

-- Apply spring forces manually (alternative approach)
local function applySpringForce(part1, part2, deltaTime)
    local distance = (part2.Position - part1.Position).Magnitude
    local displacement = distance - restLength
    local direction = (part2.Position - part1.Position).Unit
    
    -- Spring force: F = -k * x
    local springForce = -springConstant * displacement
    local force = direction * springForce
    
    -- Apply forces (Newton's third law)
    local bodyForce1 = part1:FindFirstChild("BodyForce") or Instance.new("BodyForce")
    local bodyForce2 = part2:FindFirstChild("BodyForce") or Instance.new("BodyForce")
    
    bodyForce1.Force = force
    bodyForce2.Force = -force
    
    bodyForce1.Parent = part1
    bodyForce2.Parent = part2
end

-- Example usage
local anchor = workspace.Anchor -- Fixed point
local weight = workspace.Weight -- Moving object

createSpringConstraint(anchor, weight)`;
}

function generateVelocityCode(params: any, units: string): string {
  const acceleration = params.acceleration || 9.8;
  
  return `-- Velocity and Motion Control
local RunService = game:GetService("RunService")

-- Motion parameters
local acceleration = ${acceleration} -- studs/s²
local maxVelocity = 50 -- studs/s

-- Velocity control function with error handling
local function updateVelocity(part, targetVelocity, deltaTime)
    if not part or not part.Parent then
        warn("Invalid part provided to updateVelocity")
        return 0
    end
    
    local success, result = pcall(function()
        local currentVelocity = part.Velocity.Magnitude
        local velocityDifference = targetVelocity - currentVelocity
        
        -- Apply acceleration
        local accelerationNeeded = math.min(acceleration * deltaTime, math.abs(velocityDifference))
        local newVelocity = currentVelocity + accelerationNeeded * math.sign(velocityDifference)
        
        -- Clamp to max velocity
        newVelocity = math.min(newVelocity, maxVelocity)
        
        -- Apply to part
        local bodyVelocity = part:FindFirstChild("BodyVelocity")
        if not bodyVelocity then
            bodyVelocity = Instance.new("BodyVelocity")
            bodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
            bodyVelocity.Parent = part
        end
        
        local direction = part.CFrame.LookVector
        bodyVelocity.Velocity = direction * newVelocity
        
        return newVelocity
    end)
    
    if not success then
        warn("Velocity update failed:", result)
        return 0
    end
    return result
end

-- Example movement system with error checking
local vehicle = workspace:FindFirstChild("Vehicle")
if not vehicle then
    warn("Vehicle not found in workspace")
    return
end

local targetSpeed = 30 -- studs/s
local startTime = tick()
local maxRunTime = 60 -- Maximum runtime in seconds

local connection
connection = RunService.Heartbeat:Connect(function(deltaTime)
    -- Safety timeout
    if tick() - startTime > maxRunTime then
        connection:Disconnect()
        print("Movement system stopped after timeout")
        return
    end
    
    local currentSpeed = updateVelocity(vehicle, targetSpeed, deltaTime)
    if currentSpeed > 0 then
        print("Current speed:", currentSpeed, "studs/s")
    end
end)`;
}