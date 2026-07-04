const apiKey = "34c3177bf0063e3842e991dd3388a023";
async function getWeather() {

    const city = document.getElementById("cityInput").value.trim();

    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    try {

        const weatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await fetch(weatherUrl);

        if (!response.ok) {
            throw new Error("City not found");
        }

        const data = await response.json();

        displayWeather(data);

        const lat = data.coord.lat;
        const lon = data.coord.lon;

        getAQI(lat, lon);

        updateSunTimes(data);

        changeBackground(data.weather[0].main);

    } catch (error) {
        console.error(error);
        alert("Unable to fetch weather data.");
    }
}
async function getLocationWeather() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {

            try {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const weatherUrl =
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

                const response = await fetch(weatherUrl);

                const data = await response.json();

                displayWeather(data);

                getAQI(lat, lon);

                updateSunTimes(data);

                changeBackground(data.weather[0].main);

            } catch (error) {
                console.error(error);
            }

        },
        (error) => {
            alert("Unable to access location.");
        }
    );
}
function displayWeather(data) {

    document.getElementById("weatherResult").innerHTML = `
        <div class="weather-icon">
            ☀️
        </div>

        <div class="temp">
            ${Math.round(data.main.temp)}°C
        </div>

        <div class="city">
            ${data.name}
        </div>

        <p>${data.weather[0].description}</p>

        <div class="details">

            <div class="box">
                <h3>Humidity</h3>
                <p>${data.main.humidity}%</p>
            </div>

            <div class="box">
                <h3>Wind</h3>
                <p>${data.wind.speed} km/h</p>
            </div>

            <div class="box">
                <h3>Feels Like</h3>
                <p>${Math.round(data.main.feels_like)}°C</p>
            </div>

            <div class="box">
                <h3>Pressure</h3>
                <p>${data.main.pressure} hPa</p>
            </div>
        </div>
    `;
}
async function getAQI(lat, lon) {
    try {

        const aqiUrl =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        const response = await fetch(aqiUrl);
        const data = await response.json();

        const aqiElement = document.getElementById("aqi");

        if (aqiElement) {
            aqiElement.innerHTML = data.list[0].main.aqi;
        }

    } catch (error) {
        console.error("AQI Error:", error);
    }
}

function updateSunTimes(data) {

    const sunrise = new Date(data.sys.sunrise * 1000);

    const sunset = new Date(data.sys.sunset * 1000);

    const sunriseElement = document.getElementById("sunrise");
    const sunsetElement = document.getElementById("sunset");

    if (sunriseElement) {
        sunriseElement.innerHTML =
            sunrise.toLocaleTimeString();
    }

    if (sunsetElement) {
        sunsetElement.innerHTML =
            sunset.toLocaleTimeString();
    }
}

function changeBackground(weather) {

    weather = weather.toLowerCase();

    if (weather.includes("cloud")) {

        document.body.style.backgroundImage =
            "url('images/cloudy.jpg')";

    } else if (weather.includes("rain")) {

        document.body.style.backgroundImage =
            "url('images/rainy.jpg')";

    } else if (weather.includes("snow")) {

        document.body.style.backgroundImage =
            "url('images/snow.jpg')";

    } else {

        document.body.style.backgroundImage =
            "url('images/sunny.jpg')";
    }

    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
}
