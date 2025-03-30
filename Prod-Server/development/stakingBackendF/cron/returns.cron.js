const cron = require('node-cron');
const ReturnsService = require('../services/returns.service');
const cronConfig = require('../config/cron.config');

const isDevelopment = process.env.NODE_ENV === 'development';

const processReturns = isDevelopment ? 
    async () => {
        console.log('Returns processing skipped in development mode');
    } :
    cron.schedule(cronConfig.DAILY_RETURNS_SCHEDULE, async () => {
        console.log('Processing returns...');
        await ReturnsService.processUserDailyReturns();
        console.log('Returns processed successfully');
    });

module.exports = processReturns;