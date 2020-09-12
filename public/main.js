class WeatherView {
    constructor() {
        this.input = document.querySelector("header input");
        this.addButton = document.querySelector("header button");
        this.weatherList = document.querySelector("#weather_list");
    }

    renderItem(cityId, cityName) {
        let item = this.weatherList.querySelector("#li" + cityId);
        if (item == null) {
            item = document.createElement("li");
            item.setAttribute('id', 'li' + cityId);
            this.weatherList.appendChild(item);
        }

        item.innerHTML = '';

        const dataDiv = document.createElement("div");
        const title = document.createElement("h4");
        title.innerHTML = cityName;
        const weather = document.createElement("p");
        dataDiv.append(title, weather);

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "&#9998;";
        editBtn.setAttribute("data-action","edit");
        item.appendChild(editBtn);
        const removeBtn = document.createElement("button");
        removeBtn.innerHTML = "&times;";
        removeBtn.setAttribute("data-action","remove");
        item.append(dataDiv, editBtn, removeBtn);

        return item;
    }

    setItemEditable(cityId) {
        const item = this.weatherList.querySelector("#li" + cityId);
        const cityName = item.querySelector("h4").innerText;
        item.innerHTML = '';
        const input = document.createElement("input");
        input.value = cityName;
        const okBtn = document.createElement("button");
        okBtn.innerHTML = "OK";
        okBtn.setAttribute("data-action","save");
        item.append(input, okBtn);
    }

    updateWeatherData(cityId, data) {
        const item = this.weatherList.querySelector("#li" + cityId);
        item.querySelector("p").innerHTML = data;
    }

    updateCurrentWeatherData(cityName, data) {
        const item = this.weatherList.querySelector("#current_city");
        item.querySelector("h4").innerHTML = cityName;
        item.querySelector("p").innerHTML = data;
    }

    removeItem(cityId) {
        this.weatherList.querySelector("#li" + cityId).remove();
    }
}

class WeatherModel {
    constructor(view) {
        this.view = view;
        this.cities = new Map();
        this.currentCity = {
            location: null,
            name: 'Unknown',
            weather: 'Unknown'
        }
    }

    addCity(id, name) {
        const city = {
            id: id,
            name: name,
            weather: ''
        }
        this.cities.set(id, city);
        this.loadWeather(city);
    }

    updateCity(id, newName) {
        const city = this.cities.get(id);
        city.name = newName;
        this.loadWeather(city);
    }

    removeCity(id) {
        this.cities.delete(id);
    }

    setLocation(location) {
        this.currentCity.location = location;
        if(location == null) {
            this.currentCity.name = `Unknown`;
            this.currentCity.weather = 'Unable to retrieve your location';
            this.view.updateCurrentWeatherData(this.currentCity.name, this.currentCity.weather);
            return;
        }
        this.loadCurrentWeather();
    }

    loadCurrentWeather() {
        const url = new URL('http://api.openweathermap.org/data/2.5/weather');
        url.searchParams.set('appid', 'a85a31d77daec507fe9c90f7968a89fc');
        url.searchParams.set('lat', this.currentCity.location[0]);
        url.searchParams.set('lon', this.currentCity.location[1]);

        fetch(url)
            .then(response => response.json())
            .then(result => {
                if(result.cod === 200) {
                    this.currentCity.name = result.name;
                    this.currentCity.weather = `Temp: ${(result.main.temp - 270).toFixed(1)}&deg;C; Wind: ${result.wind.speed} mph; ${result.weather[0].description}`;
                } else {
                    this.currentCity.name = `error cod=${result.cod}`;
                    this.currentCity.weather = JSON.stringify(result);
                }
            })
            .catch(err => {
                console.log(err);
                this.currentCity.name = `Unknown`;
                this.currentCity.weather = 'error';
            })
            .finally(() => {
                this.view.updateCurrentWeatherData(this.currentCity.name, this.currentCity.weather);
            });
    }

    loadWeather(city) {
        city.weather = 'loading...';
        this.view.updateWeatherData(city.id, city.weather);

        const url = new URL('http://api.openweathermap.org/data/2.5/weather');
        url.searchParams.set('appid', 'a85a31d77daec507fe9c90f7968a89fc');
        url.searchParams.set('q', city.name);

        fetch(url)
            .then(response => response.json())
            .then(result => {
                if(result.cod !== 200) return city.weather = JSON.stringify(result);
                city.weather = `Temp: ${(result.main.temp - 270).toFixed(1)}&deg;C; Wind: ${result.wind.speed} mph; ${result.weather[0].description}`;
            })
            .catch(err => {
                console.log(err);
                city.weather = 'error';
            })
            .finally(() => {
                this.view.updateWeatherData(city.id, city.weather);
            });
    }

}

class WeatherController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.handle = this.handle.bind(this);
        this.addData = this.addData.bind(this);
    }

    handle() {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition( 
                (position) => this.model.setLocation([position.coords.latitude, position.coords.longitude]),
                (err) => this.model.setLocation(null)
                );
        } else {
            this.model.setLocation(null);
        }
        fetch('http://localhost:3000/cities')
            .then(response => response.json())
            .then(result => {
                result.forEach(element => {
                    const item = this.view.renderItem(element._id, element.name);
                    const hendler = this.createHendler(element._id, this);
                    item.addEventListener("click", hendler);

                    this.model.addCity(element._id, element.name);
                });
            })
            .catch(err => console.log(err))
            .finally(() => {
                
            });
        this.view.addButton.addEventListener("click", this.addData);
    }

    addData() {
        const cityName = this.view.input.value;
        if(cityName.length === 0) return;

        fetch('http://localhost:3000/cities', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({city: cityName})
          })
            .then(response => response.json())
            .then(result => {
                const item = this.view.renderItem(result._id, result.name);
                const hendler = this.createHendler(result._id, this);
                item.addEventListener("click", hendler);

                this.model.addCity(result._id, result.name);
            })
            .catch(err => console.log(err))
            .finally(() => this.view.input.value = '');
    }

    createHendler(id, controller) {
        return {
            id: id,
            controller: controller,
            handleEvent(event) {
                let action = event.target.dataset.action;
                switch (action) {
                    case "remove":
                        fetch('http://localhost:3000/cities/' + this.id, {method: 'DELETE'})
                            .then(response => {
                                if(response.status === 200) {
                                    this.controller.model.removeCity(this.id);
                                    this.controller.view.removeItem(this.id);
                                }
                            })
                            .catch(err => console.log(err));
                        break;
                    case "edit":
                        this.controller.view.setItemEditable(this.id);
                        break;
                    case "save":
                        const newName = this.controller.view.weatherList.querySelector("#li" + this.id + " input").value;
                        fetch('http://localhost:3000/cities/' + this.id, {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({city: newName}) 
                        })
                            .finally(() => {
                                this.controller.view.renderItem(this.id, newName);
                            })
                            .then(response => {
                                if(response.status === 200) {
                                    this.controller.model.updateCity(this.id, newName);                                    
                                }
                            })
                            .catch(err => console.log(err));
                        break;
                }
            }
        }
    }
}

const weatherView = new WeatherView();
const weatherModel = new WeatherModel(weatherView);
const weatherController = new WeatherController(weatherModel, weatherView);

weatherController.handle();