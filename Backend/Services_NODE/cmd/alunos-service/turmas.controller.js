import db from "../db.js";

// GET /turmas?curso_id=&dia_semana=
export async function listarTurmas(req, res) {
  try {
    const { curso_id, dia_semana } = req.query;

    const where = [];
    const params = [];

    if (curso_id) {
      params.push(parseInt(curso_id, 10));
      where.push(`t.cursos_id_curso = $${params.length}`);
    }

    if (dia_semana) {
      params.push(dia_semana);
      where.push(`t.dia_semana = $${params.length}`);
    }

    const sql = `
      SELECT
        t.id_turma,
        t.cursos_id_curso,
        c.nome AS nome_curso,
        t.nome_turma,
        t.descricao,
        t.dia_semana,
        t.hora_inicio,
        t.hora_fim,
        t.vagas_turma
      FROM public.turma t
      JOIN public.curso c
        ON c.id_curso = t.cursos_id_curso
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY t.id_turma;
    `;

    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao listar turmas",
      details: e.message,
    });
  }
}

// GET /turmas/:id
export async function obterTurma(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        t.id_turma,
        t.cursos_id_curso,
        c.nome AS nome_curso,
        t.nome_turma,
        t.descricao,
        t.dia_semana,
        t.hora_inicio,
        t.hora_fim,
        t.vagas_turma
      FROM public.turma t
      JOIN public.curso c
        ON c.id_curso = t.cursos_id_curso
      WHERE t.id_turma = $1;
    `;

    const { rows } = await db.query(sql, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao obter turma",
      details: e.message,
    });
  }
}

// GET /cursos/:id/turmas
export async function listarTurmasPorCurso(req, res) {
  try {
    const { id } = req.params;

    const sql = `
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
    `;

    const { rows } = await db.query(sql, [id]);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao listar turmas do curso",
      details: e.message,
    });
  }
}
