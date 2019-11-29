import * as express from 'express';
import {apiRouter} from './routes';
import makeDBconnexion from '../typeORM/connector';
import * as cors from 'cors';
const rateLimit=require("express-rate-limit");

export const startServer = async() => {
    const limiter=rateLimit({
        windowMs:15*60*10000,
        max:100
    });
    const app = express();
    const port = process.env.PORT || 3000;
    app.set('trust proxy',1);
    app.use(cors());
    app.use(limiter);
    app.use(express.json());
    app.use(express.urlencoded());
    app.use('/', apiRouter);
    await makeDBconnexion();
    const expressApp = await app.listen({
        port
    }, () => {
        console.log(`Express server running at http://localhost:${port}`)
    })
    return {server: expressApp, port}
};