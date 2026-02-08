--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: gestor_admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO gestor_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archivos; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.archivos (
    id integer NOT NULL,
    entrega_id integer,
    nombre_archivo character varying(255) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    tipo_mime character varying(100),
    tamano_bytes integer,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.archivos OWNER TO gestor_admin;

--
-- Name: archivos_curso; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.archivos_curso (
    id integer NOT NULL,
    curso_id integer NOT NULL,
    nombre_archivo text NOT NULL,
    ruta_archivo text NOT NULL,
    tipo_mime text,
    tamano_bytes integer,
    fecha_subida timestamp without time zone DEFAULT now()
);


ALTER TABLE public.archivos_curso OWNER TO gestor_admin;

--
-- Name: archivos_curso_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.archivos_curso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.archivos_curso_id_seq OWNER TO gestor_admin;

--
-- Name: archivos_curso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.archivos_curso_id_seq OWNED BY public.archivos_curso.id;


--
-- Name: archivos_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.archivos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.archivos_id_seq OWNER TO gestor_admin;

--
-- Name: archivos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.archivos_id_seq OWNED BY public.archivos.id;


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.cursos (
    id integer NOT NULL,
    nombre_grupo character varying(100) NOT NULL,
    tipo character varying(20) NOT NULL,
    maestro_id integer,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    archivo_adjunto character varying(500),
    archivo_nombre character varying(255),
    CONSTRAINT cursos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['servicio_social'::character varying, 'taller_curso'::character varying])::text[])))
);


ALTER TABLE public.cursos OWNER TO gestor_admin;

--
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.cursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cursos_id_seq OWNER TO gestor_admin;

--
-- Name: cursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.cursos_id_seq OWNED BY public.cursos.id;


--
-- Name: entregas; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.entregas (
    id integer NOT NULL,
    tarea_id integer,
    alumno_id integer,
    fecha_entrega timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comentario text,
    calificacion integer,
    horas_registradas integer DEFAULT 0,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_revision timestamp without time zone,
    comentario_revision text,
    CONSTRAINT entregas_calificacion_check CHECK (((calificacion >= 0) AND (calificacion <= 100))),
    CONSTRAINT entregas_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'revisada'::character varying, 'aprobada'::character varying, 'rechazada'::character varying])::text[])))
);


ALTER TABLE public.entregas OWNER TO gestor_admin;

--
-- Name: entregas_avances; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.entregas_avances (
    id integer NOT NULL,
    entrega_id integer NOT NULL,
    alumno_id integer NOT NULL,
    archivo_url text,
    comentario text,
    horas_asignadas numeric(5,2) DEFAULT 0,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_entrega timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    revisado_por integer,
    fecha_revision timestamp without time zone,
    tarea_id integer,
    es_final boolean DEFAULT false,
    CONSTRAINT entregas_avances_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[])))
);


ALTER TABLE public.entregas_avances OWNER TO gestor_admin;

--
-- Name: entregas_avances_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.entregas_avances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entregas_avances_id_seq OWNER TO gestor_admin;

--
-- Name: entregas_avances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.entregas_avances_id_seq OWNED BY public.entregas_avances.id;


--
-- Name: entregas_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.entregas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entregas_id_seq OWNER TO gestor_admin;

--
-- Name: entregas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.entregas_id_seq OWNED BY public.entregas.id;


--
-- Name: inscripciones; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.inscripciones (
    id integer NOT NULL,
    alumno_id integer,
    curso_id integer,
    fecha_inscripcion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    horas_completadas integer DEFAULT 0,
    activo boolean DEFAULT true
);


ALTER TABLE public.inscripciones OWNER TO gestor_admin;

--
-- Name: inscripciones_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.inscripciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inscripciones_id_seq OWNER TO gestor_admin;

--
-- Name: inscripciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.inscripciones_id_seq OWNED BY public.inscripciones.id;


--
-- Name: tareas; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.tareas (
    id integer NOT NULL,
    curso_id integer,
    titulo character varying(200) NOT NULL,
    descripcion text,
    prioridad character varying(20) NOT NULL,
    fecha_vencimiento timestamp without time zone,
    asignacion_horas integer,
    limite_alumnos integer,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    archivo_instrucciones character varying(500),
    CONSTRAINT tareas_prioridad_check CHECK (((prioridad)::text = ANY ((ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'urgente'::character varying])::text[])))
);


ALTER TABLE public.tareas OWNER TO gestor_admin;

--
-- Name: COLUMN tareas.archivo_instrucciones; Type: COMMENT; Schema: public; Owner: gestor_admin
--

COMMENT ON COLUMN public.tareas.archivo_instrucciones IS 'Ruta del archivo de instrucciones subido por el maestro';


--
-- Name: tareas_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.tareas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tareas_id_seq OWNER TO gestor_admin;

--
-- Name: tareas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.tareas_id_seq OWNED BY public.tareas.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: gestor_admin
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    matricula character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    tipo_usuario character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    horas_acumuladas integer DEFAULT 0,
    CONSTRAINT usuarios_tipo_usuario_check CHECK (((tipo_usuario)::text = ANY ((ARRAY['administrador'::character varying, 'maestro'::character varying, 'alumno'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO gestor_admin;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: gestor_admin
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO gestor_admin;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gestor_admin
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: archivos id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos ALTER COLUMN id SET DEFAULT nextval('public.archivos_id_seq'::regclass);


--
-- Name: archivos_curso id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos_curso ALTER COLUMN id SET DEFAULT nextval('public.archivos_curso_id_seq'::regclass);


--
-- Name: cursos id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.cursos ALTER COLUMN id SET DEFAULT nextval('public.cursos_id_seq'::regclass);


--
-- Name: entregas id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas ALTER COLUMN id SET DEFAULT nextval('public.entregas_id_seq'::regclass);


--
-- Name: entregas_avances id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances ALTER COLUMN id SET DEFAULT nextval('public.entregas_avances_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.inscripciones ALTER COLUMN id SET DEFAULT nextval('public.inscripciones_id_seq'::regclass);


--
-- Name: tareas id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.tareas ALTER COLUMN id SET DEFAULT nextval('public.tareas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: archivos; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.archivos (id, entrega_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, uploaded_at) FROM stdin;
29	56	int.png	/uploads/avances/0/1765383278241-int.png	image/png	\N	2025-12-10 10:14:38.448255
31	58	sup.png	/uploads/avances/0/1770498612334-sup.png	image/png	\N	2026-02-07 15:10:12.677666
\.


--
-- Data for Name: archivos_curso; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.archivos_curso (id, curso_id, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, fecha_subida) FROM stdin;
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.cursos (id, nombre_grupo, tipo, maestro_id, descripcion, activo, created_at, updated_at, archivo_adjunto, archivo_nombre) FROM stdin;
16	SS Administracion	servicio_social	18	mmm	t	2025-12-09 17:43:07.04362	2025-12-09 17:43:07.04362	\N	\N
17	Test de Maestro 1	taller_curso	2	Este curso solo sirve para poder crear una tarea	t	2025-12-10 10:11:49.711962	2025-12-10 10:11:49.711962	\N	\N
15	nuevo curso	servicio_social	18	nuevo curso	f	2025-12-09 17:36:13.273313	2025-12-20 20:11:53.427977	\N	\N
\.


--
-- Data for Name: entregas; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.entregas (id, tarea_id, alumno_id, fecha_entrega, comentario, calificacion, horas_registradas, estado, fecha_revision, comentario_revision) FROM stdin;
56	38	15	2025-12-10 10:14:38.446023	holaaaa	\N	0	aprobada	2025-12-10 10:15:16.870903	Aprobada
58	39	15	2026-02-07 15:10:12.671968	AAA	\N	12	pendiente	\N	\N
\.


--
-- Data for Name: entregas_avances; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.entregas_avances (id, entrega_id, alumno_id, archivo_url, comentario, horas_asignadas, estado, fecha_entrega, revisado_por, fecha_revision, tarea_id, es_final) FROM stdin;
35	56	15	\N	Entrega directa	0.00	pendiente	2025-12-10 10:14:38.450206	\N	\N	38	t
37	58	15	\N	Entrega directa	0.00	pendiente	2026-02-07 15:10:12.681871	\N	\N	39	t
\.


--
-- Data for Name: inscripciones; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.inscripciones (id, alumno_id, curso_id, fecha_inscripcion, horas_completadas, activo) FROM stdin;
13	14	16	2025-12-09 17:44:38.78169	0	t
14	15	17	2025-12-10 10:13:07.028286	0	t
15	15	15	2025-12-20 19:37:58.478526	0	f
16	15	16	2025-12-20 20:24:54.623605	0	t
\.


--
-- Data for Name: tareas; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.tareas (id, curso_id, titulo, descripcion, prioridad, fecha_vencimiento, asignacion_horas, limite_alumnos, activo, created_at, updated_at, archivo_instrucciones) FROM stdin;
36	16	Primer reporte	se hiceron las siguientes actividades\r\nact1\r\nact2\r\nact3	media	\N	30	2	t	2025-12-09 17:44:26.201008	2025-12-09 17:44:26.201008	\N
37	16	Segundo reporte	actividades\r\nact1\r\nact2	media	\N	20	2	t	2025-12-09 17:45:08.495695	2025-12-09 17:45:08.495695	\N
38	17	Tarea de muestra	Tarea para poder ver las modales	media	\N	\N	\N	t	2025-12-10 10:12:08.564071	2025-12-10 10:12:08.564071	\N
39	16	Test de Tareas ultia	ANtes de subir al servidor, testeando sistema	media	\N	12	2	t	2026-01-28 22:00:42.566767	2026-01-28 22:00:42.566767	\N
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: gestor_admin
--

COPY public.usuarios (id, matricula, nombre, apellidos, email, tipo_usuario, password_hash, activo, created_at, updated_at, horas_acumuladas) FROM stdin;
1	ADMIN001	Administrador	Sistema	admin@escuela.edu	administrador	$2b$10$zOzfG6hj88FavHXwUv886OEy0fuod.Hgg5ifRJwuIyF.yPWK/A9f.	t	2025-10-19 13:42:54.019754	2025-10-19 14:17:26.377893	0
15	22480957	Angela	Moreno Sanchez 	angela@gmail.com	alumno	$2b$10$CwRBhxc.9VenmxyUZ3vhEe/pFbfG4BTCoiZXZB1v60je3fjKz9YQK	t	2025-12-09 12:53:18.197039	2025-12-09 13:01:21.689886	0
3	MAES002	María	López Hernández	maria.lopez@escuela.edu	maestro	$2b$10$UWafrt1EHevi1qp4HCmuYeYio5UYcUY..TvvjTNBTvdkgIBVlzuS.	t	2025-10-19 13:42:54.019754	2025-12-09 14:08:58.147076	0
14	10234509	Jenifer Elena	Hernandez Lara 	jenilara@correo.com	alumno	$2b$10$Qdqy//yHPKsZo8Gb2QHci.DY5JnozChwQPvHnA0XIk/9ejpj7Kx3C	t	2025-12-09 12:13:30.11241	2025-12-09 14:10:59.911968	0
18	MAES003	Antonio	Martinez Aguilar	antonioAguilar@gmail.com	maestro	$2b$10$3AYCFXxabx1Thrdk5p2vu.EKd0.0v.69mWFPpWgYN.ocTQkAT3T7S	t	2025-12-09 17:16:50.915261	2025-12-09 17:16:50.915261	0
2	MAES001	Juan	Pérez García	juan.perez@escuela.edu	maestro	$2b$10$6M3K/EZiBPvmOhdo3InhgOFB6HAqAUqL0XducLibTQuCqUkY4fmYG	t	2025-10-19 13:42:54.019754	2025-12-09 12:25:33.91069	0
\.


--
-- Name: archivos_curso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.archivos_curso_id_seq', 2, true);


--
-- Name: archivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.archivos_id_seq', 31, true);


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.cursos_id_seq', 18, true);


--
-- Name: entregas_avances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.entregas_avances_id_seq', 37, true);


--
-- Name: entregas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.entregas_id_seq', 58, true);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.inscripciones_id_seq', 16, true);


--
-- Name: tareas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.tareas_id_seq', 39, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gestor_admin
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 18, true);


--
-- Name: archivos_curso archivos_curso_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos_curso
    ADD CONSTRAINT archivos_curso_pkey PRIMARY KEY (id);


--
-- Name: archivos archivos_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_pkey PRIMARY KEY (id);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- Name: entregas_avances entregas_avances_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances
    ADD CONSTRAINT entregas_avances_pkey PRIMARY KEY (id);


--
-- Name: entregas entregas_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_pkey PRIMARY KEY (id);


--
-- Name: entregas entregas_tarea_id_alumno_id_key; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_tarea_id_alumno_id_key UNIQUE (tarea_id, alumno_id);


--
-- Name: inscripciones inscripciones_alumno_id_curso_id_key; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_alumno_id_curso_id_key UNIQUE (alumno_id, curso_id);


--
-- Name: inscripciones inscripciones_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_pkey PRIMARY KEY (id);


--
-- Name: tareas tareas_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_matricula_key; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_matricula_key UNIQUE (matricula);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_archivos_curso_curso_id; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_archivos_curso_curso_id ON public.archivos_curso USING btree (curso_id);


--
-- Name: idx_archivos_entrega; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_archivos_entrega ON public.archivos USING btree (entrega_id);


--
-- Name: idx_cursos_activo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_cursos_activo ON public.cursos USING btree (activo);


--
-- Name: idx_cursos_archivo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_cursos_archivo ON public.cursos USING btree (archivo_adjunto);


--
-- Name: idx_cursos_maestro; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_cursos_maestro ON public.cursos USING btree (maestro_id);


--
-- Name: idx_cursos_tipo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_cursos_tipo ON public.cursos USING btree (tipo);


--
-- Name: idx_entregas_alumno; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_entregas_alumno ON public.entregas USING btree (alumno_id);


--
-- Name: idx_entregas_estado; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_entregas_estado ON public.entregas USING btree (estado);


--
-- Name: idx_entregas_tarea; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_entregas_tarea ON public.entregas USING btree (tarea_id);


--
-- Name: idx_inscripciones_activo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_inscripciones_activo ON public.inscripciones USING btree (activo);


--
-- Name: idx_inscripciones_alumno; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_inscripciones_alumno ON public.inscripciones USING btree (alumno_id);


--
-- Name: idx_inscripciones_curso; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_inscripciones_curso ON public.inscripciones USING btree (curso_id);


--
-- Name: idx_tareas_activo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_tareas_activo ON public.tareas USING btree (activo);


--
-- Name: idx_tareas_curso; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_tareas_curso ON public.tareas USING btree (curso_id);


--
-- Name: idx_tareas_fecha_vencimiento; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_tareas_fecha_vencimiento ON public.tareas USING btree (fecha_vencimiento);


--
-- Name: idx_tareas_prioridad; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_tareas_prioridad ON public.tareas USING btree (prioridad);


--
-- Name: idx_usuarios_activo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_usuarios_activo ON public.usuarios USING btree (activo);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_matricula; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_usuarios_matricula ON public.usuarios USING btree (matricula);


--
-- Name: idx_usuarios_tipo; Type: INDEX; Schema: public; Owner: gestor_admin
--

CREATE INDEX idx_usuarios_tipo ON public.usuarios USING btree (tipo_usuario);


--
-- Name: cursos update_cursos_updated_at; Type: TRIGGER; Schema: public; Owner: gestor_admin
--

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tareas update_tareas_updated_at; Type: TRIGGER; Schema: public; Owner: gestor_admin
--

CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usuarios update_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: gestor_admin
--

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: archivos_curso archivos_curso_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos_curso
    ADD CONSTRAINT archivos_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: archivos archivos_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id) ON DELETE CASCADE;


--
-- Name: cursos cursos_maestro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_maestro_id_fkey FOREIGN KEY (maestro_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: entregas entregas_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: entregas_avances entregas_avances_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances
    ADD CONSTRAINT entregas_avances_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: entregas_avances entregas_avances_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances
    ADD CONSTRAINT entregas_avances_entrega_id_fkey FOREIGN KEY (entrega_id) REFERENCES public.entregas(id) ON DELETE CASCADE;


--
-- Name: entregas_avances entregas_avances_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances
    ADD CONSTRAINT entregas_avances_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.usuarios(id);


--
-- Name: entregas_avances entregas_avances_tarea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas_avances
    ADD CONSTRAINT entregas_avances_tarea_id_fkey FOREIGN KEY (tarea_id) REFERENCES public.tareas(id) ON DELETE CASCADE;


--
-- Name: entregas entregas_tarea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_tarea_id_fkey FOREIGN KEY (tarea_id) REFERENCES public.tareas(id) ON DELETE CASCADE;


--
-- Name: inscripciones inscripciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: inscripciones inscripciones_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: tareas tareas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gestor_admin
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

