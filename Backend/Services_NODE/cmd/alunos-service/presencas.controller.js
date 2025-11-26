import db from "../db.js";

const toInt = (v) => (v === undefined || v === null || v === "" ? null : parseInt(v, 10));

/** GET /presencas
 * filtros: chamada, aluno, presente (true/false)
 */
export async function listar(req, res) {
  try {
    const { chamada, aluno, presente } = req.query;
    const where = [];
    const params = [];

    if (chamada !== undefined) {
      params.push(toInt(chamada));
      where.push(`chamada_id_chamada = $${params.length}`);
    }
    if (aluno !== undefined) {
      params.push(toInt(aluno));
      where.push(`aluno_id_aluno = $${params.length}`);
    }
    if (presente !== undefined) {
      params.push(presente === "true");
      where.push(`presente = $${params.length}`);
    }

    const sql = `
      SELECT *
      FROM public.presenca
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY id_presenca DESC;
    `;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar presenças", details: e.message });
  }
}

/** GET /presencas/:id */
export async function obter(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "SELECT * FROM public.presenca WHERE id_presenca = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Presença não encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar presença", details: e.message });
  }
}

/** POST /presencas */
export async function criar(req, res) {
  try {
    const { chamada_id_chamada, aluno_id_aluno, presente, observacao } = req.body;
    if (!chamada_id_chamada || !aluno_id_aluno)
      return res.status(400).json({ error: "Campos obrigatórios: chamada_id_chamada e aluno_id_aluno" });

    const { rows } = await db.query(
      `INSERT INTO public.presenca
       (chamada_id_chamada, aluno_id_aluno, presente, observacao)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [toInt(chamada_id_chamada), toInt(aluno_id_aluno), !!presente, observacao ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar presença", details: e.message });
  }
}

/** PUT /presencas/:id */
export async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { chamada_id_chamada, aluno_id_aluno, presente, observacao } = req.body;
    const { rows } = await db.query(
      `UPDATE public.presenca SET
         chamada_id_chamada = COALESCE($1, chamada_id_chamada),
         aluno_id_aluno     = COALESCE($2, aluno_id_aluno),
         presente           = COALESCE($3, presente),
         observacao         = COALESCE($4, observacao)
       WHERE id_presenca = $5
       RETURNING *;`,
      [
        chamada_id_chamada !== undefined ? toInt(chamada_id_chamada) : null,
        aluno_id_aluno !== undefined ? toInt(aluno_id_aluno) : null,
        presente !== undefined ? !!presente : null,
        observacao ?? null,
        id
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "Presença não encontrada" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao atualizar presença", details: e.message });
  }
}

/** DELETE /presencas/:id */
export async function remover(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query(
      "DELETE FROM public.presenca WHERE id_presenca = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "Presença não encontrada" });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Erro ao remover presença", details: e.message });
  }
}

/** GET /aulas/:id/presencas-lista de presença de uma aula específica */
export async function listarPorAula(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT p.*, a.nome_completo
         FROM public.presenca p
         JOIN public.aluno a ON a.id_aluno = p.aluno_id_aluno
        WHERE chamada_id_chamada = $1
        ORDER BY a.nome_completo ASC`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar presenças da aula", details: e.message });
  }
}
