/**
 * 调试工具：测试浏览器到 Hardhat 节点的 RPC 连通性
 * 在浏览器控制台调用: import('/src/utils/debugRpc.js').then(m => m.testRpc())
 */
export async function testRpc() {
  const rpcUrl = 'http://127.0.0.1:8545';
  
  console.log('=== RPC 连通性测试 ===');
  
  // 测试1: eth_blockNumber
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const data = await res.json();
    console.log('✅ eth_blockNumber:', data.result, '(十进制:', parseInt(data.result, 16), ')');
  } catch (err) {
    console.error('❌ eth_blockNumber 失败:', err.message);
    return;
  }

  // 测试2: eth_getBalance
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest'],
        id: 2,
      }),
    });
    const data = await res.json();
    console.log('✅ eth_getBalance (Account#0):', parseInt(data.result, 16) / 1e18, 'ETH');
  } catch (err) {
    console.error('❌ eth_getBalance 失败:', err.message);
  }

  // 测试3: eth_estimateGas (模拟 createBounty)
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [{
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
          value: '0x16345785D8A0000', // 0.1 ETH
          data: '0xb83a3bc100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a546573744861736831000000000000000000000000000000000000000000000000',
        }],
        id: 3,
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.error('❌ eth_estimateGas 失败:', data.error);
    } else {
      console.log('✅ eth_estimateGas:', data.result, '(十进制:', parseInt(data.result, 16), ')');
    }
  } catch (err) {
    console.error('❌ eth_estimateGas 网络错误:', err.message);
  }

  // 测试4: eth_sendTransaction (直接发送，Hardhat 会自动签名)
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        params: [{
          from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          to: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
          value: '0x16345785D8A0000', // 0.1 ETH
          data: '0xb83a3bc100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a546573744861736832000000000000000000000000000000000000000000000000',
          gas: '0x7A120', // 500000
        }],
        id: 4,
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.error('❌ eth_sendTransaction 失败:', data.error);
    } else {
      console.log('✅ eth_sendTransaction 成功! tx hash:', data.result);
    }
  } catch (err) {
    console.error('❌ eth_sendTransaction 网络错误:', err.message);
  }

  console.log('=== 测试完成 ===');
}
