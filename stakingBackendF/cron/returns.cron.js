const cron = require('node-cron');
const ReturnsService = require('../services/returns.service');
const cronConfig = require('../config/cron.config');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: '/root/stakingBackendF/logs/returns-cron.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.Console() // Keep console logging as well
    ]
});

// Force production mode and remove the environment check
const isDevelopment = false;  // Force production mode
logger.info(`Environment mode: ${isDevelopment ? 'development' : 'production'}, NODE_ENV=${process.env.NODE_ENV}`);

// Create and start the cron job
const processReturns = isDevelopment ? 
    () => {
        logger.info('Returns processing skipped in development mode');
    } :
    () => {
        const job = cron.schedule(cronConfig.DAILY_RETURNS_SCHEDULE, async () => {
            logger.info('Starting daily returns processing...');
            try {
                await ReturnsService.processUserDailyReturns();
                logger.info('Returns processed successfully');
            } catch (error) {
                logger.error('Error processing returns:', error);
            }
        });
        job.start();
        logger.info('Returns cron job started');
        return job;
    };

// Export and immediately execute the function
module.exports = processReturns();