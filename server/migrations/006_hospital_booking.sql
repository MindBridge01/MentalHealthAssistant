CREATE TABLE care_hospitals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, address TEXT NOT NULL,
 city TEXT NOT NULL, public_phone TEXT NOT NULL, website TEXT NOT NULL DEFAULT '',
 officer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 payment_method TEXT NOT NULL CHECK(payment_method IN ('at_location','contact_provider')),
 payment_instructions TEXT NOT NULL, arrival_instructions TEXT NOT NULL DEFAULT '',
 cancellation_instructions TEXT NOT NULL DEFAULT '', agreement_reference TEXT NOT NULL,
 demo BOOLEAN NOT NULL DEFAULT TRUE, active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX care_hospitals_officer ON care_hospitals(officer_id);
CREATE TABLE care_affiliations (
 hospital_id UUID NOT NULL REFERENCES care_hospitals(id), professional_id TEXT NOT NULL REFERENCES users(id),
 active BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY(hospital_id,professional_id)
);
CREATE INDEX care_affiliations_professional ON care_affiliations(professional_id);
CREATE TABLE care_profiles (
 professional_id TEXT PRIMARY KEY REFERENCES users(id), bio TEXT NOT NULL DEFAULT '',
 services TEXT NOT NULL DEFAULT '', languages TEXT NOT NULL DEFAULT '', age_groups TEXT NOT NULL DEFAULT '',
 published BOOLEAN NOT NULL DEFAULT FALSE, accepting BOOLEAN NOT NULL DEFAULT FALSE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE care_slots (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), hospital_id UUID NOT NULL, professional_id TEXT NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, timezone TEXT NOT NULL,
 fee TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY(hospital_id,professional_id) REFERENCES care_affiliations(hospital_id,professional_id),
 CHECK(ends_at > starts_at AND ends_at <= starts_at + INTERVAL '4 hours')
);
CREATE INDEX care_slots_schedule ON care_slots(professional_id,starts_at,ends_at);
CREATE INDEX care_slots_hospital ON care_slots(hospital_id,starts_at);
CREATE TABLE care_bookings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id TEXT NOT NULL REFERENCES users(id),
 slot_id UUID NOT NULL REFERENCES care_slots(id), version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','proposed','confirmed','declined','cancelled','expired','completed','no_show')),
 expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX care_bookings_one_active_slot ON care_bookings(slot_id) WHERE status IN ('pending','proposed','confirmed');
CREATE INDEX care_bookings_patient ON care_bookings(patient_id,created_at);
CREATE INDEX care_bookings_expiry ON care_bookings(expires_at) WHERE status IN ('pending','proposed');
CREATE TABLE care_booking_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL REFERENCES care_bookings(id),
 actor_id TEXT REFERENCES users(id), version INTEGER NOT NULL, status TEXT NOT NULL,
 slot_id UUID NOT NULL REFERENCES care_slots(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(booking_id,version)
);
CREATE TABLE care_email_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL REFERENCES care_bookings(id),
 version INTEGER NOT NULL, event TEXT NOT NULL, audience TEXT NOT NULL CHECK(audience IN ('patient','hospital','admin','professional')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','failed','skipped')),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0), available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 locked_at TIMESTAMPTZ, lease_token UUID, last_error TEXT, sent_at TIMESTAMPTZ,
 UNIQUE(booking_id,version,event,audience)
);
CREATE INDEX care_email_queue ON care_email_jobs(status,available_at);
