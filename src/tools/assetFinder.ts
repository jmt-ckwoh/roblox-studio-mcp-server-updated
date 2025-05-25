import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Roblox asset search and management tool
 */
export const assetFinder = {
  register: (server: McpServer) => {
    logger.info('Registering assetFinder tool...');
    
    server.tool(
      'find-roblox-assets',
      'Search for Roblox assets in the marketplace',
      {
        searchQuery: z.string().describe('Search terms for the asset'),
        assetType: z.string().optional().default('Model').describe('Type of asset (Model, Decal, Audio, Hat, Gear, Badge, GamePass)'),
        category: z.string().optional().default('All').describe('Asset category to filter by'),
        maxResults: z.number().optional().default(10).describe('Maximum number of results to return')
      },
      async ({ searchQuery, assetType, category, maxResults }) => {
        try {
          const assets = await findRobloxAssets(
            assetType ?? 'Model', 
            searchQuery, 
            category ?? 'All', 
            maxResults ?? 10
          );
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(assets, null, 2)
              }
            ]
          };
        } catch (error) {
          logger.error('Asset search failed:', error);
          return {
            content: [
              {
                type: "text",
                text: `Error searching assets: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    logger.info('assetFinder tool registered successfully');
  }
};

async function findRobloxAssets(assetType: string, searchQuery: string, category: string, maxResults: number = 10) {
  try {
    // Enhanced mock asset search with realistic Roblox asset structure
    const mockAssets = generateMockAssets(assetType, searchQuery, category, maxResults);
    
    // In a real implementation, this would call the Roblox API:
    // const response = await fetch(`https://catalog.roblox.com/v1/search/items?category=${assetType}&keyword=${searchQuery}&limit=${maxResults}`);
    // const data = await response.json();
    // return data.data;
    
    return {
      results: mockAssets,
      totalCount: mockAssets.length,
      searchQuery,
      assetType,
      category
    };
  } catch (error) {
    logger.error('Asset search error:', error);
    throw error;
  }
}

function generateMockAssets(assetType: string, searchQuery: string, category: string, maxResults: number) {
  const assets = [];
  const assetTypes = ['Model', 'Decal', 'Audio', 'Hat', 'Gear', 'Badge', 'GamePass'];
  const creators = ['ROBLOX', 'SuperStriker45', 'ModelMaker123', 'AssetCreator', 'GameDev99'];
  
  for (let i = 0; i < Math.min(maxResults, 15); i++) {
    const assetId = Math.floor(Math.random() * 1000000000) + 100000000;
    const creator = creators[Math.floor(Math.random() * creators.length)];
    const price = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) + 10 : 0; // 30% chance of being paid
    
    assets.push({
      id: assetId.toString(),
      name: generateAssetName(searchQuery, assetType, i),
      description: `A ${assetType.toLowerCase()} for ${searchQuery}. Created by ${creator}.`,
      assetType: assetType,
      creator: {
        id: Math.floor(Math.random() * 10000000) + 1000000,
        name: creator,
        type: creator === 'ROBLOX' ? 'User' : 'User'
      },
      product: {
        id: Math.floor(Math.random() * 1000000) + 100000,
        type: 'User Product',
        isPublicDomain: price === 0,
        isForSale: true,
        priceInRobux: price
      },
      thumbnail: {
        url: `https://t1.rbxcdn.com/assets/${assetId}/150x150/Png/noFilter`,
        retryUrl: null,
        userId: null,
        endpointType: 'Avatar'
      },
      bundleType: null,
      favoriteCount: Math.floor(Math.random() * 10000),
      genres: category !== 'All' ? [category] : ['Building', 'Town and City'],
      itemStatus: 'Available',
      itemRestrictions: [],
      createdUtc: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedUtc: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return assets;
}

function generateAssetName(searchQuery: string, assetType: string, index: number): string {
  const adjectives = ['Amazing', 'Cool', 'Epic', 'Awesome', 'Super', 'Mega', 'Ultra', 'Premium', 'Deluxe', 'Pro'];
  const suffixes = ['2024', 'HD', 'Remastered', 'Updated', 'New', 'Improved', 'Enhanced', 'Special'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const suffix = Math.random() > 0.6 ? ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : '';
  
  if (index === 0) {
    return `${adjective} ${searchQuery} ${assetType}${suffix}`;
  } else if (index === 1) {
    return `${searchQuery} ${assetType} Pack${suffix}`;
  } else if (index === 2) {
    return `Professional ${searchQuery} ${assetType}${suffix}`;
  } else {
    return `${searchQuery} ${assetType} ${index + 1}${suffix}`;
  }
}