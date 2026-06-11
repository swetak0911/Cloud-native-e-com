import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import client from "prom-client";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ---- Observability: Prometheus metrics (RED method) ----
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// In-memory store for the starter. Replace with PostgreSQL (pg) in production.
const users: { id: string; email: string; passwordHash: string }[] = [];

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input" });
  const { email, password } = parsed.data;
  if (users.find((u) => u.email === email))
    return res.status(409).json({ error: "email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: crypto.randomUUID(), email, passwordHash };
  users.push(user);
  const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: "1h" });
  httpRequests.inc({ method: "POST", route: "/auth/signup", status: 201 });
  res.status(201).json({ token });
});

app.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input" });
  const { email, password } = parsed.data;
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "invalid credentials" });
  const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: "1h" });
  httpRequests.inc({ method: "POST", route: "/auth/login", status: 200 });
  res.json({ token });
});

// ---- Health probes for Kubernetes ----
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));      // liveness
app.get("/readyz", (_req, res) => res.json({ status: "ready" }));    // readiness

// ---- Metrics endpoint for Prometheus ----
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`auth-service listening on ${PORT}`));
