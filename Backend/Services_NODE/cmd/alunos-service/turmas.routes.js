import { Router } from "express";
import {
  listarTurmas,
  obterTurma,
  listarTurmasPorCurso,
} from "../controllers/turmas.controller.js";

const router = Router();

router.get("/", listarTurmas);          // /turmas
router.get("/:id", obterTurma);         // /turmas/:id

// atalho: /cursos/:id/turmas  (montado no server)
export const cursoTurmasHandler = listarTurmasPorCurso;

export default router;
