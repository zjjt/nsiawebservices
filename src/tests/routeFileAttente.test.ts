import makeDBconnexion from '../typeORM/connector';
import {CONTRATS} from '../entity/chapchap/CONTRATS'; 
import {CLIENT_UNIQUE} from '../entity/chapchap/CLIENT_UNIQUE';
 import { UTILISATEUR } from '../entity/chapchap/UTILISATEUR';

beforeAll(async()=>{
    await makeDBconnexion();
});

describe("Identification d'un client dans le logiciel de file d'attente",async()=>{
    test("checks if client exists in DB",async()=>{
        const c = await CONTRATS.findOne({NUMERO_POLICE: "21624981"});
        if(c)
        {
            expect(c.NUMERO_POLICE).toBe("21624981");
            const client = await CLIENT_UNIQUE.findOne({IDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE as string});
                let contrats=await CONTRATS.find({iDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE as string});
                contrats=contrats.reduce((unique:any, o:any) => {
                    if(!unique.some((obj:any) => obj.NUMERO_POLICE === o.NUMERO_POLICE && obj.iDE_CLIENT_UNIQUE === o.iDE_CLIENT_UNIQUE)) {
                      unique.push(o);
                    }
                    return unique;
                },[]);
                const loginDtails=await UTILISATEUR.findOne({IDE_CLIENT_UNIQUE: c.iDE_CLIENT_UNIQUE});
                if(client && contrats && loginDtails){
                    expect(client.IDE_CLIENT_UNIQUE).toBe("111021");
                    expect(loginDtails.LOGIN).toBe("CI694571");
                    expect(contrats).toBeInstanceOf(Array);
                    expect(contrats[0].NUMERO_POLICE).toBe("21624981");
                    console.log("client ide unique: "+client.IDE_CLIENT_UNIQUE+" login: "+loginDtails.LOGIN+" premier contrat: "+contrats[0].NUMERO_POLICE);
                }
                

            
            

        }
        
    });
    
});