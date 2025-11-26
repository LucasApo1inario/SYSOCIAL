import { Router } from "express";
import {
  listar,
  obterPorId,
  criar,
  atualizar,
  remover,
  listarResumo,        // importa a nova função
} from "../controllers/alunos.controller.js";

const router = Router();

//colocar /resumo ANTES de "/:id" pra não ser interpretado como id
router.get("/resumo", listarResumo);

router.get("/", listar);
router.get("/:id", obterPorId);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", remover);

export default router;
