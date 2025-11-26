import db from "../db.js";

const toInt = (v) => (v === undefined || v === null || v === "" ? null : parseInt(v, 10));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}/.test(String(s)); // aceita YYYY-MM-DD ou YYYY-MM-DDTHH:mm...

/** GET /auditoria
 * Filtros (query):
 *  - usuario   (users_id_usuario)
 *  - matricula (matricula_id_matricula)
 *  - campo     (campo_alterado LIKE)
 *  - de        (data_hora >=)
 *  - ate       (data_hora <=)
 *  - q         (busca em valor_antigo/valor_novo)
 *  - page, limit (padrão 1,20; máx 100)
 */
export async function listar(req, res) {
  try {
    const { usuario, matricula, campo, de, ate, q, page = 1, limit = 20 } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = [];
    const params = [];

    if (usuario !== undefined) {
      params.push(toInt(usuario));
      where.push(`users_id_usuario = $${params.length}`);
    }
    if (matricula !== undefined) {
      params.push(toInt(matricula));
      where.push(`matricula_id_matricula = $${params.length}`);
    }
    if (campo) {
      params.push(`%${campo}%`);
      where.push(`LOWER(campo_alterado) LIKE LOWER($${params.length})`);
    }
    if (de) {
      if (!isDate(de)) return res.status(400).json({ error: "Parâmetro 'de' inválido (YYYY-MM-DD)" });
      params.push(de);
      where.push(`data_hora >= $${params.length}`);
    }
    if (ate) {
      if (!isDate(ate)) return res.status(400).json({ error: "Parâmetro 'ate' inválido (YYYY-MM-DD)" });
      params.push(ate);
      where.push(`data_hora <= $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      where.push(`(valor_antigo ILIKE $${idx} OR valor_novo ILIKE $${idx})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*)::int AS total FROM public.historicoalteracoes ${whereSql}`;
    const { rows: crows } = await db.query(countSql, params);
    const total = crows[0]?.total ?? 0;

    const offset = (p - 1) * l;
    const dataSql = `
      SELECT *
      FROM public.historicoalteracoes
      ${whereSql}
      ORDER BY data_hora DESC, id_historico DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const { rows } = await db.query(dataSql, [...params, l, offset]);

    res.json({ page: p, limit: l, total, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar auditoria", details: e.message });
  }
}

/** GET /auditoria/:id */
export async function obter(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "SELECT * FROM public.historicoalteracoes WHERE id_historico = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Registro de auditoria não encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar auditoria", details: e.message });
  }
}

/** GET /auditoria/matricula/:id - trilha de mudanças de uma matrícula */
export async function trilhaMatricula(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT *
         FROM public.historicoalteracoes
        WHERE matricula_id_matricula = $1
        ORDER BY data_hora DESC, id_historico DESC`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar trilha da matrícula", details: e.message });
  }
}

/** POST /auditoria
 * body:
 *  { users_id_usuario, matricula_id_matricula, campo_alterado, valor_antigo, valor_novo, data_hora? }
 *  - data_hora opcional: se não vier, usamos NOW()
 */
export async function criar(req, res) {
  try {
    const { users_id_usuario, matricula_id_matricula, campo_alterado, valor_antigo, valor_novo, data_hora } = req.body;
    const faltando = [];
    if (users_id_usuario === undefined) faltando.push("users_id_usuario");
    if (matricula_id_matricula === undefined) faltando.push("matricula_id_matricula");
    if (!campo_alterado) faltando.push("campo_alterado");
    if (valor_antigo === undefined) faltando.push("valor_antigo");
    if (valor_novo === undefined) faltando.push("valor_novo");
    if (faltando.length) return res.status(400).json({ error: "Campos obrigatórios ausentes", campos: faltando });

    let dh = null;
    if (data_hora) {
      if (!isDate(data_hora)) return res.status(400).json({ error: "data_hora inválida (use YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)" });
      dh = data_hora;
    }

    const sql = `
      INSERT INTO public.historicoalteracoes
        (users_id_usuario, matricula_id_matricula, data_hora, campo_alterado, valor_antigo, valor_novo)
      VALUES
        ($1, $2, COALESCE($3, NOW()), $4, $5, $6)
      RETURNING *;
    `;
    const params = [
      toInt(users_id_usuario),
      toInt(matricula_id_matricula),
      dh,
      String(campo_alterado),
      valor_antigo === null ? null : String(valor_antigo),
      valor_novo === null ? null : String(valor_novo),
    ];
    const { rows } = await db.query(sql, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar auditoria", details: e.message });
  }
}

/** PUT /auditoria/:id → não permitido (imutável) */
export async function bloquearUpdate(_req, res) {
  res.status(405).json({ error: "Registros de auditoria são imutáveis (PUT não permitido)" });
}

/** DELETE /auditoria/:id → não permitido (imutável) */
export async function bloquearDelete(_req, res) {
  res.status(405).json({ error: "Registros de auditoria são imutáveis (DELETE não permitido)" });
}

/** (opcional) GET /auditoria/resumo?de=&ate=
 *  Retorna agregados por campo_alterado e por usuário
 */
export async function resumo(req, res) {
  try {
    const { de, ate } = req.query;
    const where = [];
    const params = [];
    if (de) { if (!isDate(de)) return res.status(400).json({ error: "de inválido" }); params.push(de); where.push(`data_hora >= $${params.length}`); }
    if (ate) { if (!isDate(ate)) return res.status(400).json({ error: "ate inválido" }); params.push(ate); where.push(`data_hora <= $${params.length}`); }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const byCampo = await db.query(
      `SELECT campo_alterado, COUNT(*)::int AS total
         FROM public.historicoalteracoes
         ${w}
        GROUP BY campo_alterado
        ORDER BY total DESC`
      , params
    );

    const byUser = await db.query(
      `SELECT users_id_usuario, COUNT(*)::int AS total
         FROM public.historicoalteracoes
         ${w}
        GROUP BY users_id_usuario
        ORDER BY total DESC`
      , params
    );

    res.json({ por_campo: byCampo.rows, por_usuario: byUser.rows });
  } catch (e) {
    res.status(500).json({ error: "Erro ao gerar resumo de auditoria", details: e.message });
  }
}
