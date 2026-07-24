require("dotenv").config();
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { getRedisClient, closeRedis, rateLimiter, QueueManager } = require("./redis");

// Connect to MongoDB
connectDB();

// Initialize Redis
getRedisClient();

const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

const app = express();

// Initialize Apollo Server
async function startApolloServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  console.log(`[Apollo] GraphQL Server ready at /graphql`);
}
startApolloServer();

// Middleware
app.use(cors({ origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json({ limit: "5mb" }));

// Rate limiting (Redis-based fallback to allow if Redis is down)
// Replaces express-rate-limit
app.use("/api/", rateLimiter('global_api', 200, 15 * 60));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/problems", require("./routes/problems"));
app.use("/api/submissions", require("./routes/submissions"));
app.use("/api/run", require("./routes/run"));
app.use("/api/admin/problems", require("./routes/admin/problems"));
app.use("/api/admin/contests", require("./routes/admin/contests"));
app.use("/api/admin/users", require("./routes/admin/users"));
app.use("/api/admin/companies", require("./routes/admin/companies"));
app.use("/api/admin/universities", require("./routes/admin/universities"));
app.use("/api/admin/dashboard", require("./routes/admin/dashboard"));
app.use("/api/contest-attempts", require("./routes/contest-attempts"));
app.use("/api/company", require("./routes/company"));
app.use("/api/company/jobs", require("./routes/company/jobs"));
app.use("/api/company/team", require("./routes/company/team"));
app.use("/api/company/applications", require("./routes/company/applications"));
app.use("/api/campus", require("./routes/campus"));
app.use("/api/campus/batches", require("./routes/campus/batches"));
app.use("/api/campus/students", require("./routes/campus/students"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0" });
});

// Redis health check
app.get("/api/health/redis", async (req, res) => {
  const redis = getRedisClient();
  if (redis && redis.status === 'ready') {
    try {
      const ping = await redis.ping();
      return res.json({ status: "ok", redis: "connected", ping });
    } catch (e) {
      return res.status(500).json({ status: "error", redis: "ping failed", message: e.message });
    }
  }
  res.status(503).json({ status: "error", redis: "disconnected" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});

const PORT = process.env.PORT || 5000;
const http = require("http");
const { initSocketIO } = require("./websockets/contestGateway");
const { initAIGateway } = require("./websockets/aiGateway");

const server = http.createServer(app);
const io = initSocketIO(server);
initAIGateway(io);

server.listen(PORT, () => {
  console.log(`\n🚀 CodeSkill API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log('\n[Server] Received kill signal, shutting down gracefully...');
  server.close(async () => {
    console.log('[Server] Closed out remaining Express connections');
    await QueueManager.shutdown();
    await closeRedis();
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.once('SIGUSR2', shutdown);
