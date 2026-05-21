# Lyrics Website

This project is a Node.js + Express lyrics website with MySQL backend and file uploads.

## Render deployment

Render is configured using `render.yaml`.

### What is configured

- Web service deploys from branch `main`
- `npm install` build command
- `npm start` run command
- `UPLOAD_PATH` is set to `/uploads`
- A Render persistent disk is mounted at `/uploads`
- Database connection is expected via `DATABASE_URL`
- Admin upload password is configured via `ADMIN_PASSWORD`

### Required environment variables

- `DATABASE_URL` – MySQL connection string
- `ADMIN_PASSWORD` – admin upload password
- `CLIENT_URL` – optional allowed client origin
- `UPLOAD_PATH` – file upload directory (default: `/uploads`)

### Notes

- Render file system is ephemeral unless you use a mounted disk. The app uses `UPLOAD_PATH` and can use `/uploads` when deployed with a disk mount.
- If you don’t want to store uploads on disk, use an external storage service instead.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set env vars in a `.env` file or your shell.
3. Start the app:
   ```bash
   npm start
   ```

## Database

The app supports:
- `DATABASE_URL` connection string, or
- separate MySQL env vars: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

The server will exit if the required database config is missing.
