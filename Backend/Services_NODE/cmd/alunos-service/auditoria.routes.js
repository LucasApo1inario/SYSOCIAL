import { Router } from "express";
import {
  listar, obter, trilhaMatricula, criar,
  bloquearUpdate, bloquearDelete, resumo
} from "../controllers/auditoria.controller.js";

const router = Router();

router.get("/", listar);
router.get("/resumo", resumo);
router.get("/:id", obter);
router.get("/matricula/:id", trilhaMatricula);

router.post("/", criar);

router.put("/:id", bloquearUpdate);    // 405
router.delete("/:id", bloquearDelete); // 405

export default router;
