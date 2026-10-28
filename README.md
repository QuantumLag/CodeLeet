![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TypeScript React](https://img.shields.io/badge/typescript%20react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/mongodb-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/mongoose-%234ea94b.svg?style=for-the-badge&logo=mongoose&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-%23339933.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

# FireCode

FireCode is a LeetCode-inspired coding practice app built with Express, MongoDB/Mongoose, TypeScript, and React.

## Local setup (Windows PowerShell)

Prerequisites: install a supported Node.js LTS release (which includes npm) and have access to a MongoDB Atlas cluster or another MongoDB deployment reachable from this computer.

### 1. Install dependencies

From the repository root:

```powershell
cd .\server
npm install
cd ..\client
npm install
cd ..
```

The server uses `npm start` to compile TypeScript and start `dist/server.js`. The React client uses Create React App and starts on port 3000 with `npm start`. The server defaults to port 80; if that port is unavailable, set `PORT` in `server/.env` and set the matching API URL in `client/.env.local`.

### 2. Configure the backend

The server loads `server/.env` with dotenv. A local placeholder file is included; edit it and supply your own values. Keep this file private.

- `MONGODB_URI`: your MongoDB connection string, including the intended database name.
- `ACCESS_TOKEN_SECRET`: a long random secret used to sign and verify access tokens. Generate one in PowerShell from the `server` directory:

  ```powershell
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- `PORT` (optional): backend listening port; defaults to `80` to match the existing server configuration.
- `CORS_ORIGIN` (optional): comma-separated allowed browser origins; defaults to `http://localhost:3000`.

To create a MongoDB Atlas database, create a cluster in your Atlas project, create a database user with access limited to the application database, and allow your development machine's IP address in Network Access. Choose **Connect** → **Drivers**, copy the Node.js connection string, replace its username/password placeholders, and include a database name. Put the result in `MONGODB_URI`. Do not commit the URI or broaden network access to make a connection succeed.

For a fresh checkout where `server/.env` is absent, copy the template:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

### 3. Configure the frontend API URL

The browser reads the public `REACT_APP_API_URL` setting. A local example is in `client/.env.example`. Create `client/.env.local` for local development:

```powershell
Copy-Item .\client\.env.example .\client\.env.local
```

The default is `http://localhost:80`. If you set the backend `PORT` to another value, update `REACT_APP_API_URL` to `http://localhost:<port>`. For deployment, set `REACT_APP_API_URL` in the frontend build environment to the deployed API's HTTPS origin, and set the backend `CORS_ORIGIN` to the exact deployed frontend origin. Rebuild the frontend after changing its environment value. Never put `MONGODB_URI` or `ACCESS_TOKEN_SECRET` in any client-side variable.

### 4. Add the starter problems

The `problems` collection starts empty. After configuring `server/.env`, run this once from the repository root to insert three sample JavaScript problems (Two Sum, Reverse String, and Palindrome Number):

```powershell
cd .\server
npm run seed
```

The command upserts by problem name, so it is safe to rerun. It uses the same `MONGODB_URI` as the backend. Restart the frontend page and open **Problem List** to see the problems. Each has starter code and tests for the existing JavaScript submission runner.

### 5. Start both applications

Open two PowerShell terminals at the repository root.

Terminal 1, backend:

```powershell
cd .\server
npm start
```

Terminal 2, frontend:

```powershell
cd .\client
npm start
```

The backend reports a successful MongoDB connection before it begins listening. Visit `http://localhost:3000`; use the app's signup/login flow to check API requests. Stop either foreground process with **Ctrl+C**.

### Troubleshooting

- **Missing environment variable:** fill in `MONGODB_URI` and `ACCESS_TOKEN_SECRET` in `server/.env`; the server names missing variables without showing values.
- **MongoDB connection failed / server does not listen:** verify the Atlas connection string, database-user credentials, IP allowlist, and network access. The server deliberately does not print the connection string.
- **Port already in use:** set `PORT` to an available port and update `REACT_APP_API_URL` to match; restart both processes.
- **Browser CORS error:** set backend `CORS_ORIGIN` to the exact frontend origin (including scheme and port), then restart the backend.
- **Frontend still uses an old URL:** restart `npm start` after editing `client/.env.local`; Create React App reads environment values when it starts.
- **Install/build failure:** check the reported npm error and Node.js version; run installs from each package directory so the checked-in lockfiles are used.

## Demo

The original project demo is listed at https://fire-code.vercel.app.

# Features

-   User authentication: Users can create an account, log in, and log out, delete account.
-   Coding problems: Users can browse coding problems, submit solutions.
-   User profile: Users can view their profile, including their solved problems and submissions.

# Technologies Used

-   Express: A web framework for Node.js
-   MongoDB: A NoSQL database
-   Mongoose: A MongoDB object modeling tool
-   TypeScript: A typed superset of JavaScript
-   TypeScript React: A JavaScript library for building user interfaces with TypeScript
-   Tailwind CSS: A utility-first CSS framework
-   CSS: A stylesheet language used to describe the presentation of a document written in HTML or XML

# Server Dependencies

-   acorn
-   bad-words
-   bcrypt
-   cors
-   dotenv
-   express
-   jsonwebtoken
-   mongodb
-   mongoose
-   typescript

# Client Dependencies

-   @uiw/codemirror-extensions-langs
-   @uiw/codemirror-theme-tokyo-night
-   @uiw/react-codemirror
-   axios
-   markdown-it
-   react
-   react-dom
-   react-router-dom
-   react-scripts
-   react-type-animation
-   typescript
-   web-vitals

# Contributing

Contributions are welcome! If you find a bug or have a feature request, please create an issue on GitHub. If you would like to contribute code, please fork the repository and create a pull request.

# License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.

# Acknowledgments

This project was inspired by LeetCode.
Thanks to the creators of Express, MongoDB, Mongoose, TypeScript, and React.
