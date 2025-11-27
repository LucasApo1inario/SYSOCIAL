
-- TABELA DE CURSOS

create table public.curso (
  id_curso integer generated always as identity not null,
  nome character varying(20) not null,
  vagas_totais integer not null,
  ativo boolean not null default true,
  vagas_restantes integer not null,
  constraint curso_pk primary key (id_curso)
) TABLESPACE pg_default;

-- TABELA DE TURMAS

create table public.turma (
  id_turma integer generated always as identity not null,
  cursos_id_curso integer not null,
  dia_semana character varying(20) not null,
  vagas_turma integer not null,
  nome_turma character varying not null,
  descricao text null,
  hora_inicio time without time zone null,
  hora_fim time without time zone null,
  constraint turma_pk primary key (id_turma),
  constraint possui foreign KEY (cursos_id_curso) references curso (id_curso)
) TABLESPACE pg_default;

create index IF not exists turma_idx_1 on public.turma using btree (cursos_id_curso) TABLESPACE pg_default;
