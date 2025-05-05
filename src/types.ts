export interface Alert {
	message_id: string;
	sensor_id: string;
	location: {
		latitude: number;
		longitude: number;
	};
	timestamp: number;
	sound_type: string;
	confidence: number;
	first_timestamp?: number;
}

export interface Settings {
	interval: number; // секунди
	duration: number; // секунди
	threshold: number; // відсотки
}
