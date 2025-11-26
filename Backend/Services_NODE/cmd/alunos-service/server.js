import express from "express";
import dotenv from "dotenv";

// imports de rotas
import alunosRouter from "./routes/alunos.routes.js";
import aulasRouter from "./routes/aulas.routes.js";
import cursosRouter from "./routes/cursos.routes.js";
import auditoriaRouter from "./routes/auditoria.routes.js";
import presencasRouter from "./routes/presencas.routes.js";
import matriculasRouter from "./routes/matriculas.routes.js";



dotenv.config();

const app = express();
app.use(express.json());

// healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

// registrar rotas
app.use("/alunos", alunosRouter);
app.use("/aulas", aulasRouter);
app.use("/cursos", cursosRouter);
app.use("/auditoria", auditoriaRouter);
app.use("/presencas", presencasRouter);
app.use("/matriculas", matriculasRouter);

// 404 para rotas não mapeadas
app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});



