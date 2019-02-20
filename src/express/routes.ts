import * as express from 'express';
 import {CONTRATS} from '../entity/chapchap/CONTRATS'; 
 import {CLIENT_UNIQUE} from '../entity/chapchap/CLIENT_UNIQUE';
import { UTILISATEUR } from '../entity/chapchap/UTILISATEUR';
import { getRepository } from 'typeorm';
const axios = require('axios');
export const apiRouter = express.Router();

apiRouter.route(/*'/infosAssure/:nom/:num_police/'*/'/infosAssure/:nom/:prenoms/:datenaissance/:num_police/:identiteU') // service d'identification du client sur le gestionnare de file d'attente
    .get(async(req, res) => {
        if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance !== "NONE" && req.params.num_police==="NONE" && req.params.identiteU==="NONE"){
       /* const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
            console.log(`nom ${req.params.nom} police ${req.params.num_police}`);*/
            //const client = await CLIENT_UNIQUE.findOne({NOM_CLIENT:req.params.nom,PRENOMS_CLIENT:Like(`%${req.params.prenoms}%`),DATE_NAISSANCE:req.params.datenaissance });
            const client=await getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE = :d",{n:req.params.nom,p:`%${req.params.prenoms}%`,d:req.params.datenaissance}).getOne();
            let result;
            if (typeof client!="undefined") {
                //console.dir(c);
            //console.dir(client);
            let contrats=await CONTRATS.find({iDE_CLIENT_UNIQUE: client.IDE_CLIENT_UNIQUE as string});
            const loginDtails=await UTILISATEUR.findOne({IDE_CLIENT_UNIQUE: client.IDE_CLIENT_UNIQUE});
            //remove duplicates from contrats array
            contrats=contrats.reduce((unique:any, o:any) => {
                if(!unique.some((obj:any) => obj.NUMERO_POLICE === o.NUMERO_POLICE && obj.iDE_CLIENT_UNIQUE === o.iDE_CLIENT_UNIQUE)) {
                unique.push(o);
                }
                return unique;
            },[]);
            if(client && contrats && loginDtails){
                result={
                    client:{
                        numero_client:client.NUMERO_CLIENT,
                        nom_client:client.NOM_CLIENT,
                        prenoms_client:client.PRENOMS_CLIENT,
                        date_naissance:client.DATE_NAISSANCE,
                        lieu_naissance:client.LIEU_NAISSANCE,
                        sexe:client.SEXE,
                        adresse_postale:client.ADRESSE_POSTALE,
                        telephone:client.TELEPHONE,
                        telephone1:client.TELEPHONE_1,
                        profession:client.PROFESSION,
                        civilite:client.CIVILITE,
                        nationalite:client.NATIONALITE,
                        situation_matrimoniale:client.SITUATION_MATRIMONIALE,
                        lieu_habitation:client.LIEU_HABITATION,
                        type_client:client.TYPE_CLIENT,
                        code_banque:client.CODE_BANQUE,
                        code_agence:client.CODE_AGENCE,
                        numero_compte:client.NUMERO_DE_COMPTE,
                        cle_rib:client.CLE_RIB,
                        identifiant_unique:loginDtails.IDE_CLIENT_UNIQUE,  
                        loginchapchap:loginDtails.LOGIN,
                        email:loginDtails.EMAIL,
                        mobile:loginDtails.MOBILE,
                        dejaConnecteAChapChap:loginDtails.ISFIRSTCONNEXION,
                        photo_utilisateur:loginDtails.PHOTO_UTILISATEUR,
                        contrats,

                    
                    }
        
                }
            }
            
            }
            //await res.json("ok");
            //console.log(JSON.stringify(result));
            return client
                ? res.json(result?result:"not working")
                : res.json("not working");    
          
}
     else if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance !== "NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE"){
            const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
                console.log(`nom ${req.params.nom} police ${req.params.num_police}`);
            let result;
            if (c) {
                //console.dir(c);
                const client=await getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE = :d",{n:req.params.nom,p:`%${req.params.prenoms}%`,d:req.params.datenaissance}).getOne();

                //console.dir(client);
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
                    client:{
                        numero_client:client.NUMERO_CLIENT,
                        nom_client:client.NOM_CLIENT,
                        prenoms_client:client.PRENOMS_CLIENT,
                        date_naissance:client.DATE_NAISSANCE,
                        lieu_naissance:client.LIEU_NAISSANCE,
                        sexe:client.SEXE,
                        adresse_postale:client.ADRESSE_POSTALE,
                        telephone:client.TELEPHONE,
                        telephone1:client.TELEPHONE_1,
                        profession:client.PROFESSION,
                        civilite:client.CIVILITE,
                        nationalite:client.NATIONALITE,
                        situation_matrimoniale:client.SITUATION_MATRIMONIALE,
                        lieu_habitation:client.LIEU_HABITATION,
                        type_client:client.TYPE_CLIENT,
                        code_banque:client.CODE_BANQUE,
                        code_agence:client.CODE_AGENCE,
                        numero_compte:client.NUMERO_DE_COMPTE,
                        cle_rib:client.CLE_RIB,
                        identifiant_unique:loginDtails.IDE_CLIENT_UNIQUE,  
                        loginchapchap:loginDtails.LOGIN,
                        email:loginDtails.EMAIL,
                        mobile:loginDtails.MOBILE,
                        dejaConnecteAChapChap:loginDtails.ISFIRSTCONNEXION,
                        photo_utilisateur:loginDtails.PHOTO_UTILISATEUR,
                        contrats,

                    
                    }
        
                }
            }
            
            }
            //await res.json("ok");
            //console.log(JSON.stringify(result));
            return c
                ? res.json(result?result:"not working")
                : res.json("not working");
    }else if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance === "NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE"){
        const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
            console.log(`nom ${req.params.nom} police ${req.params.num_police}`);
        let result;
        if (c) {
            //console.dir(c);
            const client=await getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p ",{n:req.params.nom,p:`%${req.params.prenoms}%`}).getOne();

            //console.dir(client);
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
                client:{
                    numero_client:client.NUMERO_CLIENT,
                    nom_client:client.NOM_CLIENT,
                    prenoms_client:client.PRENOMS_CLIENT,
                    date_naissance:client.DATE_NAISSANCE,
                    lieu_naissance:client.LIEU_NAISSANCE,
                    sexe:client.SEXE,
                    adresse_postale:client.ADRESSE_POSTALE,
                    telephone:client.TELEPHONE,
                    telephone1:client.TELEPHONE_1,
                    profession:client.PROFESSION,
                    civilite:client.CIVILITE,
                    nationalite:client.NATIONALITE,
                    situation_matrimoniale:client.SITUATION_MATRIMONIALE,
                    lieu_habitation:client.LIEU_HABITATION,
                    type_client:client.TYPE_CLIENT,
                    code_banque:client.CODE_BANQUE,
                    code_agence:client.CODE_AGENCE,
                    numero_compte:client.NUMERO_DE_COMPTE,
                    cle_rib:client.CLE_RIB,
                    identifiant_unique:loginDtails.IDE_CLIENT_UNIQUE,  
                    loginchapchap:loginDtails.LOGIN,
                    email:loginDtails.EMAIL,
                    mobile:loginDtails.MOBILE,
                    dejaConnecteAChapChap:loginDtails.ISFIRSTCONNEXION,
                    photo_utilisateur:loginDtails.PHOTO_UTILISATEUR,
                    contrats,

                
                }
    
            }
        }
        
        }
        //await res.json("ok");
        //console.log(JSON.stringify(result));
        return c
            ? res.json(result?result:"not working")
            : res.json("not working");
}else if(req.params.nom==="NONE" && req.params.num_police==="NONE" && req.params.identiteU!=="NONE"){
        /*const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
        console.log(`nom ${req.params.nom} police ${req.params.num_police}`);*/
    let result;
    if (true) {
        //console.dir(c);
    const client = await CLIENT_UNIQUE.findOne({IDE_CLIENT_UNIQUE: req.params.identiteU });
    //console.dir(client);
    let contrats=await CONTRATS.find({iDE_CLIENT_UNIQUE: req.params.identiteU});
    const loginDtails=await UTILISATEUR.findOne({IDE_CLIENT_UNIQUE: req.params.identiteU});
    //remove duplicates from contrats array
    contrats=contrats.reduce((unique:any, o:any) => {
        if(!unique.some((obj:any) => obj.NUMERO_POLICE === o.NUMERO_POLICE && obj.iDE_CLIENT_UNIQUE === o.iDE_CLIENT_UNIQUE)) {
        unique.push(o);
        }
        return unique;
    },[]);
    if(client && contrats && loginDtails){
        result={
            client:{
                numero_client:client.NUMERO_CLIENT,
                nom_client:client.NOM_CLIENT,
                prenoms_client:client.PRENOMS_CLIENT,
                date_naissance:client.DATE_NAISSANCE,
                lieu_naissance:client.LIEU_NAISSANCE,
                sexe:client.SEXE,
                adresse_postale:client.ADRESSE_POSTALE,
                telephone:client.TELEPHONE,
                telephone1:client.TELEPHONE_1,
                profession:client.PROFESSION,
                civilite:client.CIVILITE,
                nationalite:client.NATIONALITE,
                situation_matrimoniale:client.SITUATION_MATRIMONIALE,
                lieu_habitation:client.LIEU_HABITATION,
                type_client:client.TYPE_CLIENT,
                code_banque:client.CODE_BANQUE,
                code_agence:client.CODE_AGENCE,
                numero_compte:client.NUMERO_DE_COMPTE,
                cle_rib:client.CLE_RIB,
                identifiant_unique:loginDtails.IDE_CLIENT_UNIQUE,  
                loginchapchap:loginDtails.LOGIN,
                email:loginDtails.EMAIL,
                mobile:loginDtails.MOBILE,
                dejaConnecteAChapChap:loginDtails.ISFIRSTCONNEXION,
                photo_utilisateur:loginDtails.PHOTO_UTILISATEUR,
                contrats,

            
            }

        }
    }
    
    }
    //await res.json("ok");
    //console.log(JSON.stringify(result));
    return true
        ? res.json(result?result:"not working")
        : res.json("not working");
    }else if(req.params.nom==="NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE"){
        const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
        console.log(`nom ${req.params.nom} police ${req.params.num_police}`);
    let result;
    if (c) {
        //console.dir(c);
    const client = await CLIENT_UNIQUE.findOne({IDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE as string});
    //console.dir(client);
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
            client:{
                numero_client:client.NUMERO_CLIENT,
                nom_client:client.NOM_CLIENT,
                prenoms_client:client.PRENOMS_CLIENT,
                date_naissance:client.DATE_NAISSANCE,
                lieu_naissance:client.LIEU_NAISSANCE,
                sexe:client.SEXE,
                adresse_postale:client.ADRESSE_POSTALE,
                telephone:client.TELEPHONE,
                telephone1:client.TELEPHONE_1,
                profession:client.PROFESSION,
                civilite:client.CIVILITE,
                nationalite:client.NATIONALITE,
                situation_matrimoniale:client.SITUATION_MATRIMONIALE,
                lieu_habitation:client.LIEU_HABITATION,
                type_client:client.TYPE_CLIENT,
                code_banque:client.CODE_BANQUE,
                code_agence:client.CODE_AGENCE,
                numero_compte:client.NUMERO_DE_COMPTE,
                cle_rib:client.CLE_RIB,
                identifiant_unique:loginDtails.IDE_CLIENT_UNIQUE,  
                loginchapchap:loginDtails.LOGIN,
                email:loginDtails.EMAIL,
                mobile:loginDtails.MOBILE,
                dejaConnecteAChapChap:loginDtails.ISFIRSTCONNEXION,
                photo_utilisateur:loginDtails.PHOTO_UTILISATEUR,
                contrats,

            
            }

        }
    }
    
    }
    //await res.json("ok");
    //console.log(JSON.stringify(result));
    return c
        ? res.json(result?result:"not working")
        : res.json("not working");
    }
    return res.json("not working");

});
apiRouter.route('/sendSMS').post(async(req,res)=>{
//service d'envoi de sms vers SMSAUTO02
const {username,password,telephone,expeditor,typeEnvoi,sms,smsArray}=req.body;
if(!smsArray){
    try{//on envoi un seul sms
    let result=await axios({
        method:'post',
        url:'http://10.11.100.48:8097/sendSMS',
        data:{
            username,
            password,
            telephone,
            expeditor,
            typeEnvoi,
            sms
        },
        timeout:60*15*1000
    });
    return res.status(200).json(result.data.result);
}
    catch (err) {
        console.error(err);
    }
   return; 
}else{
    //sms groupers
    try{let result=await axios({
        method:'post',
        url:'http://10.11.100.48:8097/sendSMS',
        data:{
            username,
            password,
            expeditor,
            typeEnvoi,
            smsArray
        },
        timeout:60*15*1000
    });
    return res.status(200).json(result.data.result);}
    catch (err) {
        console.error(err);
    }
    return ;
}
    //console.dir(req.body);

})