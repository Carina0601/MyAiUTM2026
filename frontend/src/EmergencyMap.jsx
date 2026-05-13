import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L, { icon } from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

const EmergencyMap = ({ patientHome, hospitalBase, notifiedAt, dispatchedAt, onStatusChange}) => {
    const [route, setRoute] = useState([]);
    const [ambulancePosition, setAmbulancePosition] = useState(null);
    // const [hospitalPosition, setHospitalPosition] = useState(null);
    // const [patientLivePosition, setPatientLivePosition] = useState(null);
    const [status, setStatus] = useState("En route to patient..");
    const [isReturning, setIsReturning] = useState(false);
    const [totalDistance, setTotalDistance] = useState(0);

    const [currentIndex, setCurrentIndex] = useState(0);
    // const [progress, setProgress] = useState(0);
    // const [eta, setEta] = useState(0);


    const timerRef = useRef(null);
    const MOVE_SPEED = 100;
    const KMH_SPEED = 80;
    const PICKUP_TIME_SECONDS = 5;

    const calculateDistance = (points) => {
        let distance = 0;
        for(let i = 0; i < points.length - 1; i++){
            distance += L.latLng(points[i]).distanceTo(L.latLng(points[i+1]));
        }
        return (distance/1000).toFixed(2);
    };

    // const calculateRemainingDistance = (remainingPoints) => {
    //     let distance = 0;
    //     for (let i = 0; i < remainingPoints.length - 1; i++){
    //         distance += L.latLng(remainingPoints[i]).distanceTo(L.latLng(remainingPoints[i + 1]));
    //     }
    //     return (distance/1000).toFixed(2);
    // };

    useEffect(() => {
        // const randomLat = patientHome.lat + (Math.random() - 0.5) * 0.02;
        // const randomLng = patientHome.lng + (Math.random() - 0.5) * 0.02;
        // setPatientLivePosition([randomLat, randomLng]);

        const fetchRoads = async () => {
            const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY3NDkxM2FjZGQ1ODQ0MGFiNzU4NWQyMjBhNTdkMWE4IiwiaCI6Im11cm11cjY0In0=';
            const start = [hospitalBase.lat, hospitalBase.lng];
            const end = [patientHome.lat, patientHome.lng];
            
            try{
                const response = await axios.post(
                    `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
                    { coordinates: [[start[1], start[0]], [end[1], end[0]]] }, // Most API uses long and lat while leaflet uses lat and long
                    { headers: { Authorization: API_KEY } }
                );

                const points = response.data.features[0].geometry.coordinates.map(p => [p[1], p[0]]);

                setTotalDistance(calculateDistance(points));
                setRoute(points);
                setAmbulancePosition(points[0]);
                setCurrentIndex(0);
            } catch (e) {
                console.error("Error fetching route: ", e);
            }
        };
        if (hospitalBase?.lat && patientHome?.lat) fetchRoads();
    }, [patientHome.lat, patientHome.lng, hospitalBase.lat, hospitalBase.lng]);

    useEffect(() => {
        if (route.length === 0 || !dispatchedAt) return;

        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const startTime = new Date(dispatchedAt).getTime();
            const secondsElapsed = (now - startTime) / 1000;
            const totalDistNum = parseFloat(totalDistance);
            const oneWayTime = (totalDistNum / KMH_SPEED) * 3600;

            let currentPos, currentStatus, currentProgress, etaSec, remainingDistance, idx;

            if (secondsElapsed < oneWayTime) {
                const ratio = secondsElapsed / oneWayTime;
                idx = Math.floor(ratio * (route.length - 1));
                currentPos = route[idx];
                currentStatus = "En Route to Patient";
                currentProgress = ratio * 50;
                etaSec = Math.floor(oneWayTime - secondsElapsed);
                remainingDistance = (totalDistNum * (1 - ratio)).toFixed(2);
            } else if (secondsElapsed < oneWayTime + 5) {
                idx = route.length - 1;
                currentPos = route[idx];
                currentStatus = "Picking up Patient";
                currentProgress = 50;
                etaSec = 0;
                remainingDistance = 0;
            } else {
                const returnElapsed = secondsElapsed - oneWayTime - 5;
                const ratio = Math.min(returnElapsed / oneWayTime, 1);
                idx = Math.floor((1 - ratio) * (route.length - 1));
                currentPos = route[idx];
                currentStatus = "Returning to Hospital";
                currentProgress = 50 + (ratio * 50);
                etaSec = Math.floor(oneWayTime - returnElapsed);
                remainingDistance = (totalDistNum * (1 - ratio)).toFixed(2);
                
                if(ratio >= 1){
                    currentStatus = "Patient Admitted";
                    clearInterval(timerRef.current);
                }
            }

            setAmbulancePosition(currentPos);
            setCurrentIndex(idx);
            setStatus(currentStatus);

            if(onStatusChange) 
                onStatusChange({ 
                    status: currentStatus, 
                    progress: currentProgress,
                    eta: etaSec > 0 ? `${Math.floor(etaSec/60)}m ${etaSec%60}s` : "Arrived",
                    distance: parseFloat(remainingDistance) > 0 ? remainingDistance : "0.00"
            });

            if(currentProgress >= 100) clearInterval(timerRef.current);
        }, 100);

        return () => clearInterval(timerRef.current);
    }, [route, totalDistance, dispatchedAt]);
        
    // const handleArrival = () =>{
    //     if(!isReturning) {
    //         setStatus("Picking up patient..");

    //         if (onStatusChange) {
    //             onStatusChange({ status: "Picking up patient..", progress: 50, eta: 0, distance: totalDistance });
    //         }

    //         setTimeout(() => {
    //             const returnRoute = [...route].reverse();
    //                 setIsReturning(true);
    //                 setRoute(returnRoute);
    //                 setAmbulancePosition(returnRoute[0]);
    //                 setStatus("Returning to hospital with patient..");
    //             }, 3000);
    //         } else {
    //             setStatus("Mission Complete. Ambulance back at hospital.");
    //             if (onStatusChange){
    //                 onStatusChange({ status: "Mission Complete", progress: 100, eta: 0, distance: 0});
    //             }
    //     }
    // };


    return (
        <div style={{ height: '420px', width: '100%', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', border: '1px solid rgba(255, 255, 255, 0.18)', backgroundColor: '#ffffff'}}>
            <MapContainer center={[patientHome.lat, patientHome.lng]} zoom={16} style={{ height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'>
                </TileLayer>

                {route.length > 0 && status !== "Patient Admitted" && (
                    <>
                        <Polyline 
                            positions={status.includes("Returning") ? route.slice(0, currentIndex +1) : route.slice(currentIndex)}
                            pathOptions={{ color: '#00d4ff', weight: 12, opacity: 0.15, lineJoin: 'round' }}
                        />

                        <Polyline 
                            positions={status.includes("Returning") ? route.slice(0, currentIndex +1) : route.slice(currentIndex)}
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

                {route.length > 0 && !status.includes("Returning") && status !== "Patient Admitted" && (
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