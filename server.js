const { server, ensureDb } = require("./lib/server-core");

const PORT = Number(process.env.PORT || 3000);

ensureDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`PulseIQ server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
