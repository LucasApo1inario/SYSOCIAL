import { Router } from "express";
import { listar, obter, criar, atualizar, remover, listarPorTurma } from "../controllers/aulas.controller.js";

const router = Router();

// CRUD de aulas
router.get("/", listar);
router.get("/:id", obter);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", remover);

// atalho: aulas de uma turma
router.get("/turma/:id", listarPorTurma);

export default router;
