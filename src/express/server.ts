import * as express from 'express';
import {apiRouter} from './routes';
import makeDBconnexion from '../typeORM/connector';

export const startServer = async() => {
    const app = express();
    const port = process.env.PORT || 3000;
    app.use('/', apiRouter);
    await makeDBconnexion();
    const expressApp = await app.listen({
        port
    }, () => {
        console.log(`Express server running at http://localhost:${port}`)
    })
    return {server: expressApp, port}
};