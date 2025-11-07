# PA

A full-stack web application built with Node.js, Express, and React.

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

To verify your installations, run:
```bash
node --version
npm --version
git --version
```

## Project Structure

```
PA/
├── client/              # React frontend
│   ├── public/          # Static files
│   ├── src/             # React components and code
│   └── package.json     # Frontend dependencies
├── server/              # Node.js/Express backend
│   ├── src/             # Server code
│   │   └── index.js     # Main server file
│   ├── .env.example     # Example environment variables
│   └── package.json     # Backend dependencies
├── package.json         # Root package.json with helper scripts
└── README.md            # This file
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd PA
```

### 2. Install Dependencies

You have two options:

**Option A: Install all at once (recommended)**
```bash
npm run install-all
```

**Option B: Install manually**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file for the server:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` if you need to change any settings (default port is 5000).

### 4. Run the Application

**Option A: Run both client and server together (from root directory)**
```bash
npm run dev
```

**Option B: Run them separately in different terminals**

Terminal 1 - Start the backend server:
```bash
cd server
npm run dev
```

Terminal 2 - Start the React frontend:
```bash
cd client
npm start
```

### 5. Access the Application

- **Frontend**: Open your browser to [http://localhost:3000](http://localhost:3000)
- **Backend API**: The server runs on [http://localhost:5000](http://localhost:5000)

You should see "Hello from PA Server!" displayed on the frontend page.

## Available Scripts

### Root Directory

- `npm run install-all` - Install all dependencies for client and server
- `npm run dev` - Run both client and server in development mode
- `npm run dev:client` - Run only the React frontend
- `npm run dev:server` - Run only the Node.js backend
- `npm run build` - Build the React app for production
- `npm start` - Run the production server

### Client (React)

```bash
cd client
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

### Server (Node.js)

```bash
cd server
npm run dev      # Start with nodemon (auto-restart on changes)
npm start        # Start production server
```

## API Endpoints

The server provides the following endpoints:

- `GET /api/hello` - Returns a greeting message
- `GET /api/health` - Returns server health status

## Troubleshooting

### Port Already in Use

If you see an error like "Port 3000 is already in use":
- **Frontend**: Kill the process using port 3000 or set a different port
- **Backend**: Change the PORT in `server/.env`

### Module Not Found Errors

Make sure you've installed all dependencies:
```bash
npm run install-all
```

### CORS Errors

The server is configured with CORS enabled. If you still see CORS errors, check that:
- The backend is running on port 5000
- The frontend proxy is set correctly in `client/package.json`

## Next Steps

Now that you have the app running locally, you can:

1. Modify the React components in `client/src/`
2. Add new API endpoints in `server/src/index.js`
3. Install additional packages as needed
4. Build out your application features

## Need Help?

If you run into any issues:
1. Make sure all prerequisites are installed
2. Check that no other applications are using ports 3000 or 5000
3. Try deleting `node_modules` folders and running `npm run install-all` again

Happy coding!