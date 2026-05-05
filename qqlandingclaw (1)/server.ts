import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time multi-user state
  const users: Record<string, { id: string, name: string, x: number, y: number, avatar: string }> = {};
  let lastActivity = Date.now();
  const IDLE_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours in ms
  let topicCards: any[] = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (userData) => {
      users[socket.id] = {
        id: socket.id,
        name: userData.name || "匿名客官",
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        avatar: userData.avatar || "🦞"
      };
      io.emit("users-update", Object.values(users));
    });

    socket.on("move", (pos) => {
      if (users[socket.id]) {
        users[socket.id].x = pos.x;
        users[socket.id].y = pos.y;
        socket.broadcast.emit("user-moved", users[socket.id]);
      }
    });

    socket.on("chat-message", (msg) => {
      lastActivity = Date.now();
      io.emit("new-chat-message", {
        userId: socket.id,
        userName: users[socket.id]?.name,
        text: msg,
        timestamp: Date.now()
      });
    });

    socket.on("ai-topic-announcement", (topic) => {
      io.emit("new-chat-message", {
        userId: "ai-helper",
        userName: "🦞 龙虾助手",
        text: `【全群播报】${topic}`,
        timestamp: Date.now(),
        isAi: true
      });
    });

    socket.on("disconnect", () => {
      delete users[socket.id];
      io.emit("user-left", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
