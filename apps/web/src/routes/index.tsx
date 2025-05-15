import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return (
    <div>
      <h1>Colanode</h1>
      <button onClick={() => {}}>Say Hello from Worker</button>
    </div>
  );
}
