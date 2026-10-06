import pyaudio
import wave

execucoes = 3


p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16, channels=1, rate=44100, input=True,frames_per_buffer=2048)
stream.start_stream()

for m in range(execucoes):
    frames = []
    for _ in range(int(44100 / 2048 * 20)):
        data = stream.read(2048)
        frames.append(data)
    fileNameGenerate = f"gravacao{m + 1}.wav"
    fileWave = wave.open(fileNameGenerate, 'wb')
    fileWave.setnchannels(1)
    fileWave.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    fileWave.setframerate(44100)
    fileWave.writeframes(b''.join(frames))
    fileWave.close()

stream.stop_stream()
stream.close()
p.terminate()

