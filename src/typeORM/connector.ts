import {AllConnections} from "./allConnections/allConnections";

const makeDBconnexion = async() => {
    // here we await all types of connection needed for the app to work
    //await createChapChapConnection();
    await AllConnections();
}
export default makeDBconnexion;