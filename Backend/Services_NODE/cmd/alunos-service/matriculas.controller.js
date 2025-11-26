import db from "../db.js";

// helper
const toInt = (v) =>
  v === undefined || v === null || v === "" ? null : parseInt(v, 10);

/**
 * GET /matriculas
 * Lista matrículas com filtros opcionais:
 *  - nome (aluno)
 *  - cpf  (aluno)
 *  - curso (id_curso)
 *  - turma (id_turma)
 *  - status
 * Retorna dados resumidos para exibir em tabela.
 */
export async function listarMatriculas(req, res) {
  try {
    const { nome, cpf, curso, turma, status } = req.query;
    const where = [];
    const params = [];

    if (nome) {
      params.push(`%${nome}%`);
      where.push(`a.nome_completo ILIKE $${params.length}`);
    }

    if (cpf) {
      params.push(`%${cpf}%`);
      where.push(`a.cpf ILIKE $${params.length}`);
    }

    if (curso) {
      params.push(toInt(curso));
      where.push(`c.id_curso = $${params.length}`);
    }

    if (turma) {
      params.push(toInt(turma));
      where.push(`t.id_turma = $${params.length}`);
    }

    if (status) {
      params.push(status);
      where.push(`m.status = $${params.length}`);
    }

    const sql = `
      SELECT
        m.id_matricula,
        m.status,
        m.data_matricula,
        a.id_aluno,
        a.nome_completo       AS nome_aluno,
        a.cpf,
        a.telefone            AS telefone_aluno,
        c.id_curso,
        c.nome                AS curso,
        t.id_turma,
        t.nome_turma          AS turma,
        r.nome_completo       AS nome_responsavel,
        r.telefone            AS telefone_responsavel
      FROM public.matricula m
      JOIN public.aluno a
        ON a.id_aluno = m.aluno_id_aluno
      JOIN public.turma t
        ON t.id_turma = m.turmas_id_turma
      JOIN public.curso c
        ON c.id_curso = t.cursos_id_curso
      LEFT JOIN public.responsavel_aluno ra
        ON ra.aluno_id_aluno = a.id_aluno
       AND ra.tipo = 'principal'
      LEFT JOIN public.responsavel r
        ON r.id_responsavel = ra.responsavel_id_responsavel
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY m.id_matricula DESC;
    `;

    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Erro ao listar matrículas", details: e.message });
  }
}

/**
 * GET /matriculas/:id
 * Busca todos os dados necessários para preencher a tela completa
 * da matrícula (aluno, curso, turma, responsáveis, documentos).
 */
export async function obterMatricula(req, res) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        m.id_matricula,
        m.status,
        m.data_matricula        AS data_matricula_matricula,
        a.id_aluno,
        a.nome_completo,
        a.data_nascimento,
        a.sexo,
        a.cpf,
        a.telefone,
        a.escola_atual,
        a.serie_atual,
        a.periodo_escolar,
        a.nome_rua,
        a.numero_endereco,
        a.bairro,
        a.cep,
        a.observacoes,
        t.id_turma,
        t.nome_turma,
        t.dia_semana,
        t.hora_inicio,
        t.hora_fim,
        c.id_curso,
        c.nome AS nome_curso
      FROM public.matricula m
      JOIN public.aluno a
        ON a.id_aluno = m.aluno_id_aluno
      JOIN public.turma t
        ON t.id_turma = m.turmas_id_turma
      JOIN public.curso c
        ON c.id_curso = t.cursos_id_curso
      WHERE m.id_matricula = $1;
    `;

    const { rows } = await db.query(sql, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Matrícula não encontrada" });
    }

    const base = rows[0];

    const { rows: respRows } = await db.query(
      `
      SELECT
        r.id_responsavel,
        r.nome_completo,
        r.cpf,
        r.telefone,
        r.telefone_recado1,
        r.telefone_recado2,
        r.parentesco,
        ra.tipo
      FROM public.responsavel_aluno ra
      JOIN public.responsavel r
        ON r.id_responsavel = ra.responsavel_id_responsavel
      WHERE ra.aluno_id_aluno = $1
      ORDER BY (ra.tipo = 'principal') DESC, r.nome_completo;
      `,
      [base.id_aluno]
    );

    const { rows: docsRows } = await db.query(
      `
      SELECT
        id_documento,
        tipo_documento,
        caminho_arquivo,
        data_upload
      FROM public.documentoaluno
      WHERE aluno_id_aluno = $1
      ORDER BY id_documento;
      `,
      [base.id_aluno]
    );

    return res.json({
      id_matricula: base.id_matricula,
      status: base.status,
      data_matricula: base.data_matricula_matricula,
      aluno: {
        id_aluno: base.id_aluno,
        nome_completo: base.nome_completo,
        data_nascimento: base.data_nascimento,
        sexo: base.sexo,
        cpf: base.cpf,
        telefone: base.telefone,
        escola_atual: base.escola_atual,
        serie_atual: base.serie_atual,
        periodo_escolar: base.periodo_escolar,
        nome_rua: base.nome_rua,
        numero_endereco: base.numero_endereco,
        bairro: base.bairro,
        cep: base.cep,
        observacoes: base.observacoes,
      },
      curso: {
        id_curso: base.id_curso,
        nome: base.nome_curso,
      },
      turma: {
        id_turma: base.id_turma,
        nome_turma: base.nome_turma,
        dia_semana: base.dia_semana,
        hora_inicio: base.hora_inicio,
        hora_fim: base.hora_fim,
      },
      responsaveis: respRows,
      documentos: docsRows,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Erro ao obter matrícula", details: e.message });
  }
}

/**
 * POST /matriculas
 * Cria:
 *  - aluno
 *  - responsável (novo ou existente)
 *  - vínculo aluno-responsável
 *  - matrícula (ligando aluno + turma)
 *  - documentos (opcional)
 * Tudo em uma única transação.
 */
export async function criarMatricula(req, res) {
  const client = await db.getClient();

  try {
    const { aluno, responsavel, matricula, documentos } = req.body;

    if (!aluno || !responsavel || !matricula) {
      return res.status(400).json({
        error:
          "É obrigatório enviar 'aluno', 'responsavel' e 'matricula' no corpo da requisição.",
      });
    }

    const requiredAluno = [
      "nome_completo",
      "data_nascimento",
      "sexo",
      "cpf",
      "telefone",
      "escola_atual",
      "serie_atual",
      "periodo_escolar",
      "nome_rua",
      "numero_endereco",
      "bairro",
      "data_matricula",
      "observacoes",
    ];

    const faltandoAluno = requiredAluno.filter((k) => !aluno[k]);
    if (faltandoAluno.length) {
      return res.status(400).json({
        error: "Campos obrigatórios do aluno ausentes",
        campos: faltandoAluno,
      });
    }

    const requiredResp = [
      "nome_completo",
      "cpf",
      "telefone",
      "telefone_recado1",
      "telefone_recado2",
      "parentesco",
    ];

    const faltandoResp = requiredResp.filter((k) => !responsavel[k]);
    if (faltandoResp.length) {
      return res.status(400).json({
        error: "Campos obrigatórios do responsável ausentes",
        campos: faltandoResp,
      });
    }

    if (!matricula.turmas_id_turma) {
      return res.status(400).json({
        error: "Para matricular é necessário informar 'turmas_id_turma'.",
      });
    }

    await client.query("BEGIN");

    const insertAluno = `
      INSERT INTO public.aluno (
        nome_completo, data_nascimento, sexo, cpf, telefone,
        escola_atual, serie_atual, periodo_escolar,
        nome_rua, numero_endereco, bairro,
        data_matricula, observacoes, cep
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *;
    `;

    const alunoParams = [
      aluno.nome_completo,
      aluno.data_nascimento,
      aluno.sexo,
      aluno.cpf,
      aluno.telefone,
      aluno.escola_atual,
      aluno.serie_atual,
      aluno.periodo_escolar,
      aluno.nome_rua,
      aluno.numero_endereco,
      aluno.bairro,
      aluno.data_matricula,
      aluno.observacoes,
      aluno.cep ?? null,
    ];

    const { rows: alunoRows } = await client.query(insertAluno, alunoParams);
    const novoAluno = alunoRows[0];

    const { cpf: rCpf } = responsavel;

    const { rows: existentes } = await client.query(
      "SELECT id_responsavel FROM public.responsavel WHERE cpf = $1",
      [rCpf]
    );

    let idResponsavel;

    if (existentes.length) {
      idResponsavel = existentes[0].id_responsavel;
    } else {
      const insertResp = `
        INSERT INTO public.responsavel
          (nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id_responsavel;
      `;

      const { rows: respRows } = await client.query(insertResp, [
        responsavel.nome_completo,
        responsavel.cpf,
        responsavel.telefone,
        responsavel.telefone_recado1,
        responsavel.telefone_recado2,
        responsavel.parentesco,
      ]);

      idResponsavel = respRows[0].id_responsavel;
    }

    const tipoVinculo = responsavel.tipo || "principal";

    await client.query(
      `
      INSERT INTO public.responsavel_aluno
        (responsavel_id_responsavel, aluno_id_aluno, tipo)
      VALUES ($1,$2,$3)
      ON CONFLICT (responsavel_id_responsavel, aluno_id_aluno)
      DO UPDATE SET tipo = EXCLUDED.tipo;
    `,
      [idResponsavel, novoAluno.id_aluno, tipoVinculo]
    );

    const insertMatricula = `
      INSERT INTO public.matricula
        (aluno_id_aluno, turmas_id_turma, data_matricula, status)
      VALUES ($1,$2,NOW(),$3)
      RETURNING *;
    `;

    const statusMat = matricula.status || "ativo";

    const { rows: matRows } = await client.query(insertMatricula, [
      novoAluno.id_aluno,
      matricula.turmas_id_turma,
      statusMat,
    ]);

    const novaMatricula = matRows[0];

    let docsCriados = [];

    if (Array.isArray(documentos) && documentos.length > 0) {
      for (const doc of documentos) {
        const insertDoc = `
          INSERT INTO public.documentoaluno
            (aluno_id_aluno, tipo_documento, caminho_arquivo, data_upload)
          VALUES ($1,$2,$3,NOW())
          RETURNING *;
        `;

        const { rows: docRows } = await client.query(insertDoc, [
          novoAluno.id_aluno,
          doc.tipo_documento,
          doc.caminho_arquivo,
        ]);

        docsCriados.push(docRows[0]);
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Matrícula criada com sucesso!",
      aluno: novoAluno,
      responsavel: { id_responsavel: idResponsavel, ...responsavel },
      matricula: novaMatricula,
      documentos: docsCriados,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return res.status(500).json({
      error: "Erro ao criar matrícula",
      details: error.message,
    });
  } finally {
    client.release();
  }
}

/**
 * PUT /matriculas/:id
 * Atualiza dados da matrícula (aluno, responsável, matrícula, documentos).
 * Todos os campos são opcionais: só o que vier no body é atualizado.
 */
export async function atualizarMatricula(req, res) {
  const { id } = req.params;
  const { aluno, responsavel, matricula, documentos } = req.body;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // verifica se matrícula existe
    const { rows: matRows } = await client.query(
      "SELECT * FROM public.matricula WHERE id_matricula = $1",
      [id]
    );

    if (!matRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Matrícula não encontrada" });
    }

    const matriculaAtual = matRows[0];
    const idAluno = matriculaAtual.aluno_id_aluno;

    // ----------------------------------
    // 1) Atualizar dados do aluno (se vier)
    // ----------------------------------
    if (aluno) {
      const campos = [];
      const valores = [];
      let idx = 1;

      const camposPossiveis = [
        "nome_completo",
        "data_nascimento",
        "sexo",
        "cpf",
        "telefone",
        "escola_atual",
        "serie_atual",
        "periodo_escolar",
        "nome_rua",
        "numero_endereco",
        "bairro",
        "data_matricula",
        "observacoes",
        "cep",
      ];

      for (const campo of camposPossiveis) {
        if (aluno[campo] !== undefined) {
          campos.push(`${campo} = $${idx++}`);
          valores.push(aluno[campo]);
        }
      }

      if (campos.length) {
        valores.push(idAluno);
        await client.query(
          `UPDATE public.aluno SET ${campos.join(", ")} WHERE id_aluno = $${idx}`,
          valores
        );
      }
    }

    // ----------------------------------
    // 2) Atualizar / trocar responsável (se vier)
    //    Mesma lógica do POST: procura por CPF, reutiliza ou cria
    // ----------------------------------
    let idResponsavel = null;

    if (responsavel) {
      const rCpf = responsavel.cpf;

      const { rows: existentes } = await client.query(
        "SELECT * FROM public.responsavel WHERE cpf = $1",
        [rCpf]
      );

      if (existentes.length) {
        idResponsavel = existentes[0].id_responsavel;

        // opcional: atualiza dados desse responsável com o que veio no body
        const camposR = [];
        const valoresR = [];
        let i = 1;
        const camposResp = [
          "nome_completo",
          "telefone",
          "telefone_recado1",
          "telefone_recado2",
          "parentesco",
        ];

        for (const campo of camposResp) {
          if (responsavel[campo] !== undefined) {
            camposR.push(`${campo} = $${i++}`);
            valoresR.push(responsavel[campo]);
          }
        }

        if (camposR.length) {
          valoresR.push(idResponsavel);
          await client.query(
            `UPDATE public.responsavel SET ${camposR.join(
              ", "
            )} WHERE id_responsavel = $${i}`,
            valoresR
          );
        }
      } else {
        const insertResp = `
          INSERT INTO public.responsavel
            (nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco)
          VALUES ($1,$2,$3,$4,$5,$6)
          RETURNING id_responsavel;
        `;

        const { rows: respRows } = await client.query(insertResp, [
          responsavel.nome_completo,
          responsavel.cpf,
          responsavel.telefone,
          responsavel.telefone_recado1,
          responsavel.telefone_recado2,
          responsavel.parentesco,
        ]);

        idResponsavel = respRows[0].id_responsavel;
      }

      const tipoVinculo = responsavel.tipo || "principal";

      await client.query(
        `
        INSERT INTO public.responsavel_aluno
          (responsavel_id_responsavel, aluno_id_aluno, tipo)
        VALUES ($1,$2,$3)
        ON CONFLICT (responsavel_id_responsavel, aluno_id_aluno)
        DO UPDATE SET tipo = EXCLUDED.tipo;
      `,
        [idResponsavel, idAluno, tipoVinculo]
      );
    }

    // ----------------------------------
    // 3) Atualizar matrícula (status / turma)
    // ----------------------------------
    if (matricula) {
      const camposM = [];
      const valoresM = [];
      let j = 1;

      if (matricula.turmas_id_turma !== undefined) {
        camposM.push(`turmas_id_turma = $${j++}`);
        valoresM.push(matricula.turmas_id_turma);
      }

      if (matricula.status !== undefined) {
        camposM.push(`status = $${j++}`);
        valoresM.push(matricula.status);
      }

      if (camposM.length) {
        valoresM.push(id);
        await client.query(
          `UPDATE public.matricula SET ${camposM.join(
            ", "
          )} WHERE id_matricula = $${j}`,
          valoresM
        );
      }
    }

    // ----------------------------------
    // 4) Atualizar documentos
    //    Regra: se "documentos" vier (array), substitui todos do aluno
    // ----------------------------------
    let docsAtualizados = null;

    if (Array.isArray(documentos)) {
      await client.query(
        "DELETE FROM public.documentoaluno WHERE aluno_id_aluno = $1",
        [idAluno]
      );

      docsAtualizados = [];

      for (const doc of documentos) {
        const insertDoc = `
          INSERT INTO public.documentoaluno
            (aluno_id_aluno, tipo_documento, caminho_arquivo, data_upload)
          VALUES ($1,$2,$3,NOW())
          RETURNING *;
        `;

        const { rows: docRows } = await client.query(insertDoc, [
          idAluno,
          doc.tipo_documento,
          doc.caminho_arquivo,
        ]);

        docsAtualizados.push(docRows[0]);
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Matrícula atualizada com sucesso!",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      error: "Erro ao atualizar matrícula",
      details: error.message,
    });
  } finally {
    client.release();
  }
}
