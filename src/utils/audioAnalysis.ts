import * as FFT from "fft-js";

export const analyzeAudio = async (
	audioBlob: Blob,
	referenceAudio: ArrayBuffer,
	threshold: number,
): Promise<{ soundType: string; confidence: number }> => {
	const audioContext = new AudioContext();

	// Декодування записаного звуку
	const arrayBuffer = await audioBlob.arrayBuffer();
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	const recordedData = audioBuffer.getChannelData(0);

	// Декодування еталонного звуку
	const refBuffer = await audioContext.decodeAudioData(referenceAudio);
	const referenceData = refBuffer.getChannelData(0);

	// Виконання FFT
	const recordedFFT = FFT.fft(recordedData.slice(0, 1024));
	const referenceFFT = FFT.fft(referenceData.slice(0, 1024));

	// Обчислення подібності (спрощена косинусна подібність)
	let dotProduct = 0;
	let recordedNorm = 0;
	let referenceNorm = 0;

	for (let i = 0; i < recordedFFT.length; i++) {
		dotProduct += recordedFFT[i][0] * referenceFFT[i][0];
		recordedNorm += recordedFFT[i][0] ** 2;
		referenceNorm += referenceFFT[i][0] ** 2;
	}

	const similarity =
		dotProduct / (Math.sqrt(recordedNorm) * Math.sqrt(referenceNorm));
	const confidence = Math.min(100, Math.max(0, similarity * 100));

	return {
		soundType: confidence >= threshold ? "drone" : "unknown",
		confidence,
	};
};
