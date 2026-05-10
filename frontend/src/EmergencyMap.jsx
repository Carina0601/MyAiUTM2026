import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L, { icon } from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const ambulanceIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/2991/2991996.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const hospitalIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/4521/4521401.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const MapAutoCenter = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        map.invalidateSize();

        if (position) {
            map.setView(position, map.getZoom(),{
                animate: true,
                pan: { duration: 1 }
            });
        }
    }, [position, map]);
    return null;
};

const EmergencyMap = ({ patientHome, hospitalBase, onStatusChange}) => {
    const [route, setRoute] = useState([]);
    const [ambulancePosition, setAmbulancePosition] = useState(null);
    const [hospitalPosition, setHospitalPosition] = useState(null);
    const [patientLivePosition, setPatientLivePosition] = useState(null);
    const [status, setStatus] = useState("En route to patient..");
    const [isReturning, setIsReturning] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [eta, setEta] = useState(0);
    const [totalDistance, setTotalDistance] = useState(0);

    const timerRef = useRef(null);
    const MOVE_SPEED = 100;
    const KMH_SPEED = 80;

    const calculateDistance = (points) => {
        let distance = 0;
        for(let i = 0; i < points.length - 1; i++){
            distance += L.latLng(points[i]).distanceTo(L.latLng(points[i+1]));
        }
        return (distance/1000).toFixed(2);
    };

    const calculateRemainingDistance = (remainingPoints) => {
        let distance = 0;
        for (let i = 0; i < remainingPoints.length - 1; i++){
            distance += L.latLng(remainingPoints[i]).distanceTo(L.latLng(remainingPoints[i + 1]));
        }
        return (distance/1000).toFixed(2);
    };

    useEffect(() => {
        const randomLat = patientHome.lat + (Math.random() - 0.5) * 0.02;
        const randomLng = patientHome.lng + (Math.random() - 0.5) * 0.02;
        setPatientLivePosition([randomLat, randomLng]);

        const fetchRoads = async () => {
            const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3NDkxM2FjZGQ1ODQ0MGFiNzU4NWQyMjBhNTdkMWE4IiwiaCI6Im11cm11cjY0In0=';
            const start = [hospitalBase.lat, hospitalBase.lng];
            const end = [patientHome.lat, patientHome.lng];
            
            try{
                const response = await axios.post(
                    `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
                    { coordinates: [[start[1], start[0]], [randomLng, randomLat]] }, // Most API uses long and lat while leaflet uses lat and long
                    { headers: { Authorization: API_KEY } }
                );

                const points = response.data.features[0].geometry.coordinates.map(p => [p[1], p[0]]);

                setTotalDistance(calculateDistance(points));
                setRoute(points);
                setAmbulancePosition(points[0]);
            } catch (e) {
                console.error("Error fetching route: ", e);
            }
        };
        fetchRoads();
    }, []);

    useEffect(() => {
        if(route.length === 0) return;

        let distanceCovered = 0;
        // let i = 0;
        clearInterval(timerRef.current);

        const distancePerTick = (KMH_SPEED / 3600) * (MOVE_SPEED / 1000);

        timerRef.current = setInterval(() => {
            // if(i < route.length){
            distanceCovered += distancePerTick;

            const totalDistanceNumber = parseFloat(totalDistance);
            const ratio = distanceCovered / totalDistanceNumber;
            const targetIndex = Math.floor(ratio * route.length);

            if(targetIndex < route.length) {
                // const currentPos = route[i]
                const currentPos = route[targetIndex];
                setAmbulancePosition(currentPos);
                // setCurrentIndex(i);

                // const pointProgress = (i/route.length) * 48;
                // const currentProgress = isReturning ? 52 + pointProgress : pointProgress;

                const remaining = Math.max(0, totalDistanceNumber - distanceCovered).toFixed(2);

                // const remainingDistance = calculateRemainingDistance(route.slice(i));
                // const etaHours = remainingDistance / KMH_SPEED;

                const etaMinutes = Math.floor(((totalDistanceNumber - distanceCovered) / KMH_SPEED) * 60);
                const etaSeconds = Math.floor((((totalDistanceNumber - distanceCovered) / KMH_SPEED) * 3600) % 60);

                // setEta(etaMinutes > 0 ? etaMinutes : etaSeconds);

                // setProgress(currentProgress);
                // setEta(currentEta);

                if(onStatusChange){
                    onStatusChange({
                        status: isReturning ? "Returning to Hospital" : "En Route to Patient",
                        progress: isReturning ? 50 + (ratio * 50) : (ratio * 50),
                        eta: etaMinutes > 0 ? `${etaMinutes} min ${etaSeconds} sec` : `${etaSeconds} sec`,
                        distance: remaining > 0 ? remaining : 0,
                        speed: `${KMH_SPEED} km/h`
                    });
                }
                // i++;
            }
            else{
                clearInterval(timerRef.current);
                handleArrival();
            }
        }, MOVE_SPEED);

        return () => clearInterval(timerRef.current);
    }, [route, isReturning]);

    const handleArrival = () =>{
        if(!isReturning) {
            setStatus("Picking up patient..");

            if (onStatusChange) {
                onStatusChange({ status: "Picking up patient..", progress: 50, eta: 0, distance: totalDistance });
            }

            setTimeout(() => {
                const returnRoute = [...route].reverse();
                    setIsReturning(true);
                    setRoute(returnRoute);
                    setAmbulancePosition(returnRoute[0]);
                    setStatus("Returning to hospital with patient..");
                }, 3000);
            } else {
                setStatus("Mission Complete. Ambulance back at hospital.");
                if (onStatusChange){
                    onStatusChange({ status: "Mission Complete", progress: 100, eta: 0, distance: 0});
                }
        }
    };


    return (
        <div style={{ height: '600px', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: '#ffffff'}}>
            <MapContainer center={[patientHome.lat, patientHome.lng]} zoom={16} style={{ height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'>
                </TileLayer>

                {route.length > 0 && (
                    <>
                        <Polyline 
                            positions={route.slice(route.indexOf(ambulancePosition) === -1 ? 0 : route.indexOf(ambulancePosition))} 
                            pathOptions={{ color: '#00d4ff', weight: 12, opacity: 0.15, lineJoin: 'round' }}
                        />

                        <Polyline 
                            positions={route.slice(route.indexOf(ambulancePosition) === -1 ? 0 : route.indexOf(ambulancePosition))} 
                            pathOptions={{ color: '#00d4ff', weight: 3, opacity: 0.9, lineJoin: 'round' }}
                        />
                    </>
                    // <Polyline 
                    //     positions={route.slice(route.indexOf(ambulancePosition))} 
                    //     color='#00d4ff' 
                    //     weight={4}
                    //     opacity={0.8}>
                    // </Polyline>
                )}

                {hospitalBase && (
                    <Marker position={[hospitalBase.lat, hospitalBase.lng]} icon={hospitalIcon}>
                        <Popup>Hospital</Popup>
                    </Marker>
                )}

                {route.length > 0 && (
                    <Marker position={route[route.length - 1]}>
                        <Popup>Emergency Location</Popup>
                    </Marker>
                )}

                {ambulancePosition && (
                    <Marker position={ambulancePosition} icon={ambulanceIcon}>
                        <Popup key={status} closeButton={false} autoPan={false}>
                            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                {status}
                            </div>
                        </Popup>
                    </Marker>
                )}

                <MapAutoCenter position={ambulancePosition}></MapAutoCenter>
            </MapContainer>
        </div>
    );
};

export default EmergencyMap;