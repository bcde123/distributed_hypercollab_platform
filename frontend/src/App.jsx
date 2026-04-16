import { useDispatch, useSelector } from "react-redux";
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
import { WebSocketProvider } from "./context/WebSocketProvider";


export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // ✅ Existing auth check (KEEP AS IS)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

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
      {/* WebSocket connects only when user is authenticated */}
      {isAuthenticated ? (
        <WebSocketProvider>
          <AppRouter />
        </WebSocketProvider>
      ) : (
        <AppRouter />
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}