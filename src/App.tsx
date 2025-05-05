import { useState, useEffect } from "react";
import mqtt, { MqttClient } from "mqtt";
import { v4 as uuidv4 } from "uuid";
import { analyzeAudio } from "./utils/audioAnalysis";
import { setupMqttClient } from "./utils/mqttClient";
import AudioRecorder from "./components/AudioRecorder";
import SettingsPanel from "./components/SettingsPanel";
import ResultsDisplay from "./components/ResultsDisplay";
import MapDisplay from "./components/MapDisplay";
import { Alert, Settings } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import referenceAudio from "../public/reference_sounds/drone.mp3";

const App = () => {
	const [settings, setSettings] = useState<Settings>({
		interval: 30,
		duration: 5,
		threshold: 85,
	});
	const [results, setResults] = useState<Alert[]>([]);
	const [client, setClient] = useState<MqttClient | null>(null);
	const [sensorId] = useState(`sensor_${uuidv4()}`);
	const [referenceAudioData, setReferenceAudioData] =
		useState<ArrayBuffer | null>(null);

	useEffect(() => {
		// Завантаження еталонного звуку
		fetch(referenceAudio)
			.then((res) => res.arrayBuffer())
			.then((data) => setReferenceAudioData(data));

		// Налаштування MQTT
		const mqttClient = setupMqttClient(sensorId, (message) => {
			console.log("Received ACK:", message);
		});
		setClient(mqttClient);

		return () => {
			mqttClient.end();
		};
	}, [sensorId]);

	const handleAudioData = async (audioBlob: Blob) => {
		if (!referenceAudioData) return;

		const result = await analyzeAudio(
			audioBlob,
			referenceAudioData,
			settings.threshold,
		);
		if (result.confidence >= settings.threshold) {
			const alert: Alert = {
				message_id: `msg_${uuidv4()}`,
				sensor_id: sensorId,
				location: { latitude: 50.45, longitude: 30.52 }, // Заглушка, потрібна геолокація
				timestamp: Date.now(),
				sound_type: result.soundType,
				confidence: result.confidence,
			};

			client?.publish(
				`sound_monitoring/sensor/${sensorId}/alert`,
				JSON.stringify(alert),
			);
			setResults((prev) => [...prev, alert]);
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">
				Моніторинг звукового забруднення
			</h1>
			<Tabs defaultValue="settings" className="w-full">
				<TabsList>
					<TabsTrigger value="settings">Налаштування</TabsTrigger>
					<TabsTrigger value="results">Результати</TabsTrigger>
					<TabsTrigger value="map">Мапа</TabsTrigger>
				</TabsList>
				<TabsContent value="settings">
					<SettingsPanel settings={settings} onUpdate={setSettings} />
					<AudioRecorder
						interval={settings.interval}
						duration={settings.duration}
						onAudioReady={handleAudioData}
					/>
				</TabsContent>
				<TabsContent value="results">
					<ResultsDisplay results={results} />
				</TabsContent>
				<TabsContent value="map">
					<MapDisplay alerts={results} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default App;
