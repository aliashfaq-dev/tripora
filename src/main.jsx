import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App";
import { store, persistor } from "./store/store";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={<div className="min-h-screen bg-[#08131f]" />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
