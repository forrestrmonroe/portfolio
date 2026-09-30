# Forrest Monroe — Portfolio

A single-page portfolio presenting Forrest Monroe's audio work, biography, skills,
credits, and contact form.

## Run locally

No installation or build step is required. With Python 3 installed, run from the
repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a browser. Stop the server with Ctrl+C.

## Source layout

- `index.html`: portfolio content, section navigation, and contact form.
- `style.css`: responsive layout, typography, and visual effects.
- `script.js`: navigation, motion controls, and artist-card playback/details.
- `tracks.js`: featured track metadata, Spotify URLs, and optional local snippets.
- `assets/`: local images and Rubik fonts.

The contact form submits to Formspree and requires a network connection. There is
no local backend or configured automated test suite. GitHub Pages is the intended
hosting platform; this README does not establish current deployment status.

## Artist tracks

Each artist's `data-artist` key in `index.html` matches an entry in `tracks.js`.
Set `title`, optional `release` and `description`, and either `audioSrc`,
`spotifyUrl`, or both. For a snippet, place the audio file under `assets/audio/`
and set `audioSrc` to its relative path. No audio files are bundled yet.

Each card has one play button. It opens one player inside the artist card, then
becomes a close button that stops playback. Escape also closes it; opening another
artist closes the previous player. Local snippets take precedence when both
sources are configured. Spotify's own embedded player supplies its track title,
artist, and playback controls, without additional Spotify buttons or links.
Cards without a source have a disabled play button.

The active artist card spans the grid to give the player room. On wider screens
the portrait and player sit side by side; at 700px and below they stack. Narrow
phone gutters preserve at least 300px of player width at a 320px viewport. The
collapsed portrait grid still uses its original responsive columns.

Spotify URLs must use `https://open.spotify.com/track/<track-id>`; normal share
query strings are supported. Embeds load only after a visitor requests them.
See [Spotify's embed documentation](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed).

The hero tagline alternates on a 12-second cycle with a pause control. Reduced
motion displays the service list without animation and disables banner movement,
credit blur transitions, and hover movement. Compact navigation appears at widths
of 960px or less; section links remain available if JavaScript is unavailable.
