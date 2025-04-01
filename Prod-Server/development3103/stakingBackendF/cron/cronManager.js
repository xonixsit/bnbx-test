const returnsJob = require('./returns.cron');

class CronManager {
    static initializeCrons() {
        console.log('Initializing cron jobs...');
        // Initialize returns cron job
        returnsJob;
        console.log('Returns cron job initialized');
    }
}

module.exports = CronManager;