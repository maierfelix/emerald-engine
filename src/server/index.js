import LoginServer from "./login-server/index";
import DataServer from "./data-server/index";
import GameServer from "./game-server/index";

new DataServer().then((dataServer) => {
  new GameServer().then((gameServer) => {
    new LoginServer().then((loginServer) => {
      console.log(`All servers are running!`);
      // make session validation check available
      // for all other server instances
      /*let isValidSession = (sessionId) => loginServer.call(loginServer, sessionId);
      tsServer.isValidSession = isValidSession;
      gameServer.isValidSession = isValidSession;*/
    });
  });
});
