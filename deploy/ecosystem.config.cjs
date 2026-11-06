/* global module, __dirname */
// PM2: garde le site en marche et le relance au démarrage du VPS.
// Démarrage: pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [{
    name: "vitalforce",
    cwd: __dirname + "/..",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3000 -H 127.0.0.1",
    env: { NODE_ENV: "production" },
    max_memory_restart: "700M",
    time: true
  }]
};
