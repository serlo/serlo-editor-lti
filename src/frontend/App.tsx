// import "./App.css";
import { SerloEditor } from "@serlo/editor";
// import * as jwt from "jsonwebtoken";

function App() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const accessToken = urlParams.get("accessToken");
  const ltik = urlParams.get("ltik");

  return (
    <>
      <h1>Hallo Serlo Editor</h1>
      <h2>Access token</h2>
      <div>{accessToken}</div>
      <h2>ltik</h2>
      <div>{ltik}</div>
      <SerloEditor>
        {(editor) => {
          return <>{editor.element}</>;
        }}
      </SerloEditor>
    </>
  );
}

export default App;
