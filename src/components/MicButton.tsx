"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
// @ts-ignore: No types for wav-encoder
import WavEncoder from 'wav-encoder';

const MicButton: React.FC = () => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [listening, setListening] = useState(false);
    const [apiResult, setApiResult] = useState<string | null>(null);
    const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioURL(URL.createObjectURL(audioBlob));
                // Convert WebM to WAV
                const arrayBuffer = await audioBlob.arrayBuffer();
                // @ts-ignore: webkitAudioContext for Safari support
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const wavData = await WavEncoder.encode({
                    sampleRate: audioBuffer.sampleRate,
                    channelData: Array.from({ length: audioBuffer.numberOfChannels }, (_, i) => audioBuffer.getChannelData(i))
                });
                const wavBlob = new Blob([wavData], { type: 'audio/wav' });
                // Send WAV audio directly to Deepgram
                try {
                    const wavArrayBuffer = await wavBlob.arrayBuffer();
                    const response = await fetch('https://api.deepgram.com/v1/listen', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Token 521910b86c2d1de5c8b9651b12d61b465e423560',
                            'Content-Type': 'audio/wav',
                        },
                        body: wavArrayBuffer,
                    });
                    let result;
                    try {
                        result = await response.json();
                    } catch (e) {
                        result = await response.text();
                    }
                    let transcript = '';
                    if (result && result.results && result.results.channels && result.results.channels[0] && result.results.channels[0].alternatives && result.results.channels[0].alternatives[0]) {
                        transcript = result.results.channels[0].alternatives[0].transcript;
                    }
                    setApiResult(transcript || (typeof result === 'string' ? result : JSON.stringify(result)));
                    console.log('Deepgram result:', result);
                    console.log('Deepgram result:', transcript);
                    const responseOne = await fetch('https://y90nix3m30.execute-api.us-east-2.amazonaws.com/schedule', {
                        method: 'POST',
                        // headers: {
                        //     'Authorization': 'Token 521910b86c2d1de5c8b9651b12d61b465e423560',
                        //     'Content-Type': 'audio/wav',
                        // },
                        body: JSON.stringify({
                            text: transcript,
                        }),
                    });
                    const resultOne = await responseOne.json();
                    console.log('Deepgram result:', resultOne);
                    console.log('Deepgram result:', resultOne.message);
                    setScheduleMessage(resultOne.message); // Set the schedule message from API response
                    if (!response.ok) {
                        throw new Error('Failed to transcribe audio');
                    }
                } catch (err) {
                    alert('Error transcribing audio: ' + err);
                }
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            alert('Microphone access denied or error: ' + err);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };


    return (
        <div className="flex flex-col items-center gap-4">
            {listening && !recording && (
                <div className="text-green-600 font-semibold">Listening for wake word: "Picovoice"...</div>
            )}
            <Button
                onClick={recording ? handleStopRecording : handleStartRecording}
                variant={recording ? 'destructive' : 'default'}
                size="lg"
                className='bg-red-500 cursor-pointer text-white'
            >
                {recording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioURL && (
                <audio controls src={audioURL} className="mt-2" />
            )}
            {apiResult && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-gray-800 w-full break-words">{apiResult}</div>
            )}
            {scheduleMessage && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800 w-full break-words">
                    {scheduleMessage}
                </div>
            )}
        </div>
    );
};

export default MicButton; 