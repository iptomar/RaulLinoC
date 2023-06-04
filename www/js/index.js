/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// when page is loaded, loads home view
window.onload = () => {
    changeView('home');
}

// holds the view that is currently being displayed
let currView = "home";
// holds map object
let map, gpsPosition;
//bool to control current status of the user location marker
let markerExists = false;
let firstRun = true;

// convert coordinates to leaflet object (Abrantes box corners in order to set map bounds)
// these coordinates were acquired without any study (eye estimation)
const UPLEFTCORNER = L.latLng(39.510042, -8.296089);
const DOWNRIGHTCORNER = L.latLng(39.401459, -8.050828);

// use those coordinates to define the bounds of the map
const bounds = L.latLngBounds(UPLEFTCORNER, DOWNRIGHTCORNER);

//loads current user location into gpsPosition global variable
function onLocationFound(e) {
    gpsPosition = e.coords;
}

//if the current location couldn't be retrieved, logs an error message
function onLocationError() {
    console.log("Houve um erro ao obter a localização.");
}

/**
 * Callback function that is called when the user's location is found;
 * Where map is defined
 * 
 * @param {*} position coordinates of the user's location
 */
function onSuccess(position) {
    //set current user location
    gpsPosition = position.coords;


    console.log("Starting map loading.")
    // create the map with
    map = L.map('map', {
        center: [position.coords.latitude, position.coords.longitude],
        maxZoom: 18,
        minZoom: 12,
    }).setView([position.coords.latitude, position.coords.longitude], 12);

    // create fullscreen control and add it to the map
    L.control.fullscreen({
        title: 'FullScreen Mode', // change the title of the button, default Full Screen
        titleCancel: 'Exit FullScreen Mode', // change the title of the button when fullscreen is on, default Exit Full Screen
        forceSeparateButton: true, // separate button from zoom buttons
        forcePseudoFullscreen: true // force use of pseudo full screen, makes the fullscreen work incase the api fails
    }).addTo(map);

    // sets max bounds
    map.setMaxBounds(bounds);
    //call onLocationFound when user location is found
    map.on('locationfound', onLocationFound);

    // add the OpenStreetMap tiles (making the map usable)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    //costum green marker    
    const markerG = L.icon({
        iconUrl: 'img\\icons\\localizacao_verde.svg',
        iconSize: [50, 50],
        //icon allignment set to bottom mid corner of the icon
        iconAnchor: [25, 50],
        //popup allignment set to top mid corner of the icon
        popupAnchor: [-5, -40]
    });

    //costum yellow marker
    const markerY = L.icon({
        iconUrl: 'img\\icons\\localizacao_amarela.svg',
        iconSize: [50, 50],
        //icon allignment set to bottom mid corner of the icon
        iconAnchor: [25, 50],
        //popup allignment set to top mid corner of the icon
        popupAnchor: [-5, -40]
    });

    //variables to hold the markers that are going to change icons
    var yellowMarkers = L.layerGroup();
    var greenMarkers = L.layerGroup();

    // specify popup options 
    var customOptions = {
        'maxWidth': '150',
        'minWidth': '150',
        'className' : 'custom'
    };

    // fetches data from json file and add the markers based on the each elemnts coordinates to the map
    fetch("dados_raulLino.json")
        .then(response => response.json())
        .then(json => {
            json.data.forEach(element => {
                var customPopup = '<a class="cursor-pointer" onclick="pointsDescription(' + element.id + ');">'+
                    '<div class="row d-flex align-items-center">'+
                        '<div class="col no-padding text-left pr-2">'+
                            element.title +
                        '</div>'+
                        '<div class="col-2 no-padding">'+
                            '<img src="img/icons/ArrowTopRightOnSquare.svg" class="icon-popup">'+
                        '</div>'+
                    '</div>'+
                '</a>';
                //if the element belong to the yellow itinerary, add it to the yellowMarkers layer
                if ([1,4,6,7,10,11,14,15,16].includes(element.id)){
                    yellowMarkers.addLayer(L.marker([element.coords[0], element.coords[1]], { icon: markerY })
                        .bindPopup(customPopup, customOptions));
                    greenMarkers.addLayer(L.marker([element.coords[0], element.coords[1]], { icon: markerG })
                        .bindPopup(customPopup, customOptions));
                //if the element belongs to the green itinerary, add a green marker
                }else{
                    L.marker([element.coords[0], element.coords[1]], { icon: markerG })
                        .addTo(map)
                        .bindPopup(customPopup, customOptions);
                }
            });

            //add the greenMarkers layer group to the map
            greenMarkers.addTo(map);
            
        });

    //call the refresh function every 5 seconds
    setInterval(refreshUserMarker, 5000);

    //yellow itinerary line coordinates
    var yellowItinerary = L.polyline([
        [39.463470, -8.201936], 
        [39.463956, -8.200545],
        [39.463898, -8.200425],
        [39.464009, -8.199658],
        [39.464018, -8.199274],
        [39.463518, -8.198971],
        [39.463456, -8.198977],
        [39.463099, -8.198291],
        [39.463211, -8.198090],
        [39.462999, -8.198292],
        [39.462913, -8.197889],
        [39.462590, -8.198416],
        [39.462262, -8.198719],
        [39.461829, -8.199644],
        [39.461252, -8.199425],
        [39.461363, -8.198468],
    ], {color: 'yellow'});

    //green itinerary line coordinates
    var greenItinerary = L.polyline([
        [39.461363, -8.198468],
        [39.461824, -8.198045],
        [39.461453, -8.197270],
        [39.461805, -8.196812],
        [39.462072, -8.196206],
        [39.462577, -8.196332],
        [39.462625, -8.196112],
        [39.462594, -8.196299],
        [39.463453, -8.196723],
        [39.464861, -8.197632],
    ], {color: 'green'});

    //adds the itineraries to the itinerary layer
    var itineraryLayer = L.layerGroup([yellowItinerary, greenItinerary]);

    //boolean to check if the itineraries are being shown
    var itinerariesShown = false;

    //icon for the show/hide itineraries button
    var itineraryIcon = L.icon({
        iconUrl: 'img\\icons\\mapa_itinerario.svg',
        iconSize: [50, 50],
        //icon allignment set to bottom mid corner of the icon
        iconAnchor: [25, 50],
        //popup allignment set to top mid corner of the icon
        popupAnchor: [-5, -40]
    });

    //create a button on the map to show/hide the itineraries
    L.easyButton('<img src="img/icons/mapa_itinerario.svg" style="width:30px">', function () {
        if (!itinerariesShown) {
            itineraryLayer.addTo(map);
            //change to the yellowMarkers layer group
            map.removeLayer(greenMarkers);
            yellowMarkers.addTo(map);

            //center the map on the itinerary
            map.setView([39.463001, -8.198164], 16);

            //change the boolean value
            itinerariesShown = true;

        //if the itineraries are being shown, hide them
        } else {
            map.removeLayer(itineraryLayer);
            //change to the greenMarkers layer group
            map.removeLayer(yellowMarkers);
            greenMarkers.addTo(map);
            itinerariesShown = false;
        }
    }).addTo(map);

    //update user coords every 5 seconds
    navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        maximumAge: 1000,
        timeout: 2000
    });
    
};

/**
 * Callback function that shows an error message if the user's location is not found (or denied)
 * @param {*} error 
 */
function onError(error) {
    swal("Erro.");
    console.log("error code:" + error.code);
    console.log("error message:" + error.message);
}

/**
 * Changes the page view
 * 
 * @param {*} view view to be displayed
 */
function changeView(view) {
    let currViewElem = document.getElementById(currView);

    //hides last view
    currViewElem.style.display = "none";

    //resets last view line color
    if (currView != "desc") {
        document.getElementById(currView + "Line").classList.remove('yellow-divisor');
        document.getElementById(currView + "Line").classList.add('transparent-divisor');
    }

    //sets current view 
    currView = view;

    //shows new view
    currViewElem = document.getElementById(currView);
    currViewElem.style.display = "";

    //sets new view line color
    if (currView != "desc") {
        document.getElementById(currView + "Line").classList.remove('transparent-divisor');
        document.getElementById(currView + "Line").classList.add('yellow-divisor');
    }

    // if current view is map, loads map
    if (currView == "mapPage") {
        
        askPermission();

        if (window.cordova) {
            // Check if location is enabled using cordova.plugins.diagnostic.isLocationEnabled
            cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
                if (!enabled) {
                    // Display a swal (SweetAlert) if location is disabled
                    swal("Localização está desativada. Por favor ative-a para que a aplicação funcione corretamente");
                }
            }, function (error) {
                // Display an error swal if an error occurs
                console.log("The following error occurred: " + error.message);
            });
        }
        map.invalidateSize();
        refreshUserMarker();
    }
}


/**
 * Setup and refresh of the user location marker
 */
function refreshUserMarker() {
    //update user coords every time the function is called
    navigator.geolocation.watchPosition(onLocationFound, onLocationError);
    //creates the user icon to be added to the map
    var userIcon = L.icon({
        iconUrl: 'img/icons/userIcon.svg',

        iconSize: [20, 40], // size of the icon
        iconAnchor: [10, 40], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -40] // point from which the popup should open relative to the iconAnchor
    });

    //if the user is within the defined bounds, adds or updates his current location into a marker, otherwise removes it if it exists
    if (bounds.contains(new L.latLng(gpsPosition.latitude, gpsPosition.longitude))) {
        if (markerExists) {
            marker.setLatLng([gpsPosition.latitude, gpsPosition.longitude]);
        } else {
            marker = L.marker([gpsPosition.latitude, gpsPosition.longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup('<strong> You are here.</strong>');
            markerExists = true;
        }
    } else {
        if (markerExists) {
            map.removeLayer(marker);
            markerExists = false;
        }
    }
}


/**
 * Creates a new page with the description of the point
 * 
 * @param {*} id id of the point
 */
function pointsDescription(id) {
    var auxDesc = '', auxImg = '';
    fetch("dados_raulLino.json")
        .then(response => response.json())
        .then(json => {
            auxDesc += '<div>';
            auxDesc += '<h1 class="display-6">' + json.data[id].title + '</h1><br />';
            auxDesc += '<p>' + json.data[id].info + '</p>';
            auxDesc += '<p>Ano: ' + json.data[id].year + '</p>';
            auxDesc += '<p>Morada: ' + json.data[id].location + '</p>';
            auxDesc += '<p>Tipo de Edifício: ' + json.data[id].type + '</p>';
            auxDesc += '</div>';

            for (var i = 0; i < json.data[id].images.length; i++) {
                var element = json.data[id].images[i];
                if (i === 0) {
                    auxImg += '<div class="carousel-item active">';
                } else {
                    auxImg += '<div class="carousel-item">';
                }
                auxImg += '<img class="d-block w-100 car-img" src="' + element + '" alt="Slide ' + (i + 1) + '">' + '</div>';
            }

            document.getElementById("iterPDesc").innerHTML = auxDesc;
            document.getElementById("iterPImg").innerHTML = auxImg;
        });
    changeView("desc");
}


function askPermission() {
    cordova.plugins.diagnostic.requestLocationAuthorization(
        function (status) {
            //different possibilites of permission success, need to check all of them
            if (status == cordova.plugins.diagnostic.permissionStatus.GRANTED || status == cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE) {
                console.log("Permission granted.");
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            } else {
                console.log("Permission denied.");
                if (firstRun) {
                    firstRun = false;
                    swal("Permissão de localização negada. Para que a app funcione corretamente ative-a nas definições.");
                } else {
                    swal("Permissão de localização negada. Para que a app funcione corretamente ative-a nas definições.", {
                        buttons: {
                          cancel: "Cancelar",
                          settings: "Ir Para Definições",
                        },
                      })
                      .then((value) => {
                        switch (value) {
                       
                          case "cancel":
                            break;
                       
                          case "settings":
                            cordova.plugins.diagnostic.switchToLocationSettings();
                            break;

                        }
                      });
                }
                
            }
        }, function (error) {
            console.error("The following error occurred: " + error);
        }, false
    );
}