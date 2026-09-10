# Todo App

Jednostavna full-stack Todo aplikacija pravljena za potrebe savladavanja osnova Dockera.

## Struktura Projekta

- `frontend/` — React + Vite aplikacija
- `backend/` — Node.js + Express REST API
- `db/init/` — SQL skripte za inicijalizaciju PostgreSQL baze

---

## Lokalno pokretanje (bez Dockera)

Pre pokretanja uveri se da imaš instalirane Node.js (v20+) i PostgreSQL.

### 1. Inicijalizacija Baze Podataka

Pokreni PostgreSQL servis na svom sistemu i kreiraj bazu i korisnika:

```bash
# Pokretanje Postgres servisa (Linux)
sudo systemctl start postgresql

# Kreiranje baze i korisnika
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE tododb OWNER postgres;"

# Inicijalizacija šeme i početnih podataka
PGPASSWORD=postgres psql -U postgres -h localhost -d tododb -f db/init/01-schema.sql
PGPASSWORD=postgres psql -U postgres -h localhost -d tododb -f db/init/02-seed.sql