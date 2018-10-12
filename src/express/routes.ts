import * as express from 'express';
// import {CONTRATS} from '../entity/chapchap/CONTRATS'; import {CLIENT_UNIQUE}
// from '../entity/chapchap/CLIENT_UNIQUE';

export const apiRouter = express.Router();

apiRouter.route('/file_attente/:num_police') // service d'identification du client sur le gestionnare de file d'attente
    .get(async(req, res) => {
    /*const result = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
    let client;
    if (result) {
        client = await CLIENT_UNIQUE.findOne({IDE_CLIENT_UNIQUE: result.iDE_CLIENT_UNIQUE as string});
    }*/
    await res.json("ok");
    /*return result
        ? res.json(client)
        : res.json("not working");
*/
})