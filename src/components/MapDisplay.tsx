import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Alert } from "@/types";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { MapPinXInsideIcon } from "lucide-react";

interface MapDisplayProps {
	alerts: Alert[];
}

const MapDisplay: React.FC<MapDisplayProps> = ({ alerts }) => {
	// Calculate the center of the map based on alerts
	const center = useMemo(() => {
		if (alerts.length === 0) {
			return [50.45, 30.52]; // Default center (Kyiv)
		}
		const avgLat =
			alerts.reduce((sum, alert) => sum + alert.location.latitude, 0) /
			alerts.length;
		const avgLon =
			alerts.reduce((sum, alert) => sum + alert.location.longitude, 0) /
			alerts.length;
		return [avgLat, avgLon];
	}, [alerts]);
	// Calculate the zoom of the map based on alerts
	const zoom = useMemo(() => {
		if (alerts.length < 2) {
			return 13; // Default zoom value
		}
		const latitudes = alerts.map((alert) => alert.location.latitude);
		const longitudes = alerts.map((alert) => alert.location.longitude);
		const minLat = Math.min(...latitudes);
		const maxLat = Math.max(...latitudes);
		const minLon = Math.min(...longitudes);
		const maxLon = Math.max(...longitudes);
		const maxDistance = Math.max(maxLat - minLat, maxLon - minLon);
		const zoom = maxDistance * 3.6;
		return zoom;
	}, [alerts]);

	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle>Мапа виявлень</CardTitle>
			</CardHeader>
			<CardContent>
				{alerts.length === 0 ? (
					<p>Немає даних для відображення на мапі</p>
				) : (
					<MapContainer
						center={center}
						zoom={zoom}
						style={{ height: "400px", width: "100%", borderRadius: "8px" }}
					>
						<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
						{alerts.map((alert) => (
							<Marker
								key={alert.message_id}
								position={[alert.location.latitude, alert.location.longitude]}
							>
								<Popup>
									<div>
										<strong>{alert.sound_type}</strong>
										<br />
										Впевненість: {alert.confidence.toFixed(2)}%<br />
										Сенсор: {alert.sensor_id}
										<br />
										Час: {new Date(alert.timestamp).toLocaleString()}
									</div>
								</Popup>
							</Marker>
						))}
					</MapContainer>
				)}
			</CardContent>
		</Card>
	);
};

export default MapDisplay;
