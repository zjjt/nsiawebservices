import * as express from 'express';
 import {CONTRATS} from '../entity/chapchap/CONTRATS'; 
 import {CLIENT_UNIQUE} from '../entity/chapchap/CLIENT_UNIQUE';
import { UTILISATEUR } from '../entity/chapchap/UTILISATEUR';

export const apiRouter = express.Router();

apiRouter.route('/file_attente/:num_police') // service d'identification du client sur le gestionnare de file d'attente
    .get(async(req, res) => {
    const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
   
    let result;
    if (c) {
        console.dir(c);
       const client = await CLIENT_UNIQUE.findOne({IDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE as string});
       let contrats=await CONTRATS.find({iDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE as string});
       const loginDtails=await UTILISATEUR.findOne({IDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE});
       //remove duplicates from contrats array
       contrats=contrats.reduce((unique:any, o:any) => {
        if(!unique.some((obj:any) => obj.NUMERO_POLICE === o.NUMERO_POLICE && obj.iDE_CLIENT_UNIQUE === o.iDE_CLIENT_UNIQUE)) {
          unique.push(o);
        }
        return unique;
    },[]);
       if(client && contrats && loginDtails){
        result={
            identifiant_unique:loginDtails.LOGIN,
            civilite:client.CIVILITE,
            nom:client.NOM_CLIENT,
            prenoms:client.PRENOMS_CLIENT,
            sexe:client.SEXE,
            email:loginDtails.EMAIL,
            telephone:loginDtails.MOBILE,
            contrats
 
        }
       }
       
    }
    //await res.json("ok");
    //console.log(JSON.stringify(result));
    return c
        ? res.json(result)
        : res.json("not working");

})