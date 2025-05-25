/**
 * Memory and performance monitoring utilities
 */

export class PerformanceMonitor {
  constructor() {
    this.initialMemory = process.memoryUsage();
    this.startTime = Date.now();
    this.measurements = [];
  }

  checkMemoryLeak() {
    const currentMemory = process.memoryUsage();
    const heapGrowth = currentMemory.heapUsed - this.initialMemory.heapUsed;
    const isLeak = heapGrowth > 10 * 1024 * 1024; // 10MB threshold
    
    return {
      heapGrowth,
      heapUsed: currentMemory.heapUsed,
      initialHeap: this.initialMemory.heapUsed,
      isLeak,
      growthMB: (heapGrowth / 1024 / 1024).toFixed(2)
    };
  }

  measureOperation(name, operation) {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      try {
        const result = await operation();
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        const measurement = {
          name,
          duration: endTime - startTime,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          timestamp: startTime,
          success: true
        };
        
        this.measurements.push(measurement);
        resolve({ result, measurement });
        
      } catch (error) {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        const measurement = {
          name,
          duration: endTime - startTime,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          timestamp: startTime,
          success: false,
          error: error.message
        };
        
        this.measurements.push(measurement);
        reject({ error, measurement });
      }
    });
  }

  getStatistics() {
    const successful = this.measurements.filter(m => m.success);
    const failed = this.measurements.filter(m => !m.success);
    
    if (successful.length === 0) {
      return {
        totalOperations: this.measurements.length,
        successRate: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalMemoryDelta: 0,
        failed: failed.length
      };
    }
    
    const durations = successful.map(m => m.duration);
    const memoryDeltas = successful.map(m => m.memoryDelta);
    
    return {
      totalOperations: this.measurements.length,
      successRate: successful.length / this.measurements.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0),
      avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      failed: failed.length,
      measurements: this.measurements
    };
  }

  async runMemoryLeakTest(testFunction, iterations = 1000) {
    console.log(`🔍 Running memory leak test with ${iterations} iterations...`);
    
    const initialCheck = this.checkMemoryLeak();
    console.log(`Initial heap: ${(initialCheck.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    for (let i = 0; i < iterations; i++) {
      try {
        await this.measureOperation(`leak-test-${i}`, testFunction);
        
        // Check every 100 iterations
        if (i % 100 === 0 && i > 0) {
          const check = this.checkMemoryLeak();
          console.log(`Iteration ${i}: heap growth ${check.growthMB}MB`);
          
          if (check.isLeak) {
            console.log(`❌ Memory leak detected at iteration ${i}`);
            break;
          }
        }
        
        // Force garbage collection every 50 iterations if available
        if (i % 50 === 0 && global.gc) {
          global.gc();
        }
        
      } catch (error) {
        console.error(`❌ Test failed at iteration ${i}:`, error.error.message);
      }
    }
    
    const finalCheck = this.checkMemoryLeak();
    const stats = this.getStatistics();
    
    console.log(`\n📊 Memory Leak Test Results:`);
    console.log(`   Total heap growth: ${finalCheck.growthMB}MB`);
    console.log(`   Average operation time: ${stats.avgDuration.toFixed(2)}ms`);
    console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   Memory leak detected: ${finalCheck.isLeak ? 'YES ❌' : 'NO ✅'}`);
    
    return {
      heapGrowth: finalCheck.heapGrowth,
      isLeak: finalCheck.isLeak,
      stats
    };
  }

  reset() {
    this.initialMemory = process.memoryUsage();
    this.startTime = Date.now();
    this.measurements = [];
  }
}

export class LoadTester {
  constructor(serverUrl = 'http://localhost:3000/sse') {
    this.serverUrl = serverUrl;
    this.monitor = new PerformanceMonitor();
  }

  async testLoad(concurrency, duration = 30000) { // 30 seconds
    console.log(`⚡ Load testing: ${concurrency} concurrent connections for ${duration/1000}s`);
    
    const startTime = Date.now();
    const results = [];
    let activeConnections = 0;
    let totalRequests = 0;
    
    const createWorker = async (workerId) => {
      while (Date.now() - startTime < duration) {
        try {
          activeConnections++;
          totalRequests++;
          
          const result = await this.monitor.measureOperation(
            `load-worker-${workerId}-req-${totalRequests}`,
            async () => {
              // Simulate a typical tool call
              const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
              const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');
              
              const transport = new SSEClientTransport(new URL(this.serverUrl));
              const client = new Client({
                name: `load-test-${workerId}`,
                version: "1.0.0",
              }, { capabilities: {} });

              await client.connect(transport);
              
              const toolResult = await client.callTool({
                name: 'generate-roblox-code',
                arguments: {
                  scriptType: 'ServerScript',
                  functionality: `load test ${workerId}`,
                  includeComments: false
                }
              });
              
              await client.close();
              return toolResult;
            }
          );
          
          results.push(result);
          activeConnections--;
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 10));
          
        } catch (error) {
          activeConnections--;
          console.error(`Worker ${workerId} error:`, error.error?.message || error.message);
        }
      }
    };
    
    // Start workers
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(createWorker(i));
    }
    
    await Promise.allSettled(workers);
    
    const stats = this.monitor.getStatistics();
    const memoryCheck = this.monitor.checkMemoryLeak();
    
    console.log(`\n📊 Load Test Results:`);
    console.log(`   Total requests: ${stats.totalOperations}`);
    console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   Average response time: ${stats.avgDuration.toFixed(2)}ms`);
    console.log(`   Max response time: ${stats.maxDuration}ms`);
    console.log(`   Memory growth: ${memoryCheck.growthMB}MB`);
    console.log(`   Requests/second: ${(stats.totalOperations / (duration / 1000)).toFixed(2)}`);
    
    return stats;
  }
}