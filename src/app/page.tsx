'use client'

import { MicButton } from '../components';

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <h2 className="text-xl font-semibold">Mic Button Demo</h2>
          <MicButton
            onStart={() => console.log('Mic started')}
            onStop={() => console.log('Mic stopped')}
          />
        </div>
      </main>
   
    </div>
  );
}
