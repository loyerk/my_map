/*jslint browser: true, node: true */
/*global $, jQuery, alert, google*/
"use strict";

var map, directionsDisplay, autocompleteStart, autocompleteArrive, inputStart = document.getElementById('start'),
    inputArrive = document.getElementById('arrive'), inputSearch = document.getElementById('search'), previousPosition = null, directionsService = new google.maps.DirectionsService(),
    watchId, startWatch, stopWatch,
    attrDraggable = {
        draggable: true
    },
    service, setMark = false, msg, newLineCoordinates, newLine, infowindow, place, tabMarker, wpMarker, i, tabMarker = [], wpMarker = [], step, stepLen, j,
    requestPOI, results, result, infowindow, iconImg = "img/markerOtter.png", start, arrived, status, setMarker, stepTab = [], leg, marker;

function addPreventDefault(e) {

    e.preventDefault();
}

function addMarker(result) {

    if (status === google.maps.GeocoderStatus.OK) {
        var marker = new google.maps.Marker({
            map: map,
            position: result.geometry.location,
            icon: iconImg,
            scale: 1 / 4,
            name: result.name
        });

        google.maps.event.addListener(marker, 'mouseover', function () {
            infowindow = new google.maps.InfoWindow({
                content: this.name
            });
            infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'click', function (event) {
            setMarker(event.latLng);
        });
        google.maps.event.addListener(marker, 'mouseout', function () {
            infowindow.close();
        });
    }

}

function findPOI(results, status) {

    if (status === google.maps.places.PlacesServiceStatus.OK) {

        result = results[0];

        for (j = 0; j < results.length; j = j + 1) {

            result = results[i];
            addMarker(result);
        }
    }
}

function setLocalStorage(result) {
    if (window.setLocalStorage && window.setLocalStorage !== null) {

        step = result.routes[0].legs[0].steps;
        leg = result.routes[0].legs.length;
        stepLen = step.length;
        start = result.routes[0].legs[0].start_address;
        arrived = result.routes[0].legs[leg - 1].end_address;

        for (i = 0; i < stepLen - 1; i = i + 1) {

            stepTab += JSON.stringify(result.routes[0].legs[0].steps[i].instructions);
        }

        localStorage.setItem("starting", start);
        localStorage.setItem("arrived", arrived);
        localStorage.setItem("step", stepTab);
    }
}

function road() {

    setMark = true;

    var roadType = document.getElementById('roadType').value,
        request = {
            origin: inputStart.value,
            provideRouteAlternatives: true,
            waypoints: wpMarker,
            optimizeWaypoints: true,
            destination: inputArrive.value,
            travelMode: google.maps.TravelMode[roadType],
            avoidHighways: false,
            avoidTolls: false
        };

    if (document.getElementById('avoidHighways').checked) {

        request.avoidHighways = true;
    }
    if (document.getElementById('avoidTolls').checked) {

        request.avoidTolls = true;
    }

    directionsService.route(request, function (result, status) {

        console.log(result);

        if (status === google.maps.DirectionsStatus.OK) {

            step = result.routes[0].legs[0].steps;
            stepLen = step.length;

            setLocalStorage(result);

            for (i = 0; i < stepLen; i = i + 1) {

                requestPOI = {
                    location: new google.maps.LatLng(result.routes[0].legs[0].steps[i].lat_lngs[0].k, result.routes[0].legs[0].steps[i].lat_lngs[0].D),
                    radius: 3000,
                    query: "tourist attraction"
                };
                service.textSearch(requestPOI, findPOI);
            }

            directionsDisplay.setDirections(result);
            directionsDisplay.setPanel(document.getElementById('road_map'));

        } else {

            alert('Aucune route trouvée.');
        }
    });
}
function setAllMap(map) {
    for (i = 0; i < tabMarker.length; i = i + 1) {
        tabMarker[i].setMap(map);
    }
}

function resetMarker() {

    setAllMap(null);
    wpMarker = [];
    tabMarker = [];
    road();
}

function startWatch() {

    return startWatch;
}

function stopWatch() {

    return stopWatch;
}

function initialize() {

    function getLocation(position) {

        map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
            map: map
        });

        if (previousPosition) {
            newLineCoordinates = [
                new google.maps.LatLng(previousPosition.coords.latitude, previousPosition.coords.longitude),
                new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
            ];

            newLine = new google.maps.Polyline({
                path: newLineCoordinates,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            newLine.setMap(map);
        }
        previousPosition = position;

        inputStart.value = position.coords.latitude + " " + position.coords.longitude;
    }

    function errorGetLocation(error) {

        switch (error.code) {

        case error.PERMISSION_DENIED:
            alert("L'utilisateur n'a pas autorisé l'accès à sa position");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("L'emplacement de l'utilisateur n'a pas pu être déterminé");
            break;
        case error.TIMEOUT:
            alert("Le service n'a pas répondu à temps");
            break;
        }
    }

    function setMarker(location) {

        if (setMark === true) {
            var marker = new google.maps.Marker({
                position: location,
                map: map
            });

            tabMarker.push(marker);
            wpMarker = [];
            for (i = 0; i < tabMarker.length; i = i + 1) {
                wpMarker.push({
                    location: new google.maps.LatLng(tabMarker[i].position.k, tabMarker[i].position.D),
                    stopover: true
                });
            }
            document.getElementById('delMarker').style.display = "block";
            road();
        }
    }

    if (window.navigator.onLine) {

        directionsDisplay = new google.maps.DirectionsRenderer(attrDraggable);
        var Paris = new google.maps.LatLng(48.866667, 2.333333),
            mapOptions = {
                zoom: 12,
                center: Paris
            };
        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
        directionsDisplay.setMap(map);
        service = new google.maps.places.PlacesService(map);

        if (navigator.geolocation) {

            watchId = navigator.geolocation.watchPosition(getLocation, errorGetLocation, {enableHighAccuracy: true});

        } else {

            alert("Votre navigateur ne prend pas en compte la géolocalisation HTML5");
        }

    // Autocomplete
        autocompleteStart = new google.maps.places.Autocomplete(inputStart);
        autocompleteStart.bindTo('bounds', map);

        autocompleteArrive = new google.maps.places.Autocomplete(inputArrive);
        autocompleteArrive.bindTo('bounds', map);

        infowindow = new google.maps.InfoWindow();

        google.maps.event.addListener(autocompleteStart, 'place_changed', function () {
            place = autocompleteStart.getPlace();

            if (!place.geometry) {

                return;
            }

            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
            }
        });

        startWatch = function startWatch() {

            watchId = navigator.geolocation.watchPosition(getLocation, errorGetLocation, {enableHighAccuracy: true});

            document.getElementById('stopWatch').style.display = "block";
            document.getElementById('startWatch').style.display = "none";

            alert('La géolocalisation est activée.');
        };

        stopWatch = function stopWatch() {

            navigator.geolocation.clearWatch(watchId);

            document.getElementById('startWatch').style.display = "block";
            document.getElementById('stopWatch').style.display = "none";

            alert('La géolocalisation est désactivée.');
        };

        google.maps.event.addListener(map, 'click', function (event) {
            setMarker(event.latLng);
        });

    } else {

        document.getElementById("road_map").innerHTML = "Depart : " + localStorage.starting + " Arrivé : " + localStorage.arrived + "</br>" + localStorage.step + "</br>";

    }
}

window.onload = initialize();

document.getElementById('delMarker').addEventListener("click", addPreventDefault);
document.getElementById('delMarker').addEventListener("click", resetMarker);

inputSearch.addEventListener("click", addPreventDefault);
inputSearch.addEventListener("click", road);

document.getElementById('stopWatch').addEventListener("click", addPreventDefault);
document.getElementById('stopWatch').addEventListener("click", stopWatch);

document.getElementById('startWatch').addEventListener("click", addPreventDefault);
document.getElementById('startWatch').addEventListener("click", startWatch);