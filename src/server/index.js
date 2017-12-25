import LoginServer from "./login-server/index";
import DataServer from "./data-server/index";
import GameServer from "./game-server/index";
import HTTPServer from "./http-server/index";
import UpdateServer from "./update-server/index";

new DataServer().then(dataServer => {
  new GameServer().then(gameServer => {
    new LoginServer().then(loginServer => {
      new UpdateServer().then(updateServer => {
        // share server instances
        let instances = [dataServer, gameServer, loginServer, updateServer];
        instances.map((instance, index) => {
          instances.map(inst => {
            if (inst !== instance) instance[inst.constructor.name] = inst;
          });
        });
        console.log(`All servers are running!`);
      });
    });
  });
});
