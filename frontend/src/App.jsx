import { useDispatch, useSelector } from "react-redux";
import AppRouter from "./router/AppRouter";
import { Toaster } from "sonner";
import { checkAuth } from "./features/auth/authThunks";
import { useEffect } from "react";
import { WebSocketProvider } from "./context/WebSocketProvider";

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

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
      <Toaster
        richColors
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: "'Inter', system-ui, sans-serif" },
          className: "shadow-lg",
        }}
        closeButton
      />
    </>
  );
}