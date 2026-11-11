import { useEffect, useRef } from 'react';
import { createGame, waitForFonts } from './game/config.ts';

function App() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: ReturnType<typeof createGame> | undefined;
    let cancelled = false;
    waitForFonts().then(() => {
      if (!cancelled && gameRef.current) game = createGame(gameRef.current);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={gameRef} style={{ width: '100vw', height: '100vh', background: '#140c1f' }} />;
}

export default App;
