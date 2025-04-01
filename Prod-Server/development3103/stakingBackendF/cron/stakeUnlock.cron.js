const cron = require('node-cron');
const StakingService = require('../services/staking.service');
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
            filename: '/root/stakingBackendF/logs/stakeUnlock-cron.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.Console()
    ]
});

const isDevelopment = false;  // Force production mode
logger.info(`Environment mode: ${isDevelopment ? 'development' : 'production'}, NODE_ENV=${process.env.NODE_ENV}`);

const processStakeUnlock = isDevelopment ? 
    () => {
        logger.info('Stake unlock processing skipped in development mode');
    } :
    () => {
        const job = cron.schedule(cronConfig.DAILY_RETURNS_SCHEDULE, async () => {
            logger.info('Starting stake unlock processing...');
            try {
                await StakingService.processStakeUnlock();
                logger.info('Stake unlock processed successfully');
            } catch (error) {
                logger.error('Error processing stake unlock:', error);
            }
        });
        job.start();
        logger.info('Stake unlock cron job started');
        return job;
    };

module.exports = processStakeUnlock();