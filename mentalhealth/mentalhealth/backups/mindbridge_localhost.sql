--
-- PostgreSQL database dump
--

\restrict pTenTZ5dSRoqjsa3U6bZOe1khQ44YGTHyb0I6yIk2bcGvpDRegwJ7vCDcaSjIVD

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: prevent_audit_log_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_audit_log_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    doctor_user_id text NOT NULL,
    patient_user_id text NOT NULL,
    patient jsonb,
    patient_email jsonb,
    appointment_date text NOT NULL,
    appointment_time text NOT NULL,
    notes jsonb,
    status text DEFAULT 'Upcoming'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assessment_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    responses jsonb DEFAULT '[]'::jsonb NOT NULL,
    score integer NOT NULL,
    classification text NOT NULL,
    recommendation text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    user_role text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    ip_address text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id bigint NOT NULL,
    external_id text NOT NULL,
    user_id text NOT NULL,
    messages jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_conversations_id_seq OWNED BY public.chat_conversations.id;


--
-- Name: doctor_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_messages (
    id text NOT NULL,
    doctor_user_id text NOT NULL,
    sender_name text,
    content text,
    message_date text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: doctor_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_slots (
    id text NOT NULL,
    doctor_user_id text NOT NULL,
    doctor_name text,
    slot_date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    user_id text NOT NULL,
    name text,
    specialty text,
    bio text,
    contact text,
    profile_pic text,
    years_of_experience text,
    qualifications text,
    license_number text,
    status_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_chunks (
    id bigint NOT NULL,
    document_key text NOT NULL,
    title text NOT NULL,
    source_path text NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    embedding public.vector(768) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knowledge_chunks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knowledge_chunks_id_seq OWNED BY public.knowledge_chunks.id;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id text NOT NULL,
    post_id text NOT NULL,
    user_id text,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_engagements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_engagements (
    post_id text NOT NULL,
    user_id text NOT NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT post_engagements_reaction_type_check CHECK ((reaction_type = ANY (ARRAY['like'::text, 'save'::text])))
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id text NOT NULL,
    caption text NOT NULL,
    name text,
    location text,
    image text,
    likes integer DEFAULT 0 NOT NULL,
    comments integer DEFAULT 0 NOT NULL,
    saved integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id text NOT NULL,
    birthday jsonb,
    age jsonb,
    gender jsonb,
    phone jsonb,
    address jsonb,
    zipcode text,
    country text,
    city text,
    guardian_name jsonb,
    guardian_phone jsonb,
    guardian_email jsonb,
    illnesses jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    mental_health_context jsonb,
    consent_accepted boolean DEFAULT false NOT NULL,
    consent_accepted_at timestamp with time zone,
    onboarding_completed boolean DEFAULT false NOT NULL,
    onboarding_completed_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text,
    google_id text,
    facebook_id text,
    profile_pic text,
    role text DEFAULT 'patient'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations ALTER COLUMN id SET DEFAULT nextval('public.chat_conversations_id_seq'::regclass);


--
-- Name: knowledge_chunks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks ALTER COLUMN id SET DEFAULT nextval('public.knowledge_chunks_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, doctor_user_id, patient_user_id, patient, patient_email, appointment_date, appointment_time, notes, status, created_at) FROM stdin;
\.


--
-- Data for Name: assessment_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_sessions (id, user_id, responses, score, classification, recommendation, created_at) FROM stdin;
31e3e6e46c0297ca29e6163e	a0a1f16f4e1a0aa6205ca94c	[{"label": "Not at all", "score": 0, "question": "Little interest or pleasure in doing things", "questionId": "d1"}, {"label": "Several days", "score": 1, "question": "Feeling down, depressed, or hopeless", "questionId": "d2"}, {"label": "More than half the days", "score": 2, "question": "Trouble falling or staying asleep, or sleeping too much", "questionId": "d3"}, {"label": "Nearly every day", "score": 3, "question": "Feeling tired or having little energy", "questionId": "d4"}, {"label": "More than half the days", "score": 2, "question": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down", "questionId": "d6"}, {"label": "Several days", "score": 1, "question": "Thoughts that you would be better off dead or of hurting yourself", "questionId": "d9"}]	9	high	Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.	2026-04-30 20:52:01.775+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, user_role, action, resource_type, resource_id, ip_address, "timestamp", metadata) FROM stdin;
ce61f2b6-436e-46c8-8e0e-a5dfbdaed5cf	\N	\N	user_login	auth	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:22:59.575+05:30	{"outcome": "signup", "authProvider": "password"}
4d8c9ee5-517b-4b3a-af45-5655061da40b	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:22:59.674+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
0d2d4bdb-c3ed-4fe0-9eed-e5a21d94da7e	885b7d5a9fe2ff36bd4dedde	patient	update_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:23:53.843+05:30	{"accessScope": "self", "updatedFields": ["name", "email", "profilePic", "birthday", "age", "gender", "phone", "address", "zipcode", "country", "city", "guardianName", "guardianPhone", "guardianEmail", "illnesses"], "updatedUserId": "885b7d5a9fe2ff36bd4dedde"}
e86eab7a-96a2-4bac-b7ec-ce63f5edfd76	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:23:57.62+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
2df427b9-02b3-45f0-a522-cef5819d6c11	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:25:20.838+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
f4d9e04c-cdfa-4c63-959f-790b6cdbf4ae	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:26:15.603+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
1190bf0a-5827-40a7-a84b-ec72a7b171d4	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:26:52.997+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
fca15fc7-57cb-476f-bfcf-85cc206e73a7	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:28:44.166+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
11130594-3932-49c3-a46f-520bfcbdaf24	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:28:44.204+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
205276a6-ac13-4400-ad42-c1d717a062ef	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	appointment	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:28:52.676+05:30	{"accessorType": "patient", "appointmentCount": 0, "accessedPatientId": "885b7d5a9fe2ff36bd4dedde"}
529cf4d2-1a0d-467a-9e06-6795d7b624df	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	appointment	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:28:52.689+05:30	{"accessorType": "patient", "appointmentCount": 0, "accessedPatientId": "885b7d5a9fe2ff36bd4dedde"}
3ac1016a-0f47-46a6-907e-cee7e0b3de98	\N	\N	user_login	auth	e5628bce5d20f8a76be29736	::1	2026-03-14 09:47:43.025+05:30	{"outcome": "success", "authProvider": "password"}
1c556ad5-12d8-490a-8024-56046a41ba12	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:51:59.083+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
246cad40-fad9-4874-9cfe-afa64cf2a40e	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:51:59.096+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
ef3ec932-332c-4e12-af01-f1b6499ece97	\N	\N	user_login	auth	e5628bce5d20f8a76be29736	::1	2026-03-14 09:52:29.874+05:30	{"outcome": "success", "authProvider": "password"}
294c8879-104a-463d-8713-4ad07c8a521e	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:52:31.06+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
20491bf4-1e9d-4ff9-89f9-45298f5ca407	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 09:52:31.069+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
f54c122f-91e3-4591-bda5-5d408032f61c	e5628bce5d20f8a76be29736	admin	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:52:39.219+05:30	{"sources": ["anxiety.txt"], "topSimilarity": 0.7973214029467528, "retrievedChunkCount": 1}
a26fa9b5-8b84-47dc-b763-e97588605563	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 09:53:41.54+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
78b602e4-f6a6-444e-b696-c20668fa197b	\N	\N	user_login	auth	e5628bce5d20f8a76be29736	::1	2026-03-14 10:00:40.457+05:30	{"outcome": "success", "authProvider": "password"}
164b2d6e-80b6-4d9d-bb8b-26b7afb1c8e8	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 10:00:41.062+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
9074e25a-8136-41f7-9a9b-8c1ed479159f	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 10:00:41.072+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
c85d4cd7-625c-4846-abc2-2cc9fcfba2d4	e5628bce5d20f8a76be29736	admin	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 10:00:40.566+05:30	{"sources": ["anxiety.txt"], "topSimilarity": 0.7973214029467528, "retrievedChunkCount": 1}
5071c15b-3b5c-4c54-8528-2c23cfc53d05	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 10:04:07.621+05:30	{"sources": ["anxiety.txt"], "topSimilarity": 0.7973214029467528, "retrievedChunkCount": 1}
894860eb-0f72-4d53-9482-acbf75fc3275	885b7d5a9fe2ff36bd4dedde	patient	rag_chat_query	knowledge_chunks	\N	::1	2026-03-14 10:05:03.073+05:30	{"sources": [], "topSimilarity": null, "retrievedChunkCount": 0}
ebec2cb7-5cda-482f-9ef3-033fb1ce3955	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 10:07:07.519+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
92ccb28f-4c3e-4578-a38f-176362ce3127	885b7d5a9fe2ff36bd4dedde	patient	view_patient_record	profile	885b7d5a9fe2ff36bd4dedde	::1	2026-03-14 10:07:07.553+05:30	{"accessScope": "self", "accessedUserId": "885b7d5a9fe2ff36bd4dedde"}
07bd25e8-ba80-46f1-ad42-6dbd264a46d7	\N	\N	user_login	auth	a0a1f16f4e1a0aa6205ca94c	::1	2026-04-30 20:51:10.411+05:30	{"outcome": "signup", "authProvider": "password"}
5cfcd006-31f9-4ebf-9582-6a4957f267df	a0a1f16f4e1a0aa6205ca94c	patient	view_patient_record	profile	a0a1f16f4e1a0aa6205ca94c	::1	2026-04-30 20:51:10.527+05:30	{"accessScope": "self", "accessedUserId": "a0a1f16f4e1a0aa6205ca94c"}
64efba0f-2ad5-485b-89df-da4b11aa73e2	a0a1f16f4e1a0aa6205ca94c	patient	view_patient_record	profile	a0a1f16f4e1a0aa6205ca94c	::1	2026-04-30 20:51:34.975+05:30	{"accessScope": "self", "accessedUserId": "a0a1f16f4e1a0aa6205ca94c"}
\.


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_conversations (id, external_id, user_id, messages, created_at) FROM stdin;
\.


--
-- Data for Name: doctor_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctor_messages (id, doctor_user_id, sender_name, content, message_date, created_at) FROM stdin;
\.


--
-- Data for Name: doctor_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctor_slots (id, doctor_user_id, doctor_name, slot_date, start_time, end_time, created_at) FROM stdin;
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctors (user_id, name, specialty, bio, contact, profile_pic, years_of_experience, qualifications, license_number, status_message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: knowledge_chunks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_chunks (id, document_key, title, source_path, chunk_index, content, metadata, embedding, created_at, updated_at) FROM stdin;
1	anxiety.txt	Anxiety	/Users/abishek/Mind Bridge - Local/MentalHealthAssistant/mentalhealth/mentalhealth/server/knowledge/anxiety.txt	0	Topic: Anxiety Anxiety is a feeling of worry, nervousness, or unease about something with an uncertain outcome. Common symptoms include: - excessive worrying - restlessness - increased heart rate - difficulty concentrating If anxiety persists for long periods, it may indicate an anxiety disorder and professional medical advice should be considered.	{"fileName": "anxiety.txt"}	[0.047833588,0.025186006,-0.1970758,-0.0028301773,0.048799504,0.008246957,0.016772784,-0.013744947,0.038789514,-0.0599853,-0.0086961435,0.07879018,0.042991024,0.032719318,0.028416237,-0.0065135765,0.009541933,-0.018668124,-0.03755537,0.011935624,-0.039290626,0.021626638,-0.03923258,0.0040327716,0.00958838,0.1019204,0.008190315,-0.007510492,0.028962668,0.027598685,0.023295984,-0.039874773,-0.01223534,0.009615777,-0.08605859,-0.0465224,0.026978739,0.036402788,0.047584612,0.054885827,0.08331911,-0.024073485,0.037195258,-0.07265502,-0.016528537,0.040307485,0.027440928,0.04081604,0.059929203,-0.022427225,-0.016022911,-0.051657826,0.01589911,-0.03371767,0.07856444,0.07077775,0.042193357,0.04553053,-0.00908045,-0.0058513554,0.106431715,-0.008455452,-0.031685185,0.057194848,0.08112591,-0.10138041,-0.030977871,0.013393744,0.014778062,0.003920905,0.09904229,-0.028244767,-0.014879704,0.065670475,-0.06634999,0.015139246,0.01641448,0.0003030243,0.040591024,0.01855005,0.014117588,-0.03416274,0.06762309,-0.009764545,0.062680155,0.0015157366,-0.01105025,-0.042402796,-0.007046331,0.08820188,0.01251004,0.0012352775,0.013615008,0.01343487,-0.061283235,-0.0015365934,0.011414751,0.03350161,-0.04449331,-0.05531979,-0.05095617,0.0078921765,-0.026301445,-0.016547495,-0.027421398,-0.006633068,-0.05882779,-0.026950508,-0.0094271125,-0.008476036,-0.019806407,0.09843002,0.008757305,-0.030028798,0.049667396,-0.030611439,0.044327106,-0.0098558925,0.0044355947,-0.0039279126,0.008041275,0.0022753573,0.008861411,0.063930646,0.018110324,0.04727067,-0.008894738,0.01725236,0.004273704,-0.028521096,0.016022872,-0.020022172,-0.013140003,0.011531172,-0.018942311,0.03892797,-0.033345718,0.029412113,-0.037008625,0.019420097,0.07083361,-0.004994892,0.029493503,-0.05134858,-0.040174603,-0.00797983,0.041662797,-0.06054331,-0.04478193,-0.036295805,0.004836434,-0.0051796306,-0.03038998,0.012667891,0.012066568,0.02173831,-0.040557977,0.04458941,0.046617463,0.015522773,0.026846217,0.02950434,-0.020464443,0.058166828,-0.021857627,-0.07178837,0.0068057785,0.07358296,-0.015555703,0.046760086,-0.026323572,-0.028595474,-0.007618731,-0.023596711,0.04573043,0.009865583,0.0745773,-0.035099145,0.021028608,-0.036506366,0.026176186,-0.026147299,0.053805526,0.005762919,-0.027279288,-0.015819445,0.044834364,-0.029530235,-0.013818109,-0.054015283,0.032939903,-0.009841119,-0.06530232,-0.022000145,-0.01817501,-0.034113567,0.006027906,-0.029897403,0.041640308,-0.03580904,0.014390828,-0.030595548,0.009741603,-0.030783044,-0.026847437,0.06602949,0.032779798,-0.026449256,-0.016140912,0.015637338,0.03013093,-0.06525508,0.014352231,0.013494829,0.039526455,-0.03569495,0.04617826,-0.033892717,-0.0045895446,0.016482174,0.011404026,-0.034037065,-0.03251038,-0.02104835,0.017639551,0.014392202,-0.05104098,-0.049938627,-0.02703725,-0.028296826,-0.0075627584,-0.08873972,0.099996105,0.045092236,-0.0380883,0.021664567,-0.006144788,0.03955867,-0.015773384,0.009049982,-0.001969267,0.05821864,0.026116079,0.010426925,-0.07723283,0.016361795,-0.019446883,-0.020404896,-0.0070619374,0.0032228124,0.009300696,-0.013036463,0.01967678,0.0012916323,0.08645636,-0.059192307,-0.043072667,0.03126298,-0.010454104,-0.013511001,0.031475957,-0.026768237,0.048366327,-0.045455594,-0.058078583,-0.067787044,-0.0062900763,0.03853022,0.013016364,-0.019777765,0.048916914,0.04022376,0.024345974,0.004877615,0.026916666,-0.048032265,0.00860373,-0.018348824,0.011779606,0.0001484531,-0.0151054,0.02653022,-0.029149577,0.02856156,-0.026500713,0.015207307,0.039342433,0.030977642,0.007028935,0.021449164,0.034193207,-0.0057540406,-0.03277555,0.04787463,-0.031722028,0.041569848,0.010462495,0.04055419,0.018698629,-0.040636543,0.033567067,0.030512394,0.049248677,0.024118518,0.0154004665,-0.037822694,0.01327939,-0.008788664,-0.0031472533,-0.05771686,-0.07114432,-0.035141304,-0.012613684,0.06819336,-0.044704672,0.08706949,0.026913665,0.029220523,0.042323947,0.00884985,-0.037533227,-0.05600777,0.02020763,-0.02861706,-0.0026777703,0.014251932,-0.050577767,0.055976305,-0.024511235,-0.035752833,0.011140529,-0.005946431,-0.01416425,-0.04632711,-0.017282445,0.023479218,0.013199007,0.0059177065,-0.0023053007,0.02636699,0.06136824,-0.06557433,-0.005773904,-0.057456005,-0.01982918,0.011313499,-0.068581745,-0.006775956,0.04534342,0.0037338806,-0.039694205,-0.001437675,-0.020285813,0.015251906,0.029526275,-0.043371122,0.024713214,0.0070504406,-0.025461717,-0.01415141,0.021525687,0.013227477,-0.013066047,-0.015976954,0.0045722327,0.013724978,0.05204389,0.04076994,0.018766128,-0.03215443,0.013090388,-0.00049280876,-0.0564181,0.05109092,0.054357238,0.04530779,-0.08669573,-0.057845492,-0.06530457,-0.0026893567,-0.016661774,-0.0055217547,-0.012637457,0.014015494,0.03757454,-0.010434615,0.0066771656,-0.017131183,-0.0016264975,-0.020275895,0.007930707,-0.041843705,-0.027657885,0.042674754,0.025003193,-0.04986881,0.03660566,0.016291425,0.012541345,0.032998618,-0.019723454,-0.04816467,0.0034156109,0.042401016,-0.011120892,0.008557963,0.020001005,-0.056819536,0.040671162,-0.0019740404,0.018924473,0.04463643,-0.003976828,-0.03160668,-0.02365591,0.062589556,0.05029007,-0.022337066,0.0035058532,0.03268889,0.007363476,0.061977156,-0.015591577,0.009818705,0.013315023,-0.011984925,0.02170129,0.05813987,-0.026295982,-0.056594864,0.03512935,0.03738749,0.02399023,-0.029427828,-0.022947446,0.041883867,-0.023815796,0.014859953,-0.0120720295,0.024308342,-0.008669201,-0.01589918,-0.026525134,0.027041033,-0.006555703,0.06733792,0.024208765,-0.05596935,-0.04605009,0.03307989,-0.033301745,0.025986891,0.012213248,-0.021956025,0.094229996,-0.029135706,0.008852075,0.053491507,-0.037695043,0.026156105,0.04778975,-0.0006895428,-0.043764617,0.02962728,-0.028537203,-0.028277703,-0.015359146,-0.021098081,0.018016368,0.029974155,-0.06924772,0.007487341,0.028333446,-0.03204546,0.03817844,0.012088618,-0.02086044,-0.002483257,-0.019542443,0.056954075,0.03723362,0.0028168862,-0.02733394,-0.05470218,-0.009268762,0.013019298,0.049761523,-0.014351699,-0.0063959057,0.0140247,0.031356145,-0.0009937199,0.0025910896,-0.0458074,0.0657832,-0.026008265,-0.013764787,0.039755166,-0.03220309,-0.018874818,0.009239682,0.023506613,-0.005053644,-0.0058519137,0.013029881,0.0038679333,-0.022159068,-0.085322335,-0.030999593,-0.012075244,-0.026486991,-0.0012945167,0.044314086,0.009085864,0.05299434,0.00022956688,0.045575432,-0.00280935,-0.031612854,0.034513332,0.02999981,-0.031750556,0.008163799,-0.023399966,-0.020171972,0.0006466979,-0.0005644335,-0.03137884,0.027962012,0.030547952,0.00021031976,-0.026860774,-0.05940415,-0.028192498,-0.013703086,-0.026646398,-0.03689181,0.01151359,0.045839977,0.056709774,-0.0033628317,0.0016806215,-0.038276616,-0.0241255,0.040984347,0.037085433,-0.04826852,0.0505603,-0.04133247,-0.019975623,0.054818776,-0.086658806,-0.025053646,-0.019567192,0.017853774,-0.012382029,0.03970075,-0.014461081,-0.025729304,-0.014292671,-0.04889004,0.010107715,-0.00422718,-0.0032801002,0.027809015,0.0108386185,0.004286708,0.038170315,0.031933792,0.06467523,0.031559553,-0.014784827,0.008684718,-0.005467185,-0.033772152,-0.0019096173,0.00036384325,-0.018695785,-0.041608956,-0.032401443,-0.04062256,-0.015518021,0.029098187,0.011850156,0.026239084,0.014940622,-0.054609805,-0.06687355,0.03135267,-0.015274567,-0.042600345,0.022862906,-0.0078378245,-0.0206543,0.0024135115,0.015054608,-0.03236487,-0.0512565,-0.046034873,-0.060770735,0.036030732,0.0015169535,-0.009118032,-0.024511179,-0.0040299846,0.019920193,0.026004637,0.007457839,-0.031614084,-0.00933897,0.05059643,-0.024958005,0.04917654,-0.020090185,0.03880934,-0.062812574,0.083691016,0.028016225,-0.034178305,-0.052860618,-0.020345563,0.0010799236,0.059728876,-0.022871383,0.04669115,-0.034670454,-0.018368177,-0.05454896,-0.011873096,0.044330318,-0.04629105,-0.024567554,-0.07277533,0.024706922,-0.04744793,-0.008970839,-0.054454025,0.027783282,0.014491961,0.027168699,0.02083216,-0.022908626,-0.025982046,0.013027625,0.020150734,-0.044591516,0.035081465,0.015651703,0.04687939,-0.009450741,0.050192263,0.035016514,0.0243629,-0.014904166,0.031209353,-0.012413376,0.026759204,-0.08989641,-0.0522539,-0.08266007,-0.017390458,0.016249016,-0.012781397,0.032676257,-0.00061357487,0.002411317,0.0041927053,-0.022496898,-0.070102334,-0.060557157,0.043607555,0.006215603,0.03237835,-0.037171345,-0.00041608422,0.038499705,0.03127519,0.002002427,0.055270463,-0.0054705893,-0.030961057,-0.019707989,0.030923486,-0.006030685,-0.021868732,0.021606214,0.028719291,0.0072519146,-0.04955643,0.0096854465,-0.017570388,-0.022273108,0.0027442502,-0.041379336,0.006489448,0.030817853,-0.0022356478,-0.0042032506,-0.02641575,-0.00074173306,-0.04095314,0.014052861,0.01375098,0.039114326,-0.007908528,-0.040999334,0.02056943,0.0030174186,-0.008539791,0.060419664,0.011810905,0.021272797,0.004869612,0.0016021341,-0.013978234,0.015711028,0.012060419,-0.058395498,-0.039985485,0.035072595,0.03688111,-0.044336643,-0.09883969,-0.062924825,0.0091675585,-0.026898544,0.017281206,-0.029933153,0.03423289,-0.03875584,-0.010724007,0.032080494,-0.021684686,0.031317893,-0.01993095,0.05724957,-0.002133587,-0.004637941,-0.0150880115,-0.017637407,-0.0005149782,0.028900826,0.024956623,0.011815806,-0.013152827,-0.0029471149,-0.03121411,0.060076438,0.049219288,-0.048837118,-0.003176517,0.0011405936,-0.023815865,0.020794926,-0.0002894411,-0.0019920906,-0.01682712,0.04029928,0.057424266,-0.008314228,0.014021243,-0.023333494,-0.0049201045,-0.0042853574,-0.03228667,-0.042831868,-0.026030574,0.022292394]	2026-03-14 09:01:22.433327+05:30	2026-03-14 09:01:22.433327+05:30
2	sleep_anxiety.txt	Sleep Anxiety	/Users/abishek/Mind Bridge - Local/MentalHealthAssistant/mentalhealth/mentalhealth/server/knowledge/sleep_anxiety.txt	0	Topic: Sleep Anxiety Sleep anxiety occurs when a person experiences stress or fear related to going to sleep. Symptoms may include: - racing thoughts before bed - difficulty falling asleep - increased heart rate - fear of not being able to sleep Treatment options may include relaxation techniques, therapy, and lifestyle adjustments.	{"fileName": "sleep_anxiety.txt"}	[0.0016214813,0.05473991,-0.18899778,0.03380826,0.031798564,0.044779595,-0.028498774,-0.030260196,0.03931837,-0.04183433,-0.03215426,0.059685875,0.03887366,0.050069757,0.013717182,-0.010746614,0.0016619024,-0.013760822,-0.049099445,-0.03867382,-0.07371089,0.0050977124,-0.03159324,-0.026128752,-0.0015467219,0.10835003,0.028173001,0.0045802705,-0.0011770229,0.078652196,0.07317485,-0.04297137,-0.010732361,-0.038397215,-0.054117545,-0.025050266,0.0033600763,0.061345473,0.03331237,0.03224057,0.076221585,-0.046240266,0.052928537,-0.058802456,-0.0028611075,-0.012315632,0.0662985,-0.008590017,0.03674464,0.00048203822,0.040115073,-0.047078125,0.00245877,-0.064834625,0.073048204,0.029875278,0.034705512,0.036377646,-0.00027954488,0.017450638,0.117912434,0.009450843,-0.02474747,0.03207669,0.050308473,-0.06775227,-0.02193043,0.06511518,0.020291062,0.035950746,0.094108164,-0.012973695,-0.02717766,0.034220707,-0.080407865,0.016956639,0.034892343,-0.028890038,0.016145851,0.034028597,0.05896324,-0.03138256,0.07019474,-0.02646763,0.0488975,0.0017941404,0.0015906586,-0.041540224,-0.001931915,0.07055968,0.029941965,0.00963165,0.026678393,0.029749537,-0.04159747,0.021865323,0.037473034,0.024922598,-0.06626602,-0.0633596,-0.042560793,-0.01265066,-0.000803879,-0.019424835,-0.0059941066,-0.028971972,-0.06250818,-0.0074712257,-0.020830983,0.020831382,-0.050018758,0.08567848,0.0073942114,-0.025690844,0.008429979,-0.012635205,0.06154951,-0.035579655,0.032059707,-0.009431944,-0.020460404,-0.0098669175,0.020528253,0.03321376,-0.004588435,0.064505324,-0.017066196,0.031838138,0.010932318,-0.029555868,0.0064626746,-0.03452182,-0.024974002,0.026416734,-0.008475089,0.019276602,-0.031466786,0.002603063,-0.01866292,0.025714288,0.03815676,-0.004900456,-0.008872896,-0.062471177,-0.020474026,-0.0052233282,0.0124660805,-0.038848232,-0.0666799,-0.010310686,0.025856936,-0.009103292,-0.017545052,0.039116465,0.037498455,-0.00954866,-0.03812452,0.021402912,0.06558471,0.060203608,0.05721666,0.0018594132,-0.031787507,0.06757032,-0.012010011,-0.058569122,-0.01928991,0.06669057,0.0016437449,0.018309314,-0.02742131,-0.024044327,-0.043072667,-0.0006241599,0.07085292,0.02643132,0.06515838,-0.019633928,0.034665707,-0.012465962,0.06581849,0.003221214,0.03742484,-0.012210969,-0.023925617,-0.044938825,0.04580447,-0.028682208,-0.083587,-0.07818797,0.012750004,0.0070595406,-0.05049557,-0.017478595,-0.06668528,-0.024865488,0.019008437,0.006787344,0.063556634,-0.047912136,-0.014068494,-0.04252141,0.00841052,-0.03863273,-0.010065497,0.06811199,0.013334061,-0.033477243,-0.015297379,-0.006775085,0.057285294,-0.030443925,-0.0001547589,0.0066953003,0.022355208,-0.03370666,0.021121241,-0.059571788,-0.0113353,0.025887394,-0.016353501,-0.022369511,-0.048844077,-0.010262453,0.02273346,-0.02438763,-0.04822287,-0.036178067,-0.0030336487,-0.005529718,-0.008655974,-0.0834429,0.07306186,0.018776445,-0.02162768,0.05026337,-0.0023425429,0.040687576,-0.00083405984,-0.0019499789,-0.0056878035,0.054056212,0.03328771,0.025700513,-0.050088763,0.03340027,-0.030848078,-0.025998482,-0.029327784,0.013028766,0.01885295,-0.014332624,0.013159769,0.0011476107,0.06045956,-0.059793524,-0.043419898,0.003845044,0.008755522,0.002458112,0.01314603,-0.006596949,0.021724895,-0.051637407,-0.04536823,-0.044858266,-0.00811147,-0.01869006,0.018775629,-0.039015926,0.02813207,0.03720338,0.030006055,-0.0014194463,0.03917969,-0.042638857,0.01819567,-0.015285198,0.01817813,0.012558974,-0.026505893,0.029653808,-0.046238277,0.012174635,0.012086366,0.012046308,0.07008399,0.028876256,0.010079984,-0.025143564,0.043794755,-0.0033513214,-0.03135977,0.07824965,-0.011294591,0.052899383,0.050006285,0.02741312,0.0063749882,0.0037349875,0.040478207,0.027750067,0.044078458,0.02266327,0.0065979883,-0.017391367,0.03132131,-0.011967745,-0.014238127,-0.038133178,-0.07390031,-0.018664313,-0.022307103,0.061509974,-0.033647206,0.09697437,0.04041443,-0.0059019844,0.073748425,-0.019837238,-0.030685313,-0.024567159,0.0033848789,-0.03804718,-0.005404724,0.001761353,-0.038337123,0.059224617,-0.010032445,-0.025924891,0.04169989,0.0016243543,0.021285584,-0.060569398,-0.02056197,-0.0025264327,-0.0020913656,0.03426701,-0.023421422,0.03045768,0.041636355,-0.06706261,-0.003438396,-0.028517358,-0.037338383,0.018613243,-0.051782932,0.014324833,0.05753669,0.0007684654,-0.06987421,0.014200023,-0.034831863,0.029523624,0.0107921045,-0.023365099,0.018337846,0.026667956,-0.0118677905,0.0017985844,0.031692244,0.011261416,-0.008351413,-0.03006836,-0.02349336,0.0014876083,0.051795848,0.03354659,0.0039074165,-0.027631542,0.0045027356,-0.011013748,-0.04628285,0.004849315,0.06964831,0.043641895,-0.077293,-0.017311966,-0.0198425,-0.011949299,-0.015207915,-0.022422122,-0.021820547,-0.00022818183,0.022981364,0.00373598,-0.012282922,-0.013917026,-0.016422223,0.023203216,-0.0055178455,-0.044916138,-0.042586025,0.060884073,0.042852223,-0.018961053,0.040550634,-0.0066406773,0.023382511,0.039645147,0.0051263287,-0.037799887,-0.013256498,0.02402456,-0.0026319139,0.026228627,0.0063476088,-0.050214406,0.030847572,0.005394196,0.010002865,0.018302357,-0.0033457067,-0.023703763,0.0061651105,0.056933284,0.04706883,0.04205132,0.003546593,0.0067390553,-0.0419744,0.067314036,-0.04309503,-0.0017727943,0.00806531,0.021443946,0.01363744,0.058453217,0.010700223,-0.03751485,0.03278118,0.020901207,0.027870903,-0.027554592,-0.012617967,0.03134231,-0.0012839023,0.0019364677,-0.04643137,0.014577914,-0.012664891,0.0006110013,-0.016098866,0.03510601,-0.0130425645,0.0970594,0.026721306,-0.033467773,-0.024564706,0.032362822,-0.007440693,0.014014911,0.045471076,-0.026359154,0.08744254,-0.029156048,0.02038093,0.07253628,0.0034404234,0.035516363,0.062446516,0.0059567327,-0.03066218,0.013449872,-0.031880498,0.0037325623,-0.021549685,-0.0003551167,-0.0019540137,0.026735453,-0.060469225,0.009021454,-0.024015566,-0.03180922,0.027285635,0.027268112,-0.0034975603,-0.032636456,-0.008619408,0.041238274,0.042176593,0.008848773,-0.039052647,-0.04131557,-0.004308389,0.019673426,0.028224623,0.006288272,0.006562583,0.0013382675,0.020460183,0.008407036,-0.04306957,-0.0316758,0.06675071,0.009382255,-0.0024060511,0.02583649,-0.019664567,-0.011636941,0.014782205,0.025830109,0.011617247,-0.018449565,0.020360455,-0.009781828,0.0036725334,-0.06893474,-0.020852804,-0.014055454,-0.027586516,-0.012190068,0.014000575,0.032985743,0.075833194,-0.012669042,0.039754182,-0.021377265,-0.025602302,0.04322516,-0.0003736866,-0.056347497,0.032493018,-0.007491736,-0.0332076,0.021239936,0.017888699,-0.033911306,0.026666597,-0.02226242,-0.032486968,-0.0013251532,-0.06560521,-0.051209893,-0.028508406,-0.024712149,-0.045559276,0.00941548,0.008658342,0.049716026,-0.040266674,-0.016062632,-0.022267155,-0.022630211,0.03090749,0.017371396,-0.061187133,0.04136117,-0.037103854,0.006108704,0.01661061,-0.05249961,-0.05568568,-0.00062021805,0.007235703,-0.0065433905,0.0587593,-0.026474297,-0.020491851,0.025149891,-0.039308865,0.0115410425,0.014309493,-0.018054483,0.061745033,0.033654694,-0.021608526,0.016658137,0.03678998,0.019915907,0.025786934,-0.034438327,0.015562107,-0.02391947,-0.020877533,-0.02475945,0.013244945,-0.02597352,-0.05271113,-0.030348936,-0.03794366,-0.026790243,0.015160516,0.011987554,0.013237283,-0.008982183,-0.052785985,-0.07031647,0.034288034,-0.031884518,-0.02192973,0.008103826,0.0024174862,-0.021564664,0.036358315,-0.026026877,-0.015941117,-0.058298983,-0.046512235,-0.05416268,0.03801241,0.01581676,0.019164324,-0.011620282,-0.04334445,0.041164014,0.011754106,0.023755115,-0.009123775,-0.010339746,0.02886534,-0.007219738,0.03473509,-0.001924745,0.02976427,-0.05182894,0.0793297,-0.0063066934,-0.0012925058,-0.029928805,-0.033083767,-0.00487467,0.07662312,-0.028128868,0.047898266,-0.02362794,-0.04983187,-0.053451806,-0.013561566,0.082205996,-0.06577258,-0.05325927,-0.1062737,0.030799989,-0.07386546,-7.158085e-05,-0.029927153,0.037592825,-0.006941509,0.014469116,-0.008165575,-0.0037880002,-0.022902966,0.0030548726,0.028597564,-0.005804394,0.028841062,0.00041017664,0.036395647,-0.020514982,0.073717184,0.026274161,0.008480761,-0.00042367284,0.027779277,-0.013920843,0.001678271,-0.09713614,-0.043616813,-0.082603164,-0.015208591,0.026989697,-0.007195527,0.06292706,-0.01228408,0.0043213996,0.049293138,-0.009878258,-0.0739646,-0.037732277,0.03884317,0.009016247,0.0062593506,-0.03868608,-0.026958467,0.01834648,0.041118,0.008146159,0.053914677,-0.02608357,-0.021046896,-0.0113565475,0.027332522,-0.021701349,0.004037018,0.052459657,0.04752625,0.006880608,-0.0594775,-0.0069428696,-0.050324418,-0.02551746,-0.031528275,-0.031372968,-0.011686579,0.016920833,0.016442383,-0.01090587,-0.0042087217,0.0051837433,-0.04024502,0.0044487026,-0.0025635625,0.0108104395,-0.0073722303,-0.04342098,0.028555956,-0.020835077,-0.020165911,0.02432873,-0.0033359034,0.027323494,0.011108989,0.025124602,-0.0017177779,0.009044144,0.01544735,-0.018882837,-0.02799932,0.038243182,0.09055107,-0.056884926,-0.07606749,-0.004823349,0.035025798,-0.020444568,0.035222713,-0.014648044,0.02376782,-0.022024257,0.0042040916,-0.013916592,-0.018523106,-0.020719167,0.009132248,0.045841206,-0.024380237,-0.029703684,0.01240348,-0.019468911,-0.02180974,0.058111243,0.029251251,-0.014094756,0.010613165,-0.018983621,-0.037067667,0.058763977,0.028389204,-0.04421694,-0.01547653,-0.00096210313,-0.028676363,0.027730646,-0.03937409,-0.007289657,-0.028296676,0.018709991,0.045569595,-0.0038239595,0.031676155,-0.020512618,-0.0012254866,-0.00018088512,-0.022167698,-0.04559933,-0.004441056,-0.01758337]	2026-03-14 09:01:22.496117+05:30	2026-03-14 09:01:22.496117+05:30
\.


--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_comments (id, post_id, user_id, author_name, content, created_at) FROM stdin;
\.


--
-- Data for Name: post_engagements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.post_engagements (post_id, user_id, reaction_type, created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, caption, name, location, image, likes, comments, saved, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (user_id, birthday, age, gender, phone, address, zipcode, country, city, guardian_name, guardian_phone, guardian_email, illnesses, created_at, updated_at, mental_health_context, consent_accepted, consent_accepted_at, onboarding_completed, onboarding_completed_at) FROM stdin;
7abe9cd9a045943c51c74f2c	{"iv": "BTmETQaBaJFrgdo4", "alg": "aes-256-gcm", "tag": "8O9CJZRFY2TXEAERAUGy3Q==", "__enc": true, "value": "xY6zgeKx4miGzQ=="}	{"iv": "y0sgW1aXAv2QLHJQ", "alg": "aes-256-gcm", "tag": "+/dVLVnjQWtMHcYn16eceg==", "__enc": true, "value": "2jI="}	{"iv": "Yg6nxr95WE6msKxm", "alg": "aes-256-gcm", "tag": "iROjdzmEIoDIn9RX6kGGYg==", "__enc": true, "value": "OfnkIg=="}	{"iv": "uEER2STfukxeevyD", "alg": "aes-256-gcm", "tag": "dmKpUm7aykprUzpZtq9FIA==", "__enc": true, "value": "MGSJ2C8bYeNcrQ=="}	{"iv": "pHz8sQ3bDfgxotZM", "alg": "aes-256-gcm", "tag": "8vZdHlrOe3Vz2nxRc7snuA==", "__enc": true, "value": "j5xPJxCuUSlBj1oQwSzU"}	20000	Sri Lanka	Kandy	{"iv": "wVlQMgiWSUBYo7eA", "alg": "aes-256-gcm", "tag": "Vyh7cM5HnW81N7qbdhm7fg==", "__enc": true, "value": "n9HcLydQ"}	{"iv": "lCsGSGASnEvm0dgq", "alg": "aes-256-gcm", "tag": "3uxHPi9XDtJMJYD4YEb4AQ==", "__enc": true, "value": "T4AAERWCArhFlA=="}	{"iv": "8IB7SExWdlnWL/yu", "alg": "aes-256-gcm", "tag": "7ulql7/k1ADTETAMcZzDGw==", "__enc": true, "value": "AzCPBdN6rmMLLZnCcgFgCcjTQ8T4Kg7OXqEo5A=="}	{"iv": "QEU7yNYKcp5tYsPP", "alg": "aes-256-gcm", "tag": "5d5qQsglWpld45uqOE1XDw==", "__enc": true, "value": "RF/aABqknaeEkg=="}	2026-03-13 00:48:15.334+05:30	2026-03-13 00:48:15.334+05:30	\N	f	\N	f	\N
885b7d5a9fe2ff36bd4dedde	{"iv": "0yHBxBUDllPTfo4c", "alg": "aes-256-gcm", "tag": "XpHo62qI5dUS0wdMZsVO3w==", "__enc": true, "value": "6bmcI3S38z1d4Q=="}	{"iv": "XtPJuwzKoNjGsUj2", "alg": "aes-256-gcm", "tag": "TzEO5McWPAtKtm558ztUgQ==", "__enc": true, "value": "Y9Y="}	{"iv": "KAjbvpJ90LBu/saq", "alg": "aes-256-gcm", "tag": "H+1WsiLCpKSZU/HJb7VqyA==", "__enc": true, "value": "L6F3aOM+"}	{"iv": "Z3uro/X9txKCnaa9", "alg": "aes-256-gcm", "tag": "HgKD5SChVhs3Q/LbVZKmEg==", "__enc": true, "value": "zKP0EQ05fd6toYU="}	{"iv": "cl4P27D7eZ8Cz6pQ", "alg": "aes-256-gcm", "tag": "s5KX4sOWDgC9qTL6G2zdgw==", "__enc": true, "value": "LOyz8jgwR3SwWFVjA2R4"}	20000	Sri Lanka	Kandy	{"iv": "wwJHo/khDD9D+ume", "alg": "aes-256-gcm", "tag": "frYu+c7oqxmwhK+DFWIebw==", "__enc": true, "value": "eaEPua8+Ood+y5rQOTjrjGFvKA=="}	{"iv": "6ot4FRl9nPj3jnzH", "alg": "aes-256-gcm", "tag": "3LaiFlbSW6js6qp9XO49NA==", "__enc": true, "value": "GnyL7wA7UkQ6/w=="}	{"iv": "iPP3HHb8Rgvog9Na", "alg": "aes-256-gcm", "tag": "QVyTjP60AT7EU4AXm7JlrQ==", "__enc": true, "value": "hMShbzyW3S1T5F9amtT3l10p1fiPZCbWB8BCQQ=="}	{"iv": "mxALHw0ZKENLFOUO", "alg": "aes-256-gcm", "tag": "Q/bXHE5l1wjFV9Hf+g0WVA==", "__enc": true, "value": "a4e2RePefA=="}	2026-03-14 09:23:53.859+05:30	2026-03-14 09:23:53.859+05:30	\N	f	\N	f	\N
a0a1f16f4e1a0aa6205ca94c	\N	"3"	"Man"	\N	\N	\N	\N	\N	"23424"	"234234"	"jayathilakeabishek@gmail.com"	\N	2026-04-30 20:51:34.965+05:30	2026-04-30 20:51:34.965+05:30	"sdfxdf"	t	2026-04-30 20:51:34.965+05:30	t	2026-04-30 20:51:34.965+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, name, password, google_id, facebook_id, profile_pic, role, created_at, updated_at) FROM stdin;
e5628bce5d20f8a76be29736	mindbridge.local@gmail.com	MindBridge System Admin	$2b$10$1hQj6kLVjTh2fFOBDYKOqu3iElgFialVZP5h.yFJZ.BWZ5L7mF0xW	\N	\N	\N	admin	2026-03-12 17:28:10.762+05:30	2026-03-12 17:28:10.762+05:30
c26bcc2cd7578d095940b2f9	test@example3.com	test3	$2b$10$oic7IAznvQV3nJu/Z2bO5eM9r37B5WcM34p9wJ9xuzRmzW0e0RZIm	\N	\N	\N	patient	2026-03-12 17:29:19.561+05:30	2026-03-12 17:29:19.561+05:30
7abe9cd9a045943c51c74f2c	test@email4.com	test4	$2b$10$.QY9jo3hw7Ua5QLADFEDF.Ugv0JfFdCarnfuIZgfa4jDHn5iRKfTu	\N	\N	https://res.cloudinary.com/drwpr138z/image/upload/v1773343085/zhmec8xgq17ix3rumvqs.png	patient	2026-03-13 00:46:36.632+05:30	2026-03-13 00:48:15.323+05:30
885b7d5a9fe2ff36bd4dedde	test05@test05.com	test05	$2b$10$jURsRZlQ8Ml8NSMpkWSq9OXtaJ8WoKIwpcCWjMZ2xAOkguDFZPkR.	\N	\N	https://res.cloudinary.com/drwpr138z/image/upload/v1773460393/jtmuoyvxqurmr52o6imh.png	patient	2026-03-14 09:22:59.656+05:30	2026-03-14 09:23:53.846+05:30
a0a1f16f4e1a0aa6205ca94c	abishek@sensielas.com	ABISHEK	$2b$10$YNDHlfzNacHRNYRB9ZUyAuT6TNOyuSPsr70nskQm2BDRToI7693z6	\N	\N	\N	patient	2026-04-30 20:51:10.492+05:30	2026-04-30 20:51:34.957+05:30
\.


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_conversations_id_seq', 1, false);


--
-- Name: knowledge_chunks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.knowledge_chunks_id_seq', 2, true);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: assessment_sessions assessment_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_sessions
    ADD CONSTRAINT assessment_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: doctor_messages doctor_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_messages
    ADD CONSTRAINT doctor_messages_pkey PRIMARY KEY (id);


--
-- Name: doctor_slots doctor_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_slots
    ADD CONSTRAINT doctor_slots_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (user_id);


--
-- Name: knowledge_chunks knowledge_chunks_document_key_chunk_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_document_key_chunk_index_key UNIQUE (document_key, chunk_index);


--
-- Name: knowledge_chunks knowledge_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_engagements post_engagements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_engagements
    ADD CONSTRAINT post_engagements_pkey PRIMARY KEY (post_id, user_id, reaction_type);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_facebook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_facebook_id_key UNIQUE (facebook_id);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_user_id, created_at DESC);


--
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_user_id, created_at DESC);


--
-- Name: idx_assessment_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_sessions_user ON public.assessment_sessions USING btree (user_id, created_at DESC);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action, "timestamp" DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id, "timestamp" DESC);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_chat_conversations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_user ON public.chat_conversations USING btree (user_id, created_at DESC);


--
-- Name: idx_doctor_messages_doctor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_messages_doctor ON public.doctor_messages USING btree (doctor_user_id, created_at DESC);


--
-- Name: idx_doctor_slots_doctor_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_slots_doctor_date ON public.doctor_slots USING btree (doctor_user_id, slot_date, start_time);


--
-- Name: idx_doctors_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctors_specialty ON public.doctors USING btree (specialty);


--
-- Name: idx_knowledge_chunks_document_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_chunks_document_key ON public.knowledge_chunks USING btree (document_key);


--
-- Name: idx_knowledge_chunks_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_post_comments_post; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_comments_post ON public.post_comments USING btree (post_id, created_at DESC);


--
-- Name: idx_post_engagements_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_engagements_user ON public.post_engagements USING btree (user_id, created_at DESC);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: audit_logs audit_logs_no_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();


--
-- Name: audit_logs audit_logs_no_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();


--
-- Name: appointments appointments_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.doctors(user_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_patient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assessment_sessions assessment_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_sessions
    ADD CONSTRAINT assessment_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: doctor_messages doctor_messages_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_messages
    ADD CONSTRAINT doctor_messages_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.doctors(user_id) ON DELETE CASCADE;


--
-- Name: doctor_slots doctor_slots_doctor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_slots
    ADD CONSTRAINT doctor_slots_doctor_user_id_fkey FOREIGN KEY (doctor_user_id) REFERENCES public.doctors(user_id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: post_engagements post_engagements_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_engagements
    ADD CONSTRAINT post_engagements_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_engagements post_engagements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_engagements
    ADD CONSTRAINT post_engagements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pTenTZ5dSRoqjsa3U6bZOe1khQ44YGTHyb0I6yIk2bcGvpDRegwJ7vCDcaSjIVD

