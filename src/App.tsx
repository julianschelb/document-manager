import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greeting, setGreeting] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreeting(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Document Manager</h1>
      <p>Welcome to your Tauri + React app.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      {greeting && <p>{greeting}</p>}
    </main>
  );
}

export default App;
