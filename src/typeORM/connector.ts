import {createChapChapConnection} from "./allConnections/ChapChapConnection";

const makeDBconnexion = async() => {
    // here we await all types of connection needed for the app to work
    await createChapChapConnection();
}
export default makeDBconnexion;