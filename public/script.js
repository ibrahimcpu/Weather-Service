const searchForm = document.querySelector('#searchForm');
const cityInput = document.querySelector('#cityInput');
const searchButton = document.querySelector('#searchButton');

const statusMessage = document.querySelector('#statusMessage');

const currentCity = document.querySelector('#currentCity');
const temperature = document.querySelector('#temperature');
const condition = document.querySelector('#condition');
const description = document.querySelector('#description');
const weatherIcon = document.querySelector('#weatherIcon');

const feelsLike = document.querySelector('#feelsLike');
const humidity = document.querySelector('#humidity');
const windSpeed = document.querySelector('#windSpeed');

const forecastContainer = document.querySelector('#forecastContainer');


function getWeatherIcon(conditionName) {

    const value = String(conditionName || '').toLowerCase();

    if (value.includes('thunder')) return '⛈️';
    if (value.includes('rain')) return '🌧️';
    if (value.includes('cloud')) return '☁️';
    if (value.includes('snow')) return '❄️';
    if (value.includes('clear') || value.includes('sun')) return '☀️';
    if (value.includes('mist') || value.includes('fog')) return '🌫️';

    return '🌤️';
}


async function fetchWeatherData(endpoint) {

    const response = await fetch(endpoint);

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || 'Unable to retrieve weather information.'
        );
    }

    return result.data;
}


function displayCurrentWeather(data) {

    currentCity.textContent = `${data.city}, ${data.country}`;
    temperature.textContent = data.temperature ?? '--';
    condition.textContent = data.condition || 'Unknown condition';

    description.textContent =
        data.description || 'Current weather information';

    weatherIcon.textContent = getWeatherIcon(data.condition);

    feelsLike.textContent =
        data.feelsLike != null ? `${data.feelsLike}°C` : '--°C';

    humidity.textContent =
        data.humidity != null ? `${data.humidity}%` : '--%';

    windSpeed.textContent =
        data.windSpeed != null ? `${data.windSpeed} km/h` : '-- km/h';
}


function displayForecast(data) {

    forecastContainer.replaceChildren();

    const forecast = data.forecast;

    if (!Array.isArray(forecast) || forecast.length === 0) {

        const message = document.createElement('div');

        message.className = 'forecast-placeholder';
        message.textContent = 'No forecast information is available.';

        forecastContainer.appendChild(message);

        return;
    }

    forecast.forEach((item) => {

        const card = document.createElement('article');
        card.className = 'forecast-card';

        const date = document.createElement('p');
        date.className = 'forecast-date';

        const parsedDate = new Date(item.date);

        date.textContent = Number.isNaN(parsedDate.getTime())
            ? item.date
            : parsedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric'
            });

        const icon = document.createElement('div');
        icon.className = 'forecast-icon';
        icon.textContent = getWeatherIcon(item.condition);

        const temp = document.createElement('p');
        temp.className = 'forecast-temperature';
        temp.textContent = `${item.maxTemperature ?? '--'}°C / ${item.minTemperature ?? '--'}°C`;

        const weatherCondition = document.createElement('p');
        weatherCondition.className = 'forecast-condition';
        weatherCondition.textContent = item.condition || 'Unknown';

        card.append(
            date,
            icon,
            temp,
            weatherCondition
        );

        forecastContainer.appendChild(card);
    });
}


function displayForecastError(message) {

    forecastContainer.replaceChildren();

    const errorMessage = document.createElement('div');

    errorMessage.className = 'forecast-placeholder';
    errorMessage.textContent = message;

    forecastContainer.appendChild(errorMessage);
}


searchForm.addEventListener('submit', async (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.textContent = 'Please enter a city name.';
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';

    statusMessage.textContent = 'Retrieving weather information...';

    const encodedCity = encodeURIComponent(city);

    try {

        const results = await Promise.allSettled([

            fetchWeatherData(`/api/weather?city=${encodedCity}`),

            fetchWeatherData(`/api/forecast?city=${encodedCity}`)

        ]);

        const currentResult = results[0];
        const forecastResult = results[1];

        if (currentResult.status === 'fulfilled') {

            displayCurrentWeather(currentResult.value);

            statusMessage.textContent =
                `Current weather loaded for ${currentResult.value.city}.`;

        } else {

            throw currentResult.reason;
        }

        if (forecastResult.status === 'fulfilled') {

            displayForecast(forecastResult.value);

        } else {

            displayForecastError(
                forecastResult.reason.message ||
                'Unable to retrieve forecast information.'
            );
        }

    } catch (error) {

        statusMessage.textContent = error.message;

    } finally {

        searchButton.disabled = false;
        searchButton.textContent = 'Search Weather';
    }

});