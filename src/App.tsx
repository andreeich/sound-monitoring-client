import { useState, useEffect, useCallback } from "react";
import mqtt from "mqtt";
import { v4 as uuidv4 } from "uuid";
import { analyzeAudio } from "@/utils/audioAnalysis";
import { setupMqttClient } from "@/utils/mqttClient";
import AudioRecorder from "@/components/AudioRecorder";
import SettingsPanel from "@/components/SettingsPanel";
import ResultsDisplay from "@/components/ResultsDisplay";
import MapDisplay from "@/components/MapDisplay";
import type { Alert, Settings } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert as AlertUI, AlertDescription } from "@/components/ui/alert";
import referenceAudioFile from "/reference_sounds/drone-2.mp3";

type ConnectionStatus = "Підключення..." | "Підключено" | "Не підключено";

const App = () => {
	const [settings, setSettings] = useState<Settings>({
		interval: 30,
		duration: 5,
		threshold: 75,
	});
	const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
	const [client, setClient] = useState<mqtt.MqttClient | null>(null);
	const [sensorId] = useState(`sensor_${uuidv4()}`);
	const [referenceAudioData, setReferenceAudioData] =
		useState<ArrayBuffer | null>(null);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] =
		useState<ConnectionStatus>("Підключення...");
	const connectionStatusColor =
		connectionStatus === "Підключення..."
			? "bg-blue-300"
			: connectionStatus === "Підключено"
				? "bg-green-300"
				: "bg-red-300";
	const [audioError, setAudioError] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	// Fetch alerts from server
	const fetchAlerts = useCallback(async () => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/alerts`);
			if (!response.ok) throw new Error("Failed to fetch alerts");
			const data: Alert[] = await response.json();
			setAllAlerts(data);
		} catch (err) {
			console.error("Error fetching alerts:", err);
			setConnectionError("Помилка при завантаженні даних");
		}
	}, []);

	// Fetch reference audio
	const fetchReferenceAudio = useCallback(async () => {
		try {
			const response = await fetch(referenceAudioFile);
			if (!response.ok) throw new Error("Failed to fetch reference audio");
			const buffer = await response.arrayBuffer();
			setReferenceAudioData(buffer);
			setAudioError(null);
		} catch (err) {
			console.error("Failed to load reference audio:", err);
			setAudioError("Помилка завантаження зразку аудіо");
		}
	}, []);

	// Get user location
	const fetchUserLocation = useCallback(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setUserLocation({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					});
				},
				(err) => {
					console.error("Geolocation error:", err);
					setConnectionError(
						"Помилка визначення місцезнаходження. Використовуватиметься значення заумовчуванням",
					);
				},
			);
		} else {
			console.warn("Geolocation not supported");
			setConnectionError(
				"Визначення місцезнаходження не підтримується девайсом. Використовуватиметься значення заумовчуванням",
			);
		}
	}, []);

	useEffect(() => {
		fetchReferenceAudio();
		fetchUserLocation();
		fetchAlerts();
		const interval = setInterval(fetchAlerts, 10000); // Poll every 10 seconds
		return () => clearInterval(interval);
	}, [fetchReferenceAudio, fetchUserLocation, fetchAlerts]);

	useEffect(() => {
		// Setup MQTT
		const mqttClient = setupMqttClient(sensorId, (message) => {
			console.log("Received ACK:", message);
			fetchAlerts(); // Refresh alerts on ACK
		});

		mqttClient.on("error", (err) => {
			setConnectionError(`Помилка MQTT підключення: ${err.message}`);
			setConnectionStatus("Не підключено");
		});

		mqttClient.on("connect", () => {
			setConnectionError(null);
			setConnectionStatus("Підключено");
		});

		mqttClient.on("close", () => {
			setConnectionStatus("Не підключено");
		});

		mqttClient.on("reconnect", () => {
			setConnectionStatus("Підключення...");
		});

		setClient(mqttClient);

		return () => {
			mqttClient.end();
		};
	}, [sensorId, fetchAlerts]);

	const handleAudioData = async (audioBlob: Blob) => {
		if (!referenceAudioData) {
			setAudioError("Зразок аудіо не завантажений");
			return;
		}

		try {
			const result = await analyzeAudio(
				audioBlob,
				referenceAudioData,
				settings.threshold,
			);
			console.log("Analysis result:", result);
			if (result.confidence >= settings.threshold) {
				const alert: Alert = {
					message_id: `msg_${uuidv4()}`,
					sensor_id: sensorId,
					location: userLocation || { latitude: 50.45, longitude: 30.52 }, // Use geolocation or fallback
					timestamp: Date.now(),
					sound_type: result.soundType,
					confidence: result.confidence,
				};

				if (client?.connected) {
					client.publish(
						`sound_monitoring/sensor/${sensorId}/alert`,
						JSON.stringify(alert),
					);
					setAllAlerts((prev) => [...prev, alert]);
					fetchAlerts(); // Refresh alerts after publishing
				} else {
					console.warn("Cannot publish: MQTT client not connected");
					setConnectionError(
						"Неможливо відправити повідомлення: MQTT клієнт не підключений",
					);
				}
			}
		} catch (err) {
			console.error("Audio analysis failed:", err);
			setAudioError("Помилки при аналізі аудіо");
		}
	};

	return (
		<div className="container mx-auto p-4 min-h-screen">
			<h1 className="text-2xl font-bold mb-4">
				Моніторинг звукового забруднення
			</h1>
			<div className="mb-4">
				<p className="text-sm">
					Статус: {connectionStatus}
					<div
						className={`inline-block ml-2 rounded-full w-2 h-2 ${connectionStatusColor}`}
					/>
				</p>
				{connectionError && (
					<AlertUI variant="destructive" className="mt-2">
						<AlertDescription>{connectionError}</AlertDescription>
					</AlertUI>
				)}
				{audioError && (
					<AlertUI variant="destructive" className="mt-2">
						<AlertDescription>{audioError}</AlertDescription>
					</AlertUI>
				)}
			</div>
			<Tabs defaultValue="settings" className="w-full">
				<TabsList>
					<TabsTrigger value="settings">Налаштування</TabsTrigger>
					<TabsTrigger value="results">Результати</TabsTrigger>
					<TabsTrigger value="map">Мапа</TabsTrigger>
				</TabsList>
				<TabsContent value="settings">
					<div className="space-y-2 mt-4">
						<SettingsPanel settings={settings} onUpdate={setSettings} />
						<AudioRecorder
							interval={settings.interval}
							duration={settings.duration}
							onAudioReady={handleAudioData}
						/>
					</div>
				</TabsContent>
				<TabsContent value="results">
					<ResultsDisplay results={allAlerts} />
				</TabsContent>
				<TabsContent value="map">
					<MapDisplay alerts={allAlerts} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default App;
