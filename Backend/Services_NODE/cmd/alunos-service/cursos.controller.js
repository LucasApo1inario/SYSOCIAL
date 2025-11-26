import db from "../db.js";

/**
 * GET /cursos
 * Lista apenas os dados de curso (sem turmas)
 */
export async function listarCursos(req, res) {
  try {
    const { ativo } = req.query; // "true", "false", "1", "0", etc.
    const params = [];
    let where = "";

    if (ativo !== undefined) {
      // converte string pra boolean
      const ativoBool =
        ativo === "true" || ativo === "1" || ativo === "TRUE" || ativo === "True";

      params.push(ativoBool);
      where = "WHERE ativo = $1";
    }

    const sql = `
      SELECT
        id_curso,
        nome,
        vagas_totais,
        vagas_restantes,
        ativo
      FROM public.curso
      ${where}
      ORDER BY id_curso;
    `;

    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao listar cursos",
      details: e.message,
    });
  }
}


/**
 * GET /cursos/:id
 * Retorna somente os dados do curso (sem turmas)
 */
export async function obterCurso(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `
      SELECT
        id_curso,
        nome,
        vagas_totais,
        vagas_restantes,
        ativo
      FROM public.curso
      WHERE id_curso = $1;
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao obter curso",
      details: e.message,
    });
  }
}

/**
 * GET /cursos/:id/com-turmas
 * Retorna os dados do curso + array de turmas relacionadas
 */
export async function obterCursoComTurmas(req, res) {
  try {
    const { id } = req.params;

    // 1) Curso
    const { rows: cursoRows } = await db.query(
      `
      SELECT
        id_curso,
        nome,
        vagas_totais,
        vagas_restantes,
        ativo
      FROM public.curso
      WHERE id_curso = $1;
      `,
      [id]
    );

    if (!cursoRows.length) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const curso = cursoRows[0];

    // 2) Turmas do curso
    const { rows: turmas } = await db.query(
      `
      SELECT
        id_turma,
        cursos_id_curso,
        nome_turma,
        descricao,
        dia_semana,
        hora_inicio,
        hora_fim,
        vagas_turma
      FROM public.turma
      WHERE cursos_id_curso = $1
      ORDER BY id_turma;
      `,
      [id]
    );

    return res.json({
      ...curso,
      turmas,
    });
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao obter curso com turmas",
      details: e.message,
    });
  }
}

/**
 * POST /cursos
 * Cria curso, e opcionalmente cria turmas junto
 * Body esperado:
 * {
 *   "nome": "Informática Básica",
 *   "vagas_totais": 40,
 *   "ativo": true,          // opcional
 *   "turmas": [             // opcional
 *     {
 *       "nome_turma": "Turma A - Noite",
 *       "dia_semana": "Segunda-feira",
 *       "hora_inicio": "19:00",
 *       "hora_fim": "21:00",
 *       "vagas_turma": 20,
 *       "descricao": "Turma voltada para iniciantes."
 *     }
 *   ]
 * }
 */
export async function criarCurso(req, res) {
  const client = await db.getClient();
  try {
    const { nome, vagas_totais, ativo, turmas } = req.body;

    const faltando = [];
    if (!nome) faltando.push("nome");
    if (vagas_totais === undefined || vagas_totais === null)
      faltando.push("vagas_totais");

    if (faltando.length) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        campos: faltando,
      });
    }

    await client.query("BEGIN");

    // 1) Criar o curso
    const insertCurso = `
      INSERT INTO public.curso (nome, vagas_totais, vagas_restantes, ativo)
      VALUES ($1, $2, $2, COALESCE($3, true))
      RETURNING id_curso, nome, vagas_totais, vagas_restantes, ativo;
    `;
    const { rows: cursoRows } = await client.query(insertCurso, [
      nome,
      vagas_totais,
      ativo,
    ]);
    const curso = cursoRows[0];

    const turmasCriadas = [];

    // 2) Se veio array de turmas, cria cada uma
    if (Array.isArray(turmas) && turmas.length > 0) {
      const insertTurma = `
        INSERT INTO public.turma (
          cursos_id_curso,
          nome_turma,
          descricao,
          dia_semana,
          hora_inicio,
          hora_fim,
          vagas_turma
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING
          id_turma,
          cursos_id_curso,
          nome_turma,
          descricao,
          dia_semana,
          hora_inicio,
          hora_fim,
          vagas_turma;
      `;

      for (const t of turmas) {
        const faltandoTurma = [];
        if (!t.nome_turma) faltandoTurma.push("nome_turma");
        if (!t.dia_semana) faltandoTurma.push("dia_semana");
        if (!t.hora_inicio) faltandoTurma.push("hora_inicio");
        if (!t.hora_fim) faltandoTurma.push("hora_fim");
        if (t.vagas_turma === undefined || t.vagas_turma === null)
          faltandoTurma.push("vagas_turma");

        if (faltandoTurma.length) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Campos obrigatórios ausentes na turma",
            campos: faltandoTurma,
          });
        }

        const { rows: turmaRows } = await client.query(insertTurma, [
          curso.id_curso,
          t.nome_turma,
          t.descricao || null,
          t.dia_semana,
          t.hora_inicio,
          t.hora_fim,
          t.vagas_turma,
        ]);
        turmasCriadas.push(turmaRows[0]);
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      ...curso,
      turmas: turmasCriadas,
    });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    return res.status(500).json({
      error: "Erro ao criar curso",
      details: e.message,
    });
  } finally {
    client.release();
  }
}

/**
 * PUT /cursos/:id
 * Atualiza apenas dados do curso (não altera turmas)
 * Body (parcial):
 * {
 *   "nome": "Novo nome",
 *   "vagas_totais": 50,
 *   "ativo": false
 * }
 *
 * OBS: se mudar vagas_totais, ajusta vagas_restantes
 *       mantendo o número de matrículas ocupadas.
 */
export async function atualizarCurso(req, res) {
  try {
    const { id } = req.params;
    const { nome, vagas_totais, ativo } = req.body;

    const update = `
      UPDATE public.curso
      SET
        nome = COALESCE($1, nome),
        vagas_restantes = CASE
          WHEN $2 IS NULL THEN vagas_restantes
          ELSE vagas_restantes + ($2 - vagas_totais)
        END,
        vagas_totais = COALESCE($2, vagas_totais),
        ativo = COALESCE($3, ativo)
      WHERE id_curso = $4
      RETURNING id_curso, nome, vagas_totais, vagas_restantes, ativo;
    `;

    const { rows } = await db.query(update, [nome ?? null, vagas_totais ?? null, ativo ?? null, id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao atualizar curso",
      details: e.message,
    });
  }
}

/**
 * DELETE /cursos/:id
 * Remove curso. Se tiver turmas/matrículas associadas, o banco deve bloquear (FK),
 * e retorna 409.
 */
export async function removerCurso(req, res) {
  try {
    const { id } = req.params;

    const sql = "DELETE FROM public.curso WHERE id_curso = $1";
    const { rowCount } = await db.query(sql, [id]);

    if (!rowCount) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    return res.status(204).send();
  } catch (e) {
    // FK violation (turmas/matrículas associadas)
    if (e.code === "23503") {
      return res.status(409).json({
        error: "Não é possível remover curso com turmas ou matrículas associadas",
        details: e.detail,
      });
    }

    return res.status(500).json({
      error: "Erro ao remover curso",
      details: e.message,
    });
  }
}
