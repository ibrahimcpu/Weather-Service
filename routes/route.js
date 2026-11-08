const express = require('express');
const router = express.Router();


/*  EXTERNAL WEATHER API FETCH  */

async function getCoordinates(city) {
  // 1. Build the geocoding API URL
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;

  // 2. Send an HTTP request to Open-Meteo
  const response = await fetch(url);

  // 3. Check whether the external request was successful
  if (!response.ok) {
    throw new Error("Geocoding service request failed");
  }

  // 4. Convert the JSON response into a JavaScript object
  const result = await response.json();

  // 5. Check whether any matching location was found
  if (!result.results || result.results.length === 0) {
    return null;
  }

  // 6. Extract the first matching location
  const location = result.results[0];

  // 7. Create our own object using the location data
  const coordinates = {
    name: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone
  };

  // 8. Return the new object
  return coordinates;
}



/*  OUR WEATHER CODE CONVERTER  */
function getWeatherCondition(code) {
  const conditions = {
    0: {
      condition: "Clear",
      description: "Clear sky"
    },
    1: {
      condition: "Mainly clear",
      description: "Mainly clear skies"
    },
    2: {
      condition: "Partly cloudy",
      description: "Partly cloudy skies"
    },
    3: {
      condition: "Cloudy",
      description: "Overcast skies"
    },
    45: {
      condition: "Fog",
      description: "Foggy conditions"
    },
    48: {
      condition: "Fog",
      description: "Depositing rime fog"
    },
    51: {
      condition: "Drizzle",
      description: "Light drizzle"
    },
    53: {
      condition: "Drizzle",
      description: "Moderate drizzle"
    },
    55: {
      condition: "Drizzle",
      description: "Dense drizzle"
    },
    56: {
      condition: "Freezing drizzle",
      description: "Light freezing drizzle"
    },
    57: {
      condition: "Freezing drizzle",
      description: "Dense freezing drizzle"
    },
    61: {
      condition: "Rain",
      description: "Slight rain"
    },
    63: {
      condition: "Rain",
      description: "Moderate rain"
    },
    65: {
      condition: "Rain",
      description: "Heavy rain"
    },
    66: {
      condition: "Freezing rain",
      description: "Light freezing rain"
    },
    67: {
      condition: "Freezing rain",
      description: "Heavy freezing rain"
    },
    71: {
      condition: "Snow",
      description: "Slight snowfall"
    },
    73: {
      condition: "Snow",
      description: "Moderate snowfall"
    },
    75: {
      condition: "Snow",
      description: "Heavy snowfall"
    },
    77: {
      condition: "Snow",
      description: "Snow grains"
    },
    80: {
      condition: "Rain showers",
      description: "Slight rain showers"
    },
    81: {
      condition: "Rain showers",
      description: "Moderate rain showers"
    },
    82: {
      condition: "Rain showers",
      description: "Violent rain showers"
    },
    85: {
      condition: "Snow showers",
      description: "Slight snow showers"
    },
    86: {
      condition: "Snow showers",
      description: "Heavy snow showers"
    },
    95: {
      condition: "Thunderstorm",
      description: "Thunderstorm"
    },
    96: {
      condition: "Thunderstorm",
      description: "Thunderstorm with slight hail"
    },
    97: {
      condition: "Thunderstorm",
      description: "Heavy thunderstorm"
    },
    99: {
      condition: "Thunderstorm",
      description: "Thunderstorm with heavy hail"
    }
  };

  return conditions[code] || {
    condition: "Unknown",
    description: "Weather condition unavailable"
  };
}


//  Route Handler !!!
router.get('/weather', async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({
      success: false,
      message: "Please provide a city name"
    });
  }

  try {
    // 1. Get the city's coordinates
    const location = await getCoordinates(city);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    // 2. Build the weather API URL using those coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

    // 3. Request the weather information
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Weather service request failed");
    }

    // 4. Convert the weather response into JavaScript data
    const weatherResult = await weatherResponse.json();

    // 5. Extract the current weather measurements
    const current = weatherResult.current;

    // 6. Convert the numerical weather code into readable text
    const condition = getWeatherCondition(current.weather_code);

    // 7. Return our own API response
    return res.status(200).json({
      success: true,
      data: {
        city: location.name,
        country: location.country,
        temperature: current.temperature_2m,
        condition: condition.condition,
        description: condition.description,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(502).json({
      success: false,
      message: "Unable to retrieve weather information"
    });
  }
});


/*  FORECAST HANDLER  */
router.get('/forecast', async (req, res) => {

    const city = req.query.city;

    // 1. Validate the city input
    if (!city) {
        return res.status(400).json({
            success: false,
            message: "Please provide a city name"
        });
    }

    try {

        // 2. Get the city's coordinates
        const location = await getCoordinates(city);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "City not found"
            });
        }

        // 3. Build the Open-Meteo forecast URL
        const forecastUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

        // 4. Request forecast data
        const forecastResponse = await fetch(forecastUrl);

        if (!forecastResponse.ok) {
            throw new Error("Forecast service request failed");
        }

        // 5. Convert the response into JavaScript data
        const forecastResult = await forecastResponse.json();

        // 6. Extract the daily forecast arrays
        const daily = forecastResult.daily;

        // 7. Transform the arrays into individual forecast objects
        const forecast = daily.time.map((date, index) => {

            const condition = getWeatherCondition(
                daily.weather_code[index]
            );

            return {
                date: date,
                condition: condition.condition,
                maxTemperature: daily.temperature_2m_max[index],
                minTemperature: daily.temperature_2m_min[index]
            };

        });

        // 8. Return our own API response
        return res.status(200).json({
            success: true,
            data: {
                city: location.name,
                country: location.country,
                forecast: forecast
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(502).json({
            success: false,
            message: "Unable to retrieve forecast information"
        });

    }

});

module.exports = router;