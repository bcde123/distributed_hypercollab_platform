
import { useDispatch } from "react-redux";
import AppRouter from "./router/AppRouter"
import { Toaster } from "sonner"
import { checkAuth } from "./features/auth/authThunks";
import { useEffect } from "react";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </>
  );
}