import mqtt from "mqtt";

export const setupMqttClient = (
	sensorId: string,
	onMessage: (message: Alert) => void,
) => {
	const client = mqtt.connect(import.meta.env.VITE_MQTT_BROKER);

	client.on("connect", () => {
		console.log("Connected to MQTT broker");
		client.subscribe(`sound_monitoring/sensor/${sensorId}/ack`);
	});

	client.on("message", (topic, message) => {
		const payload = JSON.parse(message.toString());
		onMessage(payload);
	});

	return client;
};
