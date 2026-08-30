# How to update demo content

1. Edit demo-data.json to add new tracking numbers and events.
2. Edit tracking.html to connect the lookup to a real API endpoint: replace the demo object and lookup code with a fetch('/api/packages/:id').
3. To enable live map: replace the map placeholder with Google Maps or Mapbox and push location updates from the backend via WebSocket.
4. To send emails: integrate SendGrid / Amazon SES and call the email endpoint when creating a package.
