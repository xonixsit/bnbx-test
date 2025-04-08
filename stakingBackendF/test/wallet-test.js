const ethers = require('ethers');
require('dotenv').config();

async function testWalletConfig() {
    try {
        // Setup provider
        const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        
        // Create wallet instance
        const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
        
        // Get wallet info
        const balance = await provider.getBalance(wallet.address);
        const address = wallet.address;
        
        console.log('Wallet Configuration Test Results:');
        console.log('--------------------------------');
        console.log('Wallet Address:', address);
        console.log('BNB Balance:', ethers.utils.formatEther(balance));
        console.log('Matches SENDER_ADDRESS:', address.toLowerCase() === process.env.SENDER_ADDRESS.toLowerCase());
        
        return true;
    } catch (error) {
        console.error('Wallet Configuration Error:', error.message);
        return false;
    }
}

testWalletConfig();