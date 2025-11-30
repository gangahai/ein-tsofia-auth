import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export async function compressVideo(
    file: File,
    onProgress: (progress: number) => void
): Promise<File> {
    const ffmpeg = new FFmpeg();

    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // Write file to FFmpeg file system
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // Progress handler
    ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
    });

    // Run compression command
    // -vf scale=-2:720: Resize to 720p (maintain aspect ratio)
    // -c:v libx264: Use H.264 codec
    // -crf 28: Constant Rate Factor (lower is better quality, higher is smaller size. 28 is good for analysis)
    // -preset ultrafast: Prioritize speed
    await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'ultrafast',
        'output.mp4'
    ]);

    // Read result
    const data = await ffmpeg.readFile('output.mp4');
    const compressedBlob = new Blob([data as any], { type: 'video/mp4' });

    return new File([compressedBlob], `compressed_${file.name}`, {
        type: 'video/mp4',
        lastModified: Date.now(),
    });
}
