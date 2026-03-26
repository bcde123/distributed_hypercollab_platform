import { useDispatch } from "react-redux";
import AppRouter from "./router/AppRouter";
import { Toaster } from "sonner";
import { checkAuth } from "./features/auth/authThunks";
import { useEffect } from "react";
// import { initOQS } from "./crypto/crypto";
import {
  generateKEMKeyPair,
  encapsulateSecret,
  decapsulateSecret,
} from "./crypto/crypto";


export default function App() {
  const dispatch = useDispatch();




  // ✅ Existing auth check (KEEP AS IS)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // 🔥 ADD THIS (WebSocket connection)
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("✅ Connected to WS");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 New message:", data);
    };

    socket.onclose = () => {
      console.log("❌ WS disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  // useEffect(() => {
  //   console.log("Initializing OQS...");

  //   initOQS()
  //     .then((mod) => {
  //       console.log("✅ OQS Loaded:", mod);
  //     })
  //     .catch((err) => {
  //       console.error("❌ OQS Error:", err);
  //     });
  // }, []);


  useEffect(() => {
    (async () => {
      const userA = await generateKEMKeyPair();
      const userB = await generateKEMKeyPair();

      const enc = await encapsulateSecret(userB.pk);
      const dec = await decapsulateSecret(enc.kemCipherText, userB.sk);

      console.log("Sender secret:", enc.sharedSecret.slice(0, 20));
      console.log("Receiver secret:", dec.slice(0, 20));
    })();
  }, []);
  return (
    <>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </>
  );
}