import http from 'http';
import express, { Express } from 'express';
import morgan from 'morgan';
import postRoutes from './routes/posts';
import testRoutes from './routes/test';
import * as redis from 'redis';
import { RedisClientOptions } from 'redis';
import  mysql from 'mysql2';
import logger, { initLogger } from './utils/logger';

const router: Express = express();

/** Logging */
router.use(morgan('dev'));
/** Parse the request */
router.use(express.urlencoded({ extended: false }));
/** Takes care of JSON data */
router.use(express.json());

/** RULES OF OUR API */
router.use((req, res, next) => {
    // set the CORS policy
    res.header('Access-Control-Allow-Origin', '*');
    // set the CORS headers
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    // set the CORS method headers
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

/** Routes */
router.use('/', postRoutes);
router.use('/test', testRoutes);

/** Error handling */
router.use((req, res, next) => {
    const error = new Error('not found API');
    return res.status(404).json({
        message: error.message
    });
});

initLogger();

/** Server */
const httpServer = http.createServer(router);
const PORT: any = process.env.PORT ?? 80;
httpServer.listen(PORT, () => logger.info(`The server is running on port ${PORT}`));

const REDIS_PORT: any = process.env.REDIS_PORT ?? 6379;
const REDIS_HOST: any = process.env.REDIS_HOST ?? 'redis';
const url = `redis://${REDIS_HOST}:${REDIS_PORT}`;
const redisOptions: RedisClientOptions = {
    url: url,
};

const redisClient = redis.createClient(redisOptions);

redisClient.on('error', (err) => console.log("Redis connect hanppend error:\n" ,err))
redisClient.on('connect', () => console.log('Redis connected'));

async function redisConnect() {
    try {
        console.log("connecting", url);
        await redisClient.connect();
    } catch (error) {
        console.log(error);
    }
}

redisConnect()

const poolCluster = mysql.createPoolCluster();
    
export function getRedisClient() {
    return redisClient;
}

const dbMasterClient = mysql.createConnection({
    host: process.env.MYSQL_MASTER_HOST ?? 'db-master',
    database: process.env.MYSQL_MASTER_DATABASE ?? 'test',
    user: process.env.MYSQL_MASTER_USER ?? 'root',
    password: process.env.MYSQL_MASTER_PASSWORD ??'root',
});

const dbSlaveClient = mysql.createConnection({
    host: process.env.MYSQL_SLAVE_HOST ?? 'db-slave',
    database: process.env.MYSQL_SLAVE_DATABASE ?? 'test',
    user: process.env.MYSQL_SLAVE_USER ?? 'root',
    password: process.env.MYSQL_SLAVE_PASSWORD ??'root',
});

export function getDbMasterClient() {
    return dbMasterClient;
}

export function getDbSalveClient() {
    return dbSlaveClient;
}

function dbMasterConnect() {
    try {
        console.log("Connecting mysql master");
        dbMasterClient.connect((err) => {
            if (err) {
                console.log("MySql master connect hanppend error: ", err);
            } else {
                console.log('Connected to mysql master');
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function dbSlaveConnect() {
    try {
        console.log("Connecting mysql slave");
        dbSlaveClient.connect((err) => {
            if (err) {
                console.log("MySql slave connect hanppend error: ", err);
            } else {
                console.log('Connected to mysql slave');
            }
        });
    } catch (error) {
        console.log(error);
    }
}

export function createMasterTable() {
    dbMasterClient.query(`CREATE TABLE IF NOT EXISTS test(
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
    )`, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Table created');
        }
    });
}
dbMasterConnect();
dbSlaveConnect();

export default { getRedisClient, getDbMasterClient, getDbSalveClient, createMasterTable };
