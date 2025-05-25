/**
 * Shared Studio MCP Protocol Definitions
 * SINGLE SOURCE OF TRUTH for all Studio-Server communication
 * 
 * This file prevents interface drift and field mismatches
 * Import from here in ALL server files
 */

export interface StudioCommand {
  readonly id: string;
  readonly tool: string;
  readonly args: unknown;
  readonly timestamp: number;
}

export interface StudioResponse {
  readonly id: string;
  readonly success: boolean;
  readonly result?: string;  // Optional - null for errors
  readonly error?: string;   // Optional - null for success
  readonly timestamp?: number;
}

export interface ResponseChannel {
  resolve: (response: string) => void;
  reject: (error: string) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Runtime validation for StudioResponse
 * Use at all protocol boundaries to catch field mismatches
 */
export function validateStudioResponse(data: unknown): data is StudioResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const response = data as Record<string, unknown>;
  
  return (
    typeof response.id === 'string' &&
    typeof response.success === 'boolean' &&
    (response.result === undefined || typeof response.result === 'string') &&
    (response.error === undefined || typeof response.error === 'string') &&
    (response.timestamp === undefined || typeof response.timestamp === 'number')
  );
}

/**
 * Type guard for StudioCommand
 */
export function validateStudioCommand(data: unknown): data is StudioCommand {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const command = data as Record<string, unknown>;
  
  return (
    typeof command.id === 'string' &&
    typeof command.tool === 'string' &&
    command.args !== undefined &&
    typeof command.timestamp === 'number'
  );
}