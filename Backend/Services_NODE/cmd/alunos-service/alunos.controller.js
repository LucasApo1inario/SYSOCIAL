import db from "../db.js";

// helpers
const toInt = (v) => (v === undefined || v === null || v === "" ? null : parseInt(v, 10));

/** GET /alunos
 *  Query params:
 *   - page (default 1)
 *   - limit (default 20, máx 100)
 *   - nome (LIKE)
 *   - cpf (LIKE)
 *   - serie_atual (=)
 *   - periodo_escolar (=)
 *   - data_matricula_ini (>=)   [YYYY-MM-DD]
 *   - data_matricula_fim (<=)   [YYYY-MM-DD]
 */
export async function listar(req, res) {
  try {
    const { page = 1, limit = 20, nome, cpf, serie_atual, periodo_escolar, data_matricula_ini, data_matricula_fim } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = [];
    const params = [];

    if (nome) {
      params.push(`%${nome}%`);
      where.push(`LOWER(nome_completo) LIKE LOWER($${params.length})`);
    }
    if (cpf) {
      params.push(`%${cpf}%`);
      where.push(`cpf LIKE $${params.length}`);
    }
    if (serie_atual !== undefined) {
      params.push(parseInt(serie_atual, 10));
      where.push(`serie_atual = $${params.length}`);
    }
    if (periodo_escolar) {
      params.push(periodo_escolar);
      where.push(`periodo_escolar = $${params.length}`);
    }
    if (data_matricula_ini) {
      params.push(data_matricula_ini);
      where.push(`data_matricula >= $${params.length}`);
    }
    if (data_matricula_fim) {
      params.push(data_matricula_fim);
      where.push(`data_matricula <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalSql = `SELECT COUNT(*)::int AS total FROM public.aluno ${whereSql}`;
    const { rows: totalRows } = await db.query(totalSql, params);
    const total = totalRows[0]?.total ?? 0;

    const offset = (p - 1) * l;
    const dataSql = `
      SELECT *
      FROM public.aluno
      ${whereSql}
      ORDER BY id_aluno DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const { rows } = await db.query(dataSql, [...params, l, offset]);

    res.json({ page: p, limit: l, total, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Erro ao listar alunos", details: e.message });
  }
}

/** GET /alunos/:id */
export async function obterPorId(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM public.aluno WHERE id_aluno = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Aluno não encontrado" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar aluno", details: e.message });
  }
}

/** POST /alunos  (criação)
 *  OBRIGATÓRIO ter "responsavel" completo.
 */
export async function criar(req, res) {
  const client = await db.getClient();

  try {
    const {
      nome_completo,
      data_nascimento,
      sexo,
      cpf,
      telefone,
      escola_atual,
      serie_atual,
      periodo_escolar,
      nome_rua,
      numero_endereco,
      bairro,
      data_matricula,
      observacoes,
      cep,
      responsavel, // agora obrigatório
    } = req.body;

    // -----------------------------
    // 1) Validação dos dados do aluno
    // -----------------------------
    const faltando = [];
    if (!nome_completo) faltando.push("nome_completo");
    if (!data_nascimento) faltando.push("data_nascimento");
    if (!sexo) faltando.push("sexo");
    if (!cpf) faltando.push("cpf");
    if (!telefone) faltando.push("telefone");
    if (!escola_atual) faltando.push("escola_atual");
    if (serie_atual === undefined || serie_atual === null) faltando.push("serie_atual");
    if (!periodo_escolar) faltando.push("periodo_escolar");
    if (!nome_rua) faltando.push("nome_rua");
    if (numero_endereco === undefined || numero_endereco === null) faltando.push("numero_endereco");
    if (!bairro) faltando.push("bairro");
    if (!data_matricula) faltando.push("data_matricula");
    if (observacoes === undefined || observacoes === null) faltando.push("observacoes");

    // responsável obrigatório
    if (!responsavel) {
      faltando.push("responsavel");
    }

    if (faltando.length) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        campos: faltando,
      });
    }

    // -----------------------------
    // 2) Inicia transação
    // -----------------------------
    await client.query("BEGIN");

    // -----------------------------
    // 3) Inserir aluno (com CEP)
    // -----------------------------
    const insertAluno = `
      INSERT INTO public.aluno (
        nome_completo, data_nascimento, sexo, cpf, telefone,
        escola_atual, serie_atual, periodo_escolar,
        nome_rua, numero_endereco, bairro,
        data_matricula, observacoes, cep
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,
        $12,$13,$14
      )
      RETURNING *;
    `;

    const paramsAluno = [
      nome_completo,
      data_nascimento,
      sexo,
      cpf,
      telefone,
      escola_atual,
      serie_atual,
      periodo_escolar,
      nome_rua,
      numero_endereco,
      bairro,
      data_matricula,
      observacoes,
      cep,
    ];

    const { rows: alunoRows } = await client.query(insertAluno, paramsAluno);
    const aluno = alunoRows[0];

    // -----------------------------
    // 4) Validação dos dados do responsável (agora SEM caminho sem responsável)
    // -----------------------------
    const {
      nome_completo: rNome,
      cpf: rCpf,
      telefone: rTel,
      telefone_recado1,
      telefone_recado2,
      parentesco,
      tipo,
    } = responsavel || {};

    const faltandoResp = [];
    if (!rNome) faltandoResp.push("responsavel.nome_completo");
    if (!rCpf) faltandoResp.push("responsavel.cpf");
    if (!rTel) faltandoResp.push("responsavel.telefone");
    if (!telefone_recado1) faltandoResp.push("responsavel.telefone_recado1");
    if (!telefone_recado2) faltandoResp.push("responsavel.telefone_recado2");
    if (!parentesco) faltandoResp.push("responsavel.parentesco");

    if (faltandoResp.length) {
      // se os dados do responsável estiverem incompletos, nada é gravado (rollback)
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Campos obrigatórios do responsável ausentes",
        campos: faltandoResp,
      });
    }

    // -----------------------------
    // 5) Verificar se já existe responsável com esse CPF
    // -----------------------------
    const { rows: existentes } = await client.query(
      "SELECT id_responsavel FROM public.responsavel WHERE cpf = $1",
      [rCpf]
    );

    let idResponsavel;

    if (existentes.length) {
      idResponsavel = existentes[0].id_responsavel;
    } else {
      // -----------------------------
      // 6) Inserir novo responsável
      // -----------------------------
      const insertResp = `
        INSERT INTO public.responsavel
          (nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING id_responsavel;
      `;
      const { rows: respRows } = await client.query(insertResp, [
        rNome,
        rCpf,
        rTel,
        telefone_recado1,
        telefone_recado2,
        parentesco,
      ]);
      idResponsavel = respRows[0].id_responsavel;
    }

    // -----------------------------
    // 7) Vincular responsável ↔ aluno
    // -----------------------------
    const tipoVinculo = tipo || "principal";

    await client.query(
      `
      INSERT INTO public.responsavel_aluno
        (responsavel_id_responsavel, aluno_id_aluno, tipo)
      VALUES
        ($1, $2, $3)
      ON CONFLICT (responsavel_id_responsavel, aluno_id_aluno)
      DO UPDATE SET tipo = EXCLUDED.tipo;
    `,
      [idResponsavel, aluno.id_aluno, tipoVinculo]
    );

    // -----------------------------
    // 8) Commit final
    // -----------------------------
    await client.query("COMMIT");

    // -----------------------------
    // 9) Retornar aluno + responsável
    // -----------------------------
    return res.status(201).json({
      ...aluno,
      responsavel: {
        id_responsavel: idResponsavel,
        nome_completo: rNome,
        cpf: rCpf,
        telefone: rTel,
        telefone_recado1,
        telefone_recado2,
        parentesco,
        tipo: tipoVinculo,
      },
    });
  } catch (e) {
    // se der qualquer erro, garantimos o ROLLBACK
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignora erro de rollback
    }
    const status = 500;
    return res
      .status(status)
      .json({ error: "Erro ao criar aluno (com responsável)", details: e.message });
  } finally {
    client.release();
  }
}

/** PUT /alunos/:id  (atualização parcial com COALESCE, incluindo CEP) */
export async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const {
      nome_completo,
      data_nascimento,
      sexo,
      cpf,
      telefone,
      escola_atual,
      serie_atual,
      periodo_escolar,
      nome_rua,
      numero_endereco,
      bairro,
      data_matricula,
      observacoes,
      cep,
    } = req.body;

    const update = `
      UPDATE public.aluno SET
        nome_completo   = COALESCE($1, nome_completo),
        data_nascimento = COALESCE($2, data_nascimento),
        sexo            = COALESCE($3, sexo),
        cpf             = COALESCE($4, cpf),
        telefone        = COALESCE($5, telefone),
        escola_atual    = COALESCE($6, escola_atual),
        serie_atual     = COALESCE($7, serie_atual),
        periodo_escolar = COALESCE($8, periodo_escolar),
        nome_rua        = COALESCE($9, nome_rua),
        numero_endereco = COALESCE($10, numero_endereco),
        bairro          = COALESCE($11, bairro),
        data_matricula  = COALESCE($12, data_matricula),
        observacoes     = COALESCE($13, observacoes),
        cep             = COALESCE($14, cep)
      WHERE id_aluno = $15
      RETURNING *;
    `;
    const params = [
      nome_completo ?? null, // 1
      data_nascimento ?? null, // 2
      sexo ?? null, // 3
      cpf ?? null, // 4
      telefone ?? null, // 5
      escola_atual ?? null, // 6
      (serie_atual !== undefined ? toInt(serie_atual) : null), // 7
      periodo_escolar ?? null, // 8
      nome_rua ?? null, // 9
      (numero_endereco !== undefined ? toInt(numero_endereco) : null), // 10
      bairro ?? null, // 11
      data_matricula ?? null, // 12
      (observacoes !== undefined ? observacoes : null), // 13
      cep ?? null, // 14
      id, // 15
    ];

    const { rows } = await db.query(update, params);
    if (!rows.length) return res.status(404).json({ error: "Aluno não encontrado" });
    res.json(rows[0]);
  } catch (e) {
    const status = e.code === "23505" ? 409 : 500;
    res.status(status).json({ error: "Erro ao atualizar aluno", details: e.message });
  }
}

/** DELETE /alunos/:id */
export async function remover(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query(`DELETE FROM public.aluno WHERE id_aluno = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: "Aluno não encontrado" });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: "Erro ao remover aluno", details: e.message });
  }
}

/** GET /alunos/resumo  (id_matricula, nome do aluno, cpf, nome do responsável principal) */
export async function listarResumo(req, res) {
  try {
    const sql = `
      SELECT
        m.id_matricula,
        a.nome_completo AS nome_aluno,
        a.cpf,
        r.nome_responsavel
      FROM public.matricula m
      JOIN public.aluno a
        ON a.id_aluno = m.aluno_id_aluno
      LEFT JOIN LATERAL (
        SELECT
          resp.nome_completo AS nome_responsavel
        FROM public.responsavel_aluno ra
        JOIN public.responsavel resp
          ON resp.id_responsavel = ra.responsavel_id_responsavel
        WHERE ra.aluno_id_aluno = a.id_aluno
        ORDER BY
          CASE WHEN ra.tipo = 'principal' THEN 0 ELSE 1 END,
          resp.id_responsavel
        LIMIT 1
      ) r ON TRUE
      ORDER BY m.id_matricula;
    `;

    const { rows } = await db.query(sql);
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao listar resumo de alunos",
      details: e.message,
    });
  }
}
