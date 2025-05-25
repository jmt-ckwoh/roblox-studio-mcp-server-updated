import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

class ReliabilityTester {
  constructor(serverUrl = 'http://localhost:3000/sse') {
    this.serverUrl = serverUrl;
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      responseTimes: [],
      errors: []
    };
  }

  async runConcurrentTests(concurrency = 50) {
    console.log(`🔄 Running ${concurrency} concurrent connections...`);
    
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.testSingleConnection(i));
    }
    
    const results = await Promise.allSettled(promises);
    
    let successful = 0;
    let failed = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful++;
        console.log(`✅ Connection ${index}: ${result.value}ms`);
      } else {
        failed++;
        console.log(`❌ Connection ${index}: ${result.reason}`);
      }
    });
    
    console.log(`\n📊 Concurrent Test Results:`);
    console.log(`   Successful: ${successful}/${concurrency} (${(successful/concurrency*100).toFixed(1)}%)`);
    console.log(`   Failed: ${failed}/${concurrency}`);
    
    return { successful, failed, successRate: successful / concurrency };
  }

  async testSingleConnection(connectionId) {
    const startTime = Date.now();
    
    try {
      const transport = new SSEClientTransport(new URL(this.serverUrl));
      const client = new Client({
        name: `reliability-test-${connectionId}`,
        version: "1.0.0",
      }, {
        capabilities: {}
      });

      await client.connect(transport);
      
      // Test basic tool call
      const result = await client.callTool({
        name: 'generate-roblox-code',
        arguments: {
          scriptType: 'ServerScript',
          functionality: `test ${connectionId}`,
          includeComments: true
        }
      });
      
      if (!result.content || !result.content[0]) {
        throw new Error('Invalid response format');
      }
      
      await client.close();
      
      const responseTime = Date.now() - startTime;
      this.results.responseTimes.push(responseTime);
      return responseTime;
      
    } catch (error) {
      this.results.errors.push({ connectionId, error: error.message });
      throw error;
    }
  }

  async testEdgeCases() {
    console.log('\n🔍 Testing edge cases...');
    
    const edgeCases = [
      // Empty input
      {
        name: 'empty-functionality',
        tool: 'generate-roblox-code',
        args: { functionality: '', scriptType: 'ServerScript' },
        expectError: true
      },
      // Maximum size input
      {
        name: 'max-functionality-size',
        tool: 'generate-roblox-code',
        args: { functionality: 'x'.repeat(1000), scriptType: 'ServerScript' },
        expectError: false
      },
      // Over size limit
      {
        name: 'over-functionality-limit',
        tool: 'generate-roblox-code',
        args: { functionality: 'x'.repeat(1001), scriptType: 'ServerScript' },
        expectError: true
      },
      // Script validator max size
      {
        name: 'max-script-size',
        tool: 'validate-luau-script',
        args: { script: 'x'.repeat(50000) },
        expectError: false
      },
      // Script validator over limit
      {
        name: 'over-script-limit',
        tool: 'validate-luau-script',
        args: { script: 'x'.repeat(50001) },
        expectError: true
      },
      // Unicode control characters
      {
        name: 'unicode-control-chars',
        tool: 'get-user-info',
        args: { identifier: '\u0000\u0001\u0002testuser' },
        expectError: true
      },
      // Long endpoint
      {
        name: 'long-endpoint',
        tool: 'call-roblox-api',
        args: { endpoint: '/' + 'x'.repeat(200) },
        expectError: true
      }
    ];
    
    const results = [];
    
    for (const testCase of edgeCases) {
      try {
        const transport = new SSEClientTransport(new URL(this.serverUrl));
        const client = new Client({
          name: "edge-case-tester",
          version: "1.0.0",
        }, {
          capabilities: {}
        });

        await client.connect(transport);
        
        const startTime = Date.now();
        const result = await client.callTool({
          name: testCase.tool,
          arguments: testCase.args
        });
        const responseTime = Date.now() - startTime;
        
        const hasError = result.isError || (result.content && result.content[0] && result.content[0].text.includes('Error'));
        const passed = hasError === testCase.expectError;
        
        results.push({
          name: testCase.name,
          passed,
          responseTime,
          expected: testCase.expectError ? 'error' : 'success',
          actual: hasError ? 'error' : 'success'
        });
        
        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${responseTime}ms (expected ${testCase.expectError ? 'error' : 'success'}, got ${hasError ? 'error' : 'success'})`);
        
        await client.close();
        
      } catch (error) {
        const passed = testCase.expectError;
        results.push({
          name: testCase.name,
          passed,
          error: error.message,
          expected: testCase.expectError ? 'error' : 'success',
          actual: 'error'
        });
        
        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: threw error (expected ${testCase.expectError ? 'error' : 'success'})`);
      }
    }
    
    const passed = results.filter(r => r.passed).length;
    console.log(`\n📊 Edge Case Results: ${passed}/${results.length} passed`);
    
    return { passed, total: results.length, results };
  }

  async measurePerformance() {
    console.log('\n⚡ Measuring performance baseline...');
    
    const iterations = 100;
    const responseTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const transport = new SSEClientTransport(new URL(this.serverUrl));
        const client = new Client({
          name: `perf-test-${i}`,
          version: "1.0.0",
        }, {
          capabilities: {}
        });

        const startTime = Date.now();
        await client.connect(transport);
        
        const result = await client.callTool({
          name: 'generate-roblox-code',
          arguments: {
            scriptType: 'ServerScript',
            functionality: 'performance test',
            includeComments: false
          }
        });
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        await client.close();
        
        if (i % 10 === 0) {
          process.stdout.write(`${i}/${iterations} `);
        }
        
      } catch (error) {
        console.error(`\n❌ Performance test ${i} failed:`, error.message);
      }
    }
    
    // Calculate statistics
    responseTimes.sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    console.log(`\n\n📊 Performance Results:`);
    console.log(`   Average: ${avg.toFixed(1)}ms`);
    console.log(`   P50: ${p50}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms`);
    console.log(`   Target: <100ms P95 ${p95 < 100 ? '✅' : '❌'}`);
    
    return { avg, p50, p95, p99, target: p95 < 100 };
  }

  async runFullSuite() {
    console.log('🚀 Starting Reliability Test Suite\n');
    
    const suite = {
      concurrent: await this.runConcurrentTests(50),
      edgeCases: await this.testEdgeCases(),
      performance: await this.measurePerformance()
    };
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log(`   Concurrent Success Rate: ${(suite.concurrent.successRate * 100).toFixed(1)}% (target: 95%) ${suite.concurrent.successRate >= 0.95 ? '✅' : '❌'}`);
    console.log(`   Edge Case Success Rate: ${(suite.edgeCases.passed / suite.edgeCases.total * 100).toFixed(1)}% ${suite.edgeCases.passed === suite.edgeCases.total ? '✅' : '❌'}`);
    console.log(`   Performance P95: ${suite.performance.p95}ms (target: <100ms) ${suite.performance.target ? '✅' : '❌'}`);
    
    const overallSuccess = 
      suite.concurrent.successRate >= 0.95 && 
      suite.edgeCases.passed === suite.edgeCases.total && 
      suite.performance.target;
    
    console.log(`\n${overallSuccess ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return suite;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ReliabilityTester();
  tester.runFullSuite().catch(console.error);
}

export { ReliabilityTester };