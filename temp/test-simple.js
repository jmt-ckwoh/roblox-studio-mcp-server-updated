// Simple test to debug ES module issues
console.log('🚀 Simple test starting...');

// Test basic functionality
async function testBasic() {
    console.log('📡 Testing server connection...');
    
    try {
        const response = await fetch('http://localhost:3000/health');
        console.log('✅ Server responded:', response.status);
        const data = await response.text();
        console.log('📄 Response:', data);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

console.log('🎯 About to run test...');
testBasic().then(() => {
    console.log('✅ Test completed');
}).catch(error => {
    console.log('❌ Test failed:', error);
});

console.log('📝 Script end reached');