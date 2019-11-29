import * as express from 'express';
 //import {CONTRATS} from '../entity/chapchap/CONTRATS'; 
 import {CLIENT_UNIQUE} from '../entity/chapchap/CLIENT_UNIQUE';
import { UTILISATEUR } from '../entity/chapchap/UTILISATEUR';
import { getConnection } from 'typeorm';
const axios = require('axios');
const moment= require('moment');
const cache=require('express-redis-cache')({
    host: "redis", port: 6379, auth_pass:'' 
});
export const apiRouter = express.Router();

/*const reverseString=(str:any)=>{
    return str.split("").reverse().join("");
}*/
const contratsReducer=async (contrat:any)=>{
    let contracts: { NUMERO_POLICE: any; NUMERO_CONVENTION: any; NUMERO_PAYEUR: any; NUMERO_CLIENT: any; NOM_CLIENT: any; PRENOMS_CLIENT: any; DATE_NAISSANCE: any; CODE_PRODUIT: any; LIBELLE_PRODUIT: any; DATE_EFFET_POLICE: any; DATE_FIN_EFFET_POLICE: any; DUREE_CONTRAT: any; PERIODICITE: any; FRACTIONNEMENT: any; MODE_REGLEMENT_POLICE: any; TYPE_CLIENT: any; DUREE_RENTE: any; UNITE_RENTE: any; STATUT_POLICE: any; assures: { NUMERO_ASSURE: any; DATE_NAISSANCE_ASSURE: any; DATE_NAISSANCE_ASSURE_ASSOCIE: any; NOM_ASSURE_ASSOCIE: any; LIEN_PARENTE: any; DATE_SORTIE: any; }[]; beneficiaires: { NOM_ASSURE_BENEFICIAIRE: any; }[]; }[]=[];
    contrat.forEach(async(e:any,i:number,arr:any)=>{
        console.log("index is "+i);
       // console.dir(contrat);
      
        
        let initialobj={
            NUMERO_POLICE:e.POLICE,
            NUMERO_CONVENTION:e.CONVENTION,
            NUMERO_PAYEUR:e.NUMERO_PAYEUR,
            NUMERO_CLIENT:e.NUMERO_CLIENT,
            NOM_CLIENT:e.NOM_CLIENT,
            PRENOMS_CLIENT:e.PRENOMS_CLIENT,
            DATE_NAISSANCE:e.DATE_NAISSANCE,
            CODE_PRODUIT:e.CODE_PRODUIT,
            LIBELLE_PRODUIT:e.LIBELLE_PRODUIT,
            DATE_EFFET_POLICE:e.DATE_EFFET_POLICE,
            DATE_FIN_EFFET_POLICE:e.DATE_FIN_EFFET_POLICE,
            DUREE_CONTRAT:e.DUREE_POLICE,
            PERIODICITE:e.PERIODICITE,
            FRACTIONNEMENT:e.FRACTIONNEMENT,
            MODE_REGLEMENT_POLICE:e.MODE_REGLEMENT_POLICE,
            TYPE_CLIENT:e.TYPE_CLIENT,
            DUREE_RENTE:e.DUREE_RENTE,
            UNITE_RENTE:e.UNITE_RENTE,   
            STATUT_POLICE:e.STATUT_POLICE,             
            assures:[{
                NUMERO_ASSURE:e.NUMERO_ASSURE,
                DATE_NAISSANCE_ASSURE:e.DATE_NAISSANCE_ASSURE,
                DATE_NAISSANCE_ASSURE_ASSOCIE:e.DATE_NAISSANCE_ASSURE_ASSOCIE,
                NOM_ASSURE_ASSOCIE:e.NOM_ASSURE_ASSOCIE,
                LIEN_PARENTE:e.LIEN_PARENTE,
                DATE_SORTIE:e.DATE_SORTIE,
            }],
            beneficiaires:[{
                NOM_ASSURE_BENEFICIAIRE:e.NOM_ASSURE_BENEFICIAIRE,
            }],
            
            
            
        };
        if(i==0){
           
            contracts.push(initialobj);
        }else{
            
           
            if(contracts[contracts.length-1].NUMERO_POLICE==e.POLICE){
                //la police existe deja donc on check si les assure associers n'existent pas deja
              let foundAssureAssoc=contracts[contracts.length-1].assures.find(obj=>obj.NOM_ASSURE_ASSOCIE==e.NOM_ASSURE_ASSOCIE);
              let foundAssureBenef=contracts[contracts.length-1].beneficiaires.find(obj=>obj.NOM_ASSURE_BENEFICIAIRE==e.NOM_ASSURE_BENEFICIAIRE);

              if(typeof foundAssureAssoc =="undefined"){
               // on a pas trouver le meme assure
               console.log("on a pa trouver d'assure associer");
               let assureInit={
                NUMERO_ASSURE:e.NUMERO_ASSURE,
                DATE_NAISSANCE_ASSURE:e.DATE_NAISSANCE_ASSURE,
                DATE_NAISSANCE_ASSURE_ASSOCIE:e.DATE_NAISSANCE_ASSURE_ASSOCIE,
                NOM_ASSURE_ASSOCIE:e.NOM_ASSURE_ASSOCIE,
                LIEN_PARENTE:e.LIEN_PARENTE,
                DATE_SORTIE:e.DATE_SORTIE,
               };
               contracts[contracts.length-1].assures.push(assureInit);     
              }
              if(typeof foundAssureBenef=="undefined"){
                //console.log("on a pa trouver de beneficiaire");
                  let assureBenef={
                    NOM_ASSURE_BENEFICIAIRE:e.NOM_ASSURE_BENEFICIAIRE  
                  };
                  contracts[contracts.length-1].beneficiaires.push(assureBenef);
              }
            }else{
                console.log('c\'est un nouveau contrat');
                contracts.push(initialobj);
            }
        }
        
        
    });
    
 return await contracts;
}; 
apiRouter.route('/infosAssureChapChap/:nom/:prenoms/:datenaissance/:num_police/:identiteU')
.get(cache.route({
    expire:{
        200:604800,//1 semaine
        xxx:1,
    }
}),async(req,res)=>{
    if(req.params.nom==="NONE" && req.params.prenoms==="NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE" && req.params.datenaissance==="NONE"){
        //modification pour renvoyer la liste exhaustive de tous les contrats  
        //@ts-ignore 
        if(isNaN(req.params.num_police) || req.params.num_police.length>8||req.params.num_police<8){
          res.status(400).send({error:"Veuillez re verifier le numero de police"});
      }
        let result;
      let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${parseInt(req.params.num_police,10)}`);
      let sunContract=await contratsReducer(sunContracts);  
      const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE=:d ",{n:sunContract[0].NOM_CLIENT,p:`%${sunContract[0].PRENOMS_CLIENT}%`,d:sunContracts[0].DATE_NAISSANCE}).getOne();          
      const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client!.IDE_CLIENT_UNIQUE}):null;
       sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @IDCLI='${sunContract[0].NUMERO_CLIENT}'`);
      // let notMatchingContract;
      if(client){
          let extranetContrats=await getConnection("extranet").manager.query(`select * from CONTRATS where IDE_CLIENT_UNIQUE=${client!.IDE_CLIENT_UNIQUE}`);
          console.log("extranet length is "+extranetContrats.length);

       for(let i=0;i<extranetContrats.length;i++){
          let found=[];
           console.log("extranet police is "+extranetContrats[i].NUMERO_POLICE);
          for(let j=0;j<sunContracts.length;j++){
              console.log("Both are "+sunContracts[j].POLICE+" of type"+typeof sunContracts[j].POLICE+" and "+extranetContrats[i].NUMERO_POLICE+" of type"+typeof extranetContrats[i].NUMERO_POLICE);
              if(sunContracts[j].POLICE!=extranetContrats[i].NUMERO_POLICE)
              {
                  //@ts-ignore
                  found.push(false);
              }
              else{
                  console.log('going to next');
                  //@ts-ignore
                  found.push(true);
              }
              
          }
          //@ts-ignore
          if(!found.includes(true)){
              
              let otherSunC=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${extranetContrats[i].NUMERO_POLICE}`);
              console.log("nouveau contrat ==>"+otherSunC[0].NUMERO_POLICE);
              sunContracts.push(otherSunC[0]);   
          }
       }
    
      }
       
       sunContract=await contratsReducer(sunContracts); 
      
  
      //remove duplicates from contrats array
  let contrats=sunContract;
      if(contrats){
          result={
              client:{
                  numero_client:sunContracts[0].NUMERO_CLIENT,
                  nom_client:sunContracts[0].NOM_CLIENT,
                  prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                  date_naissance:sunContracts[0].DATE_NAISSANCE,
                  lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                  sexe:typeof client !="undefined"?client.SEXE:null,
                  adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                  telephone:typeof client !="undefined"?client.TELEPHONE:null,
                  telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                  profession:typeof client !="undefined"?client.PROFESSION:null,
                  civilite:typeof client !="undefined"?client.CIVILITE:null,
                  nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                  situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                  lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                  type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                  code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                  code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                  numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                  cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                  identifiant_unique:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.IDE_CLIENT_UNIQUE,  
                  loginchapchap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.LOGIN,
                  email:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.EMAIL,
                  mobile:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.MOBILE,
                  dejaConnecteAChapChap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.ISFIRSTCONNEXION,
                  photo_utilisateur:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.PHOTO_UTILISATEUR,
                  contrats,
  
              
              }
  
          }
      }
     // console.log("voila le resultat");
      //console.dir(result);
      //console.log("voila le client");
      //console.dir(client);
      //await res.json("ok");
      //console.log(JSON.stringify(result));
      return res.json(result);
      }
      return res.json("not working");  
});
apiRouter.route(/*'/infosAssure/:nom/:num_police/'*/'/infosAssure/:nom/:prenoms/:datenaissance/:num_police/:identiteU') // service d'identification du client sur le gestionnare de file d'attente
    .get(async(req, res) => {
        if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance !== "NONE" && req.params.num_police==="NONE" && req.params.identiteU==="NONE"){
            //@ts-ignore
            if(isNaN(req.params.num_police) || req.params.num_police.length>8||req.params.num_police<8){
                res.status(400).send({error:"Veuillew re verifier le numero de police"});
            }
            /* const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
            console.log(`nom ${req.params.nom} police ${req.params.num_police}`);*/
            //const client = await CLIENT_UNIQUE.findOne({NOM_CLIENT:req.params.nom,PRENOMS_CLIENT:Like(`%${req.params.prenoms}%`),DATE_NAISSANCE:req.params.datenaissance });
            const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE = :d",{n:req.params.nom,p:`%${req.params.prenoms}%`,d:req.params.datenaissance}).getOne();
            let result;
            let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @NOM='${req.params.nom}', @PRENOMS='${req.params.prenoms}',@DATENAISS=${parseInt(req.params.datenaissance,10)}`);
           let sunContract=await contratsReducer(sunContracts);
            if (typeof client!="undefined") {
                //console.dir(c);
            //console.dir(client);
            let contrats=sunContract;
            const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client.IDE_CLIENT_UNIQUE}):null;
            if(contrats){
                result={
                    client:{
                        numero_client:sunContracts[0].NUMERO_CLIENT,
                nom_client:sunContracts[0].NOM_CLIENT,
                prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                date_naissance:sunContracts[0].DATE_NAISSANCE,
                lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                sexe:typeof client !="undefined"?client.SEXE:null,
                adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                telephone:typeof client !="undefined"?client.TELEPHONE:null,
                telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                profession:typeof client !="undefined"?client.PROFESSION:null,
                civilite:typeof client !="undefined"?client.CIVILITE:null,
                nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                identifiant_unique:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.IDE_CLIENT_UNIQUE:null,  
                loginchapchap:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.LOGIN:null,
                email:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.EMAIL:null,
                mobile:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.MOBILE:null,
                dejaConnecteAChapChap:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.ISFIRSTCONNEXION:null,
                photo_utilisateur:typeof loginDtails !="undefined"||loginDtails!=null?loginDtails!.PHOTO_UTILISATEUR:null,
                        contrats,

                    
                    }
        
                }
            }
            
            }
            //await res.json("ok");
            //console.log(JSON.stringify(result));
            return  res.json(result);    
          
}
//@ts-ignore
     else if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance !== "NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE"){
        //@ts-ignore
        if(isNaN(req.params.num_police) || req.params.num_police.length>8||req.params.num_police<8){
            res.status(400).send({error:"Veuillew re verifier le numero de police"});
        }        
        const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE = :d",{n:req.params.nom,p:`%${req.params.prenoms}%`,d:req.params.datenaissance}).getOne();

                //console.dir(client);
                let result;
                let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${parseInt(req.params.num_police,10)}, @NOM='${req.params.nom}', @PRENOMS='${req.params.prenoms}',@DATENAISS=${parseInt(req.params.datenaissance,10)}`);
                let sunContract=await contratsReducer(sunContracts);            
                const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client!.IDE_CLIENT_UNIQUE}):null;
            //remove duplicates from contrats array
            let contrats=sunContract;
            if(contrats ){
                result={
                    client:{
                        numero_client:sunContracts[0].NUMERO_CLIENT,
                nom_client:sunContracts[0].NOM_CLIENT,
                prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                date_naissance:sunContracts[0].DATE_NAISSANCE,
                lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                sexe:typeof client !="undefined"?client.SEXE:null,
                adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                telephone:typeof client !="undefined"?client.TELEPHONE:null,
                telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                profession:typeof client !="undefined"?client.PROFESSION:null,
                civilite:typeof client !="undefined"?client.CIVILITE:null,
                nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                identifiant_unique:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.IDE_CLIENT_UNIQUE,  
                loginchapchap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.LOGIN,
                email:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.EMAIL,
                mobile:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.MOBILE,
                dejaConnecteAChapChap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.ISFIRSTCONNEXION,
                photo_utilisateur:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.PHOTO_UTILISATEUR,
                        contrats,

                    
                    }
        
                }
            }
            
            //await res.json("ok");
            //console.log(JSON.stringify(result));
            return  res.json(result);
    }
    //@ts-ignore
    else if(req.params.nom!=="NONE" && req.params.prenoms!=="NONE" && req.params.datenaissance === "NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE"){
        //@ts-ignore
        if(isNaN(req.params.num_police) || req.params.num_police.length>8||req.params.num_police<8){
            res.status(400).send({error:"Veuillew re verifier le numero de police"});
        }
        let result;
        const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p ",{n:req.params.nom,p:`%${req.params.prenoms}%`}).getOne();
        let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${parseInt(req.params.num_police,10)}, @NOM='${req.params.nom}', @PRENOMS='${req.params.prenoms}'`);
        let sunContract=await contratsReducer(sunContracts);            
        const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client!.IDE_CLIENT_UNIQUE}):null;
    //remove duplicates from contrats array
    let contrats=sunContract;
        if(contrats){
            result={
                client:{
                    numero_client:sunContracts[0].NUMERO_CLIENT,
                nom_client:sunContracts[0].NOM_CLIENT,
                prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                date_naissance:sunContracts[0].DATE_NAISSANCE,
                lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                sexe:typeof client !="undefined"?client.SEXE:null,
                adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                telephone:typeof client !="undefined"?client.TELEPHONE:null,
                telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                profession:typeof client !="undefined"?client.PROFESSION:null,
                civilite:typeof client !="undefined"?client.CIVILITE:null,
                nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                identifiant_unique:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.IDE_CLIENT_UNIQUE,  
                loginchapchap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.LOGIN,
                email:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.EMAIL,
                mobile:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.MOBILE,
                dejaConnecteAChapChap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.ISFIRSTCONNEXION,
                photo_utilisateur:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.PHOTO_UTILISATEUR,
                    contrats,

                
                }
    
            }
        }
        
        
        return  res.json(result);
}else if(req.params.nom==="NONE" && req.params.num_police==="NONE" && req.params.datenaissance==='NONE' && req.params.num_police==='NONE' && req.params.identiteU!=="NONE"){
        /*const c = await CONTRATS.findOne({NUMERO_POLICE: req.params.num_police});
        console.log(`nom ${req.params.nom} police ${req.params.num_police}`);*/
    let result;
    if (true) {
        let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @IDCLI=${parseInt(req.params.identiteU,10)}`);
        let sunContract=await contratsReducer(sunContracts);  
        const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE=:d ",{n:sunContract[0].NOM_CLIENT,p:`%${sunContract[0].PRENOMS_CLIENT}%`,d:sunContracts[0].DATE_NAISSANCE}).getOne();          
        const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client!.IDE_CLIENT_UNIQUE}):null;
    //remove duplicates from contrats array
    let contrats=sunContract;
    if(contrats){
        result={
            client:{
                numero_client:sunContracts[0].NUMERO_CLIENT,
                nom_client:sunContracts[0].NOM_CLIENT,
                prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                date_naissance:sunContracts[0].DATE_NAISSANCE,
                lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                sexe:typeof client !="undefined"?client.SEXE:null,
                adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                telephone:typeof client !="undefined"?client.TELEPHONE:null,
                telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                profession:typeof client !="undefined"?client.PROFESSION:null,
                civilite:typeof client !="undefined"?client.CIVILITE:null,
                nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                identifiant_unique:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.IDE_CLIENT_UNIQUE,  
                loginchapchap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.LOGIN,
                email:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.EMAIL,
                mobile:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.MOBILE,
                dejaConnecteAChapChap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.ISFIRSTCONNEXION,
                photo_utilisateur:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.PHOTO_UTILISATEUR,
                contrats,

            
            }

        }
    }
    
    }
    //await res.json("ok");
    //console.log(JSON.stringify(result));
    return res.json(result);
    }else if(req.params.nom==="NONE" && req.params.prenoms==="NONE" && req.params.num_police!=="NONE" && req.params.identiteU==="NONE" && req.params.datenaissance==="NONE"){
      //modification pour renvoyer la liste exhaustive de tous les contrats  
      //@ts-ignore 
      if(isNaN(req.params.num_police) || req.params.num_police.length>8||req.params.num_police<8){
        res.status(400).send({error:"Veuillez re verifier le numero de police"});
    }
      let result;
    let sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${parseInt(req.params.num_police,10)}`);
    let sunContract=await contratsReducer(sunContracts);  
    const client=await getConnection('extranet').getRepository(CLIENT_UNIQUE).createQueryBuilder("client").where("client.NOM_CLIENT= :n and client.PRENOMS_CLIENT like :p and client.DATE_NAISSANCE=:d ",{n:sunContract[0].NOM_CLIENT,p:`%${sunContract[0].PRENOMS_CLIENT}%`,d:sunContracts[0].DATE_NAISSANCE}).getOne();          
    const loginDtails=typeof client !="undefined"?await getConnection('extranet').getRepository(UTILISATEUR).findOne({IDE_CLIENT_UNIQUE: client!.IDE_CLIENT_UNIQUE}):null;
     sunContracts=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @IDCLI='${sunContract[0].NUMERO_CLIENT}'`);
    // let notMatchingContract;
    if(client){
        let extranetContrats=await getConnection("extranet").manager.query(`select* from CONTRATS where IDE_CLIENT_UNIQUE=${client!.IDE_CLIENT_UNIQUE}`);
        console.log("extranet length is "+extranetContrats.length);
     for(let i=0;i<extranetContrats.length;i++){
        let found=[];
         console.log("extranet police is "+extranetContrats[i].NUMERO_POLICE);
        for(let j=0;j<sunContracts.length;j++){
            console.log("Both are "+sunContracts[j].POLICE+" of type"+typeof sunContracts[j].POLICE+" and "+extranetContrats[i].NUMERO_POLICE+" of type"+typeof extranetContrats[i].NUMERO_POLICE);
            if(sunContracts[j].POLICE!=extranetContrats[i].NUMERO_POLICE)
            {
                //@ts-ignore
                found.push(false);
            }
            else{
                console.log('going to next');
                //@ts-ignore
                found.push(true);
            }
            
        }
        //@ts-ignore
        if(!found.includes(true)){
              
            let otherSunC=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${extranetContrats[i].NUMERO_POLICE}`);
            console.log("nouveau contrat ==>"+otherSunC[0].NUMERO_POLICE);
            sunContracts.push(otherSunC[0]);   
        }
     }
    /* let otherSunC=await getConnection("sunshine").manager.query(`exec dbo.wsi_infos_assures @POLICE=${notMatchingContract.NUMERO_POLICE}`);
     console.dir(otherSunC);

     sunContracts.push(otherSunC);*/
    }
     
     sunContract=await contratsReducer(sunContracts); 
    

    //remove duplicates from contrats array
let contrats=sunContract;
    if(contrats){
        result={
            client:{
                numero_client:sunContracts[0].NUMERO_CLIENT,
                nom_client:sunContracts[0].NOM_CLIENT,
                prenoms_client:sunContracts[0].PRENOMS_CLIENT,
                date_naissance:sunContracts[0].DATE_NAISSANCE,
                lieu_naissance:typeof client !="undefined"?client.LIEU_NAISSANCE:null,
                sexe:typeof client !="undefined"?client.SEXE:null,
                adresse_postale:typeof client !="undefined"?client.ADRESSE_POSTALE:null,
                telephone:typeof client !="undefined"?client.TELEPHONE:null,
                telephone1:typeof client !="undefined"?client.TELEPHONE_1:null,
                profession:typeof client !="undefined"?client.PROFESSION:null,
                civilite:typeof client !="undefined"?client.CIVILITE:null,
                nationalite:typeof client !="undefined"?client.NATIONALITE:null,
                situation_matrimoniale:typeof client !="undefined"?client.SITUATION_MATRIMONIALE:null,
                lieu_habitation:typeof client !="undefined"?client.LIEU_HABITATION:null,
                type_client:typeof client !="undefined"?client.TYPE_CLIENT:null,
                code_banque:typeof client !="undefined"?client.CODE_BANQUE:null,
                code_agence:typeof client !="undefined"?client.CODE_AGENCE:null,
                numero_compte:typeof client !="undefined"?client.NUMERO_DE_COMPTE:null,
                cle_rib:typeof client !="undefined"?client.CLE_RIB:null,
                identifiant_unique:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.IDE_CLIENT_UNIQUE,  
                loginchapchap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.LOGIN,
                email:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.EMAIL,
                mobile:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.MOBILE,
                dejaConnecteAChapChap:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.ISFIRSTCONNEXION,
                photo_utilisateur:typeof loginDtails =="undefined"||!loginDtails?null:loginDtails!.PHOTO_UTILISATEUR,
                contrats,

            
            }

        }
    }
    console.log("voila le resultat");
    console.dir(result);
    console.log("voila le client");
    console.dir(client);
    //await res.json("ok");
    //console.log(JSON.stringify(result));
    return res.json(result);
    }
    return res.json("not working");

});
//WS garantie police
apiRouter.route('/garantiePolice/:num_police').get(async(req,res)=>{
    let result;
    if(req.params.num_police){
        let garantie=await getConnection("sunshine").manager.query(`exec dbo.WSI_details_garanties_police @POLICE=${parseInt(req.params.num_police,10)}`);
        result=garantie;
    }else{
        result={
            error:"not working"
        }
    }
    result?res.json(result):res.json("not working");
});
//WS impayes du mois en cours
apiRouter.route('/monthlyImpaye/').get(async(req,res)=>{
    let result;
    
        let impayes=await getConnection("sunshine").manager.query(`exec dbo.wsi_imp_envoi`);
        result=impayes;
    
    result?res.json(result):res.json({error:"not working"});
});
//WS BORNE DISPOREG
apiRouter.route('/etatCotisation/:num_police').get(cache.route({
    expire:{
        200:604800,//une semaine
        xxx:1,
    }
}),async(req,res)=>{
    let result;
    let query=`exec dbo.wsi_cotisation @POLICE=${req.params.num_police}`;
    let etatCotisation=await getConnection("sunshine").manager.query(query);
    if(etatCotisation.length>0){
        console.log("getting etat de cotisation de police "+req.params.num_police);
        //console.dir(etatCotisation);
        let cotisations:any=[];
        etatCotisation.forEach((e:any,i:any,arr)=>{
            let final={
                "CodeEtat": 100,
                "DateComptable": e.DATE_COMPTABLE,
                "DateQuittance": e.DATE_QUITTANCE,
                "DebutPeriode": e.PERIODE_QUITTANCE,
                "EcheanceAvanceImpaye": 0,
                "EtatQuittance": e.ETAT_QUITTANCE=="SOLDEES"?"Soldée":e.ETAT_QUITTANCE=="IMPAYE EN ATTENTE RETOUR BANQUE"?"Attente retour banque":"Impayé",
                "FinPeriode": e.PERIODE_FIN_QUITTANCE,
                "FraisRejet": 0,
                "MontantCotise": e.ETAT_QUITTANCE=="SOLDEES"?parseInt(e.PRIME):0,
                "MontantEcheanceAvance": 0,
                "MontantEmis": parseInt(e.PRIME),
                "MontantEncaisse": e.ETAT_QUITTANCE=="SOLDEES"?parseInt(e.PRIME):0,
                "MontantImpaye": e.ETAT_QUITTANCE=="IMPAYE EN ATTENTE RETOUR BANQUE"||e.ETAT_QUITTANCE=="IMPAYES"?parseInt(e.MONTANT_IMPAYES):0,
                "MontantPrime": parseInt(e.PRIME),
                "MontantRegularise": 0,
                "NombreQuittanceImpayee": 0,
                "NombreQuittanceSoldee": 0,
                "NumeroQuittance": parseInt(e.QUITTANCE),
                "PrimePeriodique": parseInt(e.PRIME)
            };
            cotisations.push(final);
        });
        let finalObj={
            "CodeErreur":null,
            "Message":null,
            "Assure":{
                "CodeErreur":null,
                "Message":null,
                "AdressePostale":etatCotisation[etatCotisation.length-1].ADRESSE_CLIENT,
                "Civilite":etatCotisation[etatCotisation.length-1].CIVILITE_SOUSCRIPTEUR,
                "DateNaissance":etatCotisation[etatCotisation.length-1].DATE_NAISSANCE_CLIENT,
                "Identifiant":etatCotisation[etatCotisation.length-1].NUMERO_SOUSCRIPTEUR,
                "Nom": `${etatCotisation[etatCotisation.length-1].NOM_SOUSCRIPTEUR} ${etatCotisation[etatCotisation.length-1].PRENOMS}`,
                "Numero": etatCotisation[etatCotisation.length-1].NUMERO_SOUSCRIPTEUR.toString(),
                "Prenoms": null,
                "Profession": etatCotisation[etatCotisation.length-1].PROFESSION_CLIENT,
                "Telephone": etatCotisation[etatCotisation.length-1].TELEPHONE_CLIENT
            },
            "Contrat":{
                "CodeErreur": null,
                "Message": null,
                "CodeFiliale": "CI_VIE",
                "CodePaiement": etatCotisation[etatCotisation.length-1].MODE_REGLEMENT.toString().substring(0,1),
                "CodeProduit": etatCotisation[etatCotisation.length-1].NUMEROPOLICE.toString().substring(0,3),
                "Cotisations":cotisations,
                "DateDemande":moment().format("DD/MM/YYYY"),
                "Fractionnement":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="MENSUELLE"?"MENSUEL":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="TRIMESTRIELLE"?"TRIMESTRIEL":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="SEMESTRIELLE"?"SEMESTRIEL":"ANNUEL",
                "LibelleProduit":etatCotisation[etatCotisation.length-1].LIBELLEPRODUIT,
                "ModeReglement":etatCotisation[etatCotisation.length-1].MODE_REGLEMENT,
                "NombreQuittanceImpayees":parseInt(etatCotisation[etatCotisation.length-1].NOMBRE_IMPAYES),
                "NombreQuittanceSoldees":parseInt(etatCotisation[etatCotisation.length-1].NOMBRE_SOLDEES),
                "NumeroPolice":parseInt(etatCotisation[etatCotisation.length-1].NUMEROPOLICE),
                "Periodicite":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="MENSUELLE"?"MENSUEL":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="TRIMESTRIELLE"?"TRIMESTRIEL":etatCotisation[etatCotisation.length-1].FRACTIONNEMENT=="SEMESTRIELLE"?"SEMESTRIEL":"ANNUEL",
                "TotalEcheanceAvance":0,
                "TotalMontantCotise":parseInt(etatCotisation[etatCotisation.length-1].MONTANT_SOLDEES),
                "TotalMontantEncaisse":parseInt(etatCotisation[etatCotisation.length-1].MONTANT_SOLDEES),
                "TotalMontantImpaye":parseInt(etatCotisation[etatCotisation.length-1].MONTANT_IMPAYES)
            },
            "Payeur":{
                "CodeErreur":null,
                "Message":null,
                "AdressePostale":etatCotisation[etatCotisation.length-1].ADDRESSE_PAYEUR,
                "Civilite":etatCotisation[etatCotisation.length-1].CIVILITE_PAYEUR,
                "DateNaissance":null,
                "Identifiant":null,
                "LieuNaissance":null,
                "Nom":etatCotisation[etatCotisation.length-1].NOM_PAYEUR,
                "Numero":etatCotisation[etatCotisation.length-1].NUMERO_PAYEUR.toString(),
                "Prenoms":etatCotisation[etatCotisation.length-1].PRENOMS_PAYEUR,
                "Profession":etatCotisation[etatCotisation.length-1].PROFESSION_PAYEUR,
                "Telephone":etatCotisation[etatCotisation.length-1].TELEPHONE_PAYEUR,
            },
            "Souscripteur":{
                "CodeErreur":null,
                "Message":null,
                "AdressePostale":etatCotisation[etatCotisation.length-1].ADDRESSE_CLIENT,
                "Civilite":etatCotisation[etatCotisation.length-1].CIVILITE_SOUSCRIPTEUR,
                "DateNaissance":etatCotisation[etatCotisation.length-1].DATE_NAISSANCE_CLIENT,
                "Identifiant":null,
                "LieuNaissance":etatCotisation[etatCotisation.length-1].LIEU_NAISSANCE_CLIENT,
                "Nom":etatCotisation[etatCotisation.length-1].NOM_SOUSCRIPTEUR,
                "Numero":etatCotisation[etatCotisation.length-1].NUMERO_SOUSCRIPTEUR.toString(),
                "Prenoms":etatCotisation[etatCotisation.length-1].PRENOMS,
                "Profession":etatCotisation[etatCotisation.length-1].PROFESSION_CLIENT,
                "Telephone":etatCotisation[etatCotisation.length-1].TELEPHONE_CLIENT,
            }
            
        }
        result=finalObj;
        console.dir(result);
        return res.status(200).json(result);
    }
    // result= await axios.get(`http://nsia-sun-app:5000/production/ServiceSunshine.svc/etatcotisation?pol=${req.params.num_police}`);
    // console.dir(result);
    // return res.json(result.data);
    result={
        error:"could not request for this police"
    }
    return res.json(result);
});
apiRouter.route('/dispoRgt/:num_police').get(cache.route({
    expire:{
        200:18000,//5 heures
        xxx:1,
    }
}),async(req,res)=>{
        let result;
        result =await axios.get(`http://${process.env.NGINXHOST?process.env.NGINXHOST:'10.11.100.48:4000'}/statutRgt/${req.params.num_police}/NONE/NONE/NO/NONE`);
       let final;
       console.dir(result.data);
        if(Array.isArray(result.data)){
            console.log("longueur est:"+result.data.length)
            let i=0;
            let cumulM=0;
            let ndx=0;
            result.data.map((e:any,ind:any,arr)=>{
                console.log("in map")
                if(e.statut=="PRET"){
                    i++;
                    ndx=ind;
                    cumulM+=e.montant;
                  }
                  
            });
            if(i>1){
                final={
                    "CodeErreur":null,
                    "Message":null,
                    "ElementDispositionReglement":[
                        {
                            "MessageDispositionReglement":result.data[0].NOM_BENEFICIAIRE
                        },{
                            "MessageDispositionReglement":`Vos ${i} règlements sur la police ${result.data.police} d'un montant cumulé de ${cumulM.toFixed(3)} FCFA est disponible.`
                        }
                    ],
                };
            }else{
                final={
                    "CodeErreur":null,
                    "Message":null,
                    "ElementDispositionReglement":[
                        {
                            "MessageDispositionReglement":result.data[0].NOM_BENEFICIAIRE
                        },{
                            "MessageDispositionReglement":`Vos règlements sur la police ${result.data[ndx].police} d'un montant de ${result.data[ndx].montant.toFixed(3)} FCFA est disponible depuis le ${moment(result.data[ndx].date_recep_sign_reg).format("DD/MM/YYYY")}.`
                        }
                    ],
                };
            }
            return res.status(200).json(final);
        }else{
            final={
                "CodeErreur":null,
                "Message":null,
                "ElementDispositionReglement":[
                    {
                        "MessageDispositionReglement":""
                    },{
                        "MessageDispositionReglement":`Cher client vous n'avez pas de règlement disponible.`
                    }
                ],
            };
            return res.status(200).json(final);
        }
});
//WS Reglement
//@ts-ignore
apiRouter.route('/statutRgt/:num_police/:num_rgt/:domaine/:full/:offset').get(cache.route({
    expire:{
        200:18000,//5 heures
        xxx:1,
    }
}),async(req,res)=>{
    let result;
   const limite=100;
    if(req.params.num_police!=="NONE" && req.params.num_rgt==="NONE" && req.params.domaine==="NONE" && req.params.full!=="NONE" && req.params.offset==="NONE" ){
       //@ts-ignore
        if(isNaN(req.params.num_police)|| req.params.num_police.length>8){
            result={
                error:"bad police number "
            };
            res.json(result);
        }else{
            if(req.params.full==="NO" ){
                //on affiche la version simple recuperer de exp.regdispo
                let query=``;
                let q1=`select wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
        from exp.regdispo where wnupo=${parseInt(req.params.num_police,10)}`;
        let r1=await getConnection("sunshine").manager.query(q1);
        if(typeof r1[0] !="undefined"){
            switch(r1[0].domaine){
                case "I":
                query=`WITH TP AS (select wnrgt as Numero_reglement,
                    wnupo as police,
                    nom_beneficiaire,
                    date_depot_treso,
                    date_sort_treso,
                    date_depot_sign,
                    date_recep_sign_reg,
                    date_retrait_reg,
                    dateRDV,
                    Num_envoi,
                    statut_reg_retirer as statut,
                    domaine,redac,
                    MNTGT as montant,MRGGT as mode_reglement
                    from exp.regdispo where wnupo=${parseInt(req.params.num_police,10)})
                    SELECT * FROM TP X JOIN (SELECT  
                        SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                        ,A.WASRG NUMERO_BENEFICIAIRE
                        ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                        ,LIBSD LIBELLE_SINISTRE
                        ,WNUSI NUMERO_SINISTRE
                        ,A.WNRGT NUMERO_REGLEMENT
                        ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                        ,A.WNDCSI DECOMPTE
                        ,B.WNUPO POLICE
                        ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                        ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                        ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                        ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                        ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                        ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                        WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                        WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                        WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                        WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                        WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                        WHEN'DEMD'THEN'DEMD - Suite à demande'
                        WHEN'DEXC'THEN'DEXC - Décès exclusion'
                        WHEN'EXON'THEN'EXON - Exonération'
                        WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                        WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                        WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                        WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                        WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                        WHEN'LIC'THEN'LIC - Licenciement'
                        WHEN'POLI'THEN'POLI - Pollicitation'
                        WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                        WHEN'RBAV'THEN'RBAV - Rembousement avance'
                        WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                        WHEN'RENT'THEN'RENT - Transformation en rente'
                        WHEN'RETR'THEN'RETR - Retraite'
                        WHEN'TASB'THEN'TASB - Tirage au sort'
                        WHEN'TERM'THEN'TERM - Arrivée au terme'
                        WHEN'TRPM'THEN'TRPM - Transfert PM'
                        ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                        , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                            WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                            WHEN	'D'	THEN 	'DECES'
                                                            WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                            WHEN	'F'	THEN 	'RENTE TERME'
                                                            WHEN	'H'	THEN 	'RENTE TERME'
                                                            WHEN	'I'	THEN 	'INCAPACITES'
                                                            WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                            WHEN	'V'	THEN 	'INVALIDITES'
                                        ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                            FROM NSIACIF.JAREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                            JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                            LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                            OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                            JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                            LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                        WHERE 0=0 
                        AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
                ON XX.NUMERO_REGLEMENT = X.Numero_reglement`;
                break;
                case "G":
                query=`WITH TP AS (select wnrgt as Numero_reglement,
                    wnupo as police,
                    nom_beneficiaire,
                    date_depot_treso,
                    date_sort_treso,
                    date_depot_sign,
                    date_recep_sign_reg,
                    date_retrait_reg,
                    dateRDV,
                    Num_envoi,
                    statut_reg_retirer as statut,
                    domaine,redac,
                    MNTGT as montant,MRGGT as mode_reglement
                    from exp.regdispo where wnupo=${parseInt(req.params.num_police,10)})
                    SELECT * FROM TP X JOIN (SELECT  
                        SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                        ,A.WASRG NUMERO_BENEFICIAIRE
                        ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                        ,LIBSD LIBELLE_SINISTRE
                        ,WNUSI NUMERO_SINISTRE
                        ,A.WNRGT NUMERO_REGLEMENT
                        ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                        ,A.WNDCSI DECOMPTE
                        ,B.WNUPO POLICE
                        ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                        ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                        ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                        ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                        ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                        ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                        WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                        WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                        WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                        WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                        WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                        WHEN'DEMD'THEN'DEMD - Suite à demande'
                        WHEN'DEXC'THEN'DEXC - Décès exclusion'
                        WHEN'EXON'THEN'EXON - Exonération'
                        WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                        WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                        WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                        WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                        WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                        WHEN'LIC'THEN'LIC - Licenciement'
                        WHEN'POLI'THEN'POLI - Pollicitation'
                        WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                        WHEN'RBAV'THEN'RBAV - Rembousement avance'
                        WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                        WHEN'RENT'THEN'RENT - Transformation en rente'
                        WHEN'RETR'THEN'RETR - Retraite'
                        WHEN'TASB'THEN'TASB - Tirage au sort'
                        WHEN'TERM'THEN'TERM - Arrivée au terme'
                        WHEN'TRPM'THEN'TRPM - Transfert PM'
                        ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                        , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                            WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                            WHEN	'D'	THEN 	'DECES'
                                                            WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                            WHEN	'F'	THEN 	'RENTE TERME'
                                                            WHEN	'H'	THEN 	'RENTE TERME'
                                                            WHEN	'I'	THEN 	'INCAPACITES'
                                                            WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                            WHEN	'V'	THEN 	'INVALIDITES'
                                        ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                            FROM NSIACIF.JPREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                            JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                            LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                            OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                            JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                            LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                        WHERE 0=0 
                        AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
                ON XX.NUMERO_REGLEMENT = X.Numero_reglement`;
                break;
                case "R":
                query=`WITH TP AS (select wnrgt as Numero_reglement,
                    wnupo as police,
                    nom_beneficiaire,
                    date_depot_treso,
                    date_sort_treso,
                    date_depot_sign,
                    date_recep_sign_reg,
                    date_retrait_reg,
                    dateRDV,
                    Num_envoi,
                    statut_reg_retirer as statut,
                    domaine,redac,
                    MNTGT as montant,MRGGT as mode_reglement
                    from exp.regdispo where wnupo=${parseInt(req.params.num_police,10)})
                    SELECT * FROM TP X JOIN (SELECT  
                        SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                        ,A.WASRG NUMERO_BENEFICIAIRE
                        ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                        ,LIBSD LIBELLE_SINISTRE
                        ,WNUSI NUMERO_SINISTRE
                        ,A.WNRGT NUMERO_REGLEMENT
                        ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                        ,A.WNDCSI DECOMPTE
                        ,B.WNUPO POLICE
                        ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                        ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                        ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                        ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                        ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                        ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                        WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                        WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                        WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                        WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                        WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                        WHEN'DEMD'THEN'DEMD - Suite à demande'
                        WHEN'DEXC'THEN'DEXC - Décès exclusion'
                        WHEN'EXON'THEN'EXON - Exonération'
                        WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                        WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                        WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                        WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                        WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                        WHEN'LIC'THEN'LIC - Licenciement'
                        WHEN'POLI'THEN'POLI - Pollicitation'
                        WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                        WHEN'RBAV'THEN'RBAV - Rembousement avance'
                        WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                        WHEN'RENT'THEN'RENT - Transformation en rente'
                        WHEN'RETR'THEN'RETR - Retraite'
                        WHEN'TASB'THEN'TASB - Tirage au sort'
                        WHEN'TERM'THEN'TERM - Arrivée au terme'
                        WHEN'TRPM'THEN'TRPM - Transfert PM'
                        ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                        , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                            WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                            WHEN	'D'	THEN 	'DECES'
                                                            WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                            WHEN	'F'	THEN 	'RENTE TERME'
                                                            WHEN	'H'	THEN 	'RENTE TERME'
                                                            WHEN	'I'	THEN 	'INCAPACITES'
                                                            WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                            WHEN	'V'	THEN 	'INVALIDITES'
                                        ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                            FROM NSIACIF.JRREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                            JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                            LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                            OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                            JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                            LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                        WHERE 0=0 
                        AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
                ON XX.NUMERO_REGLEMENT = X.Numero_reglement`;
                break;
                default:
                    result={
                        error:"bad police"
                    };
                    return res.json(result);
    
            }
        }else{
            result={
                error:"bad police"
            };
            return res.json(result);
        }
        
                
                result=await getConnection("sunshine").manager.query(query);
                return res.json(result);

            }else if(req.params.full==="YES"){
                let domaineQueries=[`
                    WITH TP AS (select wnrgt as Numero_reglement,
                        wnupo as police,
                        nom_beneficiaire,
                        date_depot_treso,
                        date_sort_treso,
                        date_depot_sign,
                        date_recep_sign_reg,
                        date_retrait_reg,
                        dateRDV,
                        Num_envoi,
                        statut_reg_retirer as statut,
                        domaine,redac,
                        MNTGT as montant,MRGGT as mode_reglement
                from exp.regdispo where domaine = 'I' and wnupo=${parseInt(req.params.num_police,10)})
                SELECT * FROM TP X JOIN (SELECT  
                    SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                    ,A.WASRG NUMERO_BENEFICIAIRE
                    ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                    ,LIBSD LIBELLE_SINISTRE
                    ,WNUSI NUMERO_SINISTRE
                    ,A.WNRGT NUMERO_REGLEMENT
                    ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                    ,A.WNDCSI DECOMPTE
                    ,B.WNUPO POLICE
                    ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                    ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                    ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                    ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                    ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                    ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                    WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                    WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                    WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                    WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                    WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                    WHEN'DEMD'THEN'DEMD - Suite à demande'
                    WHEN'DEXC'THEN'DEXC - Décès exclusion'
                    WHEN'EXON'THEN'EXON - Exonération'
                    WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                    WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                    WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                    WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                    WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                    WHEN'LIC'THEN'LIC - Licenciement'
                    WHEN'POLI'THEN'POLI - Pollicitation'
                    WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                    WHEN'RBAV'THEN'RBAV - Rembousement avance'
                    WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                    WHEN'RENT'THEN'RENT - Transformation en rente'
                    WHEN'RETR'THEN'RETR - Retraite'
                    WHEN'TASB'THEN'TASB - Tirage au sort'
                    WHEN'TERM'THEN'TERM - Arrivée au terme'
                    WHEN'TRPM'THEN'TRPM - Transfert PM'
                    ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                    , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                        WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                        WHEN	'D'	THEN 	'DECES'
                                                        WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                        WHEN	'F'	THEN 	'RENTE TERME'
                                                        WHEN	'H'	THEN 	'RENTE TERME'
                                                        WHEN	'I'	THEN 	'INCAPACITES'
                                                        WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                        WHEN	'V'	THEN 	'INVALIDITES'
                                    ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                        FROM NSIACIF.JAREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                        JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                        LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                        OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                        JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                        LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                    WHERE 0=0 
                    AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
            ON XX.NUMERO_REGLEMENT = X.Numero_reglement
                    `,`
                    WITH TP AS (select wnrgt as Numero_reglement,
                        wnupo as police,
                        nom_beneficiaire,
                        date_depot_treso,
                        date_sort_treso,
                        date_depot_sign,
                        date_recep_sign_reg,
                        date_retrait_reg,
                        dateRDV,
                        Num_envoi,
                        statut_reg_retirer as statut,
                        domaine,redac,
                        MNTGT as montant,MRGGT as mode_reglement
                from exp.regdispo where domaine = 'G' and wnupo=${parseInt(req.params.num_police,10)})
                SELECT * FROM TP X JOIN (SELECT  
                    SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                    ,A.WASRG NUMERO_BENEFICIAIRE
                    ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                    ,LIBSD LIBELLE_SINISTRE
                    ,WNUSI NUMERO_SINISTRE
                    ,A.WNRGT NUMERO_REGLEMENT
                    ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                    ,A.WNDCSI DECOMPTE
                    ,B.WNUPO POLICE
                    ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                    ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                    ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                    ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                    ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                    ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                    WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                    WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                    WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                    WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                    WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                    WHEN'DEMD'THEN'DEMD - Suite à demande'
                    WHEN'DEXC'THEN'DEXC - Décès exclusion'
                    WHEN'EXON'THEN'EXON - Exonération'
                    WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                    WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                    WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                    WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                    WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                    WHEN'LIC'THEN'LIC - Licenciement'
                    WHEN'POLI'THEN'POLI - Pollicitation'
                    WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                    WHEN'RBAV'THEN'RBAV - Rembousement avance'
                    WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                    WHEN'RENT'THEN'RENT - Transformation en rente'
                    WHEN'RETR'THEN'RETR - Retraite'
                    WHEN'TASB'THEN'TASB - Tirage au sort'
                    WHEN'TERM'THEN'TERM - Arrivée au terme'
                    WHEN'TRPM'THEN'TRPM - Transfert PM'
                    ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                    , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                        WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                        WHEN	'D'	THEN 	'DECES'
                                                        WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                        WHEN	'F'	THEN 	'RENTE TERME'
                                                        WHEN	'H'	THEN 	'RENTE TERME'
                                                        WHEN	'I'	THEN 	'INCAPACITES'
                                                        WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                        WHEN	'V'	THEN 	'INVALIDITES'
                                    ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                        FROM NSIACIF.JPREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                        JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                        LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                        OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                        JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                        LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                    WHERE 0=0 
                    AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
            ON XX.NUMERO_REGLEMENT = X.Numero_reglement
                    `,
                    `
                    WITH TP AS (select wnrgt as Numero_reglement,
                        wnupo as police,
                        nom_beneficiaire,
                        date_depot_treso,
                        date_sort_treso,
                        date_depot_sign,
                        date_recep_sign_reg,
                        date_retrait_reg,
                        dateRDV,
                        Num_envoi,
                        statut_reg_retirer as statut,
                        domaine,redac,
                        MNTGT as montant,MRGGT as mode_reglement
                from exp.regdispo where domaine = 'R' and wnupo=${parseInt(req.params.num_police,10)})
                SELECT * FROM TP X JOIN (SELECT  
                    SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
                    ,A.WASRG NUMERO_BENEFICIAIRE
                    ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
                    ,LIBSD LIBELLE_SINISTRE
                    ,WNUSI NUMERO_SINISTRE
                    ,A.WNRGT NUMERO_REGLEMENT
                    ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
                    ,A.WNDCSI DECOMPTE
                    ,B.WNUPO POLICE
                    ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
                    ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
                    ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
                    ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
                    ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
                    ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
                    WHEN'DCM'THEN'DCM - Décès suite à Maladie'
                    WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
                    WHEN'DCTC'THEN'DCTC - Décès toutes causes'
                    WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
                    WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
                    WHEN'DEMD'THEN'DEMD - Suite à demande'
                    WHEN'DEXC'THEN'DEXC - Décès exclusion'
                    WHEN'EXON'THEN'EXON - Exonération'
                    WHEN'FRMJ'THEN'FRMJ - Force Majeure'
                    WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
                    WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
                    WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
                    WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
                    WHEN'LIC'THEN'LIC - Licenciement'
                    WHEN'POLI'THEN'POLI - Pollicitation'
                    WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
                    WHEN'RBAV'THEN'RBAV - Rembousement avance'
                    WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
                    WHEN'RENT'THEN'RENT - Transformation en rente'
                    WHEN'RETR'THEN'RETR - Retraite'
                    WHEN'TASB'THEN'TASB - Tirage au sort'
                    WHEN'TERM'THEN'TERM - Arrivée au terme'
                    WHEN'TRPM'THEN'TRPM - Transfert PM'
                    ELSE JASINAP_NATSA END) CAUSE_SINISTRE
                    , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                        WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                        WHEN	'D'	THEN 	'DECES'
                                                        WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                        WHEN	'F'	THEN 	'RENTE TERME'
                                                        WHEN	'H'	THEN 	'RENTE TERME'
                                                        WHEN	'I'	THEN 	'INCAPACITES'
                                                        WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                        WHEN	'V'	THEN 	'INVALIDITES'
                                    ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                        FROM NSIACIF.JRREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                        JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                        LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                        OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                        JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                        LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
                    WHERE 0=0 
                    AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
            ON XX.NUMERO_REGLEMENT = X.Numero_reglement
                    `
                ];
            
                
                result= domaineQueries.map((q,i)=>{
                    return getConnection("sunshine").manager.query(q);
            });
                res.json(await Promise.all(result));     
         
            }else{
                result={
                    error:"veuillez fournir soit NO ou YES au service"
                };
            }
            
            
        }
    }
    else if(req.params.num_police==="NONE" && req.params.num_rgt!=="NONE" && req.params.domaine!=="NONE" && req.params.full==="NONE" && req.params.offset==="NONE"){
        if(req.params.domaine!=="I"&&req.params.domaine!=="G"&&req.params.domaine!=="R"){
            //@ts-ignore
            result={
                error:"bad domain parameter "+req.params.domaine
            };
            //@ts-ignore
            return res.json(result);
        }
        //@ts-ignore
        if(isNaN(req.params.num_rgt)){
            result={
                error:"bad num_rgt parameter"
            };
            return res.json(result);
        }
        let domaineTable=req.params.domaine==="I"?"JAREGTP":req.params.domaine==="G"?"JPREGTP":"JRREGTP";
        let query=`
        WITH TP AS (select wnrgt as Numero_reglement,
            wnupo as police,
            nom_beneficiaire,
            date_depot_treso,
            date_sort_treso,
            date_depot_sign,
            date_recep_sign_reg,
            date_retrait_reg,
            dateRDV,
            Num_envoi,
            statut_reg_retirer as statut,
            domaine,redac,
            MNTGT as montant,MRGGT as mode_reglement
     from exp.regdispo where domaine = '${req.params.domaine}' and wnrgt=${parseInt(req.params.num_rgt,10)})
     SELECT * FROM TP X JOIN (SELECT  
        SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
        ,A.WASRG NUMERO_BENEFICIAIRE
        ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
        ,LIBSD LIBELLE_SINISTRE
        ,WNUSI NUMERO_SINISTRE
        ,A.WNRGT NUMERO_REGLEMENT
        ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
        ,A.WNDCSI DECOMPTE
        ,B.WNUPO POLICE
        ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
        ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
        ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
        ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
        ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
        ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
        WHEN'DCM'THEN'DCM - Décès suite à Maladie'
        WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
        WHEN'DCTC'THEN'DCTC - Décès toutes causes'
        WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
        WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
        WHEN'DEMD'THEN'DEMD - Suite à demande'
        WHEN'DEXC'THEN'DEXC - Décès exclusion'
        WHEN'EXON'THEN'EXON - Exonération'
        WHEN'FRMJ'THEN'FRMJ - Force Majeure'
        WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
        WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
        WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
        WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
        WHEN'LIC'THEN'LIC - Licenciement'
        WHEN'POLI'THEN'POLI - Pollicitation'
        WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
        WHEN'RBAV'THEN'RBAV - Rembousement avance'
        WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
        WHEN'RENT'THEN'RENT - Transformation en rente'
        WHEN'RETR'THEN'RETR - Retraite'
        WHEN'TASB'THEN'TASB - Tirage au sort'
        WHEN'TERM'THEN'TERM - Arrivée au terme'
        WHEN'TRPM'THEN'TRPM - Transfert PM'
        ELSE JASINAP_NATSA END) CAUSE_SINISTRE
        , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                              WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                              WHEN	'D'	THEN 	'DECES'
                                              WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                              WHEN	'F'	THEN 	'RENTE TERME'
                                              WHEN	'H'	THEN 	'RENTE TERME'
                                              WHEN	'I'	THEN 	'INCAPACITES'
                                              WHEN	'R'	THEN 	'RACHAT TOTAL'
                                              WHEN	'V'	THEN 	'INVALIDITES'
                        ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
				               FROM NSIACIF.${domaineTable} A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                               JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                               LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                               OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                               JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                               LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
        WHERE 0=0 
        AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
ON XX.NUMERO_REGLEMENT = X.Numero_reglement
        `;
        let rgt=await getConnection("sunshine").manager.query(query);
        result=rgt[0];
        return res.json(result);
    }else if(req.params.num_police==="NONE" && req.params.num_rgt!=="NONE" && req.params.domaine==="NONE" && req.params.full==="NONE" && req.params.offset==="NONE"){
        let domaineQueries=[`
            WITH TP AS (select wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
         from exp.regdispo where domaine = 'I' and wnrgt=${parseInt(req.params.num_rgt,10)})
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JAREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement
            `,`
            WITH TP AS (select wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
         from exp.regdispo where domaine = 'G' and wnrgt=${parseInt(req.params.num_rgt,10)})
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JPREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement
            `,
            `
            WITH TP AS (select wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
         from exp.regdispo where domaine = 'R' and wnrgt=${parseInt(req.params.num_rgt,10)})
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JRREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement
            `
        ];
        //@ts-ignore
        if(isNaN(req.params.num_rgt)){
            result={
                error:"bad num_rgt parameter"
            };
            return res.json(result);
        }else{
            let p= domaineQueries.map((q,i)=>{
                return getConnection("sunshine").manager.query(q);
           });
             res.json(await Promise.all(p));    
         
        }
    }else if(req.params.num_police==="NONE" && req.params.num_rgt==="NONE" && req.params.domaine==="NONE" && req.params.full==="NONE" && req.params.offset!=="NONE"){
        let domaineQueries=[`
        WITH TP AS (
            select
            ROW_NUMBER() OVER(ORDER BY date_depot_treso) as rowno, 
            wnrgt as Numero_reglement,
            wnupo as police,
            nom_beneficiaire,
            date_depot_treso,
            date_sort_treso,
            date_depot_sign,
            date_recep_sign_reg,
            date_retrait_reg,
            dateRDV,
            Num_envoi,
            statut_reg_retirer as statut,
            domaine,redac,
            MNTGT as montant,MRGGT as mode_reglement
     from exp.regdispo where domaine = 'R' and date_depot_treso IS NOT NULL
    )
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JAREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement where rowno between ${parseInt(req.params.offset)} and ${parseInt(req.params.offset)+limite}
            `,`
            WITH TP AS (
                select
                ROW_NUMBER() OVER(ORDER BY date_depot_treso) as rowno, 
                wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
         from exp.regdispo where domaine = 'G' and date_depot_treso IS NOT NULL
                )
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JPREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement where rowno between ${parseInt(req.params.offset)} and ${parseInt(req.params.offset)+limite}
            `,
            `
            WITH TP AS (
                select
                ROW_NUMBER() OVER(ORDER BY date_depot_treso) as rowno, 
                wnrgt as Numero_reglement,
                wnupo as police,
                nom_beneficiaire,
                date_depot_treso,
                date_sort_treso,
                date_depot_sign,
                date_recep_sign_reg,
                date_retrait_reg,
                dateRDV,
                Num_envoi,
                statut_reg_retirer as statut,
                domaine,redac,
                MNTGT as montant,MRGGT as mode_reglement
         from exp.regdispo where domaine = 'R' and date_depot_treso IS NOT NULL
        
        )
         SELECT * FROM TP X JOIN (SELECT  
            SUBSTRING(CONVERT(VARCHAR,DTSSD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DTSSD),7,2) AS DATE_SURVENANCE_SINISTRE
            ,A.WASRG NUMERO_BENEFICIAIRE
            ,JAIDENP_NOMTOT NOM_BENEFICIAIRE
            ,LIBSD LIBELLE_SINISTRE
            ,WNUSI NUMERO_SINISTRE
            ,A.WNRGT NUMERO_REGLEMENT
            ,G.JAEMRGP_JACHRGP_NCHEQ AS NUMERO_CHEQUE
            ,A.WNDCSI DECOMPTE
            ,B.WNUPO POLICE
            ,SUBSTRING(CONVERT(VARCHAR,DRGGT),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,DRGGT),7,2) AS  DATE_REGLEMENT
            ,SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,JAIDENP_DNAAD),7,2) AS  DATE_NAISSANCE
            ,SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),1,4)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),5,2)+'-'+SUBSTRING(CONVERT(VARCHAR,T.X.value('DTRSA[1]','varchar(8)')),7,2) AS  DATE_RECEPTION
            ,CONVERT(NUMERIC,TTRSG) MONTANT_BRUT
            ,CONVERT(NUMERIC,TTNSG) MONTANT_NET_REGLEMENT
            ,(CASE JASINAP_NATSA WHEN'DCA'THEN'DCA - Décès accidentel'
            WHEN'DCM'THEN'DCM - Décès suite à Maladie'
            WHEN'DCTA'THEN'DCTA - Frais Funéraires Ascendant'
            WHEN'DCTC'THEN'DCTC - Décès toutes causes'
            WHEN'DCTE'THEN'DCTE - Funéraire Enfant'
            WHEN'DCTF'THEN'DCTF - Frais Funéraires Conjoint'
            WHEN'DEMD'THEN'DEMD - Suite à demande'
            WHEN'DEXC'THEN'DEXC - Décès exclusion'
            WHEN'EXON'THEN'EXON - Exonération'
            WHEN'FRMJ'THEN'FRMJ - Force Majeure'
            WHEN'IPP'THEN'IPP - Invalidité Permanente Partiel.'
            WHEN'IPPA'THEN'IPPA - Invalidité Permanente Partiel. Acct'
            WHEN'IPT'THEN'IPT - Invalidité Permanente Totale'
            WHEN'IPTA'THEN'IPTA - I.P.T. Accident du Travail'
            WHEN'LIC'THEN'LIC - Licenciement'
            WHEN'POLI'THEN'POLI - Pollicitation'
            WHEN'RA15'THEN'RA15 - Rachat avant 2 +15% prime'
            WHEN'RBAV'THEN'RBAV - Rembousement avance'
            WHEN'REMP'THEN'REMP - Rachat Total Reemploi'
            WHEN'RENT'THEN'RENT - Transformation en rente'
            WHEN'RETR'THEN'RETR - Retraite'
            WHEN'TASB'THEN'TASB - Tirage au sort'
            WHEN'TERM'THEN'TERM - Arrivée au terme'
            WHEN'TRPM'THEN'TRPM - Transfert PM'
            ELSE JASINAP_NATSA END) CAUSE_SINISTRE
            , (CASE JASINAP_TYPSA WHEN	'A'	THEN 	'PRESTATIONS DIVERSES (TIRAGE/SOINS)'
                                                  WHEN	'B'	THEN 	'RACHAT PARTIEL'
                                                  WHEN	'D'	THEN 	'DECES'
                                                  WHEN	'E'	THEN 	'RENTE ACCIDENTELLE'
                                                  WHEN	'F'	THEN 	'RENTE TERME'
                                                  WHEN	'H'	THEN 	'RENTE TERME'
                                                  WHEN	'I'	THEN 	'INCAPACITES'
                                                  WHEN	'R'	THEN 	'RACHAT TOTAL'
                                                  WHEN	'V'	THEN 	'INVALIDITES'
                            ELSE JASINAP_TYPSA END) AS TYPE_SINISTRE
                                   FROM NSIACIF.JRREGTP A JOIN NSIACIF.JASIRGP B ON A.WNDCSI=B.WNDCSI
                                   JOIN NSIACIF.JASIRDP C ON C.WNDCSI=A.WNDCSI
                                   LEFT OUTER JOIN (SELECT JASINAP_WNUPO,JASINAP_WNUSI,JASINAP_TYPSA,JASINAP_NATSA,JASINAP_DTOSA,JASINAP_DTSSA,CONVERT(XML,FICXML) FICXML FROM NSIACIF.JASINAP WHERE JASINAP_TYPSA NOT IN ('H','E','F'))E ON E.JASINAP_WNUPO=B.WNUPO AND E.JASINAP_WNUSI=C.WNUSI
                                   OUTER APPLY E.FICXML.nodes('//JASINAP')T(X)
                                   JOIN NSIACIF.JAIDENP D ON D.JAIDENP_WNUAD=A.WASRG
                                   LEFT OUTER JOIN NSIACIF.JAEMRGP G ON G.JAEMRGP_WNRGT = A.WNRGT
            WHERE 0=0 
            AND ETAGT<>'AN' AND [dbo].[Etat_sinistre](WNUSI) NOT LIKE 'Sinistre Annulé') XX
    ON XX.NUMERO_REGLEMENT = X.Numero_reglement where rowno between ${parseInt(req.params.offset)} and ${parseInt(req.params.offset)+limite}
            `
        ];
        result= domaineQueries.map((q,i)=>{
            return getConnection("sunshine").manager.query(q);
    });
        res.json(await Promise.all(result));   
    }
return res.json(result);
});
//WS PoliceIntegree ECOM
apiRouter.route('/policeIntegre/:policeExterne').get(async(req,res)=>{
    let result;
    if(!req.params.policeExterne){
        result={
            error:"bad policeExterne parameter"
        };
        return res.json(result);
    }else{
        let query=`select JAPOLIP_WNUPO as NUMERO_POLICE from NSIACIF.JAPOLIP where JAPOLIP_ANUPO='${req.params.policeExterne}'`;
        let rgt=await getConnection("sunshine").manager.query(query);
        result=rgt[0];
    }
    return res.json(result);
});
apiRouter.route('/getAuthChapChap/:login/:password').get(cache.route({
    expire:{
        200:604800,//1 semaine
        xxx:1,
    }
}),async(req,res)=>{
    let result;
    const {login,password}=req.params;
    let getidQuery=`select IDE_CLIENT_UNIQUE as id from utilisateur where login like '${login}' and mot_de_passe = '${password}'`;
    let idArr=await getConnection("extranet").manager.query(getidQuery);
    if(idArr.length<0){
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":null
        };
        return res.status(200).json(result) ;
    }
    let contractsQuery=`select * from contrats where IDE_CLIENT_UNIQUE = ${parseInt(idArr[0].id)} `;
    let listC=await getConnection("extranet").manager.query(contractsQuery);
    let newListC:any[]=[];
    listC.forEach(element => {
        newListC.push({
            "CodeProduit":element.NUMERO_POLICE.substring(0,3),
            "DateEffetPolice":0,
            "DureeContrat":0,
            "LibelleProduit":"",
            "NomPrenomAssure":"",
            "NumeroAssure":0,
            "NumeroPayeur":parseInt(element.NUMERO_PAYEUR),
            "PoliceInterne":parseInt(element.NUMERO_POLICE)

        });
    });
    if(listC.length){
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":newListC
        }
    }else{
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":null
        }
    }
    
    return res.json(result);
});
apiRouter.route('/authChapChap').post(async(req,res)=>{
    let result;
    const {login,password}=req.body;
    let getidQuery=`select IDE_CLIENT_UNIQUE as id from utilisateur where login like '${login}' and mot_de_passe = '${password}'`;
    let idArr=await getConnection("extranet").manager.query(getidQuery);
    if(idArr.length<0){
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":null
        };
        return res.status(200).json(result) ;
    }
    let contractsQuery=`select * from contrats where IDE_CLIENT_UNIQUE = ${parseInt(idArr[0].id)} `;
    let listC=await getConnection("extranet").manager.query(contractsQuery);
    let newListC:any[]=[];
    listC.forEach(element => {
        newListC.push({
            "CodeProduit":element.NUMERO_POLICE.substring(0,3),
            "DateEffetPolice":0,
            "DureeContrat":0,
            "LibelleProduit":"",
            "NomPrenomAssure":"",
            "NumeroAssure":0,
            "NumeroPayeur":parseInt(element.NUMERO_PAYEUR),
            "PoliceInterne":parseInt(element.NUMERO_POLICE)

        });
    });
    if(listC.length){
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":newListC
        }
    }else{
        result={
            "CodeErreur":null,
            "Message":null,
            "ElementsAuthentifies":null
        }
    }
    
    return res.json(result);
});
//WS Envoi SMS
apiRouter.route('/sendSMS').post(async(req,res)=>{
//service d'envoi de sms vers GESMS
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
    //console.dir(result.data);
    return result.data.result?res.status(200).json({"status":200,"message":result.data.result}):res.status(400).json({"status":400,"message":result.data.error});
}
    catch (err) {
        res.status(400).json(err.response.data.error);
        console.error(err.response);
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
    return result.data.result?res.status(200).json({"status":200,"message":result.data.result}):res.status(400).json({"status":400,"message":result.data.error});
}
    catch (err) {
        console.error(err);
    }
    return ;
}
    //console.dir(req.body);

});
//AVENANT SUR POLICE
apiRouter.route('/avenantPolice').post(async (req,res)=>{
    let result;
    const {police}=req.body;
    if(isNaN(police)){
        return res.status(400).send({error:"Veuillez verifier le numero de police"});
    }
    let query=`exec dbo.wsi_avenant @police=${police}`;
    let aven=await getConnection("sunshine").manager.query(query);
    result=aven;
    return res.json(result);
});
// SINISTRES
apiRouter.route('/infoSinistre').post(async(req,res)=>{
    let result;
    
//service de demandes d'information sur les sinistres
const {numero_assure,nom_complet,date_survenance,police}=req.body;
//controles de base
    
    
    // if(numero_assure &&( nom_complet || date_survenance || police)){
    //     return res.status(400).send({error:"Veuillez ne renseigner que le numero de l'assure ou que le numero de police"});
    // }
    // if(nom_complet && !date_survenance ){
    //     return res.status(400).send({error:"Veuillez joindre au nom la date de survenance du sinistre"});
    // }
    // if(!nom_complet && date_survenance ){
    //     return res.status(400).send({error:"Veuillez joindre a la date de survenance du sinistre le nom complet du client"});
    // }
    
    // recherche des sinistres avec le numero_assure

    if(numero_assure && !police && !date_survenance && !nom_complet){
        if(isNaN(numero_assure)){
            return res.status(400).send({error:"Veuillez verifier le numero assure"});
        }
        let query=`exec dbo.wsi_sinistre_deces_id @id=${numero_assure}`;
        let sin=await getConnection("sunshine").manager.query(query);
        result=sin;
        return res.json(result);
    }else if(!numero_assure && police && !date_survenance && !nom_complet){
// recherde des sinistres par numero de police
        if(isNaN(police) || (police.length>8 || police.length<8)){
            return res.status(400).send({error:"Veuillez verifier le numero de police"});
        }
        let query=`exec dbo.wsi_sinistre_deces_id @police=${police}`;
        let sin=await getConnection("sunshine").manager.query(query);
        result=sin;
        return res.json(result);
    }else if(nom_complet && !date_survenance && !police && !numero_assure){
        return res.status(400).send({error:"Veuillez joindre au nom la date de survenance du sinistre"});
    }else if(!nom_complet && date_survenance && !police && !numero_assure){
        return res.status(400).send({error:"Veuillez joindre a la date de survenance du sinistre le nom complet du client"});
    }else if(isNaN(date_survenance)||date_survenance.length>8 || date_survenance.length<8){
        return res.status(400).send({error:"Veuillez verifier la date de survenance du sinistre "});
    }else if(nom_complet && date_survenance && !police && !numero_assure){
        // recherde des sinistres par nom et date survenance
        let query=`exec dbo.wsi_sinistre_deces_id @nom="${nom_complet}",@datesurv=${date_survenance}`;
        let sin=await getConnection("sunshine").manager.query(query);
        result=sin;
        return res.json(result);
    }else{
        return res.json(result);
    }
   
});