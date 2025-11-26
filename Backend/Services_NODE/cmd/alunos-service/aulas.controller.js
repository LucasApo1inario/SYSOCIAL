import db from "../db.js";

// Helpers
const toInt = (v) => (v === undefined || v === null || v === "" ? null : parseInt(v, 10));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s)); // YYYY-MM-DD

/** GET /aulas
 *  Query params (opcionais):
 *   - turma  (id da turma)
 *   - usuario (id do professor/usuario)
 *   - de  (data inicial YYYY-MM-DD)
 *   - ate (data final   YYYY-MM-DD)
 *   - page, limit (padrão 1,20; máx 100)
 */
export async function listar(req, res) {
  try {
    const { turma, usuario, de, ate, page = 1, limit = 20 } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = [];
    const params = [];

    if (turma !== undefined) {
      params.push(toInt(turma));
      where.push(`turmas_id_turma = $${params.length}`);
    }
    if (usuario !== undefined) {
      params.push(toInt(usuario));
      where.push(`users_id_usuario = $${params.length}`);
    }
    if (de) {
      if (!isDate(de)) return res.status(400).json({ error: "Parâmetro 'de' inválido (YYYY-MM-DD)" });
      params.push(de);
      where.push(`data_aula >= $${params.length}`);
    }
    if (ate) {
      if (!isDate(ate)) return res.status(400).json({ error: "Parâmetro 'ate' inválido (YYYY-MM-DD)" });
      params.push(ate);
      where.push(`data_aula <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*)::int AS total FROM public.chamada ${whereSql}`;
    const { rows: crows } = await db.query(countSql, params);
    const total = crows[0]?.total ?? 0;

    const offset = (p - 1) * l;
    const dataSql = `
      SELECT *
      FROM public.chamada
      ${whereSql}
      ORDER BY data_aula DESC, id_chamada DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const { rows } = await db.query(dataSql, [...params, l, offset]);

    res.json({ page: p, limit: l, total, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar aulas", details: e.message });
  }
}

/** GET /aulas/:id */
export async function obter(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "SELECT * FROM public.chamada WHERE id_chamada = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Aula não encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar aula", details: e.message });
  }
}

/** POST /aulas
 * body: { users_id_usuario, turmas_id_turma, data_aula(YYYY-MM-DD) }
 */
export async function criar(req, res) {
  try {
    const { users_id_usuario, turmas_id_turma, data_aula } = req.body;

    const faltando = [];
    if (users_id_usuario === undefined) faltando.push("users_id_usuario");
    if (turmas_id_turma === undefined) faltando.push("turmas_id_turma");
    if (!data_aula) faltando.push("data_aula");
    if (faltando.length) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes", campos: faltando });
    }
    if (!isDate(data_aula)) {
      return res.status(400).json({ error: "data_aula deve ser YYYY-MM-DD" });
    }

    const insert = `
      INSERT INTO public.chamada (users_id_usuario, turmas_id_turma, data_aula)
      VALUES ($1,$2,$3)
      RETURNING *;
    `;
    const params = [toInt(users_id_usuario), toInt(turmas_id_turma), data_aula];

    const { rows } = await db.query(insert, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar aula", details: e.message });
  }
}

/** PUT /aulas/:id
 * body (parcial): { users_id_usuario?, turmas_id_turma?, data_aula? }
 */
export async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { users_id_usuario, turmas_id_turma, data_aula } = req.body;

    if (data_aula !== undefined && data_aula !== null && !isDate(data_aula)) {
      return res.status(400).json({ error: "data_aula deve ser YYYY-MM-DD" });
    }

    const update = `
      UPDATE public.chamada SET
        users_id_usuario = COALESCE($1, users_id_usuario),
        turmas_id_turma  = COALESCE($2, turmas_id_turma),
        data_aula        = COALESCE($3, data_aula)
      WHERE id_chamada = $4
      RETURNING *;
    `;
    const params = [
      users_id_usuario !== undefined ? toInt(users_id_usuario) : null,
      turmas_id_turma  !== undefined ? toInt(turmas_id_turma)  : null,
      data_aula !== undefined ? data_aula : null,
      id
    ];

    const { rows } = await db.query(update, params);
    if (!rows.length) return res.status(404).json({ error: "Aula não encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao atualizar aula", details: e.message });
  }
}

/** DELETE /aulas/:id */
export async function remover(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query(
      "DELETE FROM public.chamada WHERE id_chamada = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "Aula não encontrada" });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Erro ao remover aula", details: e.message });
  }
}

/** GET /turmas/:id/aulas - listar aulas de uma turma (atalho) */
export async function listarPorTurma(req, res) {
  try {
    const { id } = req.params;
    const { de, ate } = req.query;
    const where = ["turmas_id_turma = $1"];
    const params = [id];
    if (de) {
      if (!isDate(de)) return res.status(400).json({ error: "Parâmetro 'de' inválido (YYYY-MM-DD)" });
      params.push(de);
      where.push(`data_aula >= $${params.length}`);
    }
    if (ate) {
      if (!isDate(ate)) return res.status(400).json({ error: "Parâmetro 'ate' inválido (YYYY-MM-DD)" });
      params.push(ate);
      where.push(`data_aula <= $${params.length}`);
    }
    const { rows } = await db.query(
      `SELECT * FROM public.chamada WHERE ${where.join(" AND ")} ORDER BY data_aula DESC, id_chamada DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar aulas da turma", details: e.message });
  }
}
