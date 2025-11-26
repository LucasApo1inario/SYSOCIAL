import { Router } from "express";
import {
  listarMatriculas,
  obterMatricula,
  criarMatricula,
  atualizarMatricula,
} from "../controllers/matriculas.controller.js";

const router = Router();

// lista (tabela com filtros)
router.get("/", listarMatriculas);

// detalhe (tela completa da matrícula)
router.get("/:id", obterMatricula);

// criar nova matrícula
router.post("/", criarMatricula);

// atualizar matrícula existente
router.put("/:id", atualizarMatricula);

export default router;
