const apiKey = "8bc28047de95b0134705e284629b19e8";

let weatherChart = null;

async function getWeather() {

    const cityInput = document.getElementById("cityInput");

    if (!cityInput) return;

    const city = cityInput.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    showLoading();

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Weather API error");
        }

        await loadDashboard(data);

    } catch (error) {

        console.error("Weather Error:", error);

        alert(error.message);

        resetLoading();

    }
}


// ============================================
// 2. GET WEATHER USING CURRENT LOCATION
// ============================================

function getLocationWeather() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            try {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const url =
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Location weather unavailable.");
                }

                await loadDashboard(data);

            } catch (error) {

                console.error("Location Error:", error);

                alert(error.message);

                resetLoading();

            }

        },

        (error) => {

            resetLoading();

            alert("Location access denied or unavailable.");

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


// ============================================
// 3. LOAD COMPLETE WEATHER DASHBOARD
// ============================================

async function loadDashboard(data) {

    displayWeather(data);

    updateStatistics(data);

    updateSunTimes(data);

    const lat = data.coord.lat;
    const lon = data.coord.lon;

    await Promise.all([
        getAQI(lat, lon),
        getForecast(lat, lon)
    ]);

}


// ============================================
// 4. DISPLAY CURRENT WEATHER
// ============================================

function displayWeather(data) {

    const result = document.getElementById("weatherResult");

    if (!result) return;

    const icon = data.weather[0].icon;

    result.innerHTML = `

        <img
            class="weather-icon"
            src="https://openweathermap.org/img/wn/${icon}@2x.png"
            alt="${data.weather[0].description}"
        >

        <div class="temp">
            ${Math.round(data.main.temp)}°C
        </div>

        <div class="city">
            ${data.name}, ${data.sys.country}
        </div>

        <p>
            ${data.weather[0].description}
        </p>

        <div class="details">

            <div class="box">
                <h3>Humidity</h3>
                <p>${data.main.humidity}%</p>
            </div>

            <div class="box">
                <h3>Wind Speed</h3>
                <p>${(data.wind.speed * 3.6).toFixed(1)} km/h</p>
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


// ============================================
// 5. UPDATE WEATHER STATISTICS
// ============================================

function updateStatistics(data) {

    const temperature =
        document.getElementById("statTemperature");

    const wind =
        document.getElementById("statWind");

    const humidity =
        document.getElementById("statHumidity");

    if (temperature) {
        temperature.textContent =
            Math.round(data.main.temp) + "°C";
    }

    if (wind) {
        wind.textContent =
            (data.wind.speed * 3.6).toFixed(1) + " km/h";
    }

    if (humidity) {
        humidity.textContent =
            data.main.humidity + "%";
    }

}


// ============================================
// 6. GET AIR QUALITY INDEX
// ============================================

async function getAQI(lat, lon) {

    const aqiElement = document.getElementById("aqi");

    if (!aqiElement) return;

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "AQI unavailable.");
        }

        const aqi = data.list[0].main.aqi;

        const aqiLabels = {
            1: "Good",
            2: "Fair",
            3: "Moderate",
            4: "Poor",
            5: "Very Poor"
        };

        aqiElement.textContent =
            aqiLabels[aqi] || "Unavailable";

    } catch (error) {

        console.error("AQI Error:", error);

        aqiElement.textContent = "Unavailable";

    }

}


// ============================================
// 7. SUNRISE AND SUNSET
// ============================================

function updateSunTimes(data) {

    const sunriseElement =
        document.getElementById("sunrise");

    const sunsetElement =
        document.getElementById("sunset");

    if (!sunriseElement && !sunsetElement) return;

    const sunrise =
        new Date(data.sys.sunrise * 1000);

    const sunset =
        new Date(data.sys.sunset * 1000);

    const timeZone = data.timezone;

    function formatLocalTime(date) {

        const utcTime = date.getTime() +
            date.getTimezoneOffset() * 60000;

        return new Date(utcTime + timeZone * 1000)
            .toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

    }

    if (sunriseElement) {
        sunriseElement.textContent =
            formatLocalTime(sunrise);
    }

    if (sunsetElement) {
        sunsetElement.textContent =
            formatLocalTime(sunset);
    }

}


// ============================================
// 8. GET FIVE-DAY WEATHER FORECAST
// ============================================

async function getForecast(lat, lon) {

    const container =
        document.getElementById("forecastCards");

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Forecast unavailable.");
        }

        const dailyData = {};

        // Select one forecast close to midday per day

        data.list.forEach(item => {

            const date = item.dt_txt.split(" ")[0];

            const existing = dailyData[date];

            if (
                !existing ||
                Math.abs(
                    Number(item.dt_txt.substring(11, 13)) - 12
                ) <
                Math.abs(
                    Number(existing.dt_txt.substring(11, 13)) - 12
                )
            ) {

                dailyData[date] = item;

            }

        });

        const forecast =
            Object.values(dailyData).slice(0, 5);

        displayForecast(forecast);

        updateChart(forecast);

    } catch (error) {

        console.error("Forecast Error:", error);

        if (container) {

            container.innerHTML =
                "<p>Forecast data is currently unavailable.</p>";

        }

    }

}


// ============================================
// 9. DISPLAY FORECAST CARDS
// ============================================

function displayForecast(forecast) {

    const container =
        document.getElementById("forecastCards");

    if (!container) return;

    container.innerHTML = "";

    forecast.forEach(day => {

        const date = new Date(day.dt * 1000);

        const dayName =
            date.toLocaleDateString("en-US", {
                weekday: "short"
            });

        const icon = day.weather[0].icon;

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `

            <h3>${dayName}</h3>

            <img
                src="https://openweathermap.org/img/wn/${icon}@2x.png"
                alt="${day.weather[0].description}"
            >

            <h2>${Math.round(day.main.temp)}°C</h2>

            <p>${day.weather[0].description}</p>

            <p>Humidity: ${day.main.humidity}%</p>

        `;

        container.appendChild(card);

    });

}


// ============================================
// 10. TEMPERATURE TREND CHART
// ============================================

function updateChart(forecast) {

    const canvas =
        document.getElementById("weatherChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const labels = forecast.map(day =>

        new Date(day.dt * 1000)
            .toLocaleDateString("en-US", {
                weekday: "short"
            })

    );

    const temperatures = forecast.map(day =>
        Math.round(day.main.temp)
    );

    if (weatherChart) {
        weatherChart.destroy();
    }

    weatherChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Temperature (°C)",

                data: temperatures,

                borderColor: "#38bdf8",

                backgroundColor:
                    "rgba(56,189,248,0.15)",

                borderWidth: 3,

                fill: true,

                tension: 0.4,

                pointBackgroundColor: "#ffffff",

                pointBorderColor: "#38bdf8",

                pointRadius: 5

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    labels: {
                        color: "#f1f5f9"
                    }
                }

            },

            scales: {

                x: {
                    ticks: {
                        color: "#a9bdd3"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)"
                    }
                },

                y: {
                    ticks: {
                        color: "#a9bdd3"
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)"
                    }
                }

            }

        }

    });

}


// ============================================
// 11. FORECAST PAGE CITY SEARCH
// ============================================

async function getForecastByCity() {

    const cityInput =
        document.getElementById("forecastCityInput");

    const container =
        document.getElementById("forecastCards");

    if (!cityInput || !container) return;

    const city = cityInput.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    container.innerHTML =
        "<p>Loading forecast...</p>";

    try {

        // Get city coordinates

        const weatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

        const weatherResponse = await fetch(weatherUrl);

        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            throw new Error(weatherData.message || "City not found.");
        }

        // Fetch forecast using coordinates

        await getForecast(
            weatherData.coord.lat,
            weatherData.coord.lon
        );

    } catch (error) {

        console.error("Forecast Search Error:", error);

        container.innerHTML =
            `<p>${error.message}</p>`;

    }

}


// ============================================
// 12. LOADING AND RESET
// ============================================

function showLoading() {

    const result =
        document.getElementById("weatherResult");

    if (!result) return;

    result.innerHTML = `

        <div class="placeholder">

            <i class="fas fa-spinner fa-spin"></i>

            <p>Loading weather information...</p>

        </div>

    `;

}


function resetLoading() {

    const result =
        document.getElementById("weatherResult");

    if (!result) return;

    result.innerHTML = `

        <div class="placeholder">

            <i class="fas fa-cloud"></i>

            <p>Unable to load weather. Please try again.</p>

        </div>

    `;

}


// ============================================
// 13. ENTER KEY SUPPORT FOR BOTH PAGES
// ============================================

// Home page search

const cityInput =
    document.getElementById("cityInput");

if (cityInput) {

    cityInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            getWeather();
        }

    });

}


// Forecast page search

const forecastCityInput =
    document.getElementById("forecastCityInput");

if (forecastCityInput) {

    forecastCityInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            getForecastByCity();
        }

    });

}
// ============================================
// AIR QUALITY PAGE CITY SEARCH
// ============================================

async function getAirQualityByCity() {

    const cityInput =
        document.getElementById("aqCityInput");

    const city = cityInput.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    try {

        document.getElementById("aqiStatus").textContent =
            "Loading...";

        const weatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;

        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            throw new Error(weatherData.message || "City not found.");
        }

        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;

        const aqiUrl =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        const aqiResponse = await fetch(aqiUrl);
        const aqiData = await aqiResponse.json();

        if (!aqiResponse.ok) {
            throw new Error(aqiData.message || "Air quality unavailable.");
        }

        displayAirQuality(
            weatherData,
            aqiData.list[0]
        );

    } catch (error) {

        console.error("Air Quality Error:", error);

        document.getElementById("aqiStatus").textContent =
            "Data unavailable";

        document.getElementById("aqiDescription").textContent =
            error.message;

    }
}


// ============================================
// DISPLAY AIR QUALITY DATA
// ============================================

function displayAirQuality(weatherData, aqiData) {

    const aqi = aqiData.main.aqi;

    const levels = {
        1: {
            status: "Good",
            description: "Air quality is considered good."
        },
        2: {
            status: "Fair",
            description: "Air quality is generally acceptable."
        },
        3: {
            status: "Moderate",
            description: "Some people may be more sensitive to pollution."
        },
        4: {
            status: "Poor",
            description: "Air pollution levels are elevated."
        },
        5: {
            status: "Very Poor",
            description: "Air pollution levels are very high."
        }
    };

    const result = levels[aqi];

    document.getElementById("aqiCityName").textContent =
        weatherData.name + ", " + weatherData.sys.country;

    document.getElementById("aqiValue").textContent =
        aqi + " / 5";

    document.getElementById("aqiStatus").textContent =
        result.status;

    document.getElementById("aqiDescription").textContent =
        result.description;

    const components = aqiData.components;

    document.getElementById("coValue").textContent =
        components.co.toFixed(2) + " µg/m³";

    document.getElementById("no2Value").textContent =
        components.no2.toFixed(2) + " µg/m³";

    document.getElementById("o3Value").textContent =
        components.o3.toFixed(2) + " µg/m³";

    document.getElementById("pm25Value").textContent =
        components.pm2_5.toFixed(2) + " µg/m³";

}
const aqCityInput =
    document.getElementById("aqCityInput");

if (aqCityInput) {

    aqCityInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            getAirQualityByCity();
        }

    });

}
// WEATHER INSIGHTS PAGE

let insightsChart = null;

async function getWeatherInsights() {

    const input = document.getElementById("insightsCityInput");

    if (!input) return;

    const city = input.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    try {
        const weatherUrl =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

        const response = await fetch(weatherUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to fetch weather.");
        }

        document.getElementById("insightsCityName").textContent =
            `Weather Overview: ${data.name}, ${data.sys.country}`;

        document.getElementById("insightTemp").textContent =
            `${data.main.temp} °C`;

        document.getElementById("insightHumidity").textContent =
            `${data.main.humidity} %`;

        document.getElementById("insightWind").textContent =
            `${data.wind.speed} m/s`;

        document.getElementById("insightClouds").textContent =
            `${data.clouds.all} %`;

        const analysis =
            `${data.name} currently has ${data.weather[0].description}.
            The temperature is ${data.main.temp} °C, with ${data.main.humidity}%
            humidity and wind speed of ${data.wind.speed} m/s.
            Cloud coverage is ${data.clouds.all}%.`;

        document.getElementById("weatherAnalysis").textContent = analysis;

        const forecastUrl =
            `https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&units=metric&appid=${apiKey}`;

        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            throw new Error(forecastData.message || "Forecast unavailable.");
        }

        displayInsightsChart(forecastData);

    } catch (error) {
        console.error("Insights Error:", error);
        document.getElementById("weatherAnalysis").textContent =
            error.message;
    }
}

function displayInsightsChart(data) {

    const dailyData = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!dailyData[date]) {
            dailyData[date] = [];
        }

        dailyData[date].push(item.main.temp);
    });

    const dates = Object.keys(dailyData).slice(0, 5);

    const temperatures = dates.map(date => {
        const values = dailyData[date];
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    });

    const canvas = document.getElementById("insightsChart");

    if (!canvas || typeof Chart === "undefined") return;

    if (insightsChart) {
        insightsChart.destroy();
    }

    insightsChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: dates,
            datasets: [{
                label: "Average Temperature (°C)",
                data: temperatures,
                borderWidth: 3,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                }
            }
        }
    });
}

const insightsInput = document.getElementById("insightsCityInput");

if (insightsInput) {
    insightsInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            getWeatherInsights();
        }
    });
}