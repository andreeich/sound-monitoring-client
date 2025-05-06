import Meyda from "meyda";

export const analyzeAudio = async (
	audioBlob: Blob,
	referenceAudio: ArrayBuffer,
	threshold: number,
): Promise<{ soundType: string; confidence: number }> => {
	const audioContext = new AudioContext();

	try {
		// Clone ArrayBuffers to prevent detachment
		const recordedArrayBuffer = await audioBlob.arrayBuffer();
		const recordedBufferClone = recordedArrayBuffer.slice(0);
		const referenceBufferClone = referenceAudio.slice(0);

		// Decode audio
		const recordedBuffer =
			await audioContext.decodeAudioData(recordedBufferClone);
		const referenceBuffer =
			await audioContext.decodeAudioData(referenceBufferClone);

		// Ensure sufficient data
		const frameSize = 2048; // Larger frame size for better frequency resolution
		if (
			recordedBuffer.length < frameSize ||
			referenceBuffer.length < frameSize
		) {
			console.warn("Audio data too short for analysis");
			return { soundType: "unknown", confidence: 0 };
		}

		// Apply high-pass filter to remove low-frequency noise
		const applyHighPassFilter = async (
			buffer: AudioBuffer,
		): Promise<AudioBuffer> => {
			const offlineContext = new OfflineAudioContext(
				buffer.numberOfChannels,
				buffer.length,
				buffer.sampleRate,
			);
			const source = offlineContext.createBufferSource();
			source.buffer = buffer;
			const filter = offlineContext.createBiquadFilter();
			filter.type = "highpass";
			filter.frequency.setValueAtTime(100, 0); // Cut below 100 Hz
			source.connect(filter);
			filter.connect(offlineContext.destination);
			source.start();
			return await offlineContext.startRendering();
		};

		const filteredRecordedBuffer = await applyHighPassFilter(recordedBuffer);
		const filteredReferenceBuffer = await applyHighPassFilter(referenceBuffer);

		// Check for silence (RMS energy)
		const isSilence = (buffer: AudioBuffer): boolean => {
			const signal = buffer.getChannelData(0);
			const rms = Math.sqrt(
				signal.reduce((sum, val) => sum + val ** 2, 0) / signal.length,
			);
			return rms < 0.01; // Threshold for silence
		};

		if (isSilence(filteredRecordedBuffer)) {
			console.log("Detected silence in recorded audio");
			return { soundType: "unknown", confidence: 0 };
		}

		// Extract MFCCs
		const extractMFCCs = (buffer: AudioBuffer): number[][] => {
			const signal = buffer.getChannelData(0);
			const hopSize = 512;
			const features: number[][] = [];

			for (let i = 0; i < signal.length - frameSize; i += hopSize) {
				const frame = signal.slice(i, i + frameSize);
				const mfcc = Meyda.extract("mfcc", frame, {
					sampleRate: buffer.sampleRate,
					bufferSize: frameSize,
					numberOfMFCCCoefficients: 13,
					melBands: 40, // More mel bands for better resolution
				}) as number[] | null;
				if (mfcc) features.push(mfcc);
			}
			return features;
		};

		const recordedMFCCs = extractMFCCs(filteredRecordedBuffer);
		const referenceMFCCs = extractMFCCs(filteredReferenceBuffer);

		// Calculate cosine similarity on MFCCs
		const calculateSimilarity = (f1: number[][], f2: number[][]): number => {
			const minLength = Math.min(f1.length, f2.length);
			if (minLength === 0) return 0;

			let totalSimilarity = 0;
			for (let i = 0; i < minLength; i++) {
				let dotProduct = 0;
				let norm1 = 0;
				let norm2 = 0;
				for (let j = 0; j < f1[i].length; j++) {
					dotProduct += f1[i][j] * f2[i][j];
					norm1 += f1[i][j] ** 2;
					norm2 += f2[i][j] ** 2;
				}
				const similarity =
					norm1 > 0 && norm2 > 0
						? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
						: 0;
				totalSimilarity += similarity;
			}

			return totalSimilarity / minLength; // Average similarity across frames
		};

		const similarity = calculateSimilarity(recordedMFCCs, referenceMFCCs);
		const confidence = Math.min(100, Math.max(0, similarity * 100)); // Scale to 0–100

		if (isNaN(confidence)) {
			console.warn("Calculated confidence is NaN");
			return { soundType: "unknown", confidence: 0 };
		}

		return {
			soundType: confidence >= threshold ? "drone" : "unknown",
			confidence,
		};
	} catch (error) {
		console.error("Error in audio analysis:", error);
		return { soundType: "unknown", confidence: 0 };
	} finally {
		await audioContext.close();
	}
};
