import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Mic, Square } from "lucide-react";

interface AudioRecorderProps {
	interval: number;
	duration: number;
	onAudioReady: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
	interval,
	duration,
	onAudioReady,
}) => {
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			mediaRecorderRef.current = new MediaRecorder(stream);
			const chunks: Blob[] = [];

			mediaRecorderRef.current.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};

			mediaRecorderRef.current.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				onAudioReady(blob);
				chunks.length = 0;
			};

			mediaRecorderRef.current.start();
			setIsRecording(true);
			setError(null);

			setTimeout(() => {
				if (mediaRecorderRef.current?.state === "recording") {
					mediaRecorderRef.current.stop();
					stream.getTracks().forEach((track) => track.stop());
					setIsRecording(false);
				}
			}, duration * 1000);
		} catch (err) {
			setError("Не вдалося отримати доступ до мікрофона");
			console.error(err);
		}
	};

	useEffect(() => {
		if (!isRecording) {
			const timer = setInterval(startRecording, interval * 1000);
			return () => clearInterval(timer);
		}
	}, [interval, isRecording]);

	return (
		<div className="space-y-4">
			<Button
				onClick={startRecording}
				disabled={isRecording}
				className={isRecording ? "bg-red-500" : "bg-green-500"}
			>
				{isRecording ? (
					<Square className="mr-2 h-4 w-4" />
				) : (
					<Mic className="mr-2 h-4 w-4" />
				)}
				{isRecording ? "Запис..." : "Почати запис"}
			</Button>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
};

export default AudioRecorder;
