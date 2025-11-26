import { Router } from "express";
import { listar, obter, criar, atualizar, remover, listarPorAula } from "../controllers/presencas.controller.js";

const router = Router();

router.get("/", listar);
router.get("/:id", obter);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", remover);

// rotas aninhadas
router.get("/aula/:id", listarPorAula);

export default router;
