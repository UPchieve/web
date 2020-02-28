# Checks if port 8080 and port 3000 is in use
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null && lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
    echo "Starting up Cypress..."
    npx cypress run
else
    echo "Please verify that your client and server are running locally before pushing to GitHub."
    exit 1
fi