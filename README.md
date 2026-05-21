# Lyrics Website

This project is a Node.js + Express lyrics website with a MySQL backend and file uploads.

## Railway deployment

This app is ready to deploy on Railway.

### Steps to deploy on Railway

1. Link your GitHub repo to Railway and create a new project.
2. Add a Node service using your repository.
3. Set the build command to:
   ```bash
   npm install
   ```
4. Set the start command to:
   ```bash
   npm start
   ```
5. Add a MySQL database plugin or use an existing MySQL instance.
6. In your Railway service environment vars, add `DATABASE_URL` using the connection string from Railway.

### DATABASE_URL format

Use the URI format:

```text
mysql://DB_USER:DB_PASS@DB_HOST:DB_PORT/DB_NAME
```

Example:

```text
mysql://root:MySecret@containers-us-west-123.railway.app:12345/lyrics_app
```

### Optional separate MySQL vars

If you prefer, set these instead of `DATABASE_URL`:

- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

## Vercel front-end deployment

This repo can host the front end on Vercel while the backend runs on Railway.

### What to do

1. Deploy the backend on Railway using the instructions above.
2. Deploy the static `public/` site on Vercel. A `vercel.json` file is included so Vercel serves only the static front end.
3. In `public/index.html`, set `window.API_BASE_URL` to your Railway backend URL.
4. In Railway, set `CLIENT_URL` to your Vercel site URL.

### Front-end API URL

The front end uses `window.API_BASE_URL` to call the backend. Set it to a URL like:

```text
https://your-railway-backend.up.railway.app
```

If you leave `window.API_BASE_URL` empty, the Vercel front end will not be able to call the Railway backend.

### Important notes

- Railway does not provide durable file storage inside the service container. Uploaded files saved to `uploads/` are ephemeral and may disappear after redeploys.
- For production file uploads, use an external storage service such as S3 or Cloudinary.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with your database values.
3. Start the app:
   ```bash
   npm start
   ```

## Local `.env` example

```env
DATABASE_URL='mysql://root:MyPassword@localhost:3306/lyrics_app'
ADMIN_PASSWORD=1234
CLIENT_URL=http://localhost:3000
```

## Database

The app requires one of the following:

- `DATABASE_URL`, or
- all of `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

The server will exit if no valid database configuration is present.
