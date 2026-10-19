// Location for the forecast, rounded to 2 decimals (about 1 km) for privacy.
  const LAT = 64.53, LON = -21.52;
  // Where the camera uploads its latest photo. Change when the camera is set up.
  const CAM_URL = "webcam/latest.jpg";

  let weather = null;   // latest API response, used by the hourly pop-up

  const codes = {0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Freezing fog",
    51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Freezing drizzle",
    61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Freezing rain",
    71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Showers",81:"Showers",82:"Heavy showers",
    85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"};
  const $ = id => document.getElementById(id);
  const compass = d => ["N","NE","E","SE","S","SW","W","NW"][Math.round(d / 45) % 8];
  // Pick an emoji for a weather code. isDay is 1 by day, 0 at night.
 function icon(code, isDay) {
   if (code <= 1) return isDay ? "☀️" : "🌙";        // clear, mostly clear
   if (code === 2) return isDay ? "⛅" : "☁️";       // partly cloudy
   if (code === 3) return "☁️";                       // overcast
   if (code === 45 || code === 48) return "🌫️";       // fog
   if (code >= 95) return "⛈️";                       // thunderstorm
   if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "❄️"; // snow
   return "🌧️";                                       // everything else is rain or drizzle
 }

   // Show the hourly forecast for one day (date like "2026-10-13") in the pop-up.
  function showHours(date, title) {
    if (!weather) return;                                // no data loaded yet
    const h = weather.hourly;
    const nowHour = weather.current.time.slice(0, 13);   // e.g. "2026-10-12T18"
    let rows = "";
    for (let i = 0; i < h.time.length; i++) {
      if (!h.time[i].startsWith(date)) continue;         // a different day
      if (h.time[i].slice(0, 13) < nowHour) continue;     // an hour already past
      rows += '<li><span class="h-time">' + h.time[i].slice(11) + '</span>' +
        '<span>' + icon(h.weather_code[i], h.is_day[i]) + '</span>' +
        '<span class="h-temp">' + Math.round(h.temperature_2m[i]) + '°</span>' +
        '<span>' + h.precipitation[i] + ' mm</span>' +
        '<span>' + Math.round(h.wind_speed_10m[i]) + ' m/s ' + compass(h.wind_direction_10m[i]) +
        ' (' + Math.round(h.wind_gusts_10m[i]) + ')</span></li>';
    }
    $("hourly-title").textContent = title;
    $("hourly-list").innerHTML = rows;
    $("hourly").showModal();
  }

  async function loadWeather() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&current=temperature_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,weather_code,is_day" +
      "&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum" +
      "&wind_speed_unit=ms&timezone=Atlantic%2FReykjavik&forecast_days=5";
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json(), c = d.current;
      weather = d;
      $("temp").textContent = Math.round(c.temperature_2m) + "°";
      $("desc").textContent = icon(c.weather_code, c.is_day) + " " + (codes[c.weather_code] || "");
      $("feels").textContent = Math.round(c.apparent_temperature) + "°C";
      $("wind").textContent = Math.round(c.wind_speed_10m) + " m/s " + compass(c.wind_direction_10m) +
        " (gusts " + Math.round(c.wind_gusts_10m) + ")";
      $("rain").textContent = c.precipitation + " mm";
      $("days").innerHTML = d.daily.time.map((t, i) => {
        const name = i === 0 ? "Today" : new Date(t).toLocaleDateString("en-GB", { weekday: "short" });
        const title = i === 0 ? "Today" : new Date(t).toLocaleDateString("en-GB", { weekday: "long" });
        return '<button type="button" class="day" data-date="' + t + '" data-title="' + title + '"><b>' + name + '</b><span>' + icon(d.daily.weather_code[i], 1) + ' ' + (codes[d.daily.weather_code[i]] || "") + '</span>' +
          '<span><span class="hi">' + Math.round(d.daily.temperature_2m_max[i]) + '°</span> / ' +
          Math.round(d.daily.temperature_2m_min[i]) + '°</span>' +
          '<span>' + d.daily.precipitation_sum[i] + ' mm</span></button>';
      }).join("");
      $("status").textContent = "";
    } catch (e) {
      $("desc").textContent = "Weather unavailable";
      $("status").textContent = "Could not load the forecast. Check your connection and reload.";
    }
  }

  function loadCam() {
    const img = $("cam-img");
    img.onload = () => {
      img.hidden = false; $("cam-empty").hidden = true;
      $("cam-note").textContent = "Updated " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    };
    img.onerror = () => { img.hidden = true; $("cam-empty").hidden = false; };
    img.src = CAM_URL + "?t=" + Date.now();
  }


    // Open the hourly pop-up when a forecast box is clicked.
  $("days").addEventListener("click", e => {
    const box = e.target.closest(".day");
    if (box) showHours(box.dataset.date, box.dataset.title);
  });

  loadWeather(); loadCam();
  loadWeather(); loadCam();
  setInterval(loadWeather, 15 * 60 * 1000);
  setInterval(loadCam, 5 * 60 * 1000);