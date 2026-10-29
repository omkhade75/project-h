// Audio Worklet Processor for BizVoice
// Captures microphone audio, converts float32 → int16 PCM, downsamples to 16kHz

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 0;
    this._buffer = new Float32Array(4096);
    // sampleRate is a global in AudioWorkletGlobalScope
    this._inputSampleRate = sampleRate;
    this._targetSampleRate = 16000;
    this._resampleRatio = this._inputSampleRate / this._targetSampleRate;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono — first channel only
    if (!channelData || channelData.length === 0) return true;

    // Accumulate samples
    for (let i = 0; i < channelData.length; i++) {
      if (this._bufferSize >= this._buffer.length) {
        // Buffer full, flush
        this._flush();
      }
      this._buffer[this._bufferSize++] = channelData[i];
    }

    // Flush when we have enough for a good chunk
    if (this._bufferSize >= 2048) {
      this._flush();
    }

    return true;
  }

  _flush() {
    if (this._bufferSize === 0) return;

    const inputSamples = this._buffer.subarray(0, this._bufferSize);

    // Downsample
    const outputLength = Math.floor(this._bufferSize / this._resampleRatio);
    const outputSamples = new Int16Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * this._resampleRatio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, this._bufferSize - 1);
      const fraction = srcIndex - srcIndexFloor;

      // Linear interpolation
      const sample = inputSamples[srcIndexFloor] * (1 - fraction) + inputSamples[srcIndexCeil] * fraction;

      // Clamp and convert to int16
      const clamped = Math.max(-1, Math.min(1, sample));
      outputSamples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    // Compute RMS level for visualization
    let sumSquares = 0;
    for (let i = 0; i < this._bufferSize; i++) {
      sumSquares += inputSamples[i] * inputSamples[i];
    }
    const rms = Math.sqrt(sumSquares / this._bufferSize);

    // Send PCM data and level to main thread
    this.port.postMessage({
      type: 'audio',
      pcmData: outputSamples.buffer,
      level: rms,
    }, [outputSamples.buffer]);

    this._bufferSize = 0;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
