class View {
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

    removeItem(cityId) {
        this.weatherList.querySelector("#li" + cityId).remove();
    }
}

class Model {
    constructor(view) {
        this.view = view;
        this.cities = new Map();
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
                if(result.cod !== 200) return city.weather = `error cod=${result.cod}`;
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

}

class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.handle = this.handle.bind(this);
        this.addData = this.addData.bind(this);
    }

    handle() {
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

const view = new View();
const model = new Model(view);
const controller = new Controller(model, view);

controller.handle();





// if(navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//         (position) => {
//             const url = new URL('http://api.openweathermap.org/data/2.5/weather');
//             url.searchParams.set('appid', 'a85a31d77daec507fe9c90f7968a89fc');
//             url.searchParams.set('lat', position.coords.latitude);
//             url.searchParams.set('lon', position.coords.longitude);

//             fetch(url)
//                 .then(response => response.json())
//                 .then(result => model.currentWeather = result)
//                 .catch(err => {
//                     console.log(err);
//                     model.currentWeather = null;
//                 })
//                 .finally(() => {
//                     //render view
//                 });
//         });
// }