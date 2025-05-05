import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Alert } from "../types";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MapDisplayProps {
	alerts: Alert[];
}

const MapDisplay: React.FC<MapDisplayProps> = ({ alerts }) => {
	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle>Мапа виявлень</CardTitle>
			</CardHeader>
			<CardContent>
				<MapContainer
					center={[50.45, 30.52]} // Приклад координат (Київ)
					zoom={13}
					style={{ height: "400px", width: "100%" }}
				>
					<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
					{alerts.map((alert) => (
						<Marker
							key={alert.message_id}
							position={[alert.location.latitude, alert.location.longitude]}
						>
							<Popup>
								{alert.sound_type} ({alert.confidence.toFixed(2)}%)
								<br />
								{new Date(alert.timestamp).toLocaleString()}
							</Popup>
						</Marker>
					))}
				</MapContainer>
			</CardContent>
		</Card>
	);
};

export default MapDisplay;
