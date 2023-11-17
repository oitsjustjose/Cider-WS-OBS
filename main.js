let socket = null;
let retryHandle = null;
let songData = { state: "", art: "", song: "", artist: "", album: "" };

const tryConnect = () => {
  retryHandle = setInterval(() => {
    try {
      socket = new WebSocket("ws://localhost:10766/ws");
      setupSocketEvents();
      clearInterval(retryHandle);
      retryHandle = null;
    } catch { }
  }, 1000);
};

const setupSocket = () => {
  if (!socket) { // Only true on first load
    // If we can connect now, then we don't really need to do anything
    try {
      socket = new WebSocket("ws://localhost:10766/ws");
      setupSocketEvents();
      return;
    } catch { }
  }

  // weren't able to connect to the socket on startup..
  tryConnect();
};

const makeArtworkUrl = (artwork) => {
  return artwork.url
    .replace("{w}", artwork.width)
    .replace("{h}", artwork.height);
};

const marqueeify = (text, elementType, amt) => {
  if (text.length > amt) {
    return `<marquee><${elementType}>${text}</${elementType}></marquee>`;
  } else {
    return `<${elementType}>${text}</${elementType}>`;
  }
};

const setupSocketEvents = () => {
  socket.onmessage = ({ data }) => {
    data = JSON.parse(data);
    // Skip seek events, super unhelpful tbh
    if (data.data.state && data.data.state == "seeking") return;

    const newSongData = data.data.state && data.data.attributes ? {
      state: data.data.state || "playing",
      art: makeArtworkUrl(data.data.attributes.artwork),
      song: data.data.attributes.name,
      artist: data.data.attributes.artistName,
      album: data.data.attributes.albumName
    } : { // If state/attrs aren't included, we're just updating the track progress
      state: "playing",
      art: makeArtworkUrl(data.data.artwork),
      song: data.data.name,
      artist: data.data.artistName,
      album: data.data.albumName
    };

    if (JSON.stringify(songData) == JSON.stringify(newSongData)) return;
    songData = newSongData;

    const art = document.getElementById("art");
    art.setAttribute("src", songData.art);
    art.style.filter = songData.state === "playing" ? "none" : "saturate(0)";

    document.getElementById("name").innerHTML = marqueeify(songData.song, "b", 25);
    document.getElementById("artist").innerHTML = marqueeify(songData.artist, "p", 11);
    document.getElementById("album").innerHTML = marqueeify(songData.album, "p", 11);
  };

  // Attempt to reconnect on close 
  socket.onclose = () => {
    if (retryHandle) return;
    tryConnect();
  };
};

document.addEventListener("DOMContentLoaded", () => {
  setupSocket();
});