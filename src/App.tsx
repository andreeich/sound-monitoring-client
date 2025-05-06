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
import referenceAudioFile from "/reference_sounds/drone-2.mp3";
import { Alert as AlertUI, AlertDescription } from "./components/ui/alert";

const App = () => {
	const [settings, setSettings] = useState<Settings>({
		interval: 30,
		duration: 5,
		threshold: 75,
	});
	const [results, setResults] = useState<Alert[]>([]);
	const [client, setClient] = useState<mqtt.MqttClient | null>(null);
	const [sensorId] = useState(`sensor_${uuidv4()}`);
	const [referenceAudioData, setReferenceAudioData] =
		useState<ArrayBuffer | null>(null);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] =
		useState<string>("Connecting...");
	const [audioError, setAudioError] = useState<string | null>(null);

	// Fetch reference audio only once
	const fetchReferenceAudio = useCallback(async () => {
		try {
			const response = await fetch(referenceAudioFile);
			if (!response.ok) throw new Error("Failed to fetch reference audio");
			const buffer = await response.arrayBuffer();
			setReferenceAudioData(buffer);
			setAudioError(null);
		} catch (err) {
			console.error("Failed to load reference audio:", err);
			setAudioError("Unable to load reference audio");
		}
	}, []);

	useEffect(() => {
		fetchReferenceAudio();

		// Setup MQTT
		const mqttClient = setupMqttClient(sensorId, (message) => {
			console.log("Received ACK:", message);
		});

		mqttClient.on("error", (err) => {
			setConnectionError(`MQTT connection failed: ${err.message}`);
			setConnectionStatus("Disconnected");
		});

		mqttClient.on("connect", () => {
			setConnectionError(null);
			setConnectionStatus("Connected");
		});

		mqttClient.on("close", () => {
			setConnectionStatus("Disconnected");
		});

		mqttClient.on("reconnect", () => {
			setConnectionStatus("Reconnecting...");
		});

		setClient(mqttClient);

		return () => {
			mqttClient.end();
		};
	}, [sensorId, fetchReferenceAudio]);

	const handleAudioData = async (audioBlob: Blob) => {
		if (!referenceAudioData) {
			setAudioError("Reference audio not loaded");
			return;
		}

		try {
			const result = await analyzeAudio(
				audioBlob,
				referenceAudioData,
				settings.threshold,
			);
			console.log("result", result);
			if (result.confidence >= settings.threshold) {
				const alert: Alert = {
					message_id: `msg_${uuidv4()}`,
					sensor_id: sensorId,
					location: { latitude: 50.45, longitude: 30.52 }, // TODO: Use geolocation
					timestamp: Date.now(),
					sound_type: result.soundType,
					confidence: result.confidence,
				};

				if (client?.connected) {
					client.publish(
						`sound_monitoring/sensor/${sensorId}/alert`,
						JSON.stringify(alert),
					);
					setResults((prev) => [...prev, alert]);
				} else {
					console.warn("Cannot publish: MQTT client not connected");
					setConnectionError("Cannot send alert: MQTT client disconnected");
				}
			}
		} catch (err) {
			console.error("Audio analysis failed:", err);
			setAudioError("Failed to analyze audio");
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">
				Моніторинг звукового забруднення
			</h1>
			<div className="mb-4">
				<p className="text-sm">MQTT Status: {connectionStatus}</p>
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
