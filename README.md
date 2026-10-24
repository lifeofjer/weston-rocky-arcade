# Weston and Rocky Arcade

Pixel arcade games built by Weston and Rocky. Every game is one HTML file in `games/`.

## Run
```
npm install
npm start
```
Then open `http://localhost:8080`. Railway deploys the same Node server (`Dockerfile`) on `$PORT`.

## Play together
Reusable WebSocket rooms live at `/play`. Rail City 3D is wired now; other games can reuse `shared/play-together.js` later.

## Add a game
1. Drop `games/<name>.html` in the repo.
2. Add a card for it in `index.html`.
3. Push. Railway rebuilds from the `Dockerfile`.

## Games
- **Turbo Tap Racers**: two-player tap race. Left Shift vs Right Shift, 10 seconds, pick your car.
- **Rail City 3D**: free-roam city, play-together rooms, police Cybertrucks, cat garage rescue, freight train crashes.
