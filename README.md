# Weston and Rocky Arcade

Pixel arcade games built by Weston and Rocky. Every game is one HTML file in `games/`.

## Run
```
npm install
npm start
```
Then open `http://localhost:8080`. Railway deploys the same Node server (`Dockerfile`) on `$PORT`.

## Play together
Reusable WebSocket rooms live at `/play`. Rail City 3D and Crash Test 3D are wired; other games can reuse `shared/play-together.js`.

## Add a game
1. Drop `games/<name>.html` in the repo.
2. Add a card for it in `index.html`.
3. Push. Railway rebuilds from the `Dockerfile`.

## Games
- **Turbo Tap Racers**: two-player tap race. Left Shift vs Right Shift, 10 seconds, pick your car.
- **Rail City 3D**: free-roam city, play-together rooms, police Cybertrucks, cat garage rescue, freight train crashes.
- **Crash Test 3D**: crash lab for Weston. Head-on, wall, train, spikes, parked cars. Vertex crumple, dummies, slow-mo replay, crash report. 2015 Ram Power Wagon is Dad's truck. Play-together rooms share the wreck.
- **Race City 3D**: open-world racing (Utah / California / Las Vegas). Free drive or race vs AI. Split-screen 2-player on one computer (WASD vs arrows). White Tesla Roadster flies as long as you want (F toggle, climb/dive/steer/flip, glide and land on wheels). Rockets never run out. BeamNG-style crumple, full-length trains, cat mode + pretend Target shop. Play-together rooms. iPad fly buttons included.
- **Cat Life City 3D**: Weston's friendly city life. Walk the orange tabby, climb real stairs to a second floor, save 20 coins for any car (including the flying Volt Sky Roadster with wall grip), ride city buses, shop inside Bullseye Mart with a cart, swim in the Palm Villa pool, and move with a Haul-It truck. Hard crashes catch fire and fire trucks follow the roads. Play-together rooms. Progress saves on this device.
- **Cat Airplane Pilot 3D**: The orange tabby walks to the hangar, picks a plane, taxis, and takes off. Arcade flying over a city, mountains, and ocean. Rings, packages, passenger rides, stunts, and soft landings. Play-together rooms. Progress saves on this device.
- **Cat Parkour 3D**: Jump the orange tabby across five worlds (city rooftops, jungle, lava, ice mountain, sky islands). Run, double jump, wall-run, ledge grab, slide, dash, and roll. Golden fish unlock outfits. Play-together rooms. Progress saves on this device.
