import { Router } from "express";
import {
  listarCursos,
  obterCurso,
  obterCursoComTurmas,
  criarCurso,
  atualizarCurso,
  removerCurso,
} from "../controllers/cursos.controller.js";

const router = Router();

// Só dados de curso
router.get("/", listarCursos);        // GET /cursos
router.get("/:id", obterCurso);       // GET /cursos/:id

// Curso + turmas
router.get("/:id/com-turmas", obterCursoComTurmas); // GET /cursos/:id/com-turmas

// CRUD de curso (com possibilidade de criar turmas junto no POST)
router.post("/", criarCurso);         // POST /cursos
router.put("/:id", atualizarCurso);   // PUT /cursos/:id
router.delete("/:id", removerCurso);  // DELETE /cursos/:id

export default router;
